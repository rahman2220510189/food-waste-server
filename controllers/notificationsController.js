const { ObjectId } = require('mongodb');

class NotificationsController {
  constructor(notificationModel, messageModel, historyModel) {
    this.notificationModel = notificationModel;
    this.messageModel = messageModel;
    this.historyModel = historyModel;
  }

  // Get all notifications for a user
  async getNotifications(req, res) {
    try {
      const { userId } = req.query;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const notifications = await this.notificationModel.findByUserId(userId);
      res.json(notifications);
    } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Accept notification - create chat
  async acceptNotification(req, res) {
    try {
      const { id } = req.params;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid notification ID' });
      }

      const notification = await this.notificationModel.findById(id);

      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' });
      }

      // Update notification status
      await this.notificationModel.updateStatus(id, 'accepted');

      // Create chat session
      const chat = await this.messageModel.createChat(
        notification.ownerId,
        notification.requesterId,
        notification.foodItemId
      );

      // Add to history
      await this.historyModel.create({
        userId: notification.ownerId,
        requesterId: notification.requesterId,
        foodItemId: notification.foodItemId,
        action: 'accepted',
        notificationId: new ObjectId(id),
        chatId: chat._id
      });

      res.json({
        success: true,
        message: 'Request accepted. Chat created!',
        chatId: chat._id
      });
    } catch (error) {
      console.error('Accept notification error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Cancel notification
  async cancelNotification(req, res) {
    try {
      const { id } = req.params;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid notification ID' });
      }

      const notification = await this.notificationModel.findById(id);

      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' });
      }

      // Update notification status
      await this.notificationModel.updateStatus(id, 'cancelled');

      // Add to history
      await this.historyModel.create({
        userId: notification.ownerId,
        requesterId: notification.requesterId,
        foodItemId: notification.foodItemId,
        action: 'cancelled',
        notificationId: new ObjectId(id)
      });

      res.json({
        success: true,
        message: 'Request cancelled successfully'
      });
    } catch (error) {
      console.error('Cancel notification error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Delete notification
  async deleteNotification(req, res) {
    try {
      const { id } = req.params;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid notification ID' });
      }

      await this.notificationModel.delete(id);

      res.json({
        success: true,
        message: 'Notification deleted'
      });
    } catch (error) {
      console.error('Delete notification error:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = NotificationsController;