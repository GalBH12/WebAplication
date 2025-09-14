/**
 * Middleware: requireAdmin
 * ------------------------
 * Ensures that only users with the "admin" role
 * can access the requested route.
 *
 * Usage:
 *   const requireAdmin = require("./middleware/requireAdmin");
 *   app.get("/admin", requireAdmin, (req, res) => { ... });
 */
function requireAdmin(req, res, next) {
  // Check if user is authenticated and has admin role
  if (req.user && req.user.role === "admin") {
    return next(); // allow request to proceed
  }

  // Otherwise, deny access
  return res.status(403).json({ error: "Admin only" });
}

module.exports = requireAdmin;
