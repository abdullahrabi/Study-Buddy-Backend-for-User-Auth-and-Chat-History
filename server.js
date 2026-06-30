// server.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');

const app = express();
const PORT = process.env.PORT || 8501;
const MONGODB_URI = process.env.MONGODB_URI;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
    res.send('StudyBuddy API is running. Use /health for status.');
});

app.use('/auth', authRoutes);
app.use('/api', chatRoutes);

// Error handlers
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found', status: 'error' });
});

app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error', status: 'error' });
});

// Export app for Vercel
module.exports = app;

// Start server only when running locally (not on Vercel)
if (require.main === module) {
    mongoose.connect(MONGODB_URI)
        .then(() => {
            console.log(`✅ Server running on port ${PORT}`);
            app.listen(PORT);
        })
        .catch(error => {
            console.error('❌ MongoDB connection error:', error.message);
            process.exit(1);
        });
}