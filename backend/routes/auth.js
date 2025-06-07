require('dotenv').config();

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const twilio = require('twilio');

const { sendOTP, verifyOTP } = require('../utils/twilio');

// Check environment variables
if (
  !process.env.JWT_SECRET ||
  !process.env.TWILIO_ACCOUNT_SID ||
  !process.env.TWILIO_AUTH_TOKEN ||
  !process.env.TWILIO_VERIFY_SID
) {
  console.error("❌ Missing environment variables. Check .env setup.");
  process.exit(1);
}

// 📲 Request OTP (uses utility)
router.post('/request-otp', async (req, res) => {
  try {
    const { phoneNumber, countryCode } = req.body;

    if (!phoneNumber || !countryCode) {
      return res.status(400).json({
        error: 'Phone number and country code are required',
        success: false
      });
    }

    const result = await sendOTP(phoneNumber, countryCode);
    if (result.success) {
      res.status(200).json({
        success: true,
        status: result.status,
        message: 'OTP sent successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to send OTP'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send OTP'
    });
  }
});

// ✅ Verify OTP (uses utility)
router.post('/verify-otp', async (req, res) => {
  try {
    const { phoneNumber, countryCode, otp } = req.body;

    if (!phoneNumber || !countryCode || !otp) {
      return res.status(400).json({
        error: 'Phone number, country code, and OTP are required',
        success: false
      });
    }

    const result = await verifyOTP(phoneNumber, countryCode, otp);
    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'OTP verified successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Invalid OTP'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to verify OTP'
    });
  }
});

// 🧾 Register User
router.post('/register', async (req, res) => {
  try {
    let { phoneNumber, name, email, password, otp } = req.body;

    // Standardize phone number to 91XXXXXXXXXX
    phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
    if (!phoneNumber.startsWith('91')) {
      phoneNumber = `91${phoneNumber}`;
    }

    if (!phoneNumber || !name || !email || !password || !otp) {
      return res.status(400).json({ error: 'All fields are required', success: false });
    }

    // Verify OTP before registering user
    const otpResult = await verifyOTP(phoneNumber, '91', otp);
    if (!otpResult.success) {
      return res.status(400).json({ error: 'Invalid or expired OTP', success: false });
    }

    const existingUser = await User.findOne({ phoneNumber });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists', success: false });
    }

    const user = new User({
      userId: `user_${Date.now()}`,
      phoneNumber,
      name,
      email,
      // password: await bcrypt.hash(password, 10), // <-- Commented out bcrypt logic
      password: password, // <-- Store plain text password (for now)
      role: 'user',
      isActive: true,
      lastLogin: new Date()
    });

    await user.save();

    const token = jwt.sign(
      { userId: user.userId, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Send Welcome Message (optional, requires TWILIO_PHONE_NUMBER)
    try {
      if (process.env.TWILIO_PHONE_NUMBER) {
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        await client.messages.create({
          body: `Welcome to Hope-AI! Your account has been successfully created.`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: phoneNumber
        });
      }
    } catch (twilioError) {
      console.error('⚠️ Failed to send welcome SMS:', twilioError.message);
    }

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        phoneNumber: user.phoneNumber
      }
    });

  } catch (error) {
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
});

// 🔐 Login Route (Manual, not OTP)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

     console.log('Login attempt:', email, password);
    const user = await User.findOne({ email });
    console.log('Found user:', user);
    console.log('User Password:',user.password);
    console.log('User password:', user ? user.password : 'No user found');
    // If using bcrypt:
    // if (!user || !await bcrypt.compare(password, user.password)) {
    //   return res.status(400).json({ error: 'Invalid credentials', success: false });
    // }
    // For plain text password:
    if (!user || user.password !== password) {
      return res.status(400).json({ error: 'Invalid credentials', success: false });
    }

    const token = jwt.sign(
      { userId: user.userId, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // user.lastLogin = new Date();
    // await user.save();

     // Use findOneAndUpdate instead of user.save()
    await User.findOneAndUpdate(
      { email },
      { $set: { lastLogin: new Date() } }
    );

    res.status(200).json({
      token,
      userId: user.userId,
      role: user.role
    });

  } catch (error) {
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
});
module.exports = router;
