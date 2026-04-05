const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Medicine = require('../models/Medicine');

const BOT_RESPONSES = {
  greet: ['namaste', 'hello', 'hi', 'hey', 'good morning', 'good evening', 'good afternoon'],
  medicine: ['medicine', 'tablet', 'drug', 'dose', 'medication', 'pill', 'remind'],
  reminder: ['reminder', 'remind', 'schedule', 'time', 'alarm', 'when'],
  health: ['health', 'feel', 'pain', 'sick', 'unwell', 'ill', 'disease', 'symptom'],
  bp: ['blood pressure', 'bp', 'hypertension', 'pressure'],
  sugar: ['sugar', 'diabetes', 'glucose', 'diabetic'],
  emergency: ['emergency', 'sos', 'help', 'urgent', 'accident', 'fall'],
  music: ['music', 'song', 'play', 'relax', 'calming'],
  doctor: ['doctor', 'hospital', 'clinic', 'appointment', 'consult'],
  weather: ['weather', 'rain', 'hot', 'cold', 'temperature'],
  exercise: ['exercise', 'walk', 'yoga', 'fitness', 'physical'],
  food: ['food', 'eat', 'diet', 'meal', 'nutrition', 'hungry', 'drink', 'water'],
  sleep: ['sleep', 'rest', 'tired', 'insomnia', 'nap'],
  mental: ['sad', 'anxious', 'stress', 'worry', 'mental', 'depressed', 'lonely'],
};

const generateResponse = async (message, user, medicines) => {
  const lower = message.toLowerCase();
  const userName = user.name.split(' ')[0];
  
  // Check categories
  const matchCategory = (keywords) => keywords.some(k => lower.includes(k));
  
  if (matchCategory(BOT_RESPONSES.greet)) {
    const time = new Date().getHours();
    const greeting = time < 12 ? 'Good Morning' : time < 17 ? 'Good Afternoon' : 'Good Evening';
    return {
      message: `${greeting}, ${userName}! 🙏 I'm Saathi, your health assistant. How are you feeling today? I can help you with:\n• 💊 Medicine reminders\n• 🩺 Health advice\n• 🚨 SOS alerts\n• 🎵 Relaxing music\n\nWhat do you need help with?`,
      action: null
    };
  }
  
  if (matchCategory(BOT_RESPONSES.emergency)) {
    return {
      message: `🚨 I understand you need emergency help! Please:\n1. Press the **SOS Button** on your dashboard immediately\n2. Call **112** (National Emergency)\n3. Call your doctor: ${user.doctorPhone || 'Not set'}\n\nStay calm, help is coming! 💪`,
      action: 'sos',
      urgent: true
    };
  }
  
  if (matchCategory(BOT_RESPONSES.medicine) || matchCategory(BOT_RESPONSES.reminder)) {
    if (medicines.length === 0) {
      return {
        message: `${userName}, you haven't added any medicines yet. 💊\n\nGo to the **Medicines** section to add your medications and set reminders. I'll make sure you never miss a dose!`,
        action: 'medicines'
      };
    }
    
    const now = new Date().toTimeString().slice(0, 5);
    const upcoming = [];
    medicines.forEach(med => {
      med.reminderTimes.forEach(rt => {
        if (rt.time >= now && !rt.taken) {
          upcoming.push(`${med.name} (${med.dosage}) at ${rt.time}`);
        }
      });
    });
    
    if (upcoming.length > 0) {
      return {
        message: `💊 Here are your upcoming medicines today:\n\n${upcoming.map((m, i) => `${i+1}. ${m}`).join('\n')}\n\nRemember to take them on time! 🕐`,
        action: 'medicines'
      };
    } else {
      return {
        message: `✅ Great news, ${userName}! You're all caught up with medicines for today. All doses have been taken or are scheduled later.\n\nYou have ${medicines.length} medicine(s) total in your list.`,
        action: 'medicines'
      };
    }
  }
  
  if (matchCategory(BOT_RESPONSES.bp)) {
    return {
      message: `❤️ Blood pressure management tips for you:\n\n• 🧂 Limit salt intake (<5g/day)\n• 🥗 Eat fruits, vegetables, whole grains (DASH diet)\n• 🚶 Walk 30 minutes daily\n• 😴 Sleep 7-8 hours\n• 🚭 Avoid smoking and alcohol\n• 💊 Take prescribed medicines regularly\n\nNormal BP: 120/80 mmHg\nConsult Dr. ${user.doctorName || 'your doctor'} if it's consistently high!`,
      action: null
    };
  }
  
  if (matchCategory(BOT_RESPONSES.sugar)) {
    return {
      message: `🩸 Diabetes management tips:\n\n• 📊 Monitor blood glucose daily\n• 🥗 Low glycemic index diet\n• 🚶 Exercise 30 min/day\n• 💧 Stay hydrated (8 glasses/day)\n• ⚖️ Maintain healthy weight\n• 💊 Never skip medication\n\nTarget glucose: 70-130 mg/dL (fasting)\nRegular HbA1c tests every 3 months are important!`,
      action: null
    };
  }
  
  if (matchCategory(BOT_RESPONSES.music)) {
    return {
      message: `🎵 I'll open the music player for you! Calming music helps reduce stress and blood pressure. \n\nBenefits of relaxing music:\n• Reduces anxiety\n• Improves sleep quality\n• Lowers blood pressure\n• Boosts mood\n\nEnjoy your music time, ${userName}! 🎶`,
      action: 'music'
    };
  }
  
  if (matchCategory(BOT_RESPONSES.exercise)) {
    return {
      message: `🏃 Exercise tips for seniors:\n\n• 🚶 Start with 10-15 min walks daily\n• 🧘 Gentle yoga or stretching\n• 🪑 Chair exercises if mobility is limited\n• 🏊 Swimming is excellent (low impact)\n• 💪 Light resistance exercises\n\nBest time: Morning or evening. Always warm up first!\n\nRemember: Consult Dr. ${user.doctorName || 'your doctor'} before starting new exercise! 💪`,
      action: null
    };
  }
  
  if (matchCategory(BOT_RESPONSES.food)) {
    return {
      message: `🥗 Healthy eating tips for you:\n\n• 🌾 Choose whole grains over refined\n• 🥬 Half your plate = vegetables\n• 💧 Drink 8 glasses of water daily\n• 🐟 Include omega-3 rich foods (fish, walnuts)\n• 🍎 Fruits as snacks instead of sweets\n• ⏰ Eat at regular meal times\n\nAny dietary restrictions? Check with Dr. ${user.doctorName || 'your doctor'}!`,
      action: null
    };
  }
  
  if (matchCategory(BOT_RESPONSES.sleep)) {
    return {
      message: `😴 Better sleep tips:\n\n• ⏰ Fixed sleep/wake schedule daily\n• 📱 No screens 1 hour before bed\n• 🌡️ Keep room cool (18-20°C)\n• ☕ Avoid caffeine after 2 PM\n• 🧘 Relaxation exercises before bed\n• 💊 If sleep issues persist, consult doctor\n\nSeniors need 7-9 hours of sleep. Sweet dreams! 🌙`,
      action: null
    };
  }
  
  if (matchCategory(BOT_RESPONSES.mental)) {
    return {
      message: `🤗 I hear you, ${userName}. Your feelings are valid!\n\nMental wellness tips:\n• 🗣️ Talk to family or friends\n• 🧘 Practice deep breathing\n• 🚶 Take a short walk outside\n• 📓 Write in a journal\n• 🎵 Listen to calming music\n• ☎️ Mental Health Helpline: **iCall: 9152987821**\n\nYou're not alone! 💙 Please speak to Dr. ${user.doctorName || 'a doctor'} if you need more support.`,
      action: null
    };
  }
  
  if (matchCategory(BOT_RESPONSES.health)) {
    return {
      message: `🩺 General health check:\n\nAs a senior, here are important regular checks:\n• 🩺 Full body checkup (yearly)\n• ❤️ Blood pressure (monthly)\n• 🩸 Blood sugar (3 months)\n• 👁️ Eye checkup (yearly)\n• 🦷 Dental checkup (6 months)\n\nYou can also use the **Disease Check** feature to analyze symptoms. Stay healthy, ${userName}! 💪`,
      action: 'disease'
    };
  }
  
  // Default response with suggestions
  return {
    message: `🤔 I'm not sure about "${message}", but I can help with:\n\n• 💊 "Show my medicines"\n• 🩺 "I have headache"\n• 🚨 "Emergency help"\n• 🎵 "Play music"\n• 🩸 "Blood pressure tips"\n• 💬 "I feel sad"\n\nTry one of these or visit the relevant section of your dashboard!`,
    action: null
  };
};

// @route POST /api/chatbot/message
router.post('/message', protect, async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Please enter a message.' });
    }
    
    const medicines = await Medicine.find({ user: req.user._id, isActive: true });
    const response = await generateResponse(message, req.user, medicines);
    
    res.json({
      success: true,
      response: response.message,
      action: response.action || null,
      urgent: response.urgent || false,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({ success: false, message: 'Chatbot service unavailable.' });
  }
});

module.exports = router;
