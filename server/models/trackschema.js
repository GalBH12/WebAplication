const mongoose = require("mongoose");

// Subdocument schema for reviews
const ReviewSchema = new mongoose.Schema({
  user: { type: String, required: true }, // or ObjectId if you want to reference User
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

// Each track has a name, description, array of points (lat,lng), owner reference, createdAt timestamp, optional image, and reviews
const TrackSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  points: { type: [[Number]], required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },

  // Store image binary in DB:
  image: {
    data: Buffer,         // binary data
    contentType: String,  // e.g. "image/jpeg"
  },
  reviews: [ReviewSchema]
});

module.exports = mongoose.models.Track || mongoose.model("Track", TrackSchema);