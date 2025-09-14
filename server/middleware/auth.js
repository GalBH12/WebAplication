const jwt = require("jsonwebtoken");

/**
 * Middleware: verifyToken
 * -----------------------
 * Verifies a JWT from the "Authorization" header.
 * If valid, attaches the decoded payload to `req.user`.
 * Otherwise, returns an error response.
 *
 * Expected header format:
 *   Authorization: Bearer <token>
 */
function verifyToken(req, res, next) {
  const h = req.headers.authorization;

  // No header provided → unauthorized
  if (!h) return res.status(401).json({ error: "No token" });

  try {
    // Extract token (after "Bearer")
    const token = h.split(" ")[1];

    // Verify signature and decode payload
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach decoded user data to request object
    req.user = decoded;

    // Continue to next middleware/route
    next();
  } catch {
    // If verification fails → forbidden
    return res.status(403).json({ error: "Invalid token" });
  }
}

module.exports = verifyToken;
