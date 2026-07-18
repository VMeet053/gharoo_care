const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true
  },
  team: {
    type: String,
    required: true
  },
  service: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    default: 'Active'
  },
  avatar: {
    type: String,
    default: '/assets/images/avatar/avatar-1.jpg'
  },
  address: {
    type: String,
    default: ''
  },
  currentLocation: {
    type: String,
    default: ''
  },
  houseNumber: {
    type: String,
    default: ''
  },
  city: {
    type: String,
    default: ''
  },
  state: {
    type: String,
    default: ''
  },
  pinCode: {
    type: String,
    default: ''
  },
  idProofType: {
    type: String,
    enum: ['Pan Card', 'Aadhaar Card', 'Driving License', 'Election Card'],
    default: null
  },
  idProofNumber: {
    type: String,
    default: null
  },
  frontIdProofImage: {
    type: String,
    default: null
  },
  backIdProofImage: {
    type: String,
    default: null
  },
  employeeId: {
    type: String,
    default: undefined,
    unique: true,
    sparse: true
  },
  profilePic: {
    type: String,
    default: null
  },
  authorizationStatus: {
    type: String,
    enum: ['pending', 'authorized'],
    default: 'pending'
  },
  designation: {
    type: String,
    default: 'Service Technician'
  }
}, { timestamps: true });

// Virtual for full name
userSchema.virtual('name').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// To include virtuals in JSON
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', userSchema);
