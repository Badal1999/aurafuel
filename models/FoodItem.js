const mongoose = require('mongoose');

const foodItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    emoji: {
        type: String,
        default: '🍽️'
    },
    category: {
        type: String,
        enum: ['breakfast', 'lunch', 'pre_workout', 'post_workout', 'dinner'],
        required: true
    },
    calories: {
        type: Number,
        required: true
    },
    protein: {
        type: Number,
        default: 0
    },
    carbs: {
        type: Number,
        default: 0
    },
    fats: {
        type: Number,
        default: 0
    },
    sugar: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('FoodItem', foodItemSchema);