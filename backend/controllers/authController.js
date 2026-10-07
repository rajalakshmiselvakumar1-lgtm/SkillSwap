const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const sign = (user) => jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

exports.register = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;
    if (!name || !email || !password || !confirmPassword)
      return res.status(400).json({ message: 'All fields are required.' });
    if (name.trim().length < 2) return res.status(400).json({ message: 'Name must be at least 2 characters.' });
    if (!emailRx.test(email)) return res.status(400).json({ message: 'Enter a valid email address.' });
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    if (password !== confirmPassword) return res.status(400).json({ message: 'Passwords do not match.' });

    if (await User.findOne({ email: email.toLowerCase() }))
      return res.status(409).json({ message: 'An account with this email already exists.' });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hash });
    res.status(201).json({ message: 'Registration successful. Please log in.', user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'An account with this email already exists.' });
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    const ok = user && await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: 'Incorrect email or password.' });
    res.json({ token: sign(user), user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.me = (req, res) => res.json({ user: req.user });
