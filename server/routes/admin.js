const express = require("express");
const User = require("../models/userschema");
const verifyToken = require("../middleware/auth");   // Middleware: check JWT & attach user
const requireAdmin = require("../middleware/admin"); // Middleware: only allow admins

const router = express.Router();

/* ============================
   GET /admin/users
   List all users (without passwords)
   ============================ */
router.get("/users", verifyToken, requireAdmin, async (req, res) => {
  const users = await User.find({}, "-password"); // Exclude password field
  res.json(users);
});

/* ============================
   POST /admin/users/:id/promote
   Promote user → admin
   ============================ */
router.post("/users/:id/promote", verifyToken, requireAdmin, async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role: "admin" },
    { new: true }
  );
  res.json(user);
});

/* ============================
   POST /admin/users/:id/demote
   Demote user → normal member
   ============================ */
router.post("/users/:id/demote", verifyToken, requireAdmin, async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role: "member" },
    { new: true }
  );
  res.json(user);
});

/* ============================
   POST /admin/users/:id/ban
   Ban a user (set banned = true)
   ============================ */
router.post("/users/:id/ban", verifyToken, requireAdmin, async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { banned: true },
    { new: true }
  );
  res.json(user);
});

/* ============================
   POST /admin/users/:id/unban
   Unban a user (set banned = false)
   ============================ */
router.post("/users/:id/unban", verifyToken, requireAdmin, async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { banned: false },
    { new: true }
  );
  res.json(user);
});

/* ============================
   DELETE /admin/users/:id
   Delete a user completely
   ============================ */
router.delete("/users/:id", verifyToken, requireAdmin, async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
