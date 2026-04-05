const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

const DISEASE_DATABASE = [
  { name: 'Common Cold', symptoms: ['runny nose', 'sneezing', 'sore throat', 'mild fever', 'cough', 'congestion', 'headache', 'fatigue'], advice: 'Rest well, drink plenty of fluids, use steam inhalation.', urgency: 'low', specialist: 'General Physician', emoji: '🤧', prevention: 'Wash hands frequently' },
  { name: 'Influenza (Flu)', symptoms: ['high fever', 'body ache', 'severe fatigue', 'chills', 'headache', 'dry cough', 'sore throat', 'muscle pain'], advice: 'Rest, stay hydrated, take fever reducers. Consult doctor if symptoms worsen.', urgency: 'medium', specialist: 'General Physician', emoji: '🤒', prevention: 'Annual flu vaccine' },
  { name: 'Hypertension', symptoms: ['headache', 'dizziness', 'chest pain', 'blurred vision', 'nosebleed', 'shortness of breath', 'palpitations'], advice: 'Check blood pressure immediately. Reduce salt intake, exercise regularly.', urgency: 'high', specialist: 'Cardiologist', emoji: '❤️', prevention: 'Healthy diet, regular exercise' },
  { name: 'Type 2 Diabetes', symptoms: ['frequent urination', 'excessive thirst', 'unexplained weight loss', 'blurred vision', 'fatigue', 'slow wound healing'], advice: 'Monitor blood sugar. Dietary changes essential. Consult endocrinologist.', urgency: 'high', specialist: 'Endocrinologist', emoji: '🩸', prevention: 'Maintain healthy weight, regular exercise' },
  { name: 'Arthritis', symptoms: ['joint pain', 'joint swelling', 'stiffness', 'reduced range of motion', 'warmth around joints', 'fatigue'], advice: 'Light exercises, warm/cold compresses. Consult rheumatologist.', urgency: 'medium', specialist: 'Rheumatologist', emoji: '🦴', prevention: 'Regular exercise, maintain healthy weight' },
  { name: 'Gastritis', symptoms: ['stomach pain', 'heartburn', 'nausea', 'vomiting', 'bloating', 'indigestion', 'burping', 'loss of appetite'], advice: 'Avoid spicy foods, eat smaller meals. Antacids may help.', urgency: 'low', specialist: 'Gastroenterologist', emoji: '🫁', prevention: 'Eat slowly, avoid trigger foods' },
  { name: 'Migraine', symptoms: ['severe headache', 'throbbing pain', 'nausea', 'sensitivity to light', 'sensitivity to sound', 'vomiting'], advice: 'Rest in dark quiet room, cold compress. Consult neurologist.', urgency: 'medium', specialist: 'Neurologist', emoji: '🧠', prevention: 'Identify triggers, regular sleep' },
  { name: 'Asthma', symptoms: ['wheezing', 'shortness of breath', 'chest tightness', 'coughing at night', 'difficulty breathing'], advice: 'Use prescribed inhaler immediately. Seek emergency care if breathing does not improve.', urgency: 'high', specialist: 'Pulmonologist', emoji: '💨', prevention: 'Avoid triggers, use air purifiers' },
  { name: 'Dengue Fever', symptoms: ['high fever', 'severe headache', 'eye pain', 'joint pain', 'muscle pain', 'skin rash', 'nausea', 'vomiting'], advice: 'URGENT: Visit hospital immediately. Stay hydrated, avoid aspirin.', urgency: 'critical', specialist: 'Emergency', emoji: '🦟', prevention: 'Mosquito repellent, eliminate standing water' },
  { name: 'Anemia', symptoms: ['fatigue', 'weakness', 'pale skin', 'dizziness', 'shortness of breath', 'cold hands', 'brittle nails', 'rapid heartbeat'], advice: 'Iron-rich diet. Iron supplements as prescribed. Blood test recommended.', urgency: 'medium', specialist: 'Hematologist', emoji: '🩸', prevention: 'Iron-rich diet, regular blood tests' },
  { name: 'COVID-19', symptoms: ['fever', 'dry cough', 'fatigue', 'loss of taste', 'loss of smell', 'difficulty breathing', 'body ache', 'sore throat'], advice: 'Isolate immediately, get tested. Monitor oxygen levels.', urgency: 'high', specialist: 'General Physician', emoji: '🦠', prevention: 'Vaccination, masks, hand hygiene' },
  { name: 'Depression', symptoms: ['persistent sadness', 'loss of interest', 'sleep problems', 'fatigue', 'hopelessness', 'anxiety', 'poor concentration'], advice: 'Speak with a mental health professional. Therapy and medication can help.', urgency: 'medium', specialist: 'Psychiatrist', emoji: '🧠', prevention: 'Regular exercise, social connections' },
  { name: 'Back Pain', symptoms: ['back pain', 'lower back pain', 'stiffness', 'muscle spasm', 'difficulty standing', 'pain when bending'], advice: 'Rest, hot/cold therapy, gentle stretching. Physiotherapy recommended.', urgency: 'low', specialist: 'Orthopedician', emoji: '🦴', prevention: 'Proper posture, regular exercise' },
  { name: 'UTI', symptoms: ['burning urination', 'frequent urination', 'cloudy urine', 'lower abdominal pain', 'blood in urine', 'pelvic pain'], advice: 'Drink plenty of water. Antibiotics required - consult doctor.', urgency: 'medium', specialist: 'Urologist', emoji: '🚰', prevention: 'Stay hydrated, maintain hygiene' },
  { name: 'Thyroid Disorder', symptoms: ['unexplained weight gain', 'fatigue', 'cold intolerance', 'dry skin', 'hair loss', 'constipation', 'depression'], advice: 'Blood test (TSH, T3, T4) essential. Thyroid medication as prescribed.', urgency: 'medium', specialist: 'Endocrinologist', emoji: '🫀', prevention: 'Adequate iodine intake, regular checkups' }
];

const predictDisease = (inputSymptoms) => {
  const normalizedInput = inputSymptoms.map(s => s.toLowerCase().trim());
  const scores = DISEASE_DATABASE.map(disease => {
    let matchCount = 0; let totalMatched = 0;
    normalizedInput.forEach(inputSymptom => {
      disease.symptoms.forEach(diseaseSymptom => {
        if (diseaseSymptom.includes(inputSymptom) || inputSymptom.includes(diseaseSymptom)) { totalMatched++; matchCount += 1; }
        const inputWords = inputSymptom.split(' ');
        const diseaseWords = diseaseSymptom.split(' ');
        const wordMatches = inputWords.filter(w => diseaseWords.includes(w)).length;
        if (wordMatches > 0) matchCount += wordMatches * 0.5;
      });
    });
    const matchRatio = matchCount / disease.symptoms.length;
    const coverageRatio = totalMatched / Math.max(normalizedInput.length, 1);
    const confidence = Math.min(95, Math.round((matchRatio * 0.6 + coverageRatio * 0.4) * 100));
    return { ...disease, confidence, matchedSymptoms: totalMatched };
  });
  return scores.filter(d => d.confidence > 10).sort((a, b) => b.confidence - a.confidence).slice(0, 3);
};

router.post('/predict', protect, async (req, res) => {
  try {
    const { symptoms } = req.body;
    if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) return res.status(400).json({ success: false, message: 'Please provide at least one symptom.' });
    const predictions = predictDisease(symptoms);
    const hasCritical = predictions.some(p => p.urgency === 'critical');
    const hasHigh = predictions.some(p => p.urgency === 'high');
    res.json({
      success: true,
      predictions: predictions.map(p => ({ name: p.name, confidence: p.confidence, advice: p.advice, urgency: p.urgency, specialist: p.specialist, emoji: p.emoji, prevention: p.prevention })),
      disclaimer: 'This is an AI-based preliminary assessment only. NOT a medical diagnosis. Please consult a doctor.',
      seekImmediateCare: hasCritical || hasHigh,
      emergencyMessage: hasCritical ? 'URGENT: Please seek immediate medical attention!' : null
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Prediction service unavailable.' });
  }
});

router.get('/symptoms-list', protect, (req, res) => {
  const allSymptoms = [...new Set(DISEASE_DATABASE.flatMap(d => d.symptoms))].sort();
  res.json({ success: true, symptoms: allSymptoms });
});

module.exports = router;
