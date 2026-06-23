const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Otp = require('../models/Otp');   // ✅ new model
const auth = require('../middleware/auth');
const nodemailer = require('nodemailer');
require('dotenv').config();

const router = express.Router();

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Nodemailer transporter
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // TLS
    requireTLS: true,
    family: 4,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false // optional, for self‑signed certs
    }
});

// ✅ NEW: Send OTP
router.post('/send-otp', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Email is required' });

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        // Delete any previous OTP for this email
        await Otp.deleteMany({ email });

        // Generate 6‑digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Save to DB (automatically expires after 5 minutes)
        await Otp.create({ email, otp });

        // Send email
      const mailOptions = {
    from: `"auraFuel ⚡" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🔥 Your OTP for auraFuel — Let\'s Get Started!',
    html: `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0; padding:0; background-color:#f5f5f5; font-family: 'Segoe UI', Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:440px; margin:30px auto; background:#ffffff; border-radius:20px; overflow:hidden; box-shadow:0 8px 24px rgba(0,0,0,0.06);">
            
            <!-- Header -->
            <tr>
                <td style="background:linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding:30px 28px; text-align:center;">
                    <h1 style="color:#ffffff; font-size:26px; font-weight:700; margin:0; letter-spacing:-0.5px;">⚡ auraFuel</h1>
                    <p style="color:#b0b0b0; font-size:13px; margin:8px 0 0; font-weight:500;">IGNITE YOUR FITNESS JOURNEY</p>
                </td>
            </tr>
            
            <!-- Body -->
            <tr>
                <td style="padding:32px 28px;">
                    <h2 style="color:#1a1a1a; font-size:18px; font-weight:700; margin:0 0 8px;">Hey there! 👋</h2>
                    <p style="color:#555; font-size:14px; line-height:1.6; margin:0 0 6px;">You're just one step away from transforming your body and mind. Use the OTP below to verify your email and start your journey with <strong>auraFuel</strong>.</p>
                    
                    <!-- Motivational Quote -->
                    <table width="100%" cellpadding="12" style="background:#fafafa; border-left:4px solid #1a1a1a; border-radius:8px; margin:20px 0;">
                        <tr>
                            <td style="font-size:13px; color:#555; font-style:italic;">
                                ✨ <em>"The only bad workout is the one that didn't happen."</em>
                            </td>
                        </tr>
                    </table>
                    
                    <!-- OTP Box -->
                    <table width="100%" cellpadding="16" style="background:#1a1a1a; border-radius:14px; margin:20px 0; text-align:center;">
                        <tr>
                            <td>
                                <p style="color:#8c8c8c; font-size:11px; text-transform:uppercase; letter-spacing:1.5px; margin:0 0 6px;">Your One‑Time Password</p>
                                <h2 style="color:#ffffff; font-size:32px; font-weight:700; letter-spacing:6px; margin:0;">${otp}</h2>
                            </td>
                        </tr>
                    </table>
                    
                    <p style="color:#888; font-size:11px; text-align:center; margin:0;">This OTP expires in <strong>5 minutes</strong>. If you didn't request this, please ignore this email.</p>
                </td>
            </tr>
            
            <!-- Footer -->
            <tr>
                <td style="background:#fafafa; padding:20px 28px; text-align:center; border-top:1px solid #e5e5e5;">
                    <p style="color:#b0b0b0; font-size:11px; margin:0;">© 2026 auraFuel. All rights reserved.</p>
                    <p style="color:#b0b0b0; font-size:11px; margin:4px 0 0;">Fuel your aura. Fuel your life.</p>
                </td>
            </tr>
            
        </table>
    </body>
    </html>
    `
};

        await transporter.sendMail(mailOptions);
        res.json({ message: 'OTP sent successfully' });

    } catch (error) {
        console.error('Send OTP error:', error);
        res.status(500).json({ message: 'Failed to send OTP', error: error.message });
    }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        // Verify OTP
        const otpRecord = await Otp.findOne({ email });
        if (!otpRecord) {
            return res.status(400).json({ message: 'OTP expired or not sent' });
        }
        if (otpRecord.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        // Find user and update password
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        user.password = newPassword;
        await user.save(); // pre-save hook will hash

        // Delete OTP
        await Otp.deleteOne({ _id: otpRecord._id });

        res.json({ message: 'Password reset successfully' });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Email is required' });

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(400).json({ message: 'No account found with this email' });
        }

        // Delete any previous OTP
        await Otp.deleteMany({ email });

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await Otp.create({ email, otp });

        // Send email
        const mailOptions = {
            from: `"auraFuel ⚡" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: '🔐 Reset Your auraFuel Password',
            html: `
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"></head>
            <body style="margin:0; padding:0; background:#f5f5f5; font-family: 'Segoe UI', Arial, sans-serif;">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width:440px; margin:30px auto; background:#ffffff; border-radius:20px; overflow:hidden; box-shadow:0 8px 24px rgba(0,0,0,0.06);">
                    <tr>
                        <td style="background:#1a1a1a; padding:30px 28px; text-align:center;">
                            <h1 style="color:#fff; font-size:24px; margin:0;">⚡ auraFuel</h1>
                            <p style="color:#b0b0b0; font-size:13px; margin:8px 0 0;">PASSWORD RESET</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:32px 28px;">
                            <h2 style="color:#1a1a1a; font-size:18px; margin:0 0 8px;">Reset Your Password 🔐</h2>
                            <p style="color:#555; font-size:14px; line-height:1.6;">Use the OTP below to reset your password. This OTP is valid for 5 minutes.</p>
                            <table width="100%" cellpadding="16" style="background:#1a1a1a; border-radius:14px; margin:20px 0; text-align:center;">
                                <tr>
                                    <td>
                                        <p style="color:#8c8c8c; font-size:11px; text-transform:uppercase; letter-spacing:1.5px; margin:0 0 6px;">Reset OTP</p>
                                        <h2 style="color:#fff; font-size:32px; font-weight:700; letter-spacing:6px; margin:0;">${otp}</h2>
                                    </td>
                                </tr>
                            </table>
                            <p style="color:#888; font-size:11px; text-align:center;">If you didn't request this, ignore this email.</p>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
            `
        };

        await transporter.sendMail(mailOptions);
        res.json({ message: 'OTP sent to your email' });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// ✅ UPDATED: Signup with OTP verification
router.post('/signup', async (req, res) => {
    try {
        const { fullName, email, mobile, password, gender, age, weight, goal, otp } = req.body;

        // 1. Check if user already exists
        const existingUser = await User.findOne({ $or: [{ email }, { mobile }] });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email or mobile' });
        }

        // 2. Verify OTP
        const otpRecord = await Otp.findOne({ email });
        if (!otpRecord) {
            return res.status(400).json({ message: 'OTP expired or not sent. Please request a new one.' });
        }
        if (otpRecord.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        // 3. Create user
        const user = await User.create({
            fullName, email, mobile, password, gender, age, weight, goal
        });

        // Delete the used OTP
        await Otp.deleteOne({ _id: otpRecord._id });

        const token = generateToken(user._id);

        res.status(201).json({
            message: 'Account created successfully',
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                mobile: user.mobile,
                gender: user.gender,
                age: user.age,
                weight: user.weight,
                goal: user.goal
            }
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// ✅ EXISTING: Login
router.post('/login', async (req, res) => {
    try {
        const { credential, password } = req.body;

        const user = await User.findOne({
            $or: [{ email: credential }, { mobile: credential }]
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = generateToken(user._id);

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                mobile: user.mobile,
                gender: user.gender,
                age: user.age,
                weight: user.weight,
                goal: user.goal
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// ✅ EXISTING: Get current user
router.get('/me', auth, async (req, res) => {
    res.json({ user: req.user });
});

// ✅ EXISTING: Update profile (used in onboarding)
router.put('/me', auth, async (req, res) => {
    try {
        const { goal, age, weight } = req.body;
        const updateFields = {};
        if (goal) updateFields.goal = goal;
        if (age !== undefined) updateFields.age = age;
        if (weight !== undefined) updateFields.weight = weight;

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: updateFields },
            { new: true }
        ).select('-password');

        res.json({ message: 'Profile updated', user });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;