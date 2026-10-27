require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/events', require('./routes/events.routes'));
app.use(require('./middleware/errorHandler'));

const PORT = process.env.PORT || 5000;

// Connect to the database only when the server is started directly,
// so tests (which use their own in-memory database) are not affected.
if (require.main === module) {
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    console.error('MONGO_URI is missing from server/.env');
    process.exit(1);
  }
  mongoose
    .connect(MONGO_URI)
    .then(() => {
      console.log('MongoDB connected');
      app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
    })
    .catch((error) => {
      console.error('MongoDB connection failed:', error.message);
      process.exit(1);
    });
}

module.exports = app;