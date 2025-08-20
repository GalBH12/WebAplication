const jwt = require("jsonwebtoken");

function verifyToken(req, res, next) {
  const h = req.headers.authorization;
  if (!h) return res.status(401).json({ error: "No token" });
  try {
    const token = h.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(403).json({ error: "Invalid token" });
  }
}
module.exports = verifyToken;