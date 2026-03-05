import express from "express";
import User from "../models/user.model.js";
import Blog from "../models/blog.model.js";
import Comment from "../models/comment.model.js";
import { requireAdmin } from "../middleware/admin.middleware.js";

const router = express.Router();

// GET admin dashboard
router.get("/", requireAdmin, async (req, res) => {
  const [totalUsers, totalBlogs, publishedBlogs, draftBlogs, totalComments] = await Promise.all([
    User.countDocuments(),
    Blog.countDocuments(),
    Blog.countDocuments({ status: "published" }),
    Blog.countDocuments({ status: "draft" }),
    Comment.countDocuments(),
  ]);

  const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5).select("-password");
  const recentBlogs = await Blog.find().sort({ createdAt: -1 }).limit(5).populate("author", "fullName");

  res.render("admin/dashboard", {
    totalUsers,
    totalBlogs,
    publishedBlogs,
    draftBlogs,
    totalComments,
    recentUsers,
    recentBlogs,
  });
});

// GET all users
router.get("/users", requireAdmin, async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 }).select("-password");
  res.render("admin/users", { users });
});

// POST delete user
router.post("/users/:id/delete", requireAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    await Blog.deleteMany({ author: req.params.id });
    await Comment.deleteMany({ author: req.params.id });
    res.redirect("/admin/users");
  } catch {
    res.status(500).send("Server error");
  }
});

// POST change user role
router.post("/users/:id/role", requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    await User.findByIdAndUpdate(req.params.id, { role });
    res.redirect("/admin/users");
  } catch {
    res.status(500).send("Server error");
  }
});

// GET all blogs
router.get("/blogs", requireAdmin, async (req, res) => {
  const { status } = req.query;
  const filter = {};
  if (status && status !== "all") filter.status = status;

  const blogs = await Blog.find(filter)
    .populate("author", "fullName")
    .sort({ createdAt: -1 });

  res.render("admin/blogs", { blogs, filter: status || "all" });
});

// POST toggle blog status
router.post("/blogs/:id/status", requireAdmin, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).send("Blog not found");
    blog.status = blog.status === "published" ? "draft" : "published";
    await blog.save();
    res.redirect("/admin/blogs");
  } catch {
    res.status(500).send("Server error");
  }
});

// POST delete blog
router.post("/blogs/:id/delete", requireAdmin, async (req, res) => {
  try {
    await Blog.findByIdAndDelete(req.params.id);
    await Comment.deleteMany({ blog: req.params.id });
    res.redirect("/admin/blogs");
  } catch {
    res.status(500).send("Server error");
  }
});

// GET all comments
router.get("/comments", requireAdmin, async (req, res) => {
  const comments = await Comment.find()
    .populate("author", "fullName email")
    .populate("blog", "title")
    .sort({ createdAt: -1 });
  res.render("admin/comments", { comments });
});

// POST delete comment
router.post("/comments/:id/delete", requireAdmin, async (req, res) => {
  await Comment.findByIdAndDelete(req.params.id);
  res.redirect("/admin/comments");
});

export default router;