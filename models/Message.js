const { ObjectId } = require('mongodb');

class Message {
  constructor(db) {
    this.chatsCollection = db.collection('chats');
    this.messagesCollection = db.collection('messages');
  }

  // Create a new chat session
  async createChat(participant1, participant2, foodItemId) {
    const existingChat = await this.chatsCollection.findOne({
      participants: { $all: [participant1, participant2] },
      foodItemId: new ObjectId(foodItemId)
    });

    if (existingChat) {
      return existingChat;
    }

    const chat = {
      participants: [participant1, participant2],
      foodItemId: new ObjectId(foodItemId),
      createdAt: new Date(),
      lastMessage: null,
      lastMessageAt: null
    };

    const result = await this.chatsCollection.insertOne(chat);
    return { ...chat, _id: result.insertedId };
  }

  // Get all chats for a user
  async getChatsByUser(userId) {
    return await this.chatsCollection
      .find({ participants: userId })
      .sort({ lastMessageAt: -1 })
      .toArray();
  }

  // Send a message
  async sendMessage(chatId, senderId, text) {
    const message = {
      chatId: new ObjectId(chatId),
      senderId,
      text,
      read: false,
      createdAt: new Date()
    };

    const result = await this.messagesCollection.insertOne(message);

    // Update chat's last message
    await this.chatsCollection.updateOne(
      { _id: new ObjectId(chatId) },
      {
        $set: {
          lastMessage: text,
          lastMessageAt: new Date()
        }
      }
    );

    return { ...message, _id: result.insertedId };
  }

  // Get messages for a chat
  async getMessages(chatId) {
    return await this.messagesCollection
      .find({ chatId: new ObjectId(chatId) })
      .sort({ createdAt: 1 })
      .toArray();
  }

  // Mark messages as read
  async markAsRead(chatId, userId) {
    return await this.messagesCollection.updateMany(
      { 
        chatId: new ObjectId(chatId), 
        senderId: { $ne: userId },
        read: false 
      },
      { $set: { read: true } }
    );
  }
}

module.exports = Message;