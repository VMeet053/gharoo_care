const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['New', 'Accepted', 'Contacted', 'Qualified', 'Lost'],
    default: 'New'
  },
  service: {
    type: String,
    required: true
  },
  city: {
    type: String,
    default: ''
  },
  area: {
    type: String,
    default: ''
  },
  assigned: {
    type: String,
    default: 'Unassigned'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Lead', leadSchema);
