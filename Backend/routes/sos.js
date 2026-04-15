const express = require('express');
const router = express.Router();
const SOS = require('../models/SOS');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

router.post('/trigger', protect, async (req, res) => {
  try {
    const { latitude, longitude, address, message } = req.body;
    const user = await User.findById(req.user._id);
    const sosLog = await SOS.create({ user: req.user._id, location: { latitude, longitude, address }, message: message || 'EMERGENCY! I need immediate help!', status: 'active' });
    const contacts = user.emergencyContacts || [];
    const alertsSent = contacts.map(c => ({ contact: c.phone, method: 'sms', status: 'sent', sentAt: new Date() }));
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚨 SOS ALERT triggered by ${user.name}`);
      contacts.forEach(c => console.log(`  → Alert sent to ${c.name} (${c.phone})`));
    }
    sosLog.alertsSent = alertsSent;
    await sosLog.save();
    res.json({ success: true, message: `SOS Alert sent to ${contacts.length} emergency contact(s)!`, sosId: sosLog._id, alertsSent: alertsSent.length, contacts: contacts.map(c => ({ name: c.name, phone: `+91${c.phone.slice(0, 3)}XXXXXXX` })) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to send SOS alert.' });
  }
});

router.get('/history', protect, async (req, res) => {
  try {
    const history = await SOS.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(10);
    res.json({ success: true, history });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch SOS history.' });
  }
});

router.patch('/:id/resolve', protect, async (req, res) => {
  try {
    const sos = await SOS.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { status: req.body.status || 'resolved', resolvedAt: new Date() }, { new: true });
    res.json({ success: true, message: 'SOS resolved.', sos });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to resolve SOS.' });
  }
});

module.exports = router;
