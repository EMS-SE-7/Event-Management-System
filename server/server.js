require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is not set in .env');
  process.exit(1);
}

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);

app.use((req, res) => res.status(404).json({ message: 'Not found' }));

// Replaces Express's default HTML error page, which shows stack traces and file paths
app.use((err, req, res, next) => {
  if (!err.expose) console.error(err);
  res.status(err.status || 500).json({ message: err.expose ? err.message : 'Server error' });
});

const PORT = process.env.PORT || 5050;

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });
