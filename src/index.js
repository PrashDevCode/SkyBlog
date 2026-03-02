import express from "express";
import dotenv from "dotenv";
import path from "path";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

/* ------------------ DATABASE ------------------ */
connectDB();

/* ------------------ MIDDLEWARE ------------------ */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ------------------ VIEW ENGINE ------------------ */
app.set("view engine", "ejs");
app.set("views", path.resolve("./src/views"));

/* ------------------ STATIC ------------------ */
app.use(express.static(path.resolve("./public")));

/* ------------------ PAGE ROUTES ------------------ */
app.get("/", (req, res) => {
  res.render("home", { title: "SkyBlog - Stories That Matter" });
});

app.get("/login", (req, res) => {
  res.render("auth/login", { title: "Sign In" });
});

app.get("/register", (req, res) => {
  res.render("auth/register", { title: "Sign Up" });
});

/* ------------------ API ROUTES ------------------ */
app.use("/api/auth", authRoutes);

/* ------------------ 404 ------------------ */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route Not Found",
  });
});

/* ------------------ ERROR HANDLER ------------------ */
app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(err.statusCode || 500).json({
    success: false,
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal Server Error",
  });
});

/* ------------------ SERVER ------------------ */
app.listen(PORT, () => {
  console.log(
    `🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
  );
});