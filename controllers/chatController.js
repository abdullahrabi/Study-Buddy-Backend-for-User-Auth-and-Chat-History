// controllers/chatController.js
const ChatHistory = require('../models/ChatHistory');
const crypto = require('crypto');

exports.saveConversation = async (req, res) => {
    try {
        const { question, answer, contexts } = req.body;
        const user_id = req.user.user_id;

        if (!question || !answer) {
            return res.status(400).json({ 
                error: 'Question and answer required', 
                status: 'error' 
            });
        }

        // Generate conversation_id
        const conversation_id = `conv_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

        // Save user message
        const userMessage = new ChatHistory({
            user_id,
            role: 'user',
            content: question,
            metadata: { 
                contexts: contexts || [],
                type: 'question'
            },
            conversation_id
        });
        await userMessage.save();

        // Save assistant message
        const assistantMessage = new ChatHistory({
            user_id,
            role: 'assistant',
            content: answer,
            metadata: {
                type: 'answer',
                contexts: contexts || []
            },
            conversation_id
        });
        await assistantMessage.save();

        res.json({
            status: 'success',
            conversation_id,
            user_message_id: userMessage._id,
            assistant_message_id: assistantMessage._id,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Save conversation error:', error);
        res.status(500).json({ 
            error: 'Internal server error', 
            status: 'error' 
        });
    }
};

exports.getHistory = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const limit = parseInt(req.query.limit) || 50;
        const conversation_id = req.query.conversation_id;

        let query = { user_id };
        if (conversation_id) {
            query.conversation_id = conversation_id;
        }

        const messages = await ChatHistory.find(query)
            .sort({ timestamp: -1 })
            .limit(limit)
            .lean();

        // Reverse to chronological order
        messages.reverse();

        // Convert ObjectIds to strings
        const history = messages.map(msg => ({
            ...msg,
            _id: msg._id.toString()
        }));

        res.json({
            status: 'success',
            count: history.length,
            history
        });

    } catch (error) {
        console.error('Get history error:', error);
        res.status(500).json({ 
            error: 'Internal server error', 
            status: 'error' 
        });
    }
};

exports.clearHistory = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const older_than_days = parseInt(req.body.older_than_days) || 0;

        let query = { user_id };
        if (older_than_days > 0) {
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - older_than_days);
            query.timestamp = { $lt: cutoff };
        }

        const result = await ChatHistory.deleteMany(query);

        res.json({
            status: 'success',
            deleted_count: result.deletedCount
        });

    } catch (error) {
        console.error('Clear history error:', error);
        res.status(500).json({ 
            error: 'Internal server error', 
            status: 'error' 
        });
    }
};

exports.getConversations = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const limit = parseInt(req.query.limit) || 50;

        // Get unique conversation IDs with metadata
        const conversations = await ChatHistory.aggregate([
            { $match: { user_id } },
            { 
                $group: { 
                    _id: '$conversation_id',
                    count: { $sum: 1 },
                    first_message: { $first: '$content' },
                    last_message: { $last: '$content' },
                    last_timestamp: { $last: '$timestamp' },
                    first_timestamp: { $first: '$timestamp' }
                }
            },
            { $sort: { last_timestamp: -1 } },
            { $limit: limit }
        ]);

        // Format response
        const formatted = conversations.map(c => ({
            conversation_id: c._id,
            message_count: c.count,
            first_message: c.first_message.substring(0, 100),
            last_message: c.last_message.substring(0, 100),
            first_timestamp: c.first_timestamp,
            last_timestamp: c.last_timestamp
        }));

        res.json({
            status: 'success',
            count: formatted.length,
            conversations: formatted
        });

    } catch (error) {
        console.error('Get conversations error:', error);
        res.status(500).json({ 
            error: 'Internal server error', 
            status: 'error' 
        });
    }
};

exports.deleteConversation = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const { conversation_id } = req.params;

        if (!conversation_id) {
            return res.status(400).json({ 
                error: 'Conversation ID required', 
                status: 'error' 
            });
        }

        const result = await ChatHistory.deleteMany({
            user_id,
            conversation_id
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({ 
                error: 'Conversation not found', 
                status: 'error' 
            });
        }

        res.json({
            status: 'success',
            deleted_count: result.deletedCount,
            conversation_id
        });

    } catch (error) {
        console.error('Delete conversation error:', error);
        res.status(500).json({ 
            error: 'Internal server error', 
            status: 'error' 
        });
    }
};