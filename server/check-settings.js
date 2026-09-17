
require('dotenv').config();
const mongoose = require('mongoose');
const PanelSettings = require('./models/PanelSettings');

async function checkSettings() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const settings = await PanelSettings.findOne();
    console.log('Current PanelSettings:', JSON.stringify(settings, null, 2));
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

checkSettings();
