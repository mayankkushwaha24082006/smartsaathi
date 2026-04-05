const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Medicine = require('../models/Medicine');

const generateResponse = async (message, user, medicines) => {
  const lower = message.toLowerCase();
  const userName = user.name.split(' ')[0];
  const match = (keywords) => keywords.some(k => lower.includes(k));

  if (match(['hello', 'hi', 'namaste', 'good morning', 'good evening', 'hey'])) {
    const h = new Date().getHours();
    const greeting = h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening';
    return { message: `${greeting}, ${userName}! 🙏 I am Saathi, your health assistant.\n\nI can help you with:\n• �� Medicine reminders\n• 🩺 Health advice\n• 🚨 SOS alerts\n• 🎵 Relaxing music\n\nWhat do you need help with?`, action: null };
  }
  if (match(['emergency', 'sos', 'help me', 'accident', 'fall', 'urgent'])) {
    return { message: `🚨 Please press the **SOS Button** on your dashboard immediately!\n\nEmergency numbers:\n• National Emergency: **112**\n• Ambulance: **102**\n\nStay calm, help is coming! 💪`, action: 'sos', urgent: true };
  }
  if (match(['medicine', 'tablet', 'pill', 'dose', 'reminder'])) {
    if (medicines.length === 0) return { message: `${userName}, you have not added any medicines yet. 💊\n\nGo to the **Medicines** section to add your medications!`, action: 'medicines' };
    const now = new Date().toTimeString().slice(0, 5);
    const upcoming = [];
    medicines.forEach(med => med.reminderTimes.forEach(rt => { if (rt.time >= now && !rt.taken) upcoming.push(`${med.name} (${med.dosage}) at ${rt.time}`); }));
    if (upcoming.length > 0) return { message: `💊 Your upcoming medicines today:\n\n${upcoming.map((m, i) => `${i+1}. ${m}`).join('\n')}\n\nRemember to take them on time! 🕐`, action: 'medicines' };
    return { message: `✅ Great news! You are all caught up with medicines for today.\n\nYou have ${medicines.length} medicine(s) in your list.`, action: 'medicines' };
  }
  if (match(['blood pressure', 'bp', 'hypertension'])) {
    return { message: `❤️ Blood pressure tips:\n\n• 🧂 Limit salt intake\n• 🥗 Eat fruits and vegetables\n• 🚶 Walk 30 minutes daily\n• 😴 Sleep 7-8 hours\n• 💊 Take medicines regularly\n\nNormal BP: 120/80 mmHg`, action: null };
  }
  if (match(['sugar', 'diabetes', 'glucose'])) {
    return { message: `🩸 Diabetes tips:\n\n• 📊 Monitor blood glucose daily\n• 🥗 Low sugar diet\n• 🚶 Exercise 30 min/day\n• 💧 Drink 8 glasses of water\n• 💊 Never skip medication`, action: null };
  }
  if (match(['music', 'song', 'play', 'relax'])) {
    return { message: `🎵 Opening the music player for you! Calming music helps reduce stress and blood pressure. Enjoy! 🎶`, action: 'music' };
  }
  if (match(['sad', 'anxious', 'stress', 'worry', 'depressed', 'lonely'])) {
    return { message: `🤗 I hear you, ${userName}. Your feelings are valid!\n\n• 🗣️ Talk to family or friends\n• 🧘 Practice deep breathing\n• 🚶 Take a short walk\n• 🎵 Listen to calming music\n\nMental Health Helpline: **iCall: 9152987821**\n\nYou are not alone! 💙`, action: null };
  }
  if (match(['sleep', 'tired', 'insomnia'])) {
    return { message: `😴 Better sleep tips:\n\n• ⏰ Fixed sleep schedule daily\n• 📱 No screens 1 hour before bed\n• 🌡️ Keep room cool\n• ☕ Avoid caffeine after 2 PM\n• 🧘 Relaxation exercises before bed`, action: null };
  }
  if (match(['food', 'eat', 'diet', 'nutrition'])) {
    return { message: `🥗 Healthy eating tips:\n\n• 🌾 Choose whole grains\n• 🥬 Half your plate = vegetables\n• 💧 Drink 8 glasses of water daily\n• 🍎 Fruits as snacks\n• ⏰ Eat at regular meal times`, action: null };
  }
  return { message: `🤔 I can help you with:\n\n• 💊 "Show my medicines"\n• 🩺 "I have headache"\n• 🚨 "Emergency help"\n• 🎵 "Play music"\n• 🩸 "Blood pressure tips"\n• 😢 "I feel sad"\n\nTry one of these!`, action: null };
};

router.post('/message', protect, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || message.trim().length === 0) return res.status(400).json({ success: false, message: 'Please enter a message.' });
    const medicines = await Medicine.find({ user: req.user._id, isActive: true });
    const response = await generateResponse(message, req.user, medicines);
    res.json({ success: true, response: response.message, action: response.action || null, urgent: response.urgent || false, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Chatbot service unavailable.' });
  }
});

module.exports = router;
