const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    split: {
        type: String,
        required: true
    },
    splitName: {
        type: String,
        required: true
    },
    mode: {
        type: String,
        enum: ['bodyweight', 'machine'],
        required: true
    },
    goal: {
        type: String,
        enum: ['weight_loss', 'muscle_gain', 'maintenance'],
        required: true
    },
    schedule: [{
        type: String
    }],
    workouts: [{
        type: mongoose.Schema.Types.Mixed
    }],
    date: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model('Exercise', exerciseSchema);