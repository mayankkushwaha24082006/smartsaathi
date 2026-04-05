const express = require('express');
const router = express.Router();
const SOS = require('../models/SOS');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// ===== SEND REAL SMS via Twilio =====
async function sendSOSSMS(phone, userName, location, message) {
  try {
    if (!process.env.TWILIO_ACCOUNT_SID || 
        process.env.TWILIO_ACCOUNT_SID === 'your_twilio_account_sid') {
      console.log(`📱 [DEV] SOS SMS to +91${phone}: ${message}`);
      return { success: true, mode: 'dev' };
    }

    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

    let locationText = '';
    if (location.latitude && location.longitude) {
      locationText = `\nLocation: https://maps.google.com/?q=${location.latitude},${location.longitude}`;
    }

    const smsBody = `🚨 EMERGENCY ALERT!\n${userName} needs immediate help!\n${message}${locationText}\n\nPlease call them or emergency services (112) immediately!`;

    await client.messages.create({
      body: smsBody,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: `+91${phone}`
    });

    console.log(`✅ SOS SMS sent to +91${phone}`);
    return { success: true, mode: 'sms' };
  } catch (error) {
    console.error(`❌ SOS SMS failed to +91${phone}:`, error.message);
    return { success: false, error: error.message };
  }
}

// ===== TRIGGER SOS =====
router.post('/trigger', protect, async (req, res) => {
  try {
    const { latitude, longitude, address, message } = req.body;
    const user = await User.findById(req.user._id);

    // Save SOS log to database
    const sosLog = await SOS.create({
      user: req.user._id,
      location: { latitude, longitude, address },
      message: message || 'EMERGENCY! I need immediate help!',
      status: 'active'
    });

    const contacts = user.emergencyContacts || [];
    const alertsSent = [];

    // Send real SMS to every emergency contact
    for (const contact of contacts) {
      const result = await sendSOSSMS(
        contact.phone,
        user.name,
        { latitude, longitude },
        message || 'EMERGENCY! I need immediate help!'
      );

      alertsSent.push({
        contact: contact.phone,
        name: contact.name,
        method: 'sms',
        status: result.success ? 'sent' : 'failed',
        sentAt: new Date()
      });
    }

    sosLog.alertsSent = alertsSent;
    await sosLog.save();

    const sentCount = alertsSent.filter(a => a.status === 'sent').length;

    console.log(`🚨 SOS by ${user.name} — ${sentCount}/${contacts.length} SMS sent`);

    res.json({
      success: true,
      message: contacts.length === 0
        ? 'SOS logged! Add emergency contacts in your profile to send alerts.'
        : `SOS Alert sent to ${sentCount} of ${contacts.length} contact(s)!`,
      sosId: sosLog._id,
      alertsSent: sentCount,
      contacts: contacts.map(c => ({
        name: c.name,
        phone: `+91${c.phone.slice(0, 3)}XXXXXXX`
      }))
    });

  } catch (error) {
    console.error('SOS Error:', error);
    res.status(500).json({ success: false, message: 'Failed to send SOS alert. Please call 112!' });
  }
});

// ===== SOS HISTORY =====
router.get('/history', protect, async (req, res) => {
  try {
    const history = await SOS.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(10);
    res.json({ success: true, history });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch SOS history.' });
  }
});

// ===== RESOLVE SOS =====
router.patch('/:id/resolve', protect, async (req, res) => {
  try {
    const sos = await SOS.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { status: req.body.status || 'resolved', resolvedAt: new Date() },
      { new: true }
    );
    res.json({ success: true, message: 'SOS resolved.', sos });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to resolve SOS.' });
  }
});

module.exports = router;