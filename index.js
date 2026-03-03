import 'dotenv/config';

import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import cookieParser from 'cookie-parser';
import userRoutes from './routes/user.routes.js';
import blogRoutes from './routes/blog.routes.js';
import { verifyToken } from './services/auth.js';
import Blog from './models/blog.model.js';

const app = express();

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.set("view engine", "ejs");
app.use(express.static("public"));
app.set("views", path.resolve("./views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// ✅ Global middleware — attach user to every request & view
app.use((req, res, next) => {
  const token = req.cookies?.token;
  if (token) {
    try {
      const user = verifyToken(token);
      req.user = user;
      res.locals.user = user; // ✅ makes `user` available in ALL ejs views
    } catch {
      req.user = null;
      res.locals.user = null;
    }
  } else {
    req.user = null;
    res.locals.user = null;
  }
  next();
});

app.use("/user", userRoutes);
app.use("/blog", blogRoutes);

// Home route
app.get("/", async (req, res) => {
  const blogs = await Blog.find({ status: "published" })
    .populate("author", "fullName")
    .sort({ createdAt: -1 });
    console.log("Published blogs found:", blogs.length);
  res.render("home", { blogs });
});

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});