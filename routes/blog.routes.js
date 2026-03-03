import express from "express";
import multer from "multer";
import Blog from "../models/blog.model.js";
import Comment from "../models/comment.model.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

// Multer setup for cover image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public/uploads/"),
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

// GET all blogs (home page)
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

// GET create post page (protected)
router.get("/create", requireAuth, (req, res) => {
  res.render("create", { blog: null, error: null });
});

// POST create blog (protected)
router.post("/create", requireAuth, upload.single("coverImage"), async (req, res) => {
  const { title, content, excerpt, category, tags, status } = req.body;
  try {
    await Blog.create({
      title,
      content,
      excerpt,
      category,
      tags: tags ? tags.split(",").map(t => t.trim()) : [],
      status: status || "draft",
      coverImage: req.file ? `/uploads/${req.file.filename}` : null,
      author: req.user._id,
    });
    res.redirect("/");
  } catch (error) {
    res.status(400).render("create", { blog: null, error: error.message });
  }
});

// GET single blog post with comments
router.get("/:id", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).populate("author", "fullName");
    if (!blog) return res.status(404).send("Blog not found");

    const comments = await Comment.find({ blog: req.params.id })
      .populate("author", "fullName profileImageURL")
      .sort({ createdAt: -1 });

    res.render("blog", { blog, comments });
  } catch {
    res.status(404).send("Blog not found");
  }
});

// POST add comment (protected)
router.post("/:id/comment", requireAuth, async (req, res) => {
  const { content } = req.body;
  try {
    await Comment.create({
      content,
      blog: req.params.id,
      author: req.user._id,
    });
    res.redirect(`/blog/${req.params.id}#comments`);
  } catch (error) {
    res.redirect(`/blog/${req.params.id}`);
  }
});

// POST delete comment (protected)
router.post("/:blogId/comment/:commentId/delete", requireAuth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).send("Comment not found");

    // Only author of comment can delete
    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).send("Unauthorized");
    }

    await Comment.findByIdAndDelete(req.params.commentId);
    res.redirect(`/blog/${req.params.blogId}#comments`);
  } catch {
    res.status(500).send("Server error");
  }
});

// GET edit post page (protected)
router.get("/:id/edit", requireAuth, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).send("Blog not found");
    res.render("create", { blog, error: null });
  } catch {
    res.status(404).send("Blog not found");
  }
});

// POST update blog (protected)
router.post("/:id/edit", requireAuth, upload.single("coverImage"), async (req, res) => {
  const { title, content, excerpt, category, tags, status } = req.body;
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).send("Blog not found");

    blog.title = title;
    blog.content = content;
    blog.excerpt = excerpt;
    blog.category = category;
    blog.tags = tags ? tags.split(",").map(t => t.trim()) : [];
    blog.status = status || "draft";
    if (req.file) blog.coverImage = `/uploads/${req.file.filename}`;

    await blog.save();
    res.redirect(`/blog/${blog._id}`);
  } catch (error) {
    res.status(400).render("create", { blog: null, error: error.message });
  }
});

// POST delete blog (protected)
router.post("/:id/delete", requireAuth, async (req, res) => {
  await Blog.findByIdAndDelete(req.params.id);
  // Also delete all comments for this blog
  await Comment.deleteMany({ blog: req.params.id });
  res.redirect("/");
});

export default router;