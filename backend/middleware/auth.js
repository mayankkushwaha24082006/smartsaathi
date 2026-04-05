const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'No token. Please login.' });
    }

    // Try multiple secrets for compatibility
    const secrets = [
      process.env.JWT_SECRET,
      'smartsaathi_super_secret_jwt_key_2024_do_not_share',
      'smartsaathi_secret_2024'
    ].filter(Boolean);

    let decoded = null;
    for (const secret of secrets) {
      try {
        decoded = jwt.verify(token, secret);
        break;
      } catch(e) { continue; }
    }

    if (!decoded) {
      return res.status(401).json({ success: false, message: 'Invalid token. Please login again.' });
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found. Please login again.' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    return res.status(401).json({ success: false, message: 'Authentication failed. Please login again.' });
  }
};

module.exports = { protect };