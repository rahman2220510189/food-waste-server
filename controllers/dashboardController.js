const { ObjectId } = require("mongodb");

class DashboardController {
  constructor(db, userModel, notificationModel, historyModel) {
    this.foodCollection = db.collection("post");
    this.userModel = userModel;
    this.notificationModel = notificationModel;
    this.historyModel = historyModel;
  }

  async getDashboardStats(req, res) {
    try {
      const { uid } = req.params;

      // Get user info
      const user = await this.userModel.getUserByUid(uid);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const notifications = await this.notificationModel.collection
        .find({
          $or: [
            { ownerId: uid },
            { requesterId: uid }
          ]
        })
        .toArray();

      const myPosts = await this.foodCollection
        .find({ ownerId: uid })
        .toArray();

      const stats = {
        myOrders: {
          total: 0,
          pending: 0,
          accepted: 0,
          cancelled: 0,
          totalSpent: 0,
          items: []
        },
        // Bookings I made (free food)
        myBookings: {
          total: 0,
          pending: 0,
          accepted: 0,
          cancelled: 0,
          items: []
        },
        // Requests I received (as owner)
        receivedRequests: {
          total: 0,
          pending: 0,
          accepted: 0,
          cancelled: 0,
          items: []
        },
        // Posts I created
        myPosts: {
          total: myPosts.length,
          active: myPosts.filter(p => p.status === 'available').length,
          completed: myPosts.filter(p => p.status === 'unavailable').length,
          items: myPosts
        }
      };

      // Process notifications
      for (const notif of notifications) {
        if (notif.requesterId === uid) {
          // I made this request
          if (notif.type === 'order') {
            stats.myOrders.total++;
            stats.myOrders[notif.status]++;
            if (notif.status === 'accepted' && notif.price) {
              stats.myOrders.totalSpent += notif.price;
            }
            stats.myOrders.items.push(notif);
          } else {
            stats.myBookings.total++;
            stats.myBookings[notif.status]++;
            stats.myBookings.items.push(notif);
          }
        } else if (notif.ownerId === uid) {
          // I received this request
          stats.receivedRequests.total++;
          stats.receivedRequests[notif.status]++;
          stats.receivedRequests.items.push(notif);
        }
      }

      // Sort items by date (newest first)
      stats.myOrders.items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      stats.myBookings.items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      stats.receivedRequests.items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      stats.myPosts.items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      res.json({
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL
        },
        stats
      });
    } catch (error) {
      console.error("Dashboard error:", error);
      res.status(500).json({ error: error.message });
    }
  }

  async getDetailedHistory(req, res) {
    try {
      const { uid } = req.params;
      const { type } = req.query; // 'orders', 'bookings', 'received', 'posts'

      const user = await this.userModel.getUserByUid(uid);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      let items = [];

      if (type === 'orders' || !type) {
        const orders = await this.notificationModel.collection
          .find({
            requesterId: uid,
            type: 'order'
          })
          .sort({ createdAt: -1 })
          .toArray();
        items = [...items, ...orders];
      }

      if (type === 'bookings' || !type) {
        const bookings = await this.notificationModel.collection
          .find({
            requesterId: uid,
            type: 'book'
          })
          .sort({ createdAt: -1 })
          .toArray();
        items = [...items, ...bookings];
      }

      if (type === 'received' || !type) {
        const received = await this.notificationModel.collection
          .find({ ownerId: uid })
          .sort({ createdAt: -1 })
          .toArray();
        items = [...items, ...received];
      }

      if (type === 'posts' || !type) {
        const posts = await this.foodCollection
          .find({ ownerId: uid })
          .sort({ createdAt: -1 })
          .toArray();
        items = [...items, ...posts.map(p => ({ ...p, itemType: 'post' }))];
      }

      res.json({
        success: true,
        items
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = DashboardController;