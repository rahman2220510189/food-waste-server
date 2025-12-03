const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const { MongoClient, ObjectId, ServerApiVersion } = require("mongodb");

const Notification = require("./models/Notification");
const Message = require("./models/Message");
const History = require("./models/History");
const User = require("./models/User")

const NotificationsController = require("./controllers/notificationsController");
const MessagesController = require("./controllers/messagesController");
const HistoryController = require("./controllers/historyController");
const UserController = require("./controllers/userController");
const DashboardController = require("./controllers/dashboardController");
const PaymentController = require("./controllers/paymentController");

const notificationRoutes = require("./routes/notifications");
const messageRoutes = require("./routes/messages");
const historyRoutes = require("./routes/history");
const userRoutes = require("./routes/users");
const dashboardRoutes = require("./routes/dashboard");
const paymentRoutes = require("./routes/payment");


const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cjuyyb2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let foodCollection;
let notificationModel, messageModel, historyModel;
let notificationsController, messagesController, historyController;
let userModel, userController, dashboardController;
let paymentController;


async function run() {
  try {
    await client.connect();
    const db = client.db("food-waste-sarver");
    foodCollection = db.collection("post");

    notificationModel = new Notification(db);
    messageModel = new Message(db);
    historyModel = new History(db);

    notificationsController = new NotificationsController(notificationModel, messageModel, historyModel);
    messagesController = new MessagesController(messageModel);
    historyController = new HistoryController(historyModel)
    userModel = new User(db);
    userController = new UserController(userModel);
    dashboardController = new DashboardController(db, userModel, notificationModel, historyModel);
    paymentController = new PaymentController(db, notificationModel);

    
    app.use("/api/users", userRoutes(userController));
    app.use("/api/dashboard", dashboardRoutes(dashboardController));
    app.use("/api/notifications", notificationRoutes(notificationsController));
    app.use("/api/messages", messageRoutes(messagesController));
    app.use("/api/history", historyRoutes(historyController));
    app.use("/api/payment", paymentRoutes(paymentController));


    console.log("✅ MongoDB Connected!");
    console.log("✅ Routes initialized!");
  } catch (err) {
    console.error(err);
  }
}
run().catch(console.dir);

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-chat", (chatId) => {
    socket.join(chatId);
    console.log(`User ${socket.id} joined chat ${chatId}`);
  });

  socket.on("send-message", async (data) => {
    try {
      const { chatId, senderId, text } = data;
      const message = await messageModel.sendMessage(chatId, senderId, text);
      io.to(chatId).emit("receive-message", message);
    } catch (error) {
      console.error("Socket message error:", error);
    }
  });

  socket.on("typing", (data) => {
    socket.to(data.chatId).emit("user-typing", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync("uploads")) {
      fs.mkdirSync("uploads");
    }
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Upload food post
app.post("/api/posts", upload.single("image"), async (req, res) => {
  try {
    const isFree = req.body.isFree === "true";
    const foodData = {
      title: req.body.title,
      image: req.file ? `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}` : "",
      location: {
        lat: parseFloat(req.body.lat),
        lng: parseFloat(req.body.lng),
        address: req.body.address,
      },
      price: isFree ? 0 : parseFloat(req.body.price),
      isFree,
      status: "available",
      createdAt: new Date(),
      ownerId: req.body.ownerId || "anonymous",
    };

    if (!isFree) {
      foodData.restaurantName = req.body.restaurantName;
      foodData.restaurantAddress = req.body.restaurantAddress;
      foodData.quantity = parseInt(req.body.quantity);
      foodData.review = req.body.review;
    } else {
      foodData.quantity = parseInt(req.body.quantity) || 1;
    }

    const result = await foodCollection.insertOne(foodData);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all posts (available and quantity > 0)
app.get("/api/posts", async (req, res) => {
  try {
    const { lat, lng } = req.query;
    const posts = await foodCollection
      .find({ status: "available", quantity: { $gt: 0 } })
      .sort({ createdAt: -1 })
      .toArray();

    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);

      posts.forEach(post => {
        if (post.location?.lat && post.location?.lng) {
          post.distance = calculateDistance(userLat, userLng, post.location.lat, post.location.lng);
        } else {
          post.distance = null;
        }
      });
    }

    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Recent posts
app.get("/api/recent-posts", async (req, res) => {
  try {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const posts = await foodCollection
      .find({ createdAt: { $gte: twoHoursAgo }, quantity: { $gt: 0 } })
      .sort({ createdAt: -1 })
      .toArray();
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Search
app.get("/api/posts/search", async (req, res) => {
  try {
    const { q, lat, lng } = req.query;

    if (!q || q.trim() === "") {
      return res.json([]);
    }

    const filter = {
      $or: [
        { title: { $regex: q, $options: "i" } },
        { restaurantName: { $regex: q, $options: "i" } },
        { "location.address": { $regex: q, $options: "i" } }
      ],
      status: "available",
      quantity: { $gt: 0 }
    };
    const posts = await foodCollection.find(filter).limit(10).toArray();

    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);

      posts.forEach(post => {
        if (post.location?.lat && post.location?.lng) {
          post.distance = calculateDistance(userLat, userLng, post.location.lat, post.location.lng);
        }
      });
    }

    res.json(posts);
  } catch (error) {
    console.error("Search Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get single post
app.get("/api/posts/:id", async (req, res) => {
  try {
    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid post ID format" });
    }

    const post = await foodCollection.findOne({ _id: new ObjectId(id) });

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    res.json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Book free food - MODIFIED TO CREATE NOTIFICATION
app.put("/api/posts/:id/book", async (req, res) => {
  try {
    const id = req.params.id;
    const { userName, contact, address, quantity, userId } = req.body;
    const orederQuantity = quantity && quantity > 0 ? parseInt(quantity) : 1;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid post ID format" });
    }

    const post = await foodCollection.findOne({ _id: new ObjectId(id) });

    if (!post) return res.status(404).json({ error: "Post not found" });

    if (post.quantity < orederQuantity) {
      return res.status(400).json({ error: `Only ${post.quantity} items available` });
    }

    if (!post.isFree) {
      return res.status(400).json({ error: "This is not free food, please order!" });
    }

    if (post.quantity <= 0) {
      return res.status(400).json({ error: "Out of stock!" });
    }

    // Create notification for the food owner
    await notificationModel.create({
      ownerId: post.ownerId,
      requesterId: userId || "anonymous",
      requesterName: userName,
      requesterContact: contact,
      requesterAddress: address,
      foodItemId: new ObjectId(id),
      foodTitle: post.title,
      quantity: orederQuantity,
      type: "book",
      status: "pending"
    });

    const newQuantity = post.quantity - orederQuantity;

    const updateData = {
      $set: {
        quantity: newQuantity,
        status: newQuantity <= 0 ? "unavailable" : "available",
        bookedBy: { userName, contact, address },
        bookedAt: new Date()
      }
    };

    await foodCollection.updateOne(
      { _id: new ObjectId(id) },
      updateData
    );

    res.status(200).json({
      success: true,
      message: "Booking request sent! Wait for owner's approval.",
      remainingQuantity: newQuantity
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Order paid food - MODIFIED TO CREATE NOTIFICATION
app.put("/api/posts/:id/order", async (req, res) => {
  try {
    const id = req.params.id;
    const { userName, contact, address, quantity, userId } = req.body;
    const orederQuantity = quantity && quantity > 0 ? parseInt(quantity) : 1;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid post ID format" });
    }

    const post = await foodCollection.findOne({ _id: new ObjectId(id) });

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (post.quantity < orederQuantity) {
      return res.status(400).json({ error: `Only ${post.quantity} items available` });
    }

    if (post.isFree) {
      return res.status(400).json({ error: "This is free food, you can book it!" });
    }

    if (post.quantity <= 0) {
      return res.status(400).json({ error: "Out of stock!" });
    }

    // Create notification for the food owner
    await notificationModel.create({
      ownerId: post.ownerId,
      requesterId: userId || "anonymous",
      requesterName: userName,
      requesterContact: contact,
      requesterAddress: address,
      foodItemId: new ObjectId(id),
      foodTitle: post.title,
      quantity: orederQuantity,
      price: post.price * orederQuantity,
      type: "order",
      status: "pending"
    });

    const newQuantity = post.quantity - orederQuantity;

    const updateData = {
      $set: {
        quantity: newQuantity,
        status: newQuantity <= 0 ? "unavailable" : "available",
        orderedBy: { userName, contact, address },
        orderedAt: new Date()
      }
    };

    await foodCollection.updateOne(
      { _id: new ObjectId(id) },
      updateData
    );

    res.status(200).json({
      success: true,
      message: "Order request sent! Wait for owner's approval.",
      remainingQuantity: newQuantity
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/", (req, res) => {
  res.send("FoodShare API running with Socket.io...");
});

server.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
  console.log(`✅ Socket.io enabled`);
});