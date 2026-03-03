import express from "express";
import multer from "multer";
import path from "path";
import Blog from "../models/blog.model.js";
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

  res.render("home", { user: req.user || null, blogs });
});

// GET create post page (protected)
router.get("/create", requireAuth, (req, res) => {
  res.render("create", { user: req.user, blog: null, error: null });
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
    res.status(400).render("create", { user: req.user, blog: null, error: error.message });
  }
});

// GET single blog post
router.get("/:id", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).populate("author", "fullName");
    if (!blog) return res.status(404).send("Blog not found");
    res.render("blog", { user: req.user || null, blog });
  } catch {
    res.status(404).send("Blog not found");
  }
});

// GET edit post page (protected)
router.get("/:id/edit", requireAuth, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).send("Blog not found");
    res.render("create", { user: req.user, blog, error: null });
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
    res.status(400).render("create", { user: req.user, blog: null, error: error.message });
  }
});

// POST delete blog (protected)
router.post("/:id/delete", requireAuth, async (req, res) => {
  await Blog.findByIdAndDelete(req.params.id);
  res.redirect("/");
});

export default router;