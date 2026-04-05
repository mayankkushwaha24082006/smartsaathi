const mongoose = require('mongoose');

const reminderTimeSchema = new mongoose.Schema({
  time: { type: String, required: true },
  label: { type: String, default: 'Morning' },
  taken: { type: Boolean, default: false },
  takenAt: { type: Date }
});

const medicineSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true },
  dosage: { type: String, required: true },
  frequency: {
    type: String,
    enum: ['once_daily', 'twice_daily', 'thrice_daily', 'four_times', 'weekly', 'as_needed'],
    default: 'once_daily'
  },
  reminderTimes: [reminderTimeSchema],
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  instructions: { type: String, default: '' },
  prescribedBy: { type: String, default: '' },
  category: {
    type: String,
    enum: ['tablet', 'capsule', 'syrup', 'injection', 'drops', 'cream', 'inhaler', 'other'],
    default: 'tablet'
  },
  color: { type: String, default: '#4A90D9' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Medicine', medicineSchema);
