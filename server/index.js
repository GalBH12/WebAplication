// server/index.js
require("dotenv").config();

const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const app = express();

/* =========================
   Env & constants
   ========================= */
const PORT = Number(process.env.PORT || 4000);
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/map-app";
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
const FRONTEND_ORIGIN =
  process.env.FRONTEND_ORIGIN || "http://localhost:5173";

/* =========================
   Global middlewares (order matters)
   ========================= */
// CORS first
app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
  })
);

// JSON/urlencoded parsers (increase limits for data URLs)
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// Static (optional) — only if you actually build the client into /public
app.use(express.static(path.join(process.cwd(), "public")));

/* =========================
   DB connection
   ========================= */
mongoose
  .connect(MONGO_URI, {
    // Add options if needed
  })
  .then(() => {
    console.log("[DB] Connected");
  })
  .catch((err) => {
    console.error("[DB] Connection error:", err?.message || err);
  });

/* =========================
   Mailer (SMTP)
   ========================= */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/* =========================
   Auth helpers & model
   ========================= */
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, index: true },
  email: { type: String, unique: true, index: true },
  password: String,
  resetToken: String,
  resetTokenExpiration: Date,
  profilePicture: String,
  savedPlaces: [
    {
      name: String,
      latlng: {
        type: [Number],
        validate: (v) => Array.isArray(v) && v.length === 2,
      },
      description: String,
      image: String,
      createdAt: { type: Date, default: Date.now },
    },
  ],
});
const User = mongoose.models.User || mongoose.model("User", userSchema);

function signToken(user) {
  // Token payload MUST include { id } for routes that rely on req.user.id
  return jwt.sign(
    { id: user._id.toString(), username: user.username },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

/* =========================
   Health check
   ========================= */
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

/* =========================
   Auth routes
   ========================= */

// Register
app.post("/api/register", async (req, res) => {
  try {
    const { username, email, password } = req.body || {};
    if (!username || !email || !password) {
      return res.status(400).json({ error: "missing fields" });
    }

    const exists = await User.findOne({
      $or: [{ username }, { email }],
    });
    if (exists) {
      return res.status(409).json({ error: "user or email already exists" });
    }

    const hash = await bcrypt.hash(password, 10);
    await User.create({ username, email, password: hash });
    res.json({ success: true });
  } catch (e) {
    console.error("[REGISTER] error:", e);
    res.status(500).json({ error: "server error" });
  }
});

// Login
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body || {};
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ error: "User not found" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: "Invalid password" });

    const token = signToken(user);
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture ?? null,
      },
    });
  } catch (e) {
    console.error("[LOGIN] error:", e);
    res.status(500).json({ error: "server error" });
  }
});

// Forgot password – send reset link
app.post("/api/forgotpasssender", async (req, res) => {
  try {
    const { email } = req.body || {};
    const user = await User.findOne({ email });
    if (!user) return res.status(404).send("User not found");

    const secret = JWT_SECRET + user.password;
    const token = jwt.sign({ email: user.email, id: user._id }, secret, {
      expiresIn: "20h",
    });

    const link = `http://localhost:5173/forgotpass/${user._id}/${token}`;

    await transporter.sendMail({
      from: "no-reply@example.com",
      to: user.email,
      subject: "Reset your password",
      html: `<p>Click below to reset your password:</p><a href="${link}">${link}</a>`,
    });

    res.json({ sent: true });
  } catch (e) {
    console.error("[FORGOT] error:", e);
    res.status(500).json({ error: "server error" });
  }
});

// Reset password by link
app.post("/api/resetpass/:id/:token", async (req, res) => {
  try {
    const { id, token } = req.params;
    const { password } = req.body || {};

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const secret = JWT_SECRET + user.password;
    try {
      jwt.verify(token, secret);
    } catch {
      return res.status(400).json({ error: "invalid or expired token" });
    }

    user.password = await bcrypt.hash(password, 10);
    await user.save();
    res.json({ success: true });
  } catch (e) {
    console.error("[RESET LINK] error:", e);
    res.status(500).json({ error: "server error" });
  }
});

// Change password from profile
app.post("/api/resetpass", async (req, res) => {
  try {
    const { username, oldPassword, newPassword } = req.body || {};
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(400).json({ error: "Incorrect current password" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: "Password changed successfully" });
  } catch (e) {
    console.error("[RESET SELF] error:", e);
    res.status(500).json({ error: "server error" });
  }
});

/* =========================
   Tracks routes (images in DB)
   ========================= */
app.use("/api/tracks", require("./routes/tracks"));
// (IMPORTANT) Do not mount /api/tracks more than once

/* =========================
   Server start
   ========================= */
app.listen(PORT, () => {
  console.log(`[API] Listening on http://localhost:${PORT}`);
  console.log(`[CORS] Allowed origin: ${FRONTEND_ORIGIN}`);
});
