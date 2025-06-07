const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    unique: true,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  countryCode: {
    type: String,
    required: true,
    default: '91'
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['user', 'doctor', 'admin'],
    required: true
  },
  password: {
    type: String,
    required: true
  },
  otp: {
    code: String,
    expiresAt: Date,
    sentAt: Date
  },
  otpAttempts: {
    type: Number,
    default: 0
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  lockedUntil: {
    type: Date
  },
  lastLogin: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  adminPhone: {
    type: String,
    required: function() {
      return this.type === 'admin';
    }
  },
  notifications: [{
    type: {
      type: String,
      enum: ['sms', 'email'],
      default: 'sms'
    },
    contact: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

userSchema.pre('save', async function(next) {
  if (!this.userId) {
    this.userId = `${this.type}_${Math.floor(100000 + Math.random() * 900000)}`;
  }
  next();
});

const User = mongoose.model('User', userSchema);
module.exports = User;
