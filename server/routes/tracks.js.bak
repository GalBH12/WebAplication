// This file handles all the API routes for tracks (like songs or paths) in the app

// Import the libraries we need
const express = require("express");      // For creating the API routes
const jwt = require("jsonwebtoken");     // For checking if a user is logged in
const multer = require("multer");        // For handling file uploads (like images)
const mongoose = require("mongoose");    // For talking to the MongoDB database

const router = express.Router();         // This lets us define our API endpoints

// ====== SETUP THE TRACK MODEL (how a track looks in the database) ======
let Track;
try {
  // Try to load the Track model from another file
  const mod = require("../models/trackschema");
  Track = mod.Track || mod;
} catch {
  // If that fails, define it right here
  const TrackSchema = new mongoose.Schema(
    {
      name: { type: String, required: true }, // Track name (required)
      description: String,                    // Track description (optional)
      points: { type: [[Number]], default: [] }, // List of points (like GPS coordinates)
      owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Who created it
      image: { data: Buffer, contentType: String }, // The image (stored in the database)
    },
    { timestamps: true } // Automatically add createdAt and updatedAt fields
  );
  Track = mongoose.models.Track || mongoose.model("Track", TrackSchema);
}

// ====== SETUP FILE UPLOADS (for images) ======
const upload = multer({
  storage: multer.memoryStorage(), // Store files in memory (not on disk)
  limits: { fileSize: 5 * 1024 * 1024 }, // Max file size: 5MB
  fileFilter: (_req, file, cb) => {
    // Only allow image files
    const ok = /^image\/(png|jpe?g|webp|gif)$/i.test(file.mimetype);
    cb(ok ? null : new Error("Only image files (png/jpg/webp/gif) are allowed"), ok);
  },
});

// ====== CHECK IF USER IS LOGGED IN (JWT) ======
function verifyToken(req, res, next) {
  // Look for the token in the request headers
  const h = req.headers.authorization;
  if (!h) return res.status(401).json({ error: "No token" }); // Not logged in
  try {
    // Check if the token is valid
    const token = h.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.id) {
      return res.status(403).json({ error: "Invalid token payload" });
    }
    req.user = decoded; // Save user info for later
    next(); // Go to the next step
  } catch {
    return res.status(403).json({ error: "Invalid token" });
  }
}

// ====== HELPER FUNCTIONS ======

// This turns a data URL (like "data:image/png;base64,...") into a buffer we can store
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

// This prepares a track object to send to the frontend (browser)
function toClient(t) {
  const out = t.toObject ? t.toObject() : t;

  // Figure out if the image is stored as a buffer or a string
  let hasBuffer = false;
  if (
    out?.image &&
    typeof out.image === "object" &&
    out.image !== null &&
    out.image.data
  ) {
    // If it's a buffer with data, mark it
    if (typeof out.image.data.length === "number" && out.image.data.length > 0) {
      hasBuffer = true;
    }
    // If it's a special MongoDB type, also mark it
    else if (typeof out.image.data.length === "function" && out.image.data.length() > 0) {
      hasBuffer = true;
    }
    else if (out.image.data._bsontype === "Binary" && out.image.data.buffer && out.image.data.buffer.length > 0) {
      hasBuffer = true;
    }
  }

  // If the image is a string that starts with "data:image/"
  const isDataUrlString =
    typeof out?.image === "string" && /^data:image\//i.test(out.image);

  // Return the track, but for images, give a URL if it's a buffer, or the string if it's a data URL
  return {
    ...out,
    image: hasBuffer
      ? `/api/tracks/${out._id}/picture`
      : (isDataUrlString ? out.image : undefined),
  };
}

// ====== API ROUTES ======

// Get a list of all tracks
router.get("/", async (_req, res) => {
  try {
    const docs = await Track.find({})
      .select("name description points owner createdAt image reviews")
      .sort({ createdAt: -1 });
    res.json(docs.map(toClient)); // Send the tracks to the browser
  } catch (e) {
    console.error("GET /api/tracks error:", e);
    res.status(500).json({ message: "Failed to fetch tracks" });
  }
});

// Get a single track by its ID
router.get("/:id", async (req, res) => {
  try {
    const t = await Track.findById(req.params.id)
      .select("name description points owner createdAt image reviews");
    if (!t) return res.status(404).json({ message: "Not found" });
    res.json(toClient(t));
  } catch (e) {
    console.error("GET /api/tracks/:id error:", e);
    res.status(500).json({ message: "Failed to fetch track" });
  }
});

// Get the image for a track (as a real image, not a string)
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

// Create a new track (user must be logged in)
router.post("/", verifyToken, upload.single("image"), async (req, res) => {
  try {
    const { name, description, points, image } = req.body;
    if (!name) return res.status(400).json({ error: "name is required" });

    // If points is a string, try to turn it into an array
    let pts = points;
    if (typeof pts === "string") {
      try { pts = JSON.parse(pts); } catch { pts = []; }
    }

    // Make a new track
    const doc = new Track({
      name,
      description,
      points: Array.isArray(pts) ? pts : [],
      owner: req.user.id, // Set the owner to the logged-in user
    });

    // Handle the image if there is one (file or data URL)
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
    await doc.save(); // Save the track in the database
    res.status(201).json(toClient(doc)); // Send the new track to the browser
  } catch (e) {
    console.error("POST /api/tracks error:", e);
    res.status(400).json({ message: "Failed to create track" });
  }
});

// Update a track (only the owner or an admin can do this)
router.put("/:id", verifyToken, upload.single("image"), async (req, res) => {
  try {
    const track = await Track.findById(req.params.id);
    if (!track) return res.status(404).json({ error: "Track not found" });

    // Only the owner or an admin can update
    const isOwner = track.owner && track.owner.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "Only the owner or an admin can update this track" });
    }

    // Get image fields from the request
    const { image, imageClear } = req.body || {};

    // Update the track fields if they are provided
    if (typeof req.body.name === "string") track.name = req.body.name;
    if (typeof req.body.description === "string") track.description = req.body.description;
    if (Array.isArray(req.body.points)) track.points = req.body.points;

    const imagePath = Track.schema?.path("image");

    // Handle image update (file, data URL, or clear)
    if (req.file) {
      if (imagePath && imagePath.instance === "String") {
        track.image = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
      } else {
        track.image = { data: req.file.buffer, contentType: req.file.mimetype };
      }
    } else if (typeof image === "string") {
      const parsed = parseDataUrl(image);
      if (imagePath && imagePath.instance === "String") {
        track.image = image;
      } else if (parsed) {
        track.image = { data: parsed.buffer, contentType: parsed.mime };
      }
    } else if (typeof imageClear !== "undefined" && (imageClear === true || imageClear === "true")) {
      // If imageClear is set, remove the image
      track.set("image", undefined, { strict: false });
      track.markModified("image");
    }

    await track.save(); // Save the changes
    res.json(toClient(track)); // Send the updated track to the browser
  } catch (e) {
    console.error("PUT /api/tracks/:id error:", e);
    res.status(500).json({ error: "Failed to update track" });
  }
});

// (Admins only) Update just the picture for a track
router.put("/:id/picture", verifyToken, upload.single("image"), async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admins can update track pictures" });
    }
    const track = await Track.findById(req.params.id);
    if (!track) return res.status(404).json({ error: "Track not found" });

    if (!req.file) return res.status(400).json({ error: "No image file" });

    track.image = { data: req.file.buffer, contentType: req.file.mimetype };
    await track.save();
    res.json(toClient(track));
  } catch (e) {
    console.error("PUT /api/tracks/:id/picture error:", e);
    res.status(400).json({ message: "Failed to update picture" });
  }
});

// Delete a track (only the owner or an admin can do this)
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const track = await Track.findById(req.params.id);
    if (!track) return res.status(404).json({ error: "Track not found" });

    // Only the owner or an admin can delete
    const isOwner = track.owner && track.owner.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "Only the owner or an admin can delete this track" });
    }

    await track.deleteOne(); // Remove the track from the database
    res.json({ ok: true });  // Tell the browser it worked
  } catch (e) {
    console.error("DELETE /api/tracks/:id error:", e);
    res.status(400).json({ message: "Failed to delete track" });
  }
});

// Add a review to a track
router.post("/:id/reviews", verifyToken, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required" });

    const track = await Track.findById(req.params.id);
    if (!track) return res.status(404).json({ error: "Track not found" });

    const review = {
      user: req.user.username,
      text,
      createdAt: new Date(),
    };
    track.reviews = track.reviews || [];
    track.reviews.push(review);
    await track.save();

    res.json(review);
  } catch (e) {
    res.status(500).json({ error: "Failed to add review" });
  }
});

// Edit a review (only by the author)
router.put("/:id/reviews/:index", verifyToken, async (req, res) => {
  try {
    const { text } = req.body;
    const { id, index } = req.params;
    const track = await Track.findById(id);
    if (!track) return res.status(404).json({ error: "Track not found" });

    const review = track.reviews[index];
    if (!review) return res.status(404).json({ error: "Review not found" });

    if (review.user !== req.user.username) {
      return res.status(403).json({ error: "You can only edit your own review" });
    }

    review.text = text;
    await track.save();
    res.json(review);
  } catch (e) {
    res.status(500).json({ error: "Failed to edit review" });
  }
});

// Delete a review (admin only)
router.delete("/:id/reviews/:index", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admins can delete reviews" });
    }
    const { id, index } = req.params;
    const track = await Track.findById(id);
    if (!track) return res.status(404).json({ error: "Track not found" });

    if (!track.reviews || !track.reviews[index]) {
      return res.status(404).json({ error: "Review not found" });
    }

    track.reviews.splice(index, 1);
    await track.save();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Failed to delete review" });
  }
});

// Export all these routes so the main server can use them
module.exports = router;