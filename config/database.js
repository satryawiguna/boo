"use strict";

const mongoose = require("mongoose");

class Database {
  constructor() {
    this.connection = null;
  }

  async connect() {
    try {
      const connectionString =
        process.env.MONGODB_URI || "mongodb://localhost:27017/boo_profiles";

      this.connection = await mongoose.connect(connectionString, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });

      console.log("MongoDB connected successfully");
      return this.connection;
    } catch (error) {
      console.error("MongoDB connection error:", error);
      process.exit(1);
    }
  }

  async disconnect() {
    if (this.connection) {
      await mongoose.disconnect();
      console.log("MongoDB disconnected");
    }
  }

  getConnection() {
    return this.connection;
  }
}

module.exports = new Database();
