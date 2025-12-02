const express = require('express');
const router = express.Router();

module.exports = (notificationsController) => {
  router.get('/', (req, res) => notificationsController.getNotifications(req, res));

  router.put('/:id/accept', (req, res) => notificationsController.acceptNotification(req, res));

  router.put('/:id/cancel', (req, res) => notificationsController.cancelNotification(req, res));

  router.delete('/:id', (req, res) => notificationsController.deleteNotification(req, res));

  return router;
};