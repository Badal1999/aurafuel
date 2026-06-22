const express = require('express');
const FoodItem = require('../models/FoodItem');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/food-items
// @desc    Get all food items
router.get('/', auth, async (req, res) => {
    try {
        const items = await FoodItem.find().sort({ category: 1, name: 1 });
        
        // Group by category
        const grouped = {
            breakfast: items.filter(i => i.category === 'breakfast'),
            lunch: items.filter(i => i.category === 'lunch'),
            pre_workout: items.filter(i => i.category === 'pre_workout'),
            post_workout: items.filter(i => i.category === 'post_workout'),
            dinner: items.filter(i => i.category === 'dinner')
        };
        
        res.json({ items, grouped });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   GET /api/food-items/:category
// @desc    Get food items by category
router.get('/category/:category', auth, async (req, res) => {
    try {
        const { category } = req.params;
        const validCategories = ['breakfast', 'lunch', 'pre_workout', 'post_workout', 'dinner'];
        
        if (!validCategories.includes(category)) {
            return res.status(400).json({ message: 'Invalid category' });
        }
        
        const items = await FoodItem.find({ category }).sort({ name: 1 });
        res.json({ items, count: items.length });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   POST /api/food-items/seed
// @desc    Seed food items database
router.post('/seed', auth, async (req, res) => {
    try {
        const foodData = req.body;
        
        if (!Array.isArray(foodData) || foodData.length === 0) {
            return res.status(400).json({ message: 'Please provide food items array' });
        }
        
        // Clear existing and insert new
        await FoodItem.deleteMany({});
        const items = await FoodItem.insertMany(foodData);
        
        res.status(201).json({ 
            message: `${items.length} food items seeded successfully`, 
            count: items.length 
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   POST /api/food-items
// @desc    Add single food item
router.post('/', auth, async (req, res) => {
    try {
        const item = await FoodItem.create(req.body);
        res.status(201).json({ message: 'Food item added', item });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;