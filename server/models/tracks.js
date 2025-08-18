const mongoose = require("mongoose");

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
});

module.exports = mongoose.models.Track || mongoose.model("Track", TrackSchema);