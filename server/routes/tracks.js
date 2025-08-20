// server/routes/tracks.js
const express = require("express");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const mongoose = require("mongoose");

const router = express.Router();

/* ===== Model (fallback if not provided elsewhere) ===== */
let Track;
try {
  const mod = require("../models/tracks");
  Track = mod.Track || mod;
} catch {
  const TrackSchema = new mongoose.Schema(
    {
      name: { type: String, required: true },
      description: String,
      points: { type: [[Number]], default: [] }, // [[lat,lng], ...]
      owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      image: { data: Buffer, contentType: String }, // stored in DB
    },
    { timestamps: true }
  );
  Track = mongoose.models.Track || mongoose.model("Track", TrackSchema);
}

/* ===== Multer (optional: supports multipart too) ===== */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file limit (JSON body limit is set in server/index.js)
  fileFilter: (_req, file, cb) => {
    const ok = /^image\/(png|jpe?g|webp|gif)$/i.test(file.mimetype);
    cb(ok ? null : new Error("Only image files (png/jpg/webp/gif) are allowed"), ok);
  },
});

/* ===== JWT auth ===== */
// Expects tokens signed like: jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" })
function verifyToken(req, res, next) {
  const h = req.headers.authorization;
  if (!h) return res.status(401).json({ error: "No token" });
  try {
    const token = h.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.id) {
      return res.status(403).json({ error: "Invalid token payload" });
    }
    req.user = decoded; // { id, iat, exp, role }
    next();
  } catch {
    return res.status(403).json({ error: "Invalid token" });
  }
}

/* ===== Helpers ===== */
// Parse data URL: data:<mime>;base64,<payload>
function parseDataUrl(str) {
  if (typeof str !== "string") return null;
  const m = str.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]+)$/);
  if (!m) return null;
  try {
    return { mime: m[1], buffer: Buffer.from(m[2], "base64") };
  } catch {
    return null;
  }
}

function toClient(t) {
  const out = t.toObject ? t.toObject() : t;

  // Fix: handle BSON Binary type (from MongoDB)
  let hasBuffer = false;
  if (
    out?.image &&
    typeof out.image === "object" &&
    out.image !== null &&
    out.image.data
  ) {
    // Node.js Buffer
    if (typeof out.image.data.length === "number" && out.image.data.length > 0) {
      hasBuffer = true;
    }
    // BSON Binary (from MongoDB)
    else if (typeof out.image.data.length === "function" && out.image.data.length() > 0) {
      hasBuffer = true;
    }
    // BSON Binary (sometimes ._bsontype === 'Binary')
    else if (out.image.data._bsontype === "Binary" && out.image.data.buffer && out.image.data.buffer.length > 0) {
      hasBuffer = true;
    }
  }

  const isDataUrlString =
    typeof out?.image === "string" && /^data:image\//i.test(out.image);

  return {
    ...out,
    image: hasBuffer
      ? `/api/tracks/${out._id}/picture`
      : (isDataUrlString ? out.image : undefined),
  };
}

/* ===== Routes (mounted at /api/tracks) ===== */

// GET /api/tracks
router.get("/", async (_req, res) => {
  try {
    const docs = await Track.find({})
      .select("name description points owner createdAt image")
      .sort({ createdAt: -1 });
    res.json(docs.map(toClient));
  } catch (e) {
    console.error("GET /api/tracks error:", e);
    res.status(500).json({ message: "Failed to fetch tracks" });
  }
});

// GET /api/tracks/:id
router.get("/:id", async (req, res) => {
  try {
    const t = await Track.findById(req.params.id)
      .select("name description points owner createdAt image");
    if (!t) return res.status(404).json({ message: "Not found" });
    res.json(toClient(t));
  } catch (e) {
    console.error("GET /api/tracks/:id error:", e);
    res.status(500).json({ message: "Failed to fetch track" });
  }
});

// Serve image binary
router.get("/:id/picture", async (req, res) => {
  try {
    const t = await Track.findById(req.params.id).select("image");
    if (!t || !t.image || !t.image.data) return res.status(404).end();
    res.set("Content-Type", t.image.contentType || "image/jpeg");
    return res.send(t.image.data);
  } catch (e) {
    console.error("GET /api/tracks/:id/picture error:", e);
    res.status(500).end();
  }
});

// Create track (accepts: JSON with data URL, or multipart file)
router.post("/", verifyToken, upload.single("image"), async (req, res) => {
  try {
    const { name, description, points, image } = req.body;
    if (!name) return res.status(400).json({ error: "name is required" });

    let pts = points;
    if (typeof pts === "string") {
      try { pts = JSON.parse(pts); } catch { pts = []; }
    }

    const doc = new Track({
      name,
      description,
      points: Array.isArray(pts) ? pts : [],
      owner: req.user.id,
    });

    if (req.file) {
      const imagePath = Track.schema?.path("image");
      if (imagePath && imagePath.instance === "String") {
        doc.image = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
      } else {
        doc.image = { data: req.file.buffer, contentType: req.file.mimetype };
      }
    } else if (typeof image === "string") {
      const parsed = parseDataUrl(image);
      const imagePath = Track.schema?.path("image");
      if (imagePath && imagePath.instance === "String") {
        doc.image = image;
      } else if (parsed) {
        doc.image = { data: parsed.buffer, contentType: parsed.mime };
      }
    }
    await doc.save();
    res.status(201).json(toClient(doc));
  } catch (e) {
    console.error("POST /api/tracks error:", e);
    res.status(400).json({ message: "Failed to create track" });
  }
});

// Update (name/desc/points + optional new image/clear)
router.put("/:id", verifyToken, upload.single("image"), async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admins can update tracks" });
    }
    const t = await Track.findById(req.params.id);
    if (!t) return res.status(404).json({ error: "Track not found" });

    const { name, description, points, image, imageClear } = req.body;

    if (typeof name !== "undefined") t.name = name;
    if (typeof description !== "undefined") t.description = description;

    if (typeof points !== "undefined") {
      let pts = points;
      if (typeof pts === "string") {
        try { pts = JSON.parse(pts); } catch { pts = t.points || []; }
      }
      t.points = Array.isArray(pts) ? pts : t.points;
    }

    const imagePath = Track.schema?.path("image");

    if (req.file) {
      if (imagePath && imagePath.instance === "String") {
        t.image = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
      } else {
        t.image = { data: req.file.buffer, contentType: req.file.mimetype };
      }
    } else if (typeof image === "string") {
      const parsed = parseDataUrl(image);
      if (imagePath && imagePath.instance === "String") {
        t.image = image;
      } else if (parsed) {
        t.image = { data: parsed.buffer, contentType: parsed.mime };
      }
    } else if (imageClear === true || imageClear === "true") {
      t.set("image", undefined, { strict: false });
      t.markModified("image");
    }

    await t.save();
    res.json(toClient(t));
  } catch (e) {
    console.error("PUT /api/tracks/:id error:", e);
    res.status(400).json({ message: "Failed to update track" });
  }
});

// Optional: dedicated picture update endpoint (file only)
router.put("/:id/picture", verifyToken, upload.single("image"), async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admins can update track pictures" });
    }
    const t = await Track.findById(req.params.id);
    if (!t) return res.status(404).json({ error: "Track not found" });

    if (!req.file) return res.status(400).json({ error: "No image file" });

    t.image = { data: req.file.buffer, contentType: req.file.mimetype };
    await t.save();
    res.json(toClient(t));
  } catch (e) {
    console.error("PUT /api/tracks/:id/picture error:", e);
    res.status(400).json({ message: "Failed to update picture" });
  }
});

// Delete
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admins can delete tracks" });
    }
    const t = await Track.findById(req.params.id);
    if (!t) return res.status(404).json({ error: "Track not found" });

    await t.deleteOne();
    res.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/tracks/:id error:", e);
    res.status(400).json({ message: "Failed to delete track" });
  }
});

module.exports = router;