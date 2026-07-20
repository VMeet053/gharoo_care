const mongoose = require('mongoose');

const premiumUserSchema = new mongoose.Schema({
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
  plan: {
    type: String,
    default: 'Premium'
  },
  price: {
    type: String,
    default: '$0'
  },
  city: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    default: ''
  },
  upiId: {
    type: String,
    default: ''
  },
  paymentName: {
    type: String,
    default: ''
  },
  paymentMethod: {
    type: String,
    default: 'UPI'
  },
  paymentStatus: {
    type: String,
    enum: ['Pending Approval', 'Approved'],
    default: 'Pending Approval'
  },
  transactionNote: {
    type: String,
    default: ''
  },
  leadData: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  expiryDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Payment Pending', 'Active', 'Expiring Soon', 'Expired'],
    default: 'Active'
  }
}, { timestamps: true });

// Convert _id to id in JSON representation
premiumUserSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('PremiumUser', premiumUserSchema);
