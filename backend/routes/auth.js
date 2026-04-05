const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { saveOTP, verifyOTP, sendOTPViaSMS } = require('../utils/otp');
const { protect } = require('../middleware/auth');

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @route POST /api/auth/send-otp
// @desc Send OTP to phone
const phoneValidation = [
  body('phone').matches(/^[6-9]\d{9}$/).withMessage('Enter a valid 10-digit Indian mobile number'),
  body('purpose').optional().isIn(['login', 'register']).withMessage('Invalid purpose')
];

router.post('/send-otp', phoneValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { phone, purpose = 'login' } = req.body;
    
    const otp = await saveOTP(phone, purpose);
    const result = await sendOTPViaSMS(phone, otp);

    const responseData = {
      success: true,
      message: `OTP sent to +91-${phone.slice(0, 5)}XXXXX`,
      expiresIn: `${process.env.OTP_EXPIRE_MINUTES || 10} minutes`
    };

    // In dev mode, return OTP in response for easy testing
    if (result.mode === 'development' || result.otp) {
      responseData.devOTP = result.otp || otp;
      responseData.devNote = '⚠️ Dev mode: OTP shown for testing only';
    }

    res.json(responseData);
  } catch (error) {
    console.error('Send OTP Error:', error);
    res.status(500).json({ success: false, message: 'Failed to send OTP. Please try again.' });
  }
});

// @route POST /api/auth/register
// @desc Register new user with OTP verification
router.post('/register', [
  body('phone').matches(/^[6-9]\d{9}$/).withMessage('Invalid phone number'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('age').isInt({ min: 1, max: 120 }).withMessage('Enter a valid age'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { phone, otp, name, age, gender, email, bloodGroup } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Phone number already registered. Please login.' });
    }

    // Verify OTP
    const otpResult = await verifyOTP(phone, otp, 'register');
    if (!otpResult.valid) {
      return res.status(400).json({ success: false, message: otpResult.message });
    }

    // Create user
    const user = await User.create({
      name, phone, age, gender, email, bloodGroup,
      isVerified: true
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: `Welcome to SmartSaathi, ${name}! 🎉`,
      token,
      user: user.toPublicJSON()
    });
  } catch (error) {
    console.error('Register Error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Phone number already exists.' });
    }
    res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
  }
});

// @route POST /api/auth/login
// @desc Login with OTP
router.post('/login', [
  body('phone').matches(/^[6-9]\d{9}$/).withMessage('Invalid phone number'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { phone, otp } = req.body;

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Phone number not registered. Please sign up first.' });
    }

    const otpResult = await verifyOTP(phone, otp, 'login');
    if (!otpResult.valid) {
      return res.status(400).json({ success: false, message: otpResult.message });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: `Welcome back, ${user.name}! 👋`,
      token,
      user: user.toPublicJSON()
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
  }
});

// @route GET /api/auth/me
// @desc Get current user
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, user: user.toPublicJSON() });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route POST /api/auth/logout
router.post('/logout', protect, (req, res) => {
  res.json({ success: true, message: 'Logged out successfully.' });
});

module.exports = router;
