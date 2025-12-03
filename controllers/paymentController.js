const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { ObjectId } = require("mongodb");

class PaymentController {
  constructor(db, notificationModel) {
    this.foodCollection = db.collection("post");
    this.notificationModel = notificationModel;
  }

  async createPaymentIntent(req, res) {
    try {
      const { amount, postId, userId, userName, contact, address, quantity } = req.body;

      if (!amount || !postId || !userId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'bdt',
        metadata: {
          postId,
          userId,
          userName,
          contact,
          address,
          quantity: quantity.toString()
        }
      });

      res.json({
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });
    } catch (error) {
      console.error("Payment intent error:", error);
      res.status(500).json({ error: error.message });
    }
  }

  async confirmPayment(req, res) {
    try {
      const { paymentIntentId, postId, userId, userName, contact, address, quantity } = req.body;

      // Verify payment
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ error: "Payment not successful" });
      }

      const { ObjectId } = require("mongodb");
      const post = await this.foodCollection.findOne({ _id: new ObjectId(postId) });

      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }

      // Create notification for the food owner
      await this.notificationModel.create({
        ownerId: post.ownerId,
        requesterId: userId,
        requesterName: userName,
        requesterContact: contact,
        requesterAddress: address,
        foodItemId: new ObjectId(postId),
        foodTitle: post.title,
        foodImage: post.image,
        quantity: quantity,
        price: post.price * quantity,
        type: "order",
        status: "pending",
        paymentIntentId: paymentIntentId,
        paymentStatus: "paid"
      });

      // Update post quantity
      const newQuantity = post.quantity - quantity;
      await this.foodCollection.updateOne(
        { _id: new ObjectId(postId) },
        {
          $set: {
            quantity: newQuantity,
            status: newQuantity <= 0 ? "unavailable" : "available"
          }
        }
      );

      res.json({
        success: true,
        message: "Payment successful! Wait for owner's approval."
      });
    } catch (error) {
      console.error("Confirm payment error:", error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = PaymentController;