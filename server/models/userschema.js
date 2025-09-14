const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true, unique: true, index: true },
    phone: { type: String, trim: true },
    birthDate: { type: Date, default: null },
    username: { type: String, unique: true, index: true, required: true, trim: true },
    password: { type: String, required: true },
    resetToken: String,
    resetTokenExpiration: Date,
    profilePicture: String,
    role: { type: String, enum: ["user", "admin"], default: "user" },
    banned: { type: Boolean, default: false },
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
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);
module.exports = User;
