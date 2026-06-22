const express = require('express');
const Exercise = require('../models/Exercise');
const auth = require('../middleware/auth');
const router = express.Router();

// POST /api/exercise — Save exercise plan
router.post('/', auth, async (req, res) => {
    try {
        console.log('Received body:', JSON.stringify(req.body, null, 2));

        const { split, splitName, mode, goal, schedule, workouts } = req.body;

        // Check if user already has an exercise plan — update it
        let exercise = await Exercise.findOne({ user: req.user._id });

        if (exercise) {
            exercise.split = split;
            exercise.splitName = splitName;
            exercise.mode = mode;
            exercise.goal = goal;
            exercise.schedule = schedule;
            exercise.workouts = workouts;
            exercise.date = new Date();
            await exercise.save();
            return res.json({ message: 'Exercise plan updated', exercise });
        }

        // Create new
        exercise = await Exercise.create({
            user: req.user._id,
            split,
            splitName,
            mode,
            goal,
            schedule,
            workouts
        });

        res.status(201).json({ message: 'Exercise plan saved', exercise });
    } catch (error) {
        console.error('Exercise save error:', error.message);
        console.error('Full error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// GET /api/exercise/latest — Get latest exercise plan
router.get('/latest', auth, async (req, res) => {
    try {
        const latest = await Exercise.findOne({ user: req.user._id })
            .sort({ createdAt: -1 });

        res.json({ exercise: latest });
    } catch (error) {
        console.error('Exercise fetch error:', error.message);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// DELETE /api/exercise — Remove exercise plan (optional)
router.delete('/', auth, async (req, res) => {
    try {
        await Exercise.deleteMany({ user: req.user._id });
        res.json({ message: 'Exercise plan deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;