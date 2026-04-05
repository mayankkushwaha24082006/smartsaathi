const mongoose = require('mongoose');
const User = require('../models/User');
const Medicine = require('../models/Medicine');
require('dotenv').config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smartsaathi');
    console.log('Connected to MongoDB...');

    // Clear existing data
    await User.deleteMany({});
    await Medicine.deleteMany({});
    console.log('Cleared existing data...');

    // Create sample user (no password - uses OTP login)
    const user = await User.create({
      name: 'Ramesh Kumar',
      phone: '9876543210',
      email: 'ramesh.kumar@example.com',
      age: 68,
      gender: 'male',
      bloodGroup: 'B+',
      address: 'House No. 42, Sector 12, Noida, UP 201301',
      isVerified: true,
      doctorName: 'Dr. Sunita Sharma',
      doctorPhone: '9811234567',
      medicalConditions: [
        { name: 'Hypertension', since: '2018', severity: 'moderate' },
        { name: 'Type 2 Diabetes', since: '2020', severity: 'mild' }
      ],
      emergencyContacts: [
        { name: 'Priya Kumar (Daughter)', phone: '9845678901', relation: 'Daughter' },
        { name: 'Suresh Kumar (Son)', phone: '9823456789', relation: 'Son' }
      ],
      allergies: ['Penicillin', 'Aspirin'],
    });

    console.log(`✅ Sample user created: ${user.name} (Phone: 9876543210)`);

    // Add medicines for sample user
    const medicines = await Medicine.insertMany([
      {
        user: user._id,
        name: 'Metformin',
        dosage: '500mg',
        frequency: 'twice_daily',
        category: 'tablet',
        color: '#4A90D9',
        instructions: 'Take with meals',
        prescribedBy: 'Dr. Sunita Sharma',
        reminderTimes: [
          { time: '08:00', label: 'Morning', taken: false },
          { time: '20:00', label: 'Night', taken: false }
        ],
        isActive: true
      },
      {
        user: user._id,
        name: 'Amlodipine',
        dosage: '5mg',
        frequency: 'once_daily',
        category: 'tablet',
        color: '#E74C3C',
        instructions: 'Take in the morning',
        prescribedBy: 'Dr. Sunita Sharma',
        reminderTimes: [
          { time: '09:00', label: 'Morning', taken: false }
        ],
        isActive: true
      },
      {
        user: user._id,
        name: 'Vitamin D3',
        dosage: '1000 IU',
        frequency: 'once_daily',
        category: 'capsule',
        color: '#F39C12',
        instructions: 'Take with breakfast',
        reminderTimes: [
          { time: '08:30', label: 'Morning', taken: false }
        ],
        isActive: true
      },
      {
        user: user._id,
        name: 'Atorvastatin',
        dosage: '10mg',
        frequency: 'once_daily',
        category: 'tablet',
        color: '#9B59B6',
        instructions: 'Take at night',
        prescribedBy: 'Dr. Sunita Sharma',
        reminderTimes: [
          { time: '21:00', label: 'Night', taken: false }
        ],
        isActive: true
      }
    ]);

    console.log(`✅ ${medicines.length} sample medicines added`);
    console.log('\n📋 TEST LOGIN INSTRUCTIONS:');
    console.log('================================');
    console.log('Phone: 9876543210');
    console.log('Use "Send OTP" → OTP will appear in server console (dev mode)');
    console.log('================================\n');

    await mongoose.connection.close();
    console.log('✅ Seed completed successfully!');
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedData();
