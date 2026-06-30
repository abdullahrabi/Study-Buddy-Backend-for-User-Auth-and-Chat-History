// routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authMiddleware } = require('../middleware/auth');

// All chat routes require authentication
router.use(authMiddleware);

// Save conversation
router.post('/evaluate', chatController.saveConversation);

// Get chat history
router.get('/history', chatController.getHistory);

// Get conversations list
router.get('/conversations', chatController.getConversations);

// Clear history
router.post('/history/clear', chatController.clearHistory);

// Delete specific conversation
router.delete('/conversations/:conversation_id', chatController.deleteConversation);

module.exports = router;