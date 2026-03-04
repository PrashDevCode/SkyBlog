import { verifyToken } from "../services/auth.js";

function requireAdmin(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return res.redirect("/user/signin");
  try {
    const user = verifyToken(token);
    if (user.role !== "admin") return res.status(403).send("Access denied. Admins only.");
    req.user = user;
    next();
  } catch {
    return res.redirect("/user/signin");
  }
}

export { requireAdmin };