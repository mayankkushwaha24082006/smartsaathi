const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  phone: { type: String, required: true, index: true },
  otp: { type: String, required: true },
  purpose: { type: String, enum: ['login', 'register', 'reset'], default: 'login' },
  attempts: { type: Number, default: 0 },
  isUsed: { type: Boolean, default: false },
  expiresAt: { type: Date, required: true, index: { expires: 0 } }
}, { timestamps: true });

module.exports = mongoose.model('OTP', otpSchema);
