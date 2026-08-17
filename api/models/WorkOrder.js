const mongoose = require('mongoose');

const workOrderSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  customerName: {
    type: String,
    required: true
  },
  customerPhone: {
    type: String,
    required: true
  },
  customerAddress: {
    type: String,
    default: ''
  },
  customerCurrentLocation: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    default: null
  },
  serviceType: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  estimatedCost: {
    type: Number,
    default: 0
  },
  earnings: {
    type: Number,
    default: 0
  },
  completedAt: {
    type: Date,
    default: null
  },
  // New fields for service man features
  beforeImage: {
    type: String,
    default: ''
  },
  afterImage: {
    type: String,
    default: ''
  },
  serviceDetails: {
    type: String,
    default: ''
  },
  partsChanged: {
    type: String,
    default: ''
  },
  finalCost: {
    type: Number,
    default: 0
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'upi', 'card', 'net-banking'],
    default: 'cash'
  },
  startedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('WorkOrder', workOrderSchema);
