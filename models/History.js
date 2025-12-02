const { ObjectId } = require('mongodb');

class History {
  constructor(db) {
    this.collection = db.collection('history');
  }

  async create(historyData) {
    const history = {
      ...historyData,
      createdAt: new Date()
    };
    return await this.collection.insertOne(history);
  }

  async findByUserId(userId) {
    return await this.collection
      .find({ 
        $or: [
          { userId: userId },
          { requesterId: userId }
        ]
      })
      .sort({ createdAt: -1 })
      .toArray();
  }

  async getAcceptedRequests(userId) {
    return await this.collection
      .find({ 
        userId: userId,
        action: 'accepted'
      })
      .sort({ createdAt: -1 })
      .toArray();
  }

  async getCancelledRequests(userId) {
    return await this.collection
      .find({ 
        userId: userId,
        action: 'cancelled'
      })
      .sort({ createdAt: -1 })
      .toArray();
  }
}

module.exports = History;