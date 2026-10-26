const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });

const publicUser = (user) => ({ id: user._id, name: user.name, email: user.email, role: user.role });

const authResponse = (user) => ({ token: signToken(user), user: publicUser(user) });

const register = async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required' });
  }

  try {
    // No role from the client: everyone signs up as Student, Organizers come from the seed script
    const user = await User.create({ name, email, password });
    res.status(201).json(authResponse(user));
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Email already registered' });
    }
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: Object.values(err.errors)[0].message });
    }
    throw err;
  }
};

const login = async (req, res) => {
  const { email, password } = req.body || {};
  if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
  // Same message for unknown email and wrong password, so emails can't be probed
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  res.json(authResponse(user));
};

const me = (req, res) => {
  res.json({ user: publicUser(req.user) });
};

module.exports = { register, login, me };
