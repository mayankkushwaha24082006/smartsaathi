const express = require('express');
const router = express.Router();
const SOS = require('../models/SOS');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const nodemailer = require('nodemailer');

// @route POST /api/sos/trigger
router.post('/trigger', protect, async (req, res) => {
  try {
    const { latitude, longitude, address, message } = req.body;
    
    const user = await User.findById(req.user._id);
    const alertsSent = [];
    
    const sosLog = await SOS.create({
      user: req.user._id,
      location: { latitude, longitude, address },
      message: message || 'EMERGENCY! I need immediate help!',
      status: 'active'
    });
    
    // Simulate SMS alerts to emergency contacts
    const contacts = user.emergencyContacts || [];
    
    for (const contact of contacts) {
      const alertEntry = {
        contact: contact.phone,
        method: 'sms',
        status: 'pending',
        sentAt: new Date()
      };
      
      if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_ACCOUNT_SID !== 'your_twilio_account_sid') {
        try {
          const twilio = require('twilio');
          const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
          const locationStr = address || (latitude ? `${latitude}, ${longitude}` : 'Unknown location');
          
          await client.messages.create({
            body: `🚨 EMERGENCY ALERT from SmartSaathi!\n${user.name} needs immediate help!\nLocation: ${locationStr}\nMessage: ${sosLog.message}\nPlease call them immediately!`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: `+91${contact.phone}`
          });
          alertEntry.status = 'sent';
        } catch (err) {
          alertEntry.status = 'failed';
          console.error('Twilio SMS error:', err.message);
        }
      } else {
        // Dev mode simulation
        console.log(`🚨 SOS ALERT would be sent to ${contact.name} (${contact.phone})`);
        alertEntry.status = 'sent'; // Simulate as sent in dev mode
      }
      
      alertsSent.push(alertEntry);
    }
    
    // Send email if configured
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS && user.email) {
      try {
        const transporter = nodemailer.createTransporter({
          host: process.env.EMAIL_HOST || 'smtp.gmail.com',
          port: process.env.EMAIL_PORT || 587,
          secure: false,
          auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
        });
        
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: user.email,
          subject: '🚨 SOS Alert Triggered - SmartSaathi',
          html: `<h2>Emergency Alert Triggered</h2><p>Your SOS alert has been sent to ${contacts.length} emergency contact(s).</p>`
        });
        alertsSent.push({ contact: user.email, method: 'email', status: 'sent', sentAt: new Date() });
      } catch (err) {
        console.error('Email error:', err.message);
      }
    }
    
    sosLog.alertsSent = alertsSent;
    await sosLog.save();
    
    res.json({
      success: true,
      message: `🚨 SOS Alert sent to ${contacts.length} emergency contact(s)!`,
      sosId: sosLog._id,
      alertsSent: alertsSent.length,
      contacts: contacts.map(c => ({ name: c.name, phone: `+91${c.phone.slice(0, 3)}XXXXXXX` }))
    });
  } catch (error) {
    console.error('SOS Error:', error);
    res.status(500).json({ success: false, message: 'Failed to send SOS alert.' });
  }
});

// @route GET /api/sos/history
router.get('/history', protect, async (req, res) => {
  try {
    const history = await SOS.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(10);
    res.json({ success: true, history });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch SOS history.' });
  }
});

// @route PATCH /api/sos/:id/resolve
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
