const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Otp = require('../models/Otp');
const auth = require('../middleware/auth');
require('dotenv').config();

const router = express.Router();

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Brevo API configuration
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_SENDER = { email: process.env.EMAIL_USER, name: 'auraFuel ⚡' };

// Helper function to send email via Brevo HTTP API
async function sendEmail(to, subject, htmlContent) {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'api-key': BREVO_API_KEY
        },
        body: JSON.stringify({
            sender: BREVO_SENDER,
            to: [{ email: to }],
            subject,
            htmlContent
        })
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Brevo API error');
    }
    return response.json();
}

// ✅ Send OTP
router.post('/send-otp', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Email is required' });

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        await Otp.deleteMany({ email });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await Otp.create({ email, otp });

        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px; border: 1px solid #e5e5e5; border-radius: 10px;">
                <h2 style="color: #000;">⚡ auraFuel</h2>
                <p>Your One‑Time Password (OTP) for registration is:</p>
                <h1 style="letter-spacing: 5px; color: #000;">${otp}</h1>
                <p style="color: #888; font-size: 12px;">This OTP is valid for 5 minutes.</p>
            </div>
        `;

        await sendEmail(email, 'Your OTP for auraFuel Registration', html);
        res.json({ message: 'OTP sent successfully' });
    } catch (error) {
        console.error('Send OTP error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// ✅ Signup (unchanged, already works)
router.post('/signup', async (req, res) => {
    try {
        const { fullName, email, mobile, password, gender, age, weight, goal, otp } = req.body;

        const existingUser = await User.findOne({ $or: [{ email }, { mobile }] });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email or mobile' });
        }

        const otpRecord = await Otp.findOne({ email });
        if (!otpRecord) {
            return res.status(400).json({ message: 'OTP expired or not sent.' });
        }
        if (otpRecord.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        const user = await User.create({ fullName, email, mobile, password, gender, age, weight, goal });
        await Otp.deleteOne({ _id: otpRecord._id });

        const token = generateToken(user._id);
        res.status(201).json({
            message: 'Account created successfully',
            token,
            user: { id: user._id, fullName: user.fullName, email: user.email, mobile: user.mobile, gender: user.gender, age: user.age, weight: user.weight, goal: user.goal }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// ✅ Forgot Password (send OTP)
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Email is required' });

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(400).json({ message: 'No account found with this email' });
        }

        await Otp.deleteMany({ email });
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await Otp.create({ email, otp });

        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px; border: 1px solid #e5e5e5; border-radius: 10px;">
                <h2 style="color: #000;">⚡ auraFuel</h2>
                <p>Your password reset OTP is:</p>
                <h1 style="letter-spacing: 5px; color: #000;">${otp}</h1>
                <p style="color: #888; font-size: 12px;">Valid for 5 minutes.</p>
            </div>
        `;

        await sendEmail(email, 'Reset Your auraFuel Password', html);
        res.json({ message: 'OTP sent to your email' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// ✅ Reset Password (unchanged)
router.post('/reset-password', async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword) return res.status(400).json({ message: 'All fields are required' });
        if (newPassword.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });

        const otpRecord = await Otp.findOne({ email });
        if (!otpRecord) return res.status(400).json({ message: 'OTP expired or not sent' });
        if (otpRecord.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) return res.status(400).json({ message: 'User not found' });

        user.password = newPassword;
        await user.save();
        await Otp.deleteOne({ _id: otpRecord._id });

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// ✅ Login (unchanged)
router.post('/login', async (req, res) => {
    try {
        const { credential, password } = req.body;
        const user = await User.findOne({ $or: [{ email: credential }, { mobile: credential }] });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = generateToken(user._id);
        res.json({
            message: 'Login successful',
            token,
            user: { id: user._id, fullName: user.fullName, email: user.email, mobile: user.mobile, gender: user.gender, age: user.age, weight: user.weight, goal: user.goal }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// ✅ Get current user (unchanged)
router.get('/me', auth, async (req, res) => {
    res.json({ user: req.user });
});

// ✅ Update profile (unchanged)
router.put('/me', auth, async (req, res) => {
    try {
        const { goal, age, weight } = req.body;
        const updateFields = {};
        if (goal) updateFields.goal = goal;
        if (age !== undefined) updateFields.age = age;
        if (weight !== undefined) updateFields.weight = weight;
        const user = await User.findByIdAndUpdate(req.user._id, { $set: updateFields }, { new: true }).select('-password');
        res.json({ message: 'Profile updated', user });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
