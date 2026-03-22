const { ObjectId } = require("mongodb");

class AdminController {
  constructor(db) {
    this.foodCollection = db.collection("post");
    this.usersCollection = db.collection("users");
    this.notificationsCollection = db.collection("notifications");
  }

  // ── Overview stats ────────────────────────────────────
  async getStats(req, res) {
    try {
      const [
        totalUsers,
        totalFoods,
        totalOrders,
        totalRevenueAll,
        totalRevenuePaid,
      ] = await Promise.all([
        this.usersCollection.countDocuments(),
        this.foodCollection.countDocuments(),
        this.notificationsCollection.countDocuments({ type: "order" }),
        this.notificationsCollection
          .aggregate([
            { $match: { type: "order", status: "accepted" } },
            { $group: { _id: null, total: { $sum: "$price" } } },
          ])
          .toArray(),
        this.notificationsCollection
          .aggregate([
            { $match: { type: "order", paymentStatus: "paid" } },
            { $group: { _id: null, total: { $sum: "$price" } } },
          ])
          .toArray(),
      ]);

      const activeFoods    = await this.foodCollection.countDocuments({ status: "available" });
      const pendingOrders  = await this.notificationsCollection.countDocuments({ type: "order", status: "pending" });
      const acceptedOrders = await this.notificationsCollection.countDocuments({ type: "order", status: "accepted" });
      const paidOrders     = await this.notificationsCollection.countDocuments({ type: "order", paymentStatus: "paid" });
      const totalBookings  = await this.notificationsCollection.countDocuments({ type: "book" });

      res.json({
        success: true,
        stats: {
          totalUsers,
          totalFoods,
          activeFoods,
          totalOrders,
          totalBookings,
          pendingOrders,
          acceptedOrders,
          paidOrders,
          totalRevenue:     totalRevenueAll[0]?.total  || 0,
          totalRevenuePaid: totalRevenuePaid[0]?.total || 0,
        },
      });
    } catch (error) {
      console.error("Admin stats error:", error);
      res.status(500).json({ error: error.message });
    }
  }

  // ── All users ─────────────────────────────────────────
  async getUsers(req, res) {
    try {
      const { page = 1, limit = 20, search = "" } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const filter = search
        ? {
            $or: [
              { displayName: { $regex: search, $options: "i" } },
              { email: { $regex: search, $options: "i" } },
            ],
          }
        : {};

      const [users, total] = await Promise.all([
        this.usersCollection
          .find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .toArray(),
        this.usersCollection.countDocuments(filter),
      ]);

      res.json({ success: true, users, total, page: parseInt(page) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // ── All foods ─────────────────────────────────────────
  async getFoods(req, res) {
    try {
      const { page = 1, limit = 20, search = "", status = "" } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const filter = {};
      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: "i" } },
          { "location.address": { $regex: search, $options: "i" } },
        ];
      }
      if (status) filter.status = status;

      const [foods, total] = await Promise.all([
        this.foodCollection
          .find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .toArray(),
        this.foodCollection.countDocuments(filter),
      ]);

      res.json({ success: true, foods, total, page: parseInt(page) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // ── All payments / orders ─────────────────────────────
  async getPayments(req, res) {
    try {
      const { page = 1, limit = 50, status = "", type = "" } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const filter = {};
      if (status) filter.status = status;
      if (type)   filter.type   = type;

      const [payments, total] = await Promise.all([
        this.notificationsCollection
          .find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .toArray(),
        this.notificationsCollection.countDocuments(filter),
      ]);

      
      const enriched = await Promise.all(
        payments.map(async (p) => {
          const [requester, owner] = await Promise.all([
            p.requesterId
              ? this.usersCollection.findOne(
                  { uid: p.requesterId },
                  { projection: { displayName: 1, email: 1, photoURL: 1 } }
                )
              : null,
            p.ownerId
              ? this.usersCollection.findOne(
                  { uid: p.ownerId },
                  { projection: { displayName: 1, email: 1, photoURL: 1 } }
                )
              : null,
          ]);
          return {
            ...p,
            requesterInfo: requester || { displayName: p.requesterName || "Unknown" },
            ownerInfo:     owner     || { displayName: "Unknown" },
          };
        })
      );

      res.json({ success: true, payments: enriched, total, page: parseInt(page) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // ── Make Admin ────────────────────────────────────────
  async makeAdmin(req, res) {
    try {
      const { id } = req.params;
      if (!ObjectId.isValid(id))
        return res.status(400).json({ error: "Invalid ID" });

      const result = await this.usersCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { role: "admin" } }
      );

      if (result.modifiedCount === 0)
        return res.status(404).json({ error: "User not found" });

      res.json({ success: true, message: "User is now Admin" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // ── Remove Admin ──────────────────────────────────────
  async removeAdmin(req, res) {
    try {
      const { id } = req.params;
      if (!ObjectId.isValid(id))
        return res.status(400).json({ error: "Invalid ID" });

      await this.usersCollection.updateOne(
        { _id: new ObjectId(id) },
        { $unset: { role: "" } }
      );

      res.json({ success: true, message: "Admin role removed" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // ── Delete food ───────────────────────────────────────
  async deleteFood(req, res) {
    try {
      const { id } = req.params;
      if (!ObjectId.isValid(id))
        return res.status(400).json({ error: "Invalid ID" });

      await this.foodCollection.deleteOne({ _id: new ObjectId(id) });
      res.json({ success: true, message: "Food deleted" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // ── Delete user ───────────────────────────────────────
  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      if (!ObjectId.isValid(id))
        return res.status(400).json({ error: "Invalid ID" });

      await this.usersCollection.deleteOne({ _id: new ObjectId(id) });
      res.json({ success: true, message: "User deleted" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = AdminController;