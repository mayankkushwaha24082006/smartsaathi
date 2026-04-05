const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: '*', credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use('/api/', limiter);

const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, max: 10,
  message: { success: false, message: 'Too many OTP requests. Please wait 5 minutes.' }
});

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smartsaathi')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// API Routes
app.use('/api/auth', otpLimiter, require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/medicines', require('./routes/medicines'));
app.use('/api/reminders', require('./routes/reminders'));
app.use('/api/sos', require('./routes/sos'));
app.use('/api/disease', require('./routes/disease'));
app.use('/api/chatbot', require('./routes/chatbot'));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'SmartSaathi API running', version: '1.0.0' });
});

// Serve Frontend
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(frontendPath, 'pages', 'dashboard.html'));
});

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'API not found' });
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: err.message || 'Server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 SmartSaathi running on port ${PORT}`);
  console.log(`🌐 Website:   http://localhost:${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`);
  console.log(`📡 API:       http://localhost:${PORT}/api\n`);
});

module.exports = app;