const express = require('express');
const WaterLog = require('../models/WaterLog');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/water
// @desc    Add water glass
router.post('/', auth, async (req, res) => {
    try {
        const { date } = req.body;
        const today = date || new Date().toISOString().split('T')[0];

        let waterLog = await WaterLog.findOne({ user: req.user._id, date: today });

        if (waterLog) {
            waterLog.glasses += 1;
            await waterLog.save();
            return res.json({ 
                message: 'Water glass added', 
                glasses: waterLog.glasses,
                waterLog 
            });
        }

        waterLog = await WaterLog.create({
            user: req.user._id,
            date: today,
            glasses: 1
        });

        res.status(201).json({ 
            message: 'Water log created', 
            glasses: 1,
            waterLog 
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   GET /api/water/today
// @desc    Get today's water intake
router.get('/today', auth, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const waterLog = await WaterLog.findOne({ user: req.user._id, date: today });
        
        res.json({ 
            date: today,
            glasses: waterLog ? waterLog.glasses : 0,
            target: 8,
            remaining: waterLog ? Math.max(8 - waterLog.glasses, 0) : 8
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   GET /api/water/:date
// @desc    Get water intake for specific date
router.get('/:date', auth, async (req, res) => {
    try {
        const waterLog = await WaterLog.findOne({ 
            user: req.user._id, 
            date: req.params.date 
        });
        
        res.json({ 
            date: req.params.date,
            glasses: waterLog ? waterLog.glasses : 0 
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   GET /api/water/history/week
// @desc    Get water history for last 7 days
router.get('/history/week', auth, async (req, res) => {
    try {
        const today = new Date();
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        const logs = await WaterLog.find({
            user: req.user._id,
            date: { $gte: weekAgo.toISOString().split('T')[0] }
        }).sort({ date: 1 });
        
        res.json({ logs });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;