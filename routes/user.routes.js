import express from "express";
import User from "../models/user.model.js";
import { createTokenForUser } from "../services/auth.js";

const router = express.Router();

router.get("/signin", (req, res) => res.render("signin", { error: null }));
router.get("/signup", (req, res) => res.render("signup", { error: null }));

router.post("/signin", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.matchPassword(email, password);
    const token = createTokenForUser(user);
    console.log("✅ Token generated:", token);
    res.cookie("token", token, { httpOnly: true, maxAge: 60 * 60 * 1000 });
    return res.redirect("/");
  } catch (error) {
    console.log("❌ Signin error:", error.message);
    return res.status(401).render("signin", { error: error.message });
  }
});

router.post("/signup", async (req, res) => {
  const { fullName, email, password } = req.body;
  try {
    const user = await User.create({ fullName, email, password });
    const token = createTokenForUser(user);
    console.log("✅ Token generated:", token);
    res.cookie("token", token, { httpOnly: true, maxAge: 60 * 60 * 1000 });
    return res.redirect("/");
  } catch (error) {
    console.log("❌ Signup error:", error.message);
    return res.status(400).render("signup", { error: error.message });
  }
});

// ✅ Sign out — clear the cookie
router.get("/signout", (req, res) => {
  res.clearCookie("token");
  return res.redirect("/");
});

export default router;