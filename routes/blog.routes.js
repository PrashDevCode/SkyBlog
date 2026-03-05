import express from "express";
import multer from "multer";
import Blog from "../models/blog.model.js";
import Comment from "../models/comment.model.js";
import User from "../models/user.model.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  sendCommentNotification,
  sendPublishedNotification,
} from "../services/email.service.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public/uploads/"),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

// GET all blogs
router.get("/", async (req, res) => {
  const { category, q } = req.query;
  const filter = { status: "published" };
  if (category && category !== "All") filter.category = category;
  if (q) filter.title = { $regex: q, $options: "i" };

  const blogs = await Blog.find(filter)
    .populate("author", "fullName")
    .sort({ createdAt: -1 });

  res.render("home", { blogs });
});

// GET create post page
router.get("/create", requireAuth, (req, res) => {
  res.render("create", { blog: null, error: null });
});

// POST create blog
router.post(
  "/create",
  requireAuth,
  upload.single("coverImage"),
  async (req, res) => {
    const { title, content, excerpt, category, tags, status } = req.body;
    try {
      const blog = await Blog.create({
        title,
        content,
        excerpt,
        category,
        tags: tags ? tags.split(",").map((t) => t.trim()) : [],
        status: status || "draft",
        coverImage: req.file ? `/uploads/${req.file.filename}` : null,
        author: req.user._id,
      });

      console.log("📝 Blog status:", blog.status);

      if (blog.status === "published") {
        // ✅ Send to ALL users so you can test even with 1 user
        const subscribers = await User.find({}).select("email fullName");
        console.log("📧 Subscribers found:", subscribers.length);
        console.log(
          "📧 Emails:",
          subscribers.map((s) => s.email),
        );
        sendPublishedNotification(blog, req.user.fullName, subscribers);
      }

      res.redirect("/");
    } catch (error) {
      console.log("❌ Create blog error:", error.message);
      res.status(400).render("create", { blog: null, error: error.message });
    }
  },
);

// GET single blog post with comments
router.get("/:id", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).populate(
      "author",
      "fullName",
    );
    if (!blog) return res.status(404).send("Blog not found");

    const comments = await Comment.find({ blog: req.params.id })
      .populate("author", "fullName profileImageURL")
      .sort({ createdAt: -1 });

    res.render("blog", { blog, comments });
  } catch {
    res.status(404).send("Blog not found");
  }
});

// POST add comment
router.post("/:id/comment", requireAuth, async (req, res) => {
  const { content } = req.body;
  try {
    const blog = await Blog.findById(req.params.id).populate(
      "author",
      "fullName email",
    );
    await Comment.create({
      content,
      blog: req.params.id,
      author: req.user._id,
    });

    // ✅ Notify blog author (only if commenter is not the author)
    if (blog.author._id.toString() !== req.user._id.toString()) {
      sendCommentNotification(blog.author, blog, {
        fullName: req.user.fullName,
        content,
      });
    }

    res.redirect(`/blog/${req.params.id}#comments`);
  } catch (error) {
    res.redirect(`/blog/${req.params.id}`);
  }
});

// POST delete comment
router.post(
  "/:blogId/comment/:commentId/delete",
  requireAuth,
  async (req, res) => {
    try {
      const comment = await Comment.findById(req.params.commentId);
      if (!comment) return res.status(404).send("Comment not found");
      if (comment.author.toString() !== req.user._id.toString())
        return res.status(403).send("Unauthorized");
      await Comment.findByIdAndDelete(req.params.commentId);
      res.redirect(`/blog/${req.params.blogId}#comments`);
    } catch {
      res.status(500).send("Server error");
    }
  },
);

// GET edit post page
router.get("/:id/edit", requireAuth, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).send("Blog not found");
    res.render("create", { blog, error: null });
  } catch {
    res.status(404).send("Blog not found");
  }
});

// POST update blog
router.post(
  "/:id/edit",
  requireAuth,
  upload.single("coverImage"),
  async (req, res) => {
    const { title, content, excerpt, category, tags, status } = req.body;
    try {
      const blog = await Blog.findById(req.params.id);
      if (!blog) return res.status(404).send("Blog not found");

      const wasPublished = blog.status === "published";
      blog.title = title;
      blog.content = content;
      blog.excerpt = excerpt;
      blog.category = category;
      blog.tags = tags ? tags.split(",").map((t) => t.trim()) : [];
      blog.status = status || "draft";
      if (req.file) blog.coverImage = `/uploads/${req.file.filename}`;
      await blog.save();

      // ✅ Notify if newly published
      if (!wasPublished && blog.status === "published") {
        // ✅ Fixed (excludes the author)
        const subscribers = await User.find({
          _id: { $ne: req.user._id },
        }).select("email fullName");
        console.log("📧 Notifying on publish:", subscribers.length, "users");
        sendPublishedNotification(blog, req.user.fullName, subscribers);
      }

      res.redirect(`/blog/${blog._id}`);
    } catch (error) {
      res.status(400).render("create", { blog: null, error: error.message });
    }
  },
);

// POST delete blog
router.post("/:id/delete", requireAuth, async (req, res) => {
  await Blog.findByIdAndDelete(req.params.id);
  await Comment.deleteMany({ blog: req.params.id });
  res.redirect("/");
});

export default router;
