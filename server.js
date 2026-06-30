// server.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');

const app = express();
const PORT = process.env.PORT || 8501;
const MONGODB_URI = process.env.MONGODB_URI;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString()
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        name: 'StudyBuddy API',
        version: '1.0.0',
        endpoints: {
            auth: {
                signup: 'POST /auth/signup',
                login: 'POST /auth/login',
                verify: 'GET /auth/verify',
                user: 'GET /auth/user'
            },
            chat: {
                evaluate: 'POST /api/evaluate',
                history: 'GET /api/history',
                conversations: 'GET /api/conversations',
                clear_history: 'POST /api/history/clear'
            },
            health: 'GET /health'
        }
    });
});

// Routes
app.use('/auth', authRoutes);
app.use('/api', chatRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Route not found',
        status: 'error'
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        error: 'Internal server error',
        status: 'error'
    });
});

// Connect to MongoDB and start server
mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('='.repeat(60));
        console.log('🚀 StudyBuddy API Server');
        console.log('='.repeat(60));
        console.log(`✅ Connected to MongoDB`);
        console.log(`📡 Server running on port ${PORT}`);
        console.log('='.repeat(60));
        console.log('📌 Available Endpoints:');
        console.log('  POST /auth/signup       - Sign up');
        console.log('  POST /auth/login        - Login');
        console.log('  GET  /auth/verify       - Verify token');
        console.log('  GET  /auth/user         - Get user info');
        console.log('  POST /api/evaluate      - Save conversation');
        console.log('  GET  /api/history       - Get chat history');
        console.log('  GET  /api/conversations - Get conversations');
        console.log('  POST /api/history/clear - Clear history');
        console.log('  GET  /health            - Health check');
        console.log('='.repeat(60));
        
        app.listen(PORT, () => {
            console.log(`✅ Server started on port ${PORT}`);
        });
    })
    .catch(error => {
        console.error('❌ MongoDB connection error:', error.message);
        process.exit(1);
    });

// Graceful shutdown
process.on('SIGINT', () => {
    mongoose.connection.close(() => {
        console.log('\n📴 MongoDB connection closed');
        process.exit(0);
    });
});