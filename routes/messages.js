const express = require('express');
const router = express.Router();

module.exports = (messagesController) => {
  router.get('/chats', (req, res) => messagesController.getUserChats(req, res));

  router.get('/:chatId', (req, res) => messagesController.getChatMessages(req, res));

  router.post('/send', (req, res) => messagesController.sendMessage(req, res));

  router.put('/:chatId/read', (req, res) => messagesController.markAsRead(req, res));

  return router;
};