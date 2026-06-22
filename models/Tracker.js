const mongoose = require('mongoose');

const mealCheckSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true },
    mealType: { type: String, enum: ['breakfast', 'lunch', 'pre_workout', 'post_workout', 'dinner'], required: true }
}, { timestamps: true });

const exerciseCheckSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true }
}, { timestamps: true });

module.exports = {
    MealCheck: mongoose.model('MealCheck', mealCheckSchema),
    ExerciseCheck: mongoose.model('ExerciseCheck', exerciseCheckSchema)
};