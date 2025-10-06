
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const { MongoClient, ObjectId, ServerApiVersion } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads")); // static serve


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cjuyyb2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let foodCollection;
const orderCollection = client.db("food-waste-sarver").collection("orders");

async function run() {
  try {
    await client.connect();
    foodCollection = client.db("food-waste-sarver").collection("post");
    console.log("✅ MongoDB Connected!");
  } catch (err) {
    console.error(err);
  }
}
run().catch(console.dir);

//multer setup and image upload
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

// upload food post
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
      price: isFree? 0: parseFloat(req.body.price) ,
      isFree,
     
      status: "available",
      createdAt: new Date(),
    };

    if(!isFree){
      foodData.restaurantName = req.body.restaurantName;
      foodData.restaurantAddress = req.body.restaurantAddress;
      foodData.quantity = parseInt(req.body.quantity);
      foodData.review = req.body.review; 
    }

    const result = await foodCollection.insertOne(foodData);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


//recent post
app.get("/api/recent-posts", async (req, res) => {
  try {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const posts = await foodCollection
      .find({ createdAt: { $gte: twoHoursAgo } })
      .sort({ createdAt: -1 })
      .toArray();
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// book post
app.put("/api/posts/:id/book", async (req, res) => {
  try {
    const id = req.params.id;
    const {userName, contact, address} = req.body;
    const post = await foodCollection.findOne({ _id: new ObjectId(id) });

    if (!post) return res.status(404).json({ error: "Post not found" });

    if (post.status === "booked") {
      return res.status(400).json({ error: "Already booked!" });
    }

    if(!post.isFree){
    return res.status(400).json({ error: "This is not a free food, please order!" });
   
    }

    const updated = await foodCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: "booked" ,
                bookedBy: {userName, contact, address}

      } }
    );

    res.json({ message: "free booked successfully booked!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//get a single post by ID 

app.get("/api/posts/:id", async (req, res) =>{
  try{
    const id = req.params.id;
    const post = await foodCollection.findOne({ _id: new ObjectId(id)});

    if(!post){
      return res.status(404).json({error: "post not found"});
    }
    res.json(post)
  }catch(err){
    console.error(err);
    res.status(500).json({error: " server error"})
  }
});


app.get("/", (req, res) => {
  res.send(" FoodShare API running...");
});


app.listen(port, () => {
  console.log(` Server running on port ${port}`);
});
