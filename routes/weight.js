const express = require('express');
const WeightLog = require('../models/WeightLog');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/weight
// @desc    Log weight
router.post('/', auth, async (req, res) => {
    try {
        const { weight, date } = req.body;
        const today = date || new Date().toISOString().split('T')[0];

        if (!weight || weight < 20 || weight > 300) {
            return res.status(400).json({ message: 'Please enter a valid weight (20-300 kg)' });
        }

        let weightLog = await WeightLog.findOne({ user: req.user._id, date: today });

        if (weightLog) {
            weightLog.weight = weight;
            await weightLog.save();
            
            // Update user weight
            const User = require('../models/User');
            await User.findByIdAndUpdate(req.user._id, { weight });
            
            return res.json({ 
                message: 'Weight updated successfully', 
                weightLog 
            });
        }

        weightLog = await WeightLog.create({
            user: req.user._id,
            date: today,
            weight
        });

        // Update user weight
        const User = require('../models/User');
        await User.findByIdAndUpdate(req.user._id, { weight });

        res.status(201).json({ 
            message: 'Weight logged successfully', 
            weightLog 
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   GET /api/weight
// @desc    Get weight history
router.get('/', auth, async (req, res) => {
    try {
        const logs = await WeightLog.find({ user: req.user._id })
            .sort({ date: -1 })
            .limit(30);
        
        res.json({ logs });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   GET /api/weight/latest
// @desc    Get latest weight
router.get('/latest', auth, async (req, res) => {
    try {
        const latestLog = await WeightLog.findOne({ user: req.user._id })
            .sort({ date: -1 });
        
        res.json({ 
            weight: latestLog ? latestLog.weight : req.user.weight || 60,
            date: latestLog ? latestLog.date : null
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   GET /api/weight/progress
// @desc    Get weight progress (first vs latest)
router.get('/progress', auth, async (req, res) => {
    try {
        const logs = await WeightLog.find({ user: req.user._id })
            .sort({ date: 1 });
        
        if (logs.length < 2) {
            return res.json({ 
                message: 'Need more data for progress',
                firstWeight: logs[0]?.weight || null,
                latestWeight: logs[logs.length - 1]?.weight || null,
                change: 0
            });
        }
        
        const firstWeight = logs[0].weight;
        const latestWeight = logs[logs.length - 1].weight;
        const change = latestWeight - firstWeight;
        
        res.json({
            firstWeight,
            latestWeight,
            change,
            trend: change > 0 ? 'gained' : change < 0 ? 'lost' : 'stable',
            daysTracked: logs.length
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;