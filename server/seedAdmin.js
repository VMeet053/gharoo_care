require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB!');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'gharoocare@gmail.com' });
    if (existingAdmin) {
      console.log('Admin user already exists!');
      process.exit(0);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('Gharoocare!@#$1234', 10);

    // Create admin user
    const adminUser = new User({
      firstName: 'Gharoocare',
      lastName: 'Admin',
      email: 'gharoocare@gmail.com',
      phone: '1234567890',
      password: hashedPassword,
      role: 'Admin',
      team: 'Operations'
    });

    await adminUser.save();
    console.log('Admin user created successfully!');
    console.log('Email: gharoocare@gmail.com');
    console.log('Password: Gharoocare!@#$1234');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding admin user:', err);
    process.exit(1);
  }
};

seedAdmin();
