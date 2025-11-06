"use strict";

/**
 * API Documentation and Health Check Endpoints
 * Provides additional endpoints for API management and monitoring
 */

const express = require("express");
const router = express.Router();
const { version, name, description } = require("../package.json");

/**
 * @swagger
 * /api/health:
 *   get:
 *     tags:
 *       - System
 *     summary: Health check endpoint
 *     description: Check if the API is running and healthy
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "healthy"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   description: Server uptime in seconds
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 */
router.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: version,
    name: name,
    environment: process.env.NODE_ENV || "development",
  });
});

/**
 * @swagger
 * /api/info:
 *   get:
 *     tags:
 *       - System
 *     summary: API information
 *     description: Get detailed information about the API
 *     responses:
 *       200:
 *         description: API information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                 version:
 *                   type: string
 *                 description:
 *                   type: string
 *                 endpoints:
 *                   type: object
 *                 documentation:
 *                   type: object
 */
router.get("/info", (req, res) => {
  const baseUrl = `${req.protocol}://${req.get("host")}`;

  res.json({
    name,
    version,
    description,
    endpoints: {
      profiles: `${baseUrl}/api/profile`,
      statistics: `${baseUrl}/api/profile/stats`,
      health: `${baseUrl}/api/health`,
      documentation: `${baseUrl}/docs`,
    },
    documentation: {
      swagger: `${baseUrl}/docs`,
      openapi: `${baseUrl}/swagger.json`,
      postman: "Import the OpenAPI spec into Postman for testing",
    },
    features: [
      "RESTful API design",
      "MongoDB integration",
      "Yup validation",
      "Service & Repository pattern",
      "Comprehensive error handling",
      "Pagination support",
      "OpenAPI/Swagger documentation",
    ],
    support: {
      issues: "Create an issue in the project repository",
      email: "support@example.com",
    },
  });
});

/**
 * @swagger
 * /api/version:
 *   get:
 *     tags:
 *       - System
 *     summary: Get API version
 *     description: Returns the current API version
 *     responses:
 *       200:
 *         description: Version information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 *                 apiVersion:
 *                   type: string
 *                   example: "v1"
 */
router.get("/version", (req, res) => {
  res.json({
    version,
    apiVersion: "v1",
    releaseDate: "2025-11-05",
    changelog: {
      "1.0.0": [
        "Initial release",
        "Full CRUD operations for profiles",
        "MongoDB integration",
        "Yup validation",
        "Service & Repository pattern",
        "Swagger documentation",
      ],
    },
  });
});

module.exports = router;
