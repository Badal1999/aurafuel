const mongoose = require('mongoose');
require('dotenv').config();

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB Connected');

        // Create a dummy document to initialize collections
        const db = mongoose.connection.db;
        
        await db.createCollection('aurauser');
        console.log('✅ aurauser collection created');
        
        await db.createCollection('meals');
        console.log('✅ meals collection created');
        
        await db.createCollection('fooditems');
        console.log('✅ fooditems collection created');
        
        await db.createCollection('waterlogs');
        console.log('✅ waterlogs collection created');
        
        await db.createCollection('weightlogs');
        console.log('✅ weightlogs collection created');

        console.log('🎉 Database initialized successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

seedDB();