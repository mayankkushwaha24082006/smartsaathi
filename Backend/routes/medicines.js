const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Medicine = require('../models/Medicine');
const { protect } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const { active } = req.query;
    const query = { user: req.user._id };
    if (active === 'true') query.isActive = true;
    const medicines = await Medicine.find(query).sort({ createdAt: -1 });
    res.json({ success: true, count: medicines.length, medicines });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch medicines.' });
  }
});

router.post('/', protect, [
  body('name').trim().notEmpty().withMessage('Medicine name is required'),
  body('dosage').trim().notEmpty().withMessage('Dosage is required'),
  body('reminderTimes').isArray({ min: 1 }).withMessage('At least one reminder time required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const medicine = await Medicine.create({ ...req.body, user: req.user._id });
    res.status(201).json({ success: true, message: 'Medicine added successfully!', medicine });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add medicine.' });
  }
});

router.get('/reminders/today', protect, async (req, res) => {
  try {
    const medicines = await Medicine.find({ user: req.user._id, isActive: true });
    const upcoming = [];
    medicines.forEach(med => {
      med.reminderTimes.forEach(rt => {
        upcoming.push({
          medicineId: med._id, medicineName: med.name, dosage: med.dosage,
          time: rt.time, label: rt.label, taken: rt.taken,
          category: med.category, color: med.color, instructions: med.instructions
        });
      });
    });
    upcoming.sort((a, b) => a.time.localeCompare(b.time));
    res.json({ success: true, reminders: upcoming });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch reminders.' });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const medicine = await Medicine.findOne({ _id: req.params.id, user: req.user._id });
    if (!medicine) return res.status(404).json({ success: false, message: 'Medicine not found.' });
    res.json({ success: true, medicine });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const medicine = await Medicine.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $set: req.body }, { new: true, runValidators: true }
    );
    if (!medicine) return res.status(404).json({ success: false, message: 'Medicine not found.' });
    res.json({ success: true, message: 'Medicine updated!', medicine });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Update failed.' });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const medicine = await Medicine.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!medicine) return res.status(404).json({ success: false, message: 'Medicine not found.' });
    res.json({ success: true, message: 'Medicine deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Delete failed.' });
  }
});

router.patch('/:id/taken', protect, async (req, res) => {
  try {
    const { time } = req.body;
    const medicine = await Medicine.findOne({ _id: req.params.id, user: req.user._id });
    if (!medicine) return res.status(404).json({ success: false, message: 'Medicine not found.' });
    const reminder = medicine.reminderTimes.find(rt => rt.time === time);
    if (reminder) {
      reminder.taken = !reminder.taken;
      reminder.takenAt = reminder.taken ? new Date() : null;
    }
    await medicine.save();
    res.json({ success: true, message: reminder?.taken ? 'Marked as taken!' : 'Marked as not taken.', medicine });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Update failed.' });
  }
});

module.exports = router;
