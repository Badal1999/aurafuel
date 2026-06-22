const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { MealCheck, ExerciseCheck } = require('../models/Tracker');
const WaterLog = require('../models/WaterLog');

// --- Meal Checks ---
// POST /api/tracker/meal - Toggle a meal check
router.post('/meal', auth, async (req, res) => {
    try {
        const { date, mealType } = req.body;
        const existing = await MealCheck.findOne({ user: req.user._id, date, mealType });
        if (existing) {
            await MealCheck.deleteOne({ _id: existing._id });
            return res.json({ checked: false });
        } else {
            await MealCheck.create({ user: req.user._id, date, mealType });
            return res.json({ checked: true });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/tracker/meal/:date
router.get('/meal/:date', auth, async (req, res) => {
    const checks = await MealCheck.find({ user: req.user._id, date: req.params.date });
    res.json({ meals: checks.map(c => c.mealType) });
});

// GET /api/tracker/water/range?start=...&end=...
router.get('/water/range', auth, async (req, res) => {
    try {
        const { start, end } = req.query;
        const logs = await WaterLog.find({
            user: req.user._id,
            date: { $gte: start, $lte: end }
        });
        // group by date and sum glasses? Actually each log has glasses field (number of glasses added at that time). But we already have WaterLog with `glasses` count for each day. The POST /api/water adds one glass per request, but the WaterLog schema has `glasses: Number`. The POST route creates or increments a single document per day. So each day has one document with `glasses` count.
        res.json({ logs });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

router.get('/exercise/range', auth, async (req, res) => {
    const { start, end } = req.query;
    const checks = await ExerciseCheck.find({
        user: req.user._id,
        date: { $gte: start, $lte: end }
    });
    const checkedDates = checks.map(c => c.date);
    res.json({ checkedDates });
});

router.get('/streak', auth, async (req, res) => {
    try {
        const mealDates = await MealCheck.distinct('date', { user: req.user._id });
        const exerciseDates = await ExerciseCheck.distinct('date', { user: req.user._id });
        const allDates = [...new Set([...mealDates, ...exerciseDates])].sort().reverse();
        let streak = 0;
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        if (allDates[0] === today || allDates[0] === yesterday) {
            streak = 1;
            for (let i = 1; i < allDates.length; i++) {
                const prev = new Date(allDates[i - 1]);
                const curr = new Date(allDates[i]);
                const diff = (prev - curr) / 86400000;
                if (diff === 1) streak++;
                else break;
            }
        }
        res.json({ streak });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// GET /api/tracker/active-dates?start=...&end=...
router.get('/active-dates', auth, async (req, res) => {
    try {
        const { start, end } = req.query;
        const mealDates = await MealCheck.distinct('date', {
            user: req.user._id,
            date: { $gte: start, $lte: end }
        });
        const exerciseDates = await ExerciseCheck.distinct('date', {
            user: req.user._id,
            date: { $gte: start, $lte: end }
        });
        const dates = [...new Set([...mealDates, ...exerciseDates])];
        res.json({ dates });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});


// --- Exercise Check ---
router.post('/exercise', auth, async (req, res) => {
    try {
        const { date } = req.body;
        const existing = await ExerciseCheck.findOne({ user: req.user._id, date });
        if (existing) {
            await ExerciseCheck.deleteOne({ _id: existing._id });
            return res.json({ checked: false });
        } else {
            await ExerciseCheck.create({ user: req.user._id, date });
            return res.json({ checked: true });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/exercise/:date', auth, async (req, res) => {
    const check = await ExerciseCheck.findOne({ user: req.user._id, date: req.params.date });
    res.json({ checked: !!check });
});

// --- Water (already exists, but ensure GET today) ---
router.get('/water/today', auth, async (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const log = await WaterLog.findOne({ user: req.user._id, date: today });
    res.json({ glasses: log ? log.glasses : 0 });
});

module.exports = router;