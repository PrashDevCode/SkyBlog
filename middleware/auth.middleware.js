import { verifyToken } from "../services/auth.js";

function requireAuth(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return res.redirect("/user/signin");
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    return res.redirect("/user/signin");
  }
}

export { requireAuth };