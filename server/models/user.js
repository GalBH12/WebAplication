const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, index: true },
  email: { type: String, unique: true, index: true },
  password: String,
  resetToken: String,
  resetTokenExpiration: Date,
  profilePicture: String,
  role: { type: String, enum: ["member", "admin"], default: "member" },
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
});
const User = mongoose.models.User || mongoose.model("User", userSchema);
module.exports = User;

console.log("User model keys:", Object.keys(User));