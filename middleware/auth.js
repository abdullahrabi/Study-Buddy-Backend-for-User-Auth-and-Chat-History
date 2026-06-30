// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            return res.status(401).json({ 
                error: 'Authorization header missing', 
                status: 'error' 
            });
        }

        const token = authHeader.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ 
                error: 'Token missing', 
                status: 'error' 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const user = await User.findOne({ user_id: decoded.user_id });
        
        if (!user) {
            return res.status(401).json({ 
                error: 'User not found', 
                status: 'error' 
            });
        }

        if (!user.is_active) {
            return res.status(403).json({ 
                error: 'Account is disabled', 
                status: 'error' 
            });
        }

        req.user = {
            user_id: user.user_id,
            email: user.email
        };
        req.token = token;

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                error: 'Invalid token', 
                status: 'error' 
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                error: 'Token expired', 
                status: 'error' 
            });
        }
        
        console.error('Auth error:', error);
        return res.status(500).json({ 
            error: 'Authentication error', 
            status: 'error' 
        });
    }
};

const generateToken = (user) => {
    return jwt.sign(
        { 
            user_id: user.user_id,
            email: user.email 
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
};

module.exports = { authMiddleware, generateToken };