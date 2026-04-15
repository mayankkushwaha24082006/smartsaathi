const OTP = require('../models/OTP');
const bcrypt = require('bcryptjs');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const saveOTP = async (phone, purpose = 'login') => {
  const otp = generateOTP();
  await OTP.deleteMany({ phone, purpose });
  const salt = await bcrypt.genSalt(10);
  const hashedOTP = await bcrypt.hash(otp, salt);
  const expireMinutes = parseInt(process.env.OTP_EXPIRE_MINUTES) || 10;
  await OTP.create({
    phone, otp: hashedOTP, purpose,
    expiresAt: new Date(Date.now() + expireMinutes * 60 * 1000)
  });
  return otp;
};

const verifyOTP = async (phone, inputOTP, purpose = 'login') => {
  const otpDoc = await OTP.findOne({
    phone, purpose, isUsed: false,
    expiresAt: { $gt: new Date() }
  }).sort({ createdAt: -1 });

  if (!otpDoc) return { valid: false, message: 'OTP expired or not found. Please request a new one.' };
  if (otpDoc.attempts >= 3) {
    await OTP.deleteOne({ _id: otpDoc._id });
    return { valid: false, message: 'Too many failed attempts. Please request a new OTP.' };
  }

  const isMatch = await bcrypt.compare(inputOTP, otpDoc.otp);
  if (!isMatch) {
    otpDoc.attempts += 1;
    await otpDoc.save();
    return { valid: false, message: `Incorrect OTP. ${3 - otpDoc.attempts} attempt(s) remaining.` };
  }

  otpDoc.isUsed = true;
  await otpDoc.save();
  return { valid: true, message: 'OTP verified successfully.' };
};

const sendOTPViaSMS = async (phone, otp) => {
  if (process.env.NODE_ENV === 'development' || !process.env.TWILIO_ACCOUNT_SID || process.env.TWILIO_ACCOUNT_SID === 'your_twilio_account_sid') {
    console.log(`\n📱 OTP for ${phone}: ${otp} (Dev Mode)\n`);
    return { success: true, mode: 'development', otp };
  }
  try {
    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    await client.messages.create({
      body: `Your SmartSaathi OTP is: ${otp}. Valid for ${process.env.OTP_EXPIRE_MINUTES || 10} minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: `+91${phone}`
    });
    return { success: true, mode: 'sms' };
  } catch (error) {
    console.log(`📱 OTP (SMS failed): ${otp}`);
    return { success: false, otp };
  }
};

module.exports = { generateOTP, saveOTP, verifyOTP, sendOTPViaSMS };

