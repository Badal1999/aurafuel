const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const mealRoutes = require('./routes/meals');
const foodItemRoutes = require('./routes/foodItems');
const waterRoutes = require('./routes/water');
const weightRoutes = require('./routes/weight');
const exerciseRoutes = require('./routes/exercise');

// Import DB Connection
const connectDB = require('./config/db');

// Initialize Express
const app = express();

// ─── Connect to MongoDB ───
connectDB();

// ─── Middleware ───
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Serve Static Files (Frontend) ───
app.use(express.static(path.join(__dirname, 'public')));

// ─── API Routes ───
app.use('/api/auth', authRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api/food-items', foodItemRoutes);
app.use('/api/water', waterRoutes);
app.use('/api/weight', weightRoutes);
app.use('/api/exercise', exerciseRoutes);   // ✅ yahan
app.use('/api/tracker', require('./routes/tracker'));

// ─── Default Route → index.html ───
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── 404 Handler ───
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// ─── Error Handler ───
app.use((err, req, res, next) => {
    console.error('Server Error:', err.message);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

// ─── Start Server ───
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log('╔══════════════════════════════╗');
    console.log('║  ⚡ auraFuel Server Ready    ║');
    console.log(`║  🚀 Port: ${PORT}               ║`);
    console.log('║  🗄️  MongoDB Connected       ║');
    console.log('╚══════════════════════════════╝');
});

module.exports = app;