const express = require("express");
const User = require("../models/userschema");
const verifyToken = require("../middleware/auth");
const requireAdmin = require("../middleware/admin");
const router = express.Router();

router.get("/users", verifyToken, requireAdmin, async (req, res) => {
  const users = await User.find({}, "-password");
  res.json(users);
});

router.post("/users/:id/promote", verifyToken, requireAdmin, async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { role: "admin" }, { new: true });
  res.json(user);
});

router.post("/users/:id/ban", verifyToken, requireAdmin, async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { banned: true }, { new: true });
  res.json(user);
});

router.post("/users/:id/unban", verifyToken, requireAdmin, async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { banned: false }, { new: true });
  res.json(user);
});

router.delete("/users/:id", verifyToken, requireAdmin, async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

module.exports = router;