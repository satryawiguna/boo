"use strict";

const express = require("express");
const router = express.Router();
const VoteController = require("../controllers/VoteController");

/**
 * @swagger
 * components:
 *   schemas:
 *     Vote:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Vote ID
 *         commentId:
 *           type: string
 *           description: Associated comment ID
 *         profileId:
 *           type: integer
 *           description: Associated profile ID
 *         personalitySystem:
 *           type: string
 *           enum: [mbti, enneagram, zodiac]
 *           description: Personality system type
 *         personalityValue:
 *           type: string
 *           description: Selected personality value
 *         createdAt:
 *           type: string
 *           format: date-time
 *       required:
 *         - commentId
 *         - personalitySystem
 *         - personalityValue
 *
 *     VoteSubmission:
 *       type: object
 *       properties:
 *         personalitySystem:
 *           type: string
 *           enum: [mbti, enneagram, zodiac]
 *           description: Personality system type
 *         personalityValue:
 *           type: string
 *           description: Selected personality value (e.g., INTJ, 4w5, Scorpio)
 *         profileId:
 *           type: integer
 *           description: Optional profile ID (defaults to 1)
 *       required:
 *         - personalitySystem
 *         - personalityValue
 *
 *     VoteStats:
 *       type: object
 *       properties:
 *         commentId:
 *           type: string
 *         voteStats:
 *           type: object
 *           properties:
 *             mbti:
 *               type: object
 *               description: MBTI vote counts
 *             enneagram:
 *               type: object
 *               description: Enneagram vote counts
 *             zodiac:
 *               type: object
 *               description: Zodiac vote counts
 *         lastUpdated:
 *           type: string
 *           format: date-time
 */

module.exports = function () {
  const voteController = new VoteController();

  /**
   * @swagger
   * /api/votes/personality-values:
   *   get:
   *     summary: Get valid personality values for all systems
   *     tags: [Votes]
   *     responses:
   *       200:
   *         description: Valid personality values retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 personalityValues:
   *                   type: object
   *                   properties:
   *                     mbti:
   *                       type: array
   *                       items:
   *                         type: string
   *                       example: ["INTJ", "INFP", "ESTJ", "ESFP"]
   *                     enneagram:
   *                       type: array
   *                       items:
   *                         type: string
   *                       example: ["1w9", "2w3", "4w5", "7w8"]
   *                     zodiac:
   *                       type: array
   *                       items:
   *                         type: string
   *                       example: ["Aries", "Scorpio", "Pisces", "Leo"]
   *                 description:
   *                   type: string
   *                 lastUpdated:
   *                   type: string
   *                   format: date-time
   *       500:
   *         description: Internal server error
   */
  router.get("/personality-values", (req, res, next) => {
    voteController.getValidPersonalityValues(req, res, next);
  });

  /**
   * @swagger
   * /api/votes/top-comments:
   *   get:
   *     summary: Get top voted comments
   *     tags: [Vote Statistics]
   *     parameters:
   *       - in: query
   *         name: personalitySystem
   *         schema:
   *           type: string
   *           enum: [mbti, enneagram, zodiac]
   *         description: Filter by personality system
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 50
   *           default: 10
   *         description: Number of comments to return
   *     responses:
   *       200:
   *         description: Top voted comments retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 comments:
   *                   type: array
   *                   items:
   *                     type: object
   *                 personalitySystem:
   *                   type: string
   *                 limit:
   *                   type: integer
   *                 lastUpdated:
   *                   type: string
   *                   format: date-time
   *       400:
   *         description: Validation error
   *       500:
   *         description: Internal server error
   */
  router.get("/top-comments", (req, res, next) => {
    voteController.getTopVotedComments(req, res, next);
  });

  /**
   * @swagger
   * /api/votes/stats:
   *   get:
   *     summary: Get personality system statistics
   *     tags: [Vote Statistics]
   *     parameters:
   *       - in: query
   *         name: commentId
   *         schema:
   *           type: string
   *         description: Optional comment ID to filter by
   *     responses:
   *       200:
   *         description: Personality system statistics retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 commentId:
   *                   type: string
   *                 personalityStats:
   *                   type: array
   *                   items:
   *                     type: object
   *                 lastUpdated:
   *                   type: string
   *                   format: date-time
   *       400:
   *         description: Validation error
   *       500:
   *         description: Internal server error
   */
  router.get("/stats", (req, res, next) => {
    voteController.getPersonalitySystemStats(req, res, next);
  });

  /**
   * @swagger
   * /api/votes/count:
   *   get:
   *     summary: Get vote count
   *     tags: [Vote Statistics]
   *     parameters:
   *       - in: query
   *         name: commentId
   *         schema:
   *           type: string
   *         description: Optional comment ID to filter by
   *       - in: query
   *         name: personalitySystem
   *         schema:
   *           type: string
   *           enum: [mbti, enneagram, zodiac]
   *         description: Optional personality system to filter by
   *     responses:
   *       200:
   *         description: Vote count retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 count:
   *                   type: integer
   *                 commentId:
   *                   type: string
   *                 personalitySystem:
   *                   type: string
   *       400:
   *         description: Validation error
   *       500:
   *         description: Internal server error
   */
  router.get("/count", (req, res, next) => {
    voteController.getVoteCount(req, res, next);
  });

  /**
   * @swagger
   * /api/votes/history:
   *   get:
   *     summary: Get voting history for current user
   *     tags: [Votes]
   *     description: |
   *       Retrieve comprehensive voting history for the current user with advanced filtering and analytics.
   *
   *       **Features:**
   *       - IP-based user identification for anonymous vote tracking
   *       - Pagination support with larger page sizes (up to 100 votes per page)
   *       - Filter by specific personality systems (MBTI, Enneagram, Zodiac)
   *       - Chronological sorting (most recent votes first)
   *       - Detailed vote metadata including timestamps and comment context
   *       - Vote statistics and patterns analysis
   *       - Efficient querying with proper indexing on voter identifiers
   *       - Cross-reference with comment and profile data
   *
   *       **User Identification:**
   *       - Uses IP address + User Agent hash for anonymous user tracking
   *       - Maintains privacy while enabling personalized history
   *       - Consistent identification across sessions from same device/IP
   *
   *       **Analytics Capabilities:**
   *       - Track voting patterns and preferences
   *       - Identify personality system preferences per user
   *       - Monitor voting frequency and engagement
   *       - Provide insights for recommendation systems
   *
   *       **Filtering Options:**
   *       - `mbti`: Show only MBTI-related votes
   *       - `enneagram`: Show only Enneagram-related votes
   *       - `zodiac`: Show only Zodiac-related votes
   *       - No filter: Show all votes across all personality systems
   *
   *       **Examples:**
   *       - `GET /api/votes/history` - Get all voting history (default 20 per page)
   *       - `GET /api/votes/history?personalitySystem=mbti&limit=50` - Get 50 MBTI votes
   *       - `GET /api/votes/history?page=3&limit=25` - Get page 3 with 25 votes per page
   *       - `GET /api/votes/history?personalitySystem=enneagram` - Get only Enneagram votes
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *         description: Page number
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *           default: 20
   *         description: Number of votes per page
   *       - in: query
   *         name: personalitySystem
   *         schema:
   *           type: string
   *           enum: [mbti, enneagram, zodiac]
   *         description: Filter by personality system
   *     responses:
   *       200:
   *         description: Vote history retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 votes:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Vote'
   *                 pagination:
   *                   type: object
   *                 voterIdentifier:
   *                   type: string
   *                 filters:
   *                   type: object
   *       400:
   *         description: Validation error
   *       500:
   *         description: Internal server error
   */
  router.get("/history", (req, res, next) => {
    voteController.getVoteHistory(req, res, next);
  });

  /**
   * @swagger
   * /api/votes/bulk:
   *   post:
   *     summary: Submit multiple votes (for testing/admin)
   *     tags: [Votes]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               votes:
   *                 type: array
   *                 items:
   *                   type: object
   *                   properties:
   *                     commentId:
   *                       type: string
   *                     personalitySystem:
   *                       type: string
   *                       enum: [mbti, enneagram, zodiac]
   *                     personalityValue:
   *                       type: string
   *                     voterIdentifier:
   *                       type: string
   *                     profileId:
   *                       type: integer
   *                   required:
   *                     - commentId
   *                     - personalitySystem
   *                     - personalityValue
   *           example:
   *             votes:
   *               - commentId: "507f1f77bcf86cd799439011"
   *                 personalitySystem: "mbti"
   *                 personalityValue: "INTJ"
   *                 voterIdentifier: "user1"
   *                 profileId: 1
   *               - commentId: "507f1f77bcf86cd799439011"
   *                 personalitySystem: "enneagram"
   *                 personalityValue: "4w5"
   *                 voterIdentifier: "user1"
   *                 profileId: 1
   *     responses:
   *       200:
   *         description: Bulk votes submitted successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 results:
   *                   type: array
   *                 errors:
   *                   type: array
   *                 summary:
   *                   type: object
   *       400:
   *         description: Validation error
   *       500:
   *         description: Internal server error
   */
  router.post("/bulk", (req, res, next) => {
    voteController.submitBulkVotes(req, res, next);
  });

  /**
   * @swagger
   * /api/votes/health:
   *   get:
   *     summary: Vote service health check
   *     tags: [Votes]
   *     responses:
   *       200:
   *         description: Service is healthy
   *       503:
   *         description: Service is unhealthy
   */
  router.get("/health", (req, res, next) => {
    voteController.healthCheck(req, res, next);
  });

  return router;
};
