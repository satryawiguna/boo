const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

process.env.NODE_ENV = "test";

let mongoServer;
let originalConsole;

beforeAll(async () => {
  originalConsole = { ...console };

  mongoose.set("strictQuery", false);

  mongoServer = await MongoMemoryServer.create({
    binary: {
      version: "6.0.4",
    },
    instance: {
      dbName: "boo_profiles_test",
    },
  });

  const mongoUri = mongoServer.getUri();

  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // Load all models
  require("../../models/Profile");
  require("../../models/Comment");
  require("../../models/Vote");

  console.log("Test database connected:", mongoUri);
}, 30000);

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }

  if (mongoServer) {
    await mongoServer.stop();
  }

  if (originalConsole) {
    Object.assign(console, originalConsole);
  }

  console.log("Test database disconnected and cleaned up");
}, 30000);

beforeEach(async () => {
  const collections = mongoose.connection.collections;

  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});

jest.setTimeout(30000);

global.createTestApp = () => {
  const express = require("express");
  const app = express();

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  app.use("/api/profile", require("../../routes/profile")());
  app.use("/api/comments", require("../../routes/comments")());
  app.use("/api/comments", require("../../routes/comment-votes")());
  app.use("/api/profiles", require("../../routes/profile-comments")());
  app.use("/api/votes", require("../../routes/votes")());

  app.use((err, req, res, next) => {
    console.error("Test app error:", err);
    res.status(500).json({
      error: "Internal Server Error",
      message: err.message,
    });
  });

  return app;
};

global.waitForDatabase = async (ms = 100) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

console.log("Integration test setup completed");
