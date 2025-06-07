require('dotenv').config();

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const twilio = require('twilio');

// Initialize Twilio
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const verifyService = process.env.TWILIO_VERIFY_SID;

// Check environment variables
if (!process.env.JWT_SECRET || !process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !verifyService) {
  console.error("❌ Missing environment variables. Check .env setup.");
  process.exit(1);
}

const { sendOTP, verifyOTP } = require('../utils/twilio');

// 📲 Request OTP
router.post('/request-otp', async (req, res) => {
  try {
    const { phoneNumber, countryCode } = req.body;

    if (!phoneNumber || !countryCode) {
      return res.status(400).json({ error: 'Phone number and country code are required', success: false });
    }

    const fullNumber = `+${countryCode}${phoneNumber}`;

    const verification = await client.verify.v2.services(verifyService)
      .verifications
      .create({ to: fullNumber, channel: 'sms' });

    console.log(`✅ OTP sent to ${fullNumber}. Status: ${verification.status}`);
    res.status(200).json({
      success: true,
      status: verification.status,
      message: 'OTP sent successfully'
    });

  } catch (error) {
    console.error('❌ OTP sending failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send OTP',
      details: {
        code: error.code,
        status: error.status
      }
    });
  }
});

// ✅ Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { phoneNumber, otp, countryCode } = req.body;

    if (!phoneNumber || !otp || !countryCode) {
      return res.status(400).json({ error: 'Phone number, country code, and OTP are required', success: false });
    }

    const fullNumber = `+${countryCode}${phoneNumber}`;

    const verificationCheck = await client.verify.v2.services(verifyService)
      .verificationChecks
      .create({
        to: fullNumber,
        code: otp
      });

    if (verificationCheck.status === 'approved') {
      console.log('✅ OTP verified successfully');
      res.status(200).json({
        success: true,
        message: 'OTP verified successfully'
      });
    } else {
      console.log('❌ Invalid OTP');
      res.status(400).json({
        success: false,
        error: 'Invalid OTP'
      });
    }

  } catch (error) {
    console.error('❌ OTP verification failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to verify OTP',
      details: {
        code: error.code,
        status: error.status
      }
    });
  }
});

// 🧾 Register User
router.post('/register', async (req, res) => {
  try {
    const { phoneNumber, name, password, userType = 'user', email } = req.body;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ error: 'Valid email is required', success: false });
    }

    // Check if user exists with same email or phone
    const existingUser = await User.findOne({
      $or: [
        { phoneNumber },
        { email }
      ]
    });
    
    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ error: 'Email already registered', success: false });
      }
      if (existingUser.phoneNumber === phoneNumber) {
        return res.status(400).json({ error: 'Phone number already registered', success: false });
      }
    }

    const user = new User({
      userId: `user_${Date.now()}`,
      phoneNumber,
      email,
      name,
      password: await bcrypt.hash(password, 10),
      type: userType,
      isActive: true,
      lastLogin: new Date()
    });

    await user.save();

    const token = jwt.sign({ userId: user.userId, type: user.type }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    });

    // Send Welcome Message
    try {
      await client.messages.create({
        body: `Welcome to Hope-AI! Your account has been successfully created.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber
      });
    } catch (twilioError) {
      console.error('⚠️ Failed to send welcome SMS:', twilioError.message);
    }

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        userId: user.userId,
        name: user.name,
        type: user.type,
        phoneNumber: user.phoneNumber,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
});

// 🔐 Login Route (Manual, not OTP)
router.post('/login', async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;

    const user = await User.findOne({ phoneNumber });
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(400).json({ error: 'Invalid credentials', success: false });
    }

    const token = jwt.sign(
      { userId: user.userId, userType: user.type },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    user.lastLogin = new Date();
    await user.save();

    res.status(200).json({
      token,
      userId: user.userId,
      userType: user.type
    });

  } catch (error) {
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
});

module.exports = router;

// Update the request-otp route
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

// Update the verify-otp route
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

// Send OTP
router.post('/send-otp', async (req, res) => {
    try {
        const { phoneNumber, countryCode } = req.body;

        if (!phoneNumber || !countryCode) {
            return res.status(400).json({
                success: false,
                message: 'Phone number and country code are required'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ phoneNumber });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this phone number'
            });
        }

        const result = await sendOTP(phoneNumber, countryCode);
        
        if (!result.success) {
            console.error('OTP sending failed:', result.error);
            return res.status(400).json({
                success: false,
                message: 'Failed to send OTP. Please try again.'
            });
        }

        res.json({
            success: true,
            message: 'OTP sent successfully'
        });
    } catch (error) {
        console.error('Error in send-otp:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send OTP. Please try again.'
        });
    }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
    try {
        const { phoneNumber, countryCode, code } = req.body;

        if (!phoneNumber || !countryCode || !code) {
            return res.status(400).json({
                success: false,
                message: 'Phone number, country code, and OTP code are required'
            });
        }

        const result = await verifyOTP(phoneNumber, countryCode, code);
        
        if (!result.success) {
            console.error('OTP verification failed:', result.error);
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP. Please try again.'
            });
        }

        res.json({
            success: true,
            message: 'OTP verified successfully'
        });
    } catch (error) {
        console.error('Error in verify-otp:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify OTP. Please try again.'
        });
    }
});
