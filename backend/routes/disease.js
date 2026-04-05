const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// Comprehensive symptom-disease dataset with weighted scoring
const DISEASE_DATABASE = [
  {
    name: 'Common Cold',
    symptoms: ['runny nose', 'sneezing', 'sore throat', 'mild fever', 'cough', 'congestion', 'headache', 'fatigue'],
    advice: 'Rest well, drink plenty of fluids, use steam inhalation. Take OTC cold medicine if needed.',
    urgency: 'low',
    specialist: 'General Physician',
    emoji: '🤧',
    prevention: 'Wash hands frequently, avoid close contact with sick people'
  },
  {
    name: 'Influenza (Flu)',
    symptoms: ['high fever', 'body ache', 'severe fatigue', 'chills', 'headache', 'dry cough', 'sore throat', 'muscle pain'],
    advice: 'Rest, stay hydrated, take fever reducers (paracetamol). Consult doctor if symptoms worsen.',
    urgency: 'medium',
    specialist: 'General Physician',
    emoji: '🤒',
    prevention: 'Annual flu vaccine, good hand hygiene'
  },
  {
    name: 'Hypertension',
    symptoms: ['headache', 'dizziness', 'chest pain', 'blurred vision', 'nosebleed', 'shortness of breath', 'palpitations'],
    advice: 'Check blood pressure immediately. Reduce salt intake, exercise regularly. Consult cardiologist.',
    urgency: 'high',
    specialist: 'Cardiologist',
    emoji: '❤️',
    prevention: 'Healthy diet, regular exercise, stress management, limit alcohol'
  },
  {
    name: 'Type 2 Diabetes',
    symptoms: ['frequent urination', 'excessive thirst', 'unexplained weight loss', 'blurred vision', 'fatigue', 'slow wound healing', 'tingling hands'],
    advice: 'Monitor blood sugar. Dietary changes essential. Consult endocrinologist for medication.',
    urgency: 'high',
    specialist: 'Endocrinologist',
    emoji: '🩸',
    prevention: 'Maintain healthy weight, regular exercise, balanced diet, limit sugar intake'
  },
  {
    name: 'Arthritis',
    symptoms: ['joint pain', 'joint swelling', 'stiffness', 'reduced range of motion', 'warmth around joints', 'fatigue'],
    advice: 'Light exercises, warm/cold compresses, anti-inflammatory diet. Consult rheumatologist.',
    urgency: 'medium',
    specialist: 'Rheumatologist',
    emoji: '🦴',
    prevention: 'Regular exercise, maintain healthy weight, avoid joint injuries'
  },
  {
    name: 'Gastritis / Acid Reflux',
    symptoms: ['stomach pain', 'heartburn', 'nausea', 'vomiting', 'bloating', 'indigestion', 'burping', 'loss of appetite'],
    advice: 'Avoid spicy/fried foods, eat smaller meals. Antacids may help. Consult gastroenterologist.',
    urgency: 'low',
    specialist: 'Gastroenterologist',
    emoji: '🫁',
    prevention: 'Eat slowly, avoid trigger foods, don\'t lie down after eating'
  },
  {
    name: 'Migraine',
    symptoms: ['severe headache', 'throbbing pain', 'nausea', 'sensitivity to light', 'sensitivity to sound', 'visual disturbances', 'vomiting'],
    advice: 'Rest in dark quiet room, cold compress on forehead. Pain relievers if prescribed. Consult neurologist.',
    urgency: 'medium',
    specialist: 'Neurologist',
    emoji: '🧠',
    prevention: 'Identify and avoid triggers, regular sleep, stress management'
  },
  {
    name: 'Asthma',
    symptoms: ['wheezing', 'shortness of breath', 'chest tightness', 'coughing at night', 'difficulty breathing', 'rapid breathing'],
    advice: 'Use prescribed inhaler immediately. Avoid triggers. Seek emergency care if breathing doesn\'t improve.',
    urgency: 'high',
    specialist: 'Pulmonologist',
    emoji: '💨',
    prevention: 'Avoid triggers, use air purifiers, stay away from smoke'
  },
  {
    name: 'Urinary Tract Infection (UTI)',
    symptoms: ['burning urination', 'frequent urination', 'cloudy urine', 'lower abdominal pain', 'blood in urine', 'strong urine odor', 'pelvic pain'],
    advice: 'Drink plenty of water, cranberry juice may help. Antibiotics required – consult doctor.',
    urgency: 'medium',
    specialist: 'Urologist',
    emoji: '🚰',
    prevention: 'Stay hydrated, maintain hygiene, urinate after intercourse'
  },
  {
    name: 'Anemia',
    symptoms: ['fatigue', 'weakness', 'pale skin', 'dizziness', 'shortness of breath', 'cold hands', 'brittle nails', 'rapid heartbeat', 'headache'],
    advice: 'Iron-rich diet (spinach, dates, meat). Iron supplements as prescribed. Blood test recommended.',
    urgency: 'medium',
    specialist: 'Hematologist',
    emoji: '🩸',
    prevention: 'Iron-rich diet, vitamin C with iron foods, regular blood tests'
  },
  {
    name: 'COVID-19 / Viral Infection',
    symptoms: ['fever', 'dry cough', 'fatigue', 'loss of taste', 'loss of smell', 'difficulty breathing', 'body ache', 'sore throat'],
    advice: 'Isolate immediately, get tested. Rest, hydrate, monitor oxygen levels. Seek immediate care if breathless.',
    urgency: 'high',
    specialist: 'General Physician / Emergency',
    emoji: '🦠',
    prevention: 'Vaccination, masks, hand hygiene, social distancing'
  },
  {
    name: 'Depression / Anxiety',
    symptoms: ['persistent sadness', 'loss of interest', 'sleep problems', 'fatigue', 'hopelessness', 'anxiety', 'nervousness', 'restlessness', 'poor concentration'],
    advice: 'Speak with a mental health professional. Therapy and medication can help. Connect with loved ones.',
    urgency: 'medium',
    specialist: 'Psychiatrist / Psychologist',
    emoji: '🧠',
    prevention: 'Regular exercise, social connections, mindfulness, limit alcohol'
  },
  {
    name: 'Back Pain',
    symptoms: ['back pain', 'lower back pain', 'stiffness', 'radiating pain', 'muscle spasm', 'difficulty standing', 'pain when bending'],
    advice: 'Rest, hot/cold therapy, gentle stretching. Physiotherapy recommended. Pain relievers if needed.',
    urgency: 'low',
    specialist: 'Orthopedician / Physiotherapist',
    emoji: '🦴',
    prevention: 'Proper posture, regular exercise, ergonomic furniture, avoid heavy lifting'
  },
  {
    name: 'Dengue Fever',
    symptoms: ['high fever', 'severe headache', 'eye pain', 'joint pain', 'muscle pain', 'skin rash', 'nausea', 'vomiting', 'fatigue'],
    advice: 'URGENT: Visit hospital immediately. Stay hydrated, avoid aspirin. Platelet count monitoring needed.',
    urgency: 'critical',
    specialist: 'Emergency / General Physician',
    emoji: '🦟',
    prevention: 'Mosquito repellent, wear full sleeves, eliminate standing water'
  },
  {
    name: 'Thyroid Disorder',
    symptoms: ['unexplained weight gain', 'fatigue', 'cold intolerance', 'dry skin', 'hair loss', 'constipation', 'muscle weakness', 'depression', 'slow heart rate'],
    advice: 'Blood test (TSH, T3, T4) essential. Thyroid medication as prescribed. Dietary adjustments.',
    urgency: 'medium',
    specialist: 'Endocrinologist',
    emoji: '🫀',
    prevention: 'Adequate iodine intake, regular thyroid check-ups after 40'
  }
];

// ML-inspired weighted scoring algorithm
const predictDisease = (inputSymptoms) => {
  const normalizedInput = inputSymptoms.map(s => s.toLowerCase().trim());
  
  const scores = DISEASE_DATABASE.map(disease => {
    let matchCount = 0;
    let totalMatched = 0;
    
    normalizedInput.forEach(inputSymptom => {
      disease.symptoms.forEach(diseaseSymptom => {
        // Exact match gets full score
        if (diseaseSymptom.includes(inputSymptom) || inputSymptom.includes(diseaseSymptom)) {
          totalMatched++;
          matchCount += 1;
        }
        // Partial word match gets partial score
        const inputWords = inputSymptom.split(' ');
        const diseaseWords = diseaseSymptom.split(' ');
        const wordMatches = inputWords.filter(w => diseaseWords.includes(w)).length;
        if (wordMatches > 0) {
          matchCount += wordMatches * 0.5;
        }
      });
    });
    
    // Calculate confidence score (0-100)
    const matchRatio = matchCount / disease.symptoms.length;
    const coverageRatio = totalMatched / Math.max(normalizedInput.length, 1);
    const confidence = Math.min(95, Math.round((matchRatio * 0.6 + coverageRatio * 0.4) * 100));
    
    return { ...disease, confidence, matchedSymptoms: totalMatched };
  });
  
  return scores
    .filter(d => d.confidence > 10)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3);
};

// @route POST /api/disease/predict
router.post('/predict', protect, async (req, res) => {
  try {
    const { symptoms } = req.body;
    
    if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide at least one symptom.' });
    }
    
    if (symptoms.length > 15) {
      return res.status(400).json({ success: false, message: 'Please enter up to 15 symptoms.' });
    }
    
    const predictions = predictDisease(symptoms);
    
    if (predictions.length === 0) {
      return res.json({
        success: true,
        predictions: [],
        disclaimer: 'No matching conditions found. Please consult a doctor for proper diagnosis.',
        generalAdvice: 'Keep a symptom diary and share it with your doctor.'
      });
    }
    
    const hasCritical = predictions.some(p => p.urgency === 'critical');
    const hasHigh = predictions.some(p => p.urgency === 'high');
    
    res.json({
      success: true,
      predictions: predictions.map(p => ({
        name: p.name,
        confidence: p.confidence,
        advice: p.advice,
        urgency: p.urgency,
        specialist: p.specialist,
        emoji: p.emoji,
        prevention: p.prevention,
        matchedSymptoms: p.matchedSymptoms
      })),
      disclaimer: '⚠️ This is an AI-based preliminary assessment only. It is NOT a medical diagnosis. Please consult a qualified doctor.',
      seekImmediateCare: hasCritical || hasHigh,
      emergencyMessage: hasCritical ? '🚨 URGENT: Please seek immediate medical attention!' : null
    });
  } catch (error) {
    console.error('Disease prediction error:', error);
    res.status(500).json({ success: false, message: 'Prediction service unavailable.' });
  }
});

// @route GET /api/disease/symptoms-list
router.get('/symptoms-list', protect, (req, res) => {
  const allSymptoms = [...new Set(DISEASE_DATABASE.flatMap(d => d.symptoms))].sort();
  res.json({ success: true, symptoms: allSymptoms });
});

module.exports = router;
