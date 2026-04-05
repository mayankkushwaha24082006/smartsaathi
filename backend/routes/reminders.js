const express = require('express');
const router = express.Router();
const Medicine = require('../models/Medicine');
const { protect } = require('../middleware/auth');

// @route GET /api/reminders/upcoming
router.get('/upcoming', protect, async (req, res) => {
  try {
    const medicines = await Medicine.find({ user: req.user._id, isActive: true });
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    
    const upcoming = [];
    medicines.forEach(med => {
      med.reminderTimes.forEach(rt => {
        const diff = getMinutesDiff(currentTime, rt.time);
        upcoming.push({
          medicineId: med._id,
          medicineName: med.name,
          dosage: med.dosage,
          time: rt.time,
          label: rt.label,
          taken: rt.taken,
          minutesUntil: diff,
          isUpcoming: diff >= 0 && diff <= 60,
          category: med.category,
          color: med.color,
          instructions: med.instructions
        });
      });
    });
    
    upcoming.sort((a, b) => a.time.localeCompare(b.time));
    
    res.json({ success: true, reminders: upcoming, currentTime });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch upcoming reminders.' });
  }
});

function getMinutesDiff(current, target) {
  const [ch, cm] = current.split(':').map(Number);
  const [th, tm] = target.split(':').map(Number);
  return (th * 60 + tm) - (ch * 60 + cm);
}

module.exports = router;
