const mongoose = require('mongoose');
const User = require('../models/User');
const Medicine = require('../models/Medicine');
require('dotenv').config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smartsaathi');
    console.log('Connected to MongoDB...');
    await User.deleteMany({});
    await Medicine.deleteMany({});
    console.log('Cleared existing data...');

    const user = await User.create({
      name: 'Ramesh Kumar',
      phone: '9876543210',
      email: 'ramesh@example.com',
      age: 68,
      gender: 'male',
      bloodGroup: 'B+',
      isVerified: true,
      doctorName: 'Dr. Sunita Sharma',
      doctorPhone: '9811234567',
      medicalConditions: [
        { name: 'Hypertension', since: '2018', severity: 'moderate' },
        { name: 'Type 2 Diabetes', since: '2020', severity: 'mild' }
      ],
      emergencyContacts: [
        { name: 'Priya Kumar', phone: '9845678901', relation: 'Daughter' },
        { name: 'Suresh Kumar', phone: '9823456789', relation: 'Son' }
      ]
    });

    await Medicine.insertMany([
      {
        user: user._id, name: 'Metformin', dosage: '500mg',
        frequency: 'twice_daily', category: 'tablet', color: '#4A90D9',
        instructions: 'Take with meals',
        reminderTimes: [{ time: '08:00', label: 'Morning' }, { time: '20:00', label: 'Night' }]
      },
      {
        user: user._id, name: 'Amlodipine', dosage: '5mg',
        frequency: 'once_daily', category: 'tablet', color: '#E74C3C',
        reminderTimes: [{ time: '09:00', label: 'Morning' }]
      },
      {
        user: user._id, name: 'Vitamin D3', dosage: '1000 IU',
        frequency: 'once_daily', category: 'capsule', color: '#F39C12',
        reminderTimes: [{ time: '08:30', label: 'Morning' }]
      },
      {
        user: user._id, name: 'Atorvastatin', dosage: '10mg',
        frequency: 'once_daily', category: 'tablet', color: '#9B59B6',
        reminderTimes: [{ time: '21:00', label: 'Night' }]
      }
    ]);

    console.log('✅ Sample user created: Ramesh Kumar (Phone: 9876543210)');
    console.log('✅ 4 sample medicines added');
    console.log('\n================================');
    console.log('TEST LOGIN: Phone: 9876543210');
    console.log('OTP will appear on screen automatically');
    console.log('================================\n');
    await mongoose.connection.close();
    console.log('✅ Seed completed successfully!');
  } catch (error) {
    console.error('Seed error:', error.message);
    process.exit(1);
  }
};

seedData();
