"use strict";

// Load environment variables
require("dotenv").config();

const express = require("express");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./docs/swagger-config");
const { createSwaggerAuth } = require("./middleware/basicAuth");
const database = require("./config/database");
const app = express();
const port = process.env.PORT || 3000;

// set the view engine to ejs
app.set("view engine", "ejs");

// Middleware for parsing request bodies
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Swagger documentation setup
const swaggerOptions = {
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info { margin: 50px 0; }
    .swagger-ui .info .title { color: #3b82f6; }
    .swagger-ui .scheme-container { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
  `,
  customSiteTitle: "Boo API Documentation",
  customfavIcon: "/favicon.ico",
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: "tag",
    filter: true,
    showExtensions: true,
    tryItOutEnabled: true,
    requestInterceptor: (req) => {
      req.headers["Content-Type"] = "application/json";
      return req;
    },
  },
};

const swaggerAuth = createSwaggerAuth();

// Protected Swagger routes with basic authentication
app.use(
  "/docs",
  swaggerAuth,
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, swaggerOptions)
);
app.use(
  "/api-docs",
  swaggerAuth,
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, swaggerOptions)
);

// Protected Swagger JSON endpoint
app.get("/swagger.json", swaggerAuth, (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// API documentation redirect
app.get("/api", (req, res) => {
  res.redirect("/docs");
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    error: "Internal Server Error",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong",
  });
});

// Initialize database and start server
async function startServer() {
  try {
    // Connect to MongoDB
    await database.connect();

    // Initialize sample data if needed
    await require("./utils/initData")();

    // API documentation and system routes
    app.use("/api", require("./routes/api-docs"));

    // Api comment, profile and voting routes (MUST come before web routes)
    app.use("/api/comments", require("./routes/comments")());
    app.use("/api/comments", require("./routes/comment-votes")());
    app.use("/api/profile", require("./routes/profile")());
    app.use("/api/profiles", require("./routes/profile-comments")());
    app.use("/api/votes", require("./routes/votes")());

    // Web routes (catch-all, must be LAST)
    app.use("/", require("./routes/web")());

    // start server
    const server = app.listen(port);
    console.log("Express started. Listening on %s", port);

    // Graceful shutdown
    process.on("SIGINT", async () => {
      console.log("Shutting down gracefully...");
      await database.disconnect();
      server.close(() => {
        console.log("Server closed");
        process.exit(0);
      });
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
