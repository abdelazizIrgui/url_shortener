const mongoose = require("mongoose");
require("dotenv").config();

const connectdb = async () => {
  try {
    await mongoose.connect(process.env.DB_URL);
    console.log("Connected to MongoDB ✅");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }
};

module.exports = connectdb;
