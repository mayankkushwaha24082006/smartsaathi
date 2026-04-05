const OTP = require('../models/OTP');
const bcrypt = require('bcryptjs');

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Save OTP to database (hashed)
const saveOTP = async (phone, purpose = 'login') => {
  const otp = generateOTP();
  
  // Delete any existing OTPs for this phone
  await OTP.deleteMany({ phone, purpose });
  
  // Hash OTP
  const salt = await bcrypt.genSalt(10);
  const hashedOTP = await bcrypt.hash(otp, salt);
  
  const expireMinutes = parseInt(process.env.OTP_EXPIRE_MINUTES) || 10;
  
  await OTP.create({
    phone,
    otp: hashedOTP,
    purpose,
    expiresAt: new Date(Date.now() + expireMinutes * 60 * 1000)
  });
  
  return otp; // Return plain OTP to send via SMS
};

// Verify OTP
const verifyOTP = async (phone, inputOTP, purpose = 'login') => {
  const otpDoc = await OTP.findOne({
    phone,
    purpose,
    isUsed: false,
    expiresAt: { $gt: new Date() }
  }).sort({ createdAt: -1 });
  
  if (!otpDoc) {
    return { valid: false, message: 'OTP expired or not found. Please request a new one.' };
  }
  
  if (otpDoc.attempts >= 3) {
    await OTP.deleteOne({ _id: otpDoc._id });
    return { valid: false, message: 'Too many failed attempts. Please request a new OTP.' };
  }
  
  const isMatch = await bcrypt.compare(inputOTP, otpDoc.otp);
  
  if (!isMatch) {
    otpDoc.attempts += 1;
    await otpDoc.save();
    const remaining = 3 - otpDoc.attempts;
    return { 
      valid: false, 
      message: `Incorrect OTP. ${remaining} attempt(s) remaining.` 
    };
  }
  
  // Mark as used
  otpDoc.isUsed = true;
  await otpDoc.save();
  
  return { valid: true, message: 'OTP verified successfully.' };
};

// Send OTP via Twilio (or log in dev)
const sendOTPViaSMS = async (phone, otp) => {
  const formattedPhone = `+91${phone}`;
  
  if (process.env.NODE_ENV === 'development' || !process.env.TWILIO_ACCOUNT_SID || process.env.TWILIO_ACCOUNT_SID === 'your_twilio_account_sid') {
    // DEV MODE: Just log OTP
    console.log(`\n📱 OTP for ${phone}: ${otp} (Dev Mode - not sent via SMS)\n`);
    return { success: true, mode: 'development', otp }; // Return OTP in dev mode
  }
  
  try {
    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    
    await client.messages.create({
      body: `Your SmartSaathi OTP is: ${otp}. Valid for ${process.env.OTP_EXPIRE_MINUTES || 10} minutes. Do not share with anyone.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone
    });
    
    return { success: true, mode: 'sms' };
  } catch (error) {
    console.error('SMS Error:', error.message);
    // Fallback: log OTP
    console.log(`📱 OTP (SMS failed): ${otp}`);
    return { success: false, error: error.message, otp }; // Always return OTP as fallback
  }
};

module.exports = { generateOTP, saveOTP, verifyOTP, sendOTPViaSMS };
