const mongoose = require('mongoose');

const mealSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: String,
        required: true
    },
    mealType: {
        type: String,
        enum: ['breakfast', 'lunch', 'pre_workout', 'post_workout', 'dinner'],
        required: true
    },
    items: [{
        name: { type: String, required: true },
        emoji: { type: String, default: '🍽️' },
        grams: { type: Number, required: true },
        calories: { type: Number, required: true },
        protein: { type: Number, default: 0 },
        carbs: { type: Number, default: 0 },
        fats: { type: Number, default: 0 },
        sugar: { type: Number, default: 0 }
    }],
    totalCalories: {
        type: Number,
        required: true
    },
    targetCalories: {
        type: Number,
        required: true
    },
    macros: {
        protein: { type: Number, default: 0 },
        carbs: { type: Number, default: 0 },
        fats: { type: Number, default: 0 },
        sugar: { type: Number, default: 0 }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Meal', mealSchema);