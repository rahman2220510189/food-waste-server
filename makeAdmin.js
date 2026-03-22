require("dotenv").config();
const { MongoClient } = require("mongodb");

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cjuyyb2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

async function makeAdmin() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db("food-waste-sarver");
    const users = db.collection("users");

    const result = await users.updateOne(
      { uid: "aTEVqajmFeYlOwEKUfYzJMYdL4Q2" },
      { $set: { role: "admin" } }
    );

    if (result.modifiedCount === 1) {
      console.log("✅ User is now Admin!");
    } else {
      console.log("❌ User not found");
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.close();
  }
}

makeAdmin();