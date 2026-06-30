// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password_hash: {
        type: String,
        required: true
    },
    user_id: {
        type: String,
        unique: true,
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    last_login: {
        type: Date
    },
    is_active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: false
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password_hash')) return next();
    this.password_hash = await bcrypt.hash(this.password_hash, 10);
    next();
});

// Generate user_id before saving
userSchema.pre('save', function(next) {
    if (!this.user_id) {
        this.user_id = `user_${Date.now()}`;
    }
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password_hash);
};



module.exports = mongoose.model('User', userSchema);