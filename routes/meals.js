const express = require('express');
const Meal = require('../models/Meal');
const auth = require('../middleware/auth');

const router = express.Router();

// POST /api/meals – Save or update a meal
router.post('/', auth, async (req, res) => {
    try {
        const { date, mealType, items, totalCalories, targetCalories, macros } = req.body;

        let meal = await Meal.findOne({ user: req.user._id, date, mealType });

        if (meal) {
            meal.items = items;
            meal.totalCalories = totalCalories;
            meal.targetCalories = targetCalories;
            meal.macros = macros;
            await meal.save();
            return res.json({ message: 'Meal updated', meal });
        }

        meal = await Meal.create({
            user: req.user._id,
            date,
            mealType,
            items,
            totalCalories,
            targetCalories,
            macros
        });

        res.status(201).json({ message: 'Meal saved', meal });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// GET /api/meals/range?start=YYYY-MM-DD&end=YYYY-MM-DD
router.get('/range', auth, async (req, res) => {
    try {
        const { start, end } = req.query;
        const meals = await Meal.find({
            user: req.user._id,
            date: { $gte: start, $lte: end }
        }).sort({ date: 1 });
        res.json({ meals });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// GET /api/meals/today – Get today's meals
router.get('/today', auth, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const meals = await Meal.find({ user: req.user._id, date: today });

        const dailyTotals = {
            totalCalories: 0,
            macros: { protein: 0, carbs: 0, fats: 0, sugar: 0 }
        };

        meals.forEach(meal => {
            dailyTotals.totalCalories += meal.totalCalories;
            dailyTotals.macros.protein += meal.macros.protein;
            dailyTotals.macros.carbs += meal.macros.carbs;
            dailyTotals.macros.fats += meal.macros.fats;
            dailyTotals.macros.sugar += meal.macros.sugar;
        });

        res.json({ meals, dailyTotals });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// ✅ NEW: GET /api/meals/latest – Get the most recent meals (any date) for auto-copy
router.get('/latest', auth, async (req, res) => {
    try {
        const allDates = await Meal.distinct('date', { user: req.user._id });
        const today = new Date().toISOString().split('T')[0];
        const previousDates = allDates.filter(d => d !== today).sort().reverse();

        if (previousDates.length === 0) {
            return res.json({ meals: [] });
        }

        const latestDate = previousDates[0];
        const meals = await Meal.find({ user: req.user._id, date: latestDate });

        res.json({ meals });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// GET /api/meals/:date – Get meals for a specific date
router.get('/:date', auth, async (req, res) => {
    try {
        const meals = await Meal.find({ user: req.user._id, date: req.params.date });

        const dailyTotals = {
            totalCalories: 0,
            macros: { protein: 0, carbs: 0, fats: 0, sugar: 0 }
        };

        meals.forEach(meal => {
            dailyTotals.totalCalories += meal.totalCalories;
            dailyTotals.macros.protein += meal.macros.protein;
            dailyTotals.macros.carbs += meal.macros.carbs;
            dailyTotals.macros.fats += meal.macros.fats;
            dailyTotals.macros.sugar += meal.macros.sugar;
        });

        res.json({ meals, dailyTotals });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// DELETE /api/meals/:id – Delete a meal
router.delete('/:id', auth, async (req, res) => {
    try {
        const meal = await Meal.findOneAndDelete({ _id: req.params.id, user: req.user._id });

        if (!meal) {
            return res.status(404).json({ message: 'Meal not found' });
        }

        res.json({ message: 'Meal deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;