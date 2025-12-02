const { ObjectId } = require('mongodb');

class Notification {
  constructor(db) {
    this.collection = db.collection('notifications');
  }

  async create(notificationData) {
    const notification = {
      ...notificationData,
      status: 'pending', // pending, accepted, cancelled
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return await this.collection.insertOne(notification);
  }

  async findByUserId(userId) {
    return await this.collection
      .find({ ownerId: userId })
      .sort({ createdAt: -1 })
      .toArray();
  }

  async findById(id) {
    return await this.collection.findOne({ _id: new ObjectId(id) });
  }

  async updateStatus(id, status) {
    return await this.collection.updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          status, 
          updatedAt: new Date() 
        } 
      }
    );
  }

  async delete(id) {
    return await this.collection.deleteOne({ _id: new ObjectId(id) });
  }
}

module.exports = Notification;