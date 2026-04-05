const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// @route GET /api/users/profile
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, user: user.toPublicJSON() });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route PUT /api/users/profile
router.put('/profile', protect, [
  body('name').optional().trim().isLength({ min: 2 }),
  body('age').optional().isInt({ min: 1, max: 120 }),
  body('email').optional().isEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const allowedFields = ['name', 'age', 'gender', 'email', 'bloodGroup', 'address', 'doctorName', 'doctorPhone', 'allergies', 'voiceEnabled', 'notifications', 'preferredLanguage'];
    const updateData = {};
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.json({ success: true, message: 'Profile updated successfully!', user: user.toPublicJSON() });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Update failed.' });
  }
});

// @route POST /api/users/emergency-contacts
router.post('/emergency-contacts', protect, [
  body('name').trim().notEmpty().withMessage('Contact name required'),
  body('phone').matches(/^[6-9]\d{9}$/).withMessage('Valid phone required'),
  body('relation').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const user = await User.findById(req.user._id);
    
    if (user.emergencyContacts.length >= 5) {
      return res.status(400).json({ success: false, message: 'Maximum 5 emergency contacts allowed.' });
    }

    user.emergencyContacts.push(req.body);
    await user.save();

    res.json({ success: true, message: 'Emergency contact added!', contacts: user.emergencyContacts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add contact.' });
  }
});

// @route DELETE /api/users/emergency-contacts/:contactId
router.delete('/emergency-contacts/:contactId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.emergencyContacts = user.emergencyContacts.filter(
      c => c._id.toString() !== req.params.contactId
    );
    await user.save();
    res.json({ success: true, message: 'Contact removed.', contacts: user.emergencyContacts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to remove contact.' });
  }
});

// @route POST /api/users/medical-conditions
router.post('/medical-conditions', protect, [
  body('name').trim().notEmpty().withMessage('Condition name required')
], async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.medicalConditions.push(req.body);
    await user.save();
    res.json({ success: true, message: 'Medical condition added!', conditions: user.medicalConditions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add condition.' });
  }
});

// @route DELETE /api/users/medical-conditions/:condId
router.delete('/medical-conditions/:condId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.medicalConditions = user.medicalConditions.filter(
      c => c._id.toString() !== req.params.condId
    );
    await user.save();
    res.json({ success: true, message: 'Condition removed.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to remove condition.' });
  }
});

module.exports = router;
