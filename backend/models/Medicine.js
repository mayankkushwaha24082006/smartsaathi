const mongoose = require('mongoose');

const reminderTimeSchema = new mongoose.Schema({
  time: { type: String, required: true }, // "08:00", "14:00"
  label: { type: String, default: 'Morning' }, // Morning, Afternoon, Evening, Night
  taken: { type: Boolean, default: false },
  takenAt: { type: Date }
});

const medicineSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Medicine name is required'],
    trim: true
  },
  dosage: {
    type: String,
    required: [true, 'Dosage is required'],
    // e.g., "500mg", "1 tablet", "10ml"
  },
  frequency: {
    type: String,
    enum: ['once_daily', 'twice_daily', 'thrice_daily', 'four_times', 'weekly', 'as_needed'],
    default: 'once_daily'
  },
  reminderTimes: [reminderTimeSchema],
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  instructions: {
    type: String, // "Take with food", "Avoid alcohol"
    default: ''
  },
  prescribedBy: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    enum: ['tablet', 'capsule', 'syrup', 'injection', 'drops', 'cream', 'inhaler', 'other'],
    default: 'tablet'
  },
  color: {
    type: String,
    default: '#4A90D9' // For UI color coding
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sideEffects: [String],
  refillDate: { type: Date },
  refillCount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Medicine', medicineSchema);
