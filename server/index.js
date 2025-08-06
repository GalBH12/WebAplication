const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require("nodemailer");
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect('mongodb+srv://gallimudim1:Project1234544@cluster0.tpv46ai.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0');

const UserSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  resetToken: String,
  resetTokenExpiration: Date
});
const User = mongoose.model('User', UserSchema);

const transporter = nodemailer.createTransport({
  host: "smtp.mailtrap.io",
  port: 587,
  auth: {
    user: "772d2a8abb99e2",
    pass: "e63b4d3d20b8fd"
  },
});

// הרשמה
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  const user = new User({ username, email, password: hash });
  await user.save();
  res.json({ success: true });
});

// התחברות
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(401).json({ error: 'User not found' });
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid password' });
  res.json({ success: true });
});

// שינוי סיסמה
app.post('/api/change-password', async (req, res) => {
  const { username, oldPassword, newPassword } = req.body;

  const user = await User.findOne({ username });
  if (!user) return res.status(404).json({ error: 'משתמש לא נמצא' });

  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) return res.status(400).json({ error: 'סיסמה נוכחית שגויה' });

  const newHashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = newHashedPassword;
  await user.save();

  res.json({ message: 'הסיסמה שונתה בהצלחה' });
});

// שליחת מייל לאיפוס סיסמה
app.post("/api/forgotpass", async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).send("User not found");

  const secret = "mysecret" + user.password; // שים כאן משהו קשיח או קח מ־env
  const token = jwt.sign({ email: user.email, id: user._id }, secret, { expiresIn: "5m" });

  const link = `http://localhost:3000/resetpass/${user._id}/${token}`;

  await transporter.sendMail({
    from: "from@example.com",
    to: user.email,
    subject: "Reset your password",
    html: `<p>Click below to reset your password:</p><a href="${link}">${link}</a>`
  });

  res.send("Email sent");
});
app.get("/api/forgotpass", (req, res) => {
  res.send("Server is up");
});

app.listen(4000, () => console.log('Server running on port 4000'));