const express = require('express');
const router = express.Router();
const Medicine = require('../models/Medicine');
const { protect } = require('../middleware/auth');

router.get('/upcoming', protect, async (req, res) => {
  try {
    const medicines = await Medicine.find({ user: req.user._id, isActive: true });
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    const upcoming = [];
    medicines.forEach(med => {
      med.reminderTimes.forEach(rt => {
        const [ch, cm] = currentTime.split(':').map(Number);
        const [th, tm] = rt.time.split(':').map(Number);
        const diff = (th * 60 + tm) - (ch * 60 + cm);
        upcoming.push({
          medicineId: med._id, medicineName: med.name, dosage: med.dosage,
          time: rt.time, label: rt.label, taken: rt.taken,
          minutesUntil: diff, isUpcoming: diff >= 0 && diff <= 60,
          category: med.category, color: med.color
        });
      });
    });
    upcoming.sort((a, b) => a.time.localeCompare(b.time));
    res.json({ success: true, reminders: upcoming, currentTime });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch reminders.' });
  }
});

module.exports = router;
