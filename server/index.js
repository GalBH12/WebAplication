const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const bcrypt = require('bcryptjs')

const app = express()
app.use(cors())
app.use(express.json())

mongoose.connect('mongodb+srv://gallimudim1:Project1234544@cluster0.tpv46ai.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')

const UserSchema = new mongoose.Schema({
  username: String,
  password: String
})
const User = mongoose.model('User', UserSchema)

// הרשמה
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body
  const hash = await bcrypt.hash(password, 10)
  const user = new User({ username, password: hash })
  await user.save()
  res.json({ success: true })
})

// התחברות
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body
  const user = await User.findOne({ username })
  if (!user) return res.status(401).json({ error: 'User not found' })
  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return res.status(401).json({ error: 'Invalid password' })
  res.json({ success: true })
})

app.listen(4000, () => console.log('Server running on port 4000'))