// server/index.js
require('dotenv').config(); // אופציונלי: ליצור .env ולהגדיר שם את המשתנים
const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// ---- Config (אפשר להעביר ל-.env) ----
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://<user>:<pass>@cluster0.tpv46ai.mongodb.net/?retryWrites=true&w=majority';
const JWT_SECRET = process.env.JWT_SECRET || 'mysecret';
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

// ---- Middlewares ----
app.use(cors({ origin: FRONTEND_ORIGIN }));
app.use(express.json());

// ---- DB ----
mongoose.connect(MONGO_URI);

// ---- Schemas ----
const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true, index: true },
  email:    { type: String, unique: true, index: true },
  password: String,
  resetToken: String,
  resetTokenExpiration: Date,
  profilePicture: String,
  savedPlaces: [{
    name: String,
    latlng: { type: [Number], validate: v => Array.isArray(v) && v.length === 2 }, // [lat,lng]
    description: String,
    image: String, // base64 data URL
    createdAt: { type: Date, default: Date.now }
  }]
});
const User = mongoose.model('User', UserSchema);

// ---- Mailer (Mailtrap example) ----
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.mailtrap.io",
  port: Number(process.env.SMTP_PORT || 587),
  auth: {
    user: process.env.SMTP_USER || "772d2a8abb99e2",
    pass: process.env.SMTP_PASS || "e63b4d3d20b8fd",
  },
});

// ---- Auth helpers ----
function signToken(user) {
  return jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
}

// ---- Routes ----

// Register
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: 'missing fields' });

    const exists = await User.findOne({ $or: [{ username }, { email }] });
    if (exists) return res.status(409).json({ error: 'user or email already exists' });

    const hash = await bcrypt.hash(password, 10);
    await User.create({ username, email, password: hash });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'server error' });
  }
});

// Login (expects username + password)
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(401).json({ error: 'User not found' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid password' });

  // create JWT and return user + token
  const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
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
});


// Forgot password – send email with reset link
app.post('/api/forgotpasssender', async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).send('User not found');

  // IMPORTANT: same secret for sign + verify
  const secret = JWT_SECRET + user.password;
  const token = jwt.sign({ email: user.email, id: user._id }, secret, { expiresIn: '20h' });

  const link = `http://localhost:5173/forgotpass/${user._id}/${token}`;

  await transporter.sendMail({
    from: 'no-reply@example.com',
    to: user.email,
    subject: 'Reset your password',
    html: `<p>Click below to reset your password:</p><a href="${link}">${link}</a>`
  });

  res.json({ sent: true });
});

// Reset password by link (/forgotpass/:id/:token)
app.post('/api/resetpass/:id/:token', async (req, res) => {
  const { id, token } = req.params;
  const { password } = req.body;

  const user = await User.findById(id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const secret = JWT_SECRET + user.password;
  try {
    jwt.verify(token, secret);
  } catch {
    return res.status(400).json({ error: 'invalid or expired token' });
  }

  user.password = await bcrypt.hash(password, 10);
  await user.save();
  res.json({ success: true });
});

// Change password from profile (matches your frontend /api/resetpass)
app.post('/api/resetpass', async (req, res) => {
  const { username, oldPassword, newPassword } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(404).json({ error: 'משתמש לא נמצא' });

  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) return res.status(400).json({ error: 'סיסמה נוכחית שגויה' });

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();
  res.json({ message: 'הסיסמה שונתה בהצלחה' });
});

app.listen(4000, () => console.log('Server running on port 4000'));