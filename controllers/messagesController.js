const { ObjectId } = require('mongodb');

class MessagesController {
  constructor(messageModel) {
    this.messageModel = messageModel;
  }

  // Get all chats for a user
  async getUserChats(req, res) {
    try {
      const { userId } = req.query;

      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const chats = await this.messageModel.getChatsByUser(userId);
      res.json(chats);
    } catch (error) {
      console.error('Get chats error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get messages for a specific chat
  async getChatMessages(req, res) {
    try {
      const { chatId } = req.params;

      if (!ObjectId.isValid(chatId)) {
        return res.status(400).json({ error: 'Invalid chat ID' });
      }

      const messages = await this.messageModel.getMessages(chatId);
      res.json(messages);
    } catch (error) {
      console.error('Get messages error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Send a message
  async sendMessage(req, res) {
    try {
      const { chatId, senderId, text } = req.body;

      if (!chatId || !senderId || !text) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      if (!ObjectId.isValid(chatId)) {
        return res.status(400).json({ error: 'Invalid chat ID' });
      }

      const message = await this.messageModel.sendMessage(chatId, senderId, text);

      res.json({
        success: true,
        message: message
      });
    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Mark messages as read
  async markAsRead(req, res) {
    try {
      const { chatId } = req.params;
      const { userId } = req.body;

      if (!ObjectId.isValid(chatId)) {
        return res.status(400).json({ error: 'Invalid chat ID' });
      }

      await this.messageModel.markAsRead(chatId, userId);

      res.json({
        success: true,
        message: 'Messages marked as read'
      });
    } catch (error) {
      console.error('Mark as read error:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = MessagesController;