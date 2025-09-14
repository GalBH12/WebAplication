require("dotenv").config();
const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
mongoose.set("bufferCommands", false);              // avoid buffering ops while DB is disconnected
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const User = require("./models/userschema");
const verifyToken = require("./middleware/auth");

const app = express();
const http = require("http").createServer(app);
const { Server } = require("socket.io");

/* ============================
   Config / Constants
   ============================ */
const PORT = Number(process.env.PORT || 4000);

// Allow loading local db config via ./db.js (optional)
let DBJS_URI = undefined;
try {
  DBJS_URI = require("./db").MONGO_URI;
} catch (e) {} // ignore if not present

const MONGO_URI = process.env.MONGO_URI || DBJS_URI || "mongodb://127.0.0.1:27017/map-app";
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";

/* ============================
   Global Middleware
   ============================ */
app.use(
  cors({
    origin: FRONTEND_ORIGIN, // allow only the known frontend
    credentials: true,
  })
);
app.use(express.json({ limit: "20mb" }));                     // JSON bodies (supports base64 images)
app.use(express.urlencoded({ extended: true, limit: "20mb" })); // form bodies
app.use(express.static(path.join(process.cwd(), "public")));  // static assets

// Fast-fail API requests if DB is down (return 503 instead of hanging)
app.use((req, res, next) => {
  if (req.path.startsWith("/api") && mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: "Database not connected" });
  }
  next();
});

// Admin routes (all endpoints within enforce auth+admin in that file)
app.use("/api/admin", require("./routes/admin"));

/* ============================
   MongoDB Connection
   ============================ */
mongoose
  .connect(MONGO_URI, { serverSelectionTimeoutMS: 10000 })
  .then(() => {
    const host = (process.env.MONGO_URI || "").replace(/:\/\/[^@]+@/, "://***:***@");
    console.log("[DB] Connected to DataBase");
  })
  .catch((err) => console.error("[DB] Connection error:", err?.message || err));

/* ============================
   Mailer (password reset emails)
   ============================ */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

/* ============================
   JWT Helpers
   ============================ */
function signToken(user) {
  // Minimal payload; NEVER include sensitive fields like password
  return jwt.sign(
    {
      id: user._id.toString(),
      username: user.username,
      role: user.role || "member",
      banned: Boolean(user.banned),
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

/* ============================
   Health Check
   ============================ */
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

/* ============================
   Auth: Register
   ============================ */
app.post("/api/register", async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      firstName,
      lastName,
      phone,
      birthDate,
    } = req.body || {};

    // Basic validation
    if (!username || !email || !password)
      return res.status(400).json({ error: "missing fields" });

    // Uniqueness check for username OR email
    const exists = await User.findOne({ $or: [{ username }, { email }] });
    if (exists) return res.status(409).json({ error: "user or email already exists" });

    // Hash password and create user
    const hash = await bcrypt.hash(password, 10);
    await User.create({
      username,
      email,
      password: hash,
      firstName: firstName ?? "",
      lastName: lastName ?? "",
      phone: phone ?? "",
      birthDate: birthDate ? new Date(birthDate) : null,
      role: "member",
    });

    res.json({ success: true });
  } catch (e) {
    console.error("register error:", e?.message || e);
    res.status(500).json({ error: "server error" });
  }
});

/* ============================
   Auth: Login
   ============================ */
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body || {};

    // Find user and validate
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ error: "User not found" });
    if (user.banned)
      return res.status(403).json({
        error: "Your account is suspended, contact us for more information.",
      });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: "Invalid password" });

    // Sign JWT and return user profile
    const token = signToken(user);
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        _id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture ?? null,
        role: user.role || "member",
        banned: Boolean(user.banned),
        firstName: user.firstName ?? "",
        lastName: user.lastName ?? "",
        phone: user.phone ?? "",
        birthDate: user.birthDate || null,
      },
    });
  } catch (e) {
    console.error("login error:", e?.message || e);
    res.status(500).json({ error: "server error" });
  }
});

/* ============================
   Auth: Get current user (/me)
   ============================ */
app.get("/api/me", verifyToken, async (req, res) => {
  try {
    // Exclude sensitive fields
    const user = await User.findById(req.user.id).select(
      "-password -resetToken -resetTokenExpiration"
    );
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      user: {
        id: user._id,
        _id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture ?? null,
        role: user.role || "member",
        banned: Boolean(user.banned),
        firstName: user.firstName ?? "",
        lastName: user.lastName ?? "",
        phone: user.phone ?? "",
        birthDate: user.birthDate || null,
      },
    });
  } catch (e) {
    console.error("me error:", e?.message || e);
    res.status(500).json({ error: "server error" });
  }
});

/* ============================
   Auth: Update current user
   ============================ */
app.patch("/api/me", verifyToken, async (req, res) => {
  try {
    const { firstName, lastName, phone, birthDate, email } = req.body || {};
    const update = {};

    // Only set fields that are provided
    if (typeof firstName === "string") update.firstName = firstName;
    if (typeof lastName === "string") update.lastName = lastName;
    if (typeof phone === "string") update.phone = phone;
    if (typeof email === "string") update.email = email;
    if (birthDate !== undefined) update.birthDate = birthDate ? new Date(birthDate) : null;

    const user = await User.findByIdAndUpdate(req.user.id, update, {
      new: true,
      runValidators: true,
      select: "-password -resetToken -resetTokenExpiration",
    });
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      user: {
        id: user._id,
        _id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture ?? null,
        role: user.role || "member",
        banned: Boolean(user.banned),
        firstName: user.firstName ?? "",
        lastName: user.lastName ?? "",
        phone: user.phone ?? "",
        birthDate: user.birthDate || null,
      },
    });
  } catch (e) {
    console.error("update me error:", e?.message || e);
    res.status(500).json({ error: "server error" });
  }
});

/* ============================
   Forgot / Reset Password (email link)
   ============================ */
app.post("/api/forgotpasssender", async (req, res) => {
  try {
    const { email } = req.body || {};
    const user = await User.findOne({ email });
    if (!user) return res.status(404).send("User not found");

    // Token is tied to current password hash
    const secret = JWT_SECRET + user.password;
    const token = jwt.sign({ email: user.email, id: user._id }, secret, { expiresIn: "20h" });

    // Reset link for frontend route
    const link = `http://localhost:5173/forgotpass/${user._id}/${token}`;

    // Send email
    await transporter.sendMail({
      from: "no-reply@example.com",
      to: user.email,
      subject: "Reset your password",
      html: `<p>Click below to reset your password:</p><a href="${link}">${link}</a>`,
    });

    res.json({ sent: true });
  } catch (e) {
    console.error("forgotpasssender error:", e?.message || e);
    res.status(500).json({ error: "server error" });
  }
});

/* ============================
   Reset Password (consumes link)
   ============================ */
app.post("/api/resetpass/:id/:token", async (req, res) => {
  try {
    const { id, token } = req.params;
    const { password } = req.body || {};
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Verify token against secret that includes the user's current password hash
    const secret = JWT_SECRET + user.password;
    try {
      jwt.verify(token, secret);
    } catch {
      return res.status(400).json({ error: "invalid or expired token" });
    }

    // Save new password
    user.password = await bcrypt.hash(password, 10);
    await user.save();
    res.json({ success: true });
  } catch (e) {
    console.error("resetpass link error:", e?.message || e);
    res.status(500).json({ error: "server error" });
  }
});

/* ============================
   Change Password (with old password)
   ============================ */
app.post("/api/resetpass", async (req, res) => {
  try {
    const { username, oldPassword, newPassword } = req.body || {};
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Validate current password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(400).json({ error: "Incorrect current password" });

    // Update password
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: "Password changed successfully" });
  } catch (e) {
    console.error("resetpass change error:", e?.message || e);
    res.status(500).json({ error: "server error" });
  }
});

/* ============================
   Tracks API
   ============================ */
app.use("/api/tracks", require("./routes/tracks"));

/* ============================
   Socket.IO (presence + simple chat)
   ============================ */
const io = new Server(http, {
  cors: {
    origin: FRONTEND_ORIGIN,
    methods: ["GET", "POST"],
  },
});

// presence map (socket.id -> { id, email, username, displayName })
const onlineUsers = new Map();

io.on("connection", (socket) => {
  // Client authenticates socket with a JWT
  socket.on("auth", async (token) => {
    try {
      const payload = jwt.verify(token, JWT_SECRET);

      // Try to enrich with DB details (best-effort)
      let u = null;
      try {
        u = await User.findById(payload.id).lean();
      } catch {}

      const email = u?.email || "";
      const username = u?.username || "";
      const firstName = u?.firstName || "";
      const lastName = u?.lastName || "";

      // Prefer full name > username > email > fallback
      const displayName =
        [firstName, lastName].filter(Boolean).join(" ") ||
        username ||
        email ||
        "unknown";

      onlineUsers.set(socket.id, {
        id: payload.id,
        email,
        username,
        displayName,
      });

      // Broadcast unique list of display names
      const list = Array.from(onlineUsers.values()).map((x) => x.displayName);
      io.emit("presence", Array.from(new Set(list)));
    } catch {
      socket.emit("auth_error", "invalid token");
    }
  });

  // Relay chat messages either globally or to a named recipient
  socket.on("chat_message", (msg) => {
    const from = onlineUsers.get(socket.id);
    const fromEmail = from?.email || from?.displayName || "unknown";
    const fromName = from?.displayName || "unknown";
    const text = String(msg?.text || "").slice(0, 1000); // limit to 1000 chars
    const to = msg?.to || undefined;

    const payload = { text, fromEmail, fromName, to };

    // 1:1 message (by display name) or broadcast
    if (to) {
      for (const [sid, u] of onlineUsers.entries()) {
        if (u.displayName === to) io.to(sid).emit("chat_message", payload);
      }
      socket.emit("chat_message", payload); // echo to sender
    } else {
      io.emit("chat_message", payload);
    }
  });

  // Cleanup presence on disconnect
  socket.on("disconnect", () => {
    onlineUsers.delete(socket.id);
    const list = Array.from(onlineUsers.values()).map((x) => x.displayName);
    io.emit("presence", Array.from(new Set(list)));
  });
});

/* ============================
   Start HTTP Server
   ============================ */
http.listen(PORT, () => {
  console.log(`[API] Listening on http://localhost:${PORT}`);
  console.log(`[CORS] Allowed origin: ${FRONTEND_ORIGIN}`);
  console.log(`[Socket.IO] Ready`);
});
