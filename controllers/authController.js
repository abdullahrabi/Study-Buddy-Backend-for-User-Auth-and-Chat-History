// controllers/authController.js
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

exports.signup = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ 
                error: 'Email and password required', 
                status: 'error' 
            });
        }

        if (password.length < 6) {
            return res.status(400).json({ 
                error: 'Password must be at least 6 characters', 
                status: 'error' 
            });
        }

        // Check if user exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(409).json({ 
                error: 'User already exists', 
                status: 'error' 
            });
        }

        // Create user
        const user = new User({
            email: email.toLowerCase(),
            password_hash: password // Will be hashed by pre-save hook
        });

        await user.save();

        const token = generateToken(user);

        res.status(201).json({
            status: 'success',
            token,
            user_id: user.user_id,
            email: user.email,
            created_at: user.created_at
        });

    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ 
            error: 'Internal server error', 
            status: 'error' 
        });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ 
                error: 'Email and password required', 
                status: 'error' 
            });
        }

        // Find user
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ 
                error: 'Invalid credentials', 
                status: 'error' 
            });
        }

        // Check password
        const isValid = await user.comparePassword(password);
        if (!isValid) {
            return res.status(401).json({ 
                error: 'Invalid credentials', 
                status: 'error' 
            });
        }

        // Update last login
        user.last_login = new Date();
        await user.save();

        const token = generateToken(user);

        res.json({
            status: 'success',
            token,
            user_id: user.user_id,
            email: user.email
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            error: 'Internal server error', 
            status: 'error' 
        });
    }
};

exports.verifyToken = async (req, res) => {
    try {
        res.json({
            status: 'valid',
            user_id: req.user.user_id,
            email: req.user.email
        });
    } catch (error) {
        res.status(500).json({ 
            error: 'Verification failed', 
            status: 'error' 
        });
    }
};

exports.getUserInfo = async (req, res) => {
    try {
        const user = await User.findOne({ user_id: req.user.user_id })
            .select('email user_id created_at last_login is_active');

        if (!user) {
            return res.status(404).json({ 
                error: 'User not found', 
                status: 'error' 
            });
        }

        res.json({
            status: 'success',
            user
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ 
            error: 'Internal server error', 
            status: 'error' 
        });
    }
};

exports.logout = async (req, res) => {
    // JWT is stateless, logout is handled client-side
    // This endpoint exists for completeness
    res.json({
        status: 'success',
        message: 'Logged out successfully'
    });
};