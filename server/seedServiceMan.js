require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const createServiceMan = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const existingUser = await User.findOne({ email: 'serviceman@example.com' });
    if (existingUser) {
      console.log('Service man already exists!');
      console.log('Email: serviceman@example.com');
      console.log('Password: password123');
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash('password123', 10);
    const serviceMan = new User({
      firstName: 'Service',
      lastName: 'Man',
      email: 'serviceman@example.com',
      phone: '9876543210',
      password: hashedPassword,
      role: 'Service Man',
      team: 'Service',
      notes: 'Sample service man account'
    });

    await serviceMan.save();
    console.log('Service man created successfully!');
    console.log('Email: serviceman@example.com');
    console.log('Password: password123');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

createServiceMan();
