const mongoose = require("mongoose");

/* ============================
   User Schema
   ============================ */
const userSchema = new mongoose.Schema(
  {
    // ---- Basic Info ----
    firstName: { type: String, trim: true },  // optional first name
    lastName: { type: String, trim: true },   // optional last name

    // ---- Contact ----
    email: {
      type: String,
      trim: true,
      lowercase: true,    // always stored in lowercase
      unique: true,       // must be unique
      index: true,        // speeds up queries
    },
    phone: { type: String, trim: true },      // optional phone number
    birthDate: { type: Date, default: null }, // optional birth date

    // ---- Authentication ----
    username: {
      type: String,
      unique: true,       // usernames must be unique
      index: true,
      required: true,     // required field
      trim: true,
    },
    password: { type: String, required: true }, // hashed password

    // ---- Password Reset ----
    resetToken: String,           // token sent for "forgot password"
    resetTokenExpiration: Date,   // token expiry timestamp

    // ---- Profile ----
    profilePicture: String, // URL or base64 of profile image

    // ---- Role & Permissions ----
    role: {
      type: String,
      enum: ["member", "admin"], // only two allowed roles
      default: "member",
    },
    banned: { type: Boolean, default: false }, // flag for blocking account

    // ---- Saved Places (subdocument array) ----
    savedPlaces: [
      {
        name: String,          // place name
        latlng: {
          type: [Number],      // [latitude, longitude]
          validate: (v) => Array.isArray(v) && v.length === 2, // must be array of 2 numbers
        },
        description: String,   // optional description
        image: String,         // optional image (URL/base64)
        createdAt: { type: Date, default: Date.now }, // timestamp for saved place
      },
    ],
  },
  { timestamps: true } // adds createdAt & updatedAt for the user
);

/* ============================
   Model Export
   ============================ */
// Reuse existing model if already compiled (important in dev with hot-reload)
const User = mongoose.models.User || mongoose.model("User", userSchema);
module.exports = User;
