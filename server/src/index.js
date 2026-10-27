require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const AppError = require('./utils/AppError');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);

app.use('/api/events', require('./routes/events.routes'));

app.use((req, res, next) => next(new AppError(404, 'NOT_FOUND', 'Not found')));
app.use(require('./middleware/errorHandler'));

const PORT = process.env.PORT || 5000;
if (require.main === module) {
  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not set in .env');
    process.exit(1);
  }
  connectDB()
    .then(() => app.listen(PORT, () => console.log(`Server running on ${PORT}`)))
    .catch((err) => {
      console.error('MongoDB connection failed:', err.message);
      process.exit(1);
    });
}
module.exports = app;
