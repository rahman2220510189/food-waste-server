class User {
  constructor(db) {
    this.collection = db.collection("users");
  }

  async createOrUpdate(userData) {
    const { uid, email, displayName, photoURL, providerId } = userData;
    
    const existingUser = await this.collection.findOne({ uid });
    
    if (existingUser) {
      // Update last login
      await this.collection.updateOne(
        { uid },
        {
          $set: {
            lastLogin: new Date(),
            displayName: displayName || existingUser.displayName,
            photoURL: photoURL || existingUser.photoURL
          }
        }
      );
      return existingUser;
    } else {
      // Create new user
      const newUser = {
        uid,
        email,
        displayName: displayName || email.split('@')[0],
        photoURL: photoURL || null,
        providerId: providerId || 'password',
        createdAt: new Date(),
        lastLogin: new Date(),
        totalSpent: 0,
        totalOrders: 0,
        totalBookings: 0
      };
      
      await this.collection.insertOne(newUser);
      return newUser;
    }
  }

  async getUserByUid(uid) {
    return await this.collection.findOne({ uid });
  }

  async getUserByEmail(email) {
    return await this.collection.findOne({ email });
  }

  async updateUserStats(uid, updates) {
    return await this.collection.updateOne(
      { uid },
      { $inc: updates }
    );
  }
}

module.exports = User;