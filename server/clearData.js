const mongoose = require('mongoose');
const User = require('./models/User');
const WorkOrder = require('./models/WorkOrder');
require('dotenv').config();

const clearData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB!');

    // Clear all service men and work orders
    await User.deleteMany({ role: 'Service Man' });
    await WorkOrder.deleteMany({});
    console.log('✅ All dummy/seed data cleared!');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error clearing data:', err);
    process.exit(1);
  }
};

clearData();
