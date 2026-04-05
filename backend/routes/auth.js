const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { saveOTP, verifyOTP, sendOTPViaSMS } = require('../utils/otp');
const { protect } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'smartsaathi_super_secret_jwt_key_2024_do_not_share';

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '30d' });
};

// ===== SEND OTP =====
router.post('/send-otp', [
  body('phone').matches(/^[6-9]\d{9}$/).withMessage('Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { phone, purpose = 'login' } = req.body;

    // ✅ KEY FIX: For LOGIN — check user exists BEFORE sending OTP
    if (purpose === 'login') {
      const user = await User.findOne({ phone });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'This number is not registered. Please sign up first.'
        });
      }
    }

    // For REGISTER — check user does NOT already exist
    if (purpose === 'register') {
      const existingUser = await User.findOne({ phone });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'This number is already registered. Please login instead.'
        });
      }
    }

    const otp = await saveOTP(phone, purpose);
    const result = await sendOTPViaSMS(phone, otp);

    const responseData = {
      success: true,
      message: `OTP sent to ${phone.slice(0,2)}XXXXXX${phone.slice(-2)}`,
      expiresIn: `${process.env.OTP_EXPIRE_MINUTES || 1} minutes`
    };

    // Show OTP in dev mode
    if (result.mode === 'development' || result.otp) {
      responseData.devOTP = result.otp || otp;
    }

    res.json(responseData);
  } catch (error) {
    console.error('Send OTP Error:', error);
    res.status(500).json({ success: false, message: 'Failed to send OTP. Please try again.' });
  }
});

// ===== REGISTER =====
router.post('/register', [
  body('phone').matches(/^[6-9]\d{9}$/).withMessage('Invalid phone number'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('age').isInt({ min: 1, max: 120 }).withMessage('Enter a valid age'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });

    const { phone, otp, name, age, gender, email, bloodGroup } = req.body;

    const existingUser = await User.findOne({ phone });
    if (existingUser) return res.status(400).json({ success: false, message: 'Phone already registered. Please login.' });

    const otpResult = await verifyOTP(phone, otp, 'register');
    if (!otpResult.valid) return res.status(400).json({ success: false, message: otpResult.message });

    const user = await User.create({ name, phone, age, gender, email, bloodGroup, isVerified: true });
    const token = generateToken(user._id);
    console.log(`✅ Registered: ${name} (${phone})`);

    res.status(201).json({
      success: true,
      message: `Welcome to SmartSaathi, ${name}! 🎉`,
      token,
      user: user.toPublicJSON()
    });
  } catch (error) {
    console.error('Register Error:', error);
    if (error.code === 11000) return res.status(400).json({ success: false, message: 'Phone already exists.' });
    res.status(500).json({ success: false, message: 'Registration failed.' });
  }
});

// ===== LOGIN =====
router.post('/login', [
  body('phone').matches(/^[6-9]\d{9}$/).withMessage('Invalid phone number'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });

    const { phone, otp } = req.body;

    const user = await User.findOne({ phone });
    if (!user) return res.status(404).json({ success: false, message: 'Phone not registered. Please sign up first.' });

    const otpResult = await verifyOTP(phone, otp, 'login');
    if (!otpResult.valid) return res.status(400).json({ success: false, message: otpResult.message });

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });
    const token = generateToken(user._id);
    console.log(`✅ Login: ${user.name} (${phone})`);

    res.json({
      success: true,
      message: `Welcome back, ${user.name}! 👋`,
      token,
      user: user.toPublicJSON()
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ success: false, message: 'Login failed.' });
  }
});

// ===== GET CURRENT USER =====
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user: user.toPublicJSON() });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/logout', protect, (req, res) => {
  res.json({ success: true, message: 'Logged out successfully.' });
});

module.exports = router;