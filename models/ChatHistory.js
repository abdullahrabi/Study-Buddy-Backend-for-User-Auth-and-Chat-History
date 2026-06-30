// models/ChatHistory.js
const mongoose = require('mongoose');

const chatHistorySchema = new mongoose.Schema({
    user_id: {
        type: String,
        required: true,
        index: true
    },
    role: {
        type: String,
        enum: ['user', 'assistant', 'system'],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    conversation_id: {
        type: String,
        index: true
    }
}, {
    timestamps: false
});

// Compound indexes for efficient queries
chatHistorySchema.index({ user_id: 1, timestamp: -1 });
chatHistorySchema.index({ conversation_id: 1 });
chatHistorySchema.index({ user_id: 1, conversation_id: 1 });

// Convert to JSON
chatHistorySchema.methods.toJSON = function() {
    const obj = this.toObject();
    obj._id = obj._id.toString();
    return obj;
};

module.exports = mongoose.model('ChatHistory', chatHistorySchema);