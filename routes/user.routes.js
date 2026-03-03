import express from "express";
import multer from "multer";
import User from "../models/user.model.js";
import Blog from "../models/blog.model.js";
import { createTokenForUser } from "../services/auth.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

// Multer for profile image
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public/uploads/"),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

router.get("/signin", (req, res) => res.render("signin", { error: null }));
router.get("/signup", (req, res) => res.render("signup", { error: null }));

router.post("/signin", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.matchPassword(email, password);
    const token = createTokenForUser(user);
    res.cookie("token", token, { httpOnly: true, maxAge: 60 * 60 * 1000 });
    return res.redirect("/");
  } catch (error) {
    return res.status(401).render("signin", { error: error.message });
  }
});

router.post("/signup", async (req, res) => {
  const { fullName, email, password } = req.body;
  try {
    const user = await User.create({ fullName, email, password });
    const token = createTokenForUser(user);
    res.cookie("token", token, { httpOnly: true, maxAge: 60 * 60 * 1000 });
    return res.redirect("/");
  } catch (error) {
    return res.status(400).render("signup", { error: error.message });
  }
});

// Sign out
router.get("/signout", (req, res) => {
  res.clearCookie("token");
  return res.redirect("/");
});

// GET dashboard (protected)
router.get("/dashboard", requireAuth, async (req, res) => {
  const { filter } = req.query;
  const query = { author: req.user._id };
  if (filter === "published") query.status = "published";
  if (filter === "draft") query.status = "draft";

  const [totalBlogs, publishedBlogs, draftBlogs, blogs] = await Promise.all([
    Blog.countDocuments({ author: req.user._id }),
    Blog.countDocuments({ author: req.user._id, status: "published" }),
    Blog.countDocuments({ author: req.user._id, status: "draft" }),
    Blog.find(query).sort({ createdAt: -1 }),
  ]);

  res.render("dashboard", {
    totalBlogs,
    publishedBlogs,
    draftBlogs,
    blogs,
    filter: filter || "all",
  });
});

// GET profile page
router.get("/profile/:id", async (req, res) => {
  try {
    const profileUser = await User.findById(req.params.id).select("-password");
    if (!profileUser) return res.status(404).send("User not found");

    const [totalBlogs, publishedBlogs, draftBlogs, blogs] = await Promise.all([
      Blog.countDocuments({ author: profileUser._id }),
      Blog.countDocuments({ author: profileUser._id, status: "published" }),
      Blog.countDocuments({ author: profileUser._id, status: "draft" }),
      Blog.find({ author: profileUser._id }).sort({ createdAt: -1 }).limit(10),
    ]);

    res.render("profile", {
      profileUser,
      totalBlogs,
      publishedBlogs,
      draftBlogs,
      blogs,
    });
  } catch (error) {
    res.status(500).send("Server error");
  }
});

// POST update profile
router.post("/profile/update", requireAuth, upload.single("profileImage"), async (req, res) => {
  try {
    const { fullName } = req.body;
    const updateData = { fullName };
    if (req.file) updateData.profileImageURL = `/uploads/${req.file.filename}`;

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true }
    );

    const token = createTokenForUser(updatedUser);
    res.cookie("token", token, { httpOnly: true, maxAge: 60 * 60 * 1000 });
    res.redirect(`/user/profile/${req.user._id}`);
  } catch (error) {
    res.status(500).send("Failed to update profile");
  }
});

export default router;