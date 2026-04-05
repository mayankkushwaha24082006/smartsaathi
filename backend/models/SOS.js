const mongoose = require('mongoose');

const sosSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  location: { latitude: Number, longitude: Number, address: String },
  message: { type: String, default: 'EMERGENCY! I need immediate help!' },
  alertsSent: [{
    contact: String,
    method: { type: String, enum: ['sms', 'email', 'call'] },
    status: { type: String, enum: ['sent', 'failed', 'pending'] },
    sentAt: { type: Date, default: Date.now }
  }],
  status: { type: String, enum: ['active', 'resolved', 'false_alarm'], default: 'active' },
  resolvedAt: Date,
  notes: String
}, { timestamps: true });

module.exports = mongoose.model('SOS', sosSchema);
