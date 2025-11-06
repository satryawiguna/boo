"use strict";

const express = require("express");
const router = express.Router();
const CommentController = require("../controllers/CommentController");

/**
 * @swagger
 * components:
 *   schemas:
 *     Comment:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Comment ID
 *         content:
 *           type: string
 *           description: Comment content
 *         title:
 *           type: string
 *           description: Optional comment title
 *         author:
 *           type: string
 *           description: Comment author name
 *         profileId:
 *           type: integer
 *           description: Associated profile ID
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
 *         totalVotes:
 *           type: integer
 *           description: Total number of votes
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       required:
 *         - content
 *         - author
 *         - profileId
 *
 *     CommentCreate:
 *       type: object
 *       properties:
 *         content:
 *           type: string
 *           minLength: 1
 *           maxLength: 1000
 *           description: Comment content
 *         title:
 *           type: string
 *           maxLength: 200
 *           description: Optional comment title
 *         author:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *           description: Comment author name
 *         profileId:
 *           type: integer
 *           minimum: 1
 *           maximum: 99999
 *           description: Associated profile ID
 *       required:
 *         - content
 *         - author
 *         - profileId
 *
 *     CommentUpdate:
 *       type: object
 *       properties:
 *         content:
 *           type: string
 *           minLength: 1
 *           maxLength: 1000
 *           description: Comment content
 *         title:
 *           type: string
 *           maxLength: 200
 *           description: Optional comment title
 *         isVisible:
 *           type: boolean
 *           description: Comment visibility
 */

module.exports = function () {
  const commentController = new CommentController();

  /**
   * @swagger
   * /api/comments:
   *   post:
   *     summary: Create a new comment
   *     tags: [Comments]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CommentCreate'
   *           example:
   *             content: "This is a thoughtful comment about personality types."
   *             title: "MBTI Insights"
   *             author: "John Doe"
   *             profileId: 1
   *     responses:
   *       201:
   *         description: Comment created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 comment:
   *                   $ref: '#/components/schemas/Comment'
   *       400:
   *         description: Validation error
   *       500:
   *         description: Internal server error
   */
  router.post("/", (req, res, next) => {
    commentController.createComment(req, res, next);
  });

  /**
   * @swagger
   * /api/comments:
   *   get:
   *     summary: Get all comments with pagination
   *     tags: [Comments]
   *     description: |
   *       Retrieve all comments with advanced filtering, sorting, and pagination capabilities.
   *
   *       **Features:**
   *       - Pagination support with customizable page size (1-50 comments per page)
   *       - Multiple sorting options: recent, best (by votes), oldest
   *       - Advanced filtering by personality systems (MBTI, Enneagram, Zodiac)
   *       - Efficient querying with MongoDB aggregation
   *       - Vote statistics integration for each comment
   *       - Returns comprehensive pagination metadata
   *       - Optimized performance for large datasets
   *
   *       **Sorting Options:**
   *       - `recent`: Newest comments first (default)
   *       - `best`: Comments with highest vote counts first
   *       - `oldest`: Oldest comments first
   *
   *       **Filter Options:**
   *       - `all`: Show all comments (default)
   *       - `mbti`: Comments with MBTI-related votes
   *       - `enneagram`: Comments with Enneagram-related votes
   *       - `zodiac`: Comments with Zodiac-related votes
   *
   *       **Examples:**
   *       - `GET /api/comments` - Get recent comments (default)
   *       - `GET /api/comments?page=2&limit=20` - Get page 2 with 20 comments
   *       - `GET /api/comments?sort=best&filter=mbti` - Get best MBTI comments
   *       - `GET /api/comments?sort=oldest&limit=5` - Get 5 oldest comments
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
   *           maximum: 50
   *           default: 10
   *         description: Number of comments per page
   *       - in: query
   *         name: sort
   *         schema:
   *           type: string
   *           enum: [recent, best, oldest]
   *           default: recent
   *         description: Sort order
   *       - in: query
   *         name: filter
   *         schema:
   *           type: string
   *           enum: [all, mbti, enneagram, zodiac]
   *           default: all
   *         description: Filter by personality system
   *     responses:
   *       200:
   *         description: Comments retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 comments:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Comment'
   *                 pagination:
   *                   type: object
   *                   properties:
   *                     page:
   *                       type: integer
   *                     limit:
   *                       type: integer
   *                     totalCount:
   *                       type: integer
   *                     totalPages:
   *                       type: integer
   *                     hasNextPage:
   *                       type: boolean
   *                     hasPrevPage:
   *                       type: boolean
   *                 filters:
   *                   type: object
   *       400:
   *         description: Validation error
   *       500:
   *         description: Internal server error
   */
  router.get("/", (req, res, next) => {
    commentController.getAllComments(req, res, next);
  });

  /**
   * @swagger
   * /api/comments/count:
   *   get:
   *     summary: Get total comment count
   *     tags: [Comment Statistics]
   *     parameters:
   *       - in: query
   *         name: profileId
   *         schema:
   *           type: integer
   *         description: Optional profile ID to filter by
   *     responses:
   *       200:
   *         description: Comment count retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 count:
   *                   type: integer
   *       500:
   *         description: Internal server error
   */
  router.get("/count", (req, res, next) => {
    commentController.getCommentCount(req, res, next);
  });

  /**
   * @swagger
   * /api/comments/stats:
   *   get:
   *     summary: Get comment statistics
   *     tags: [Comment Statistics]
   *     responses:
   *       200:
   *         description: Comment statistics retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 totalComments:
   *                   type: integer
   *                 topComments:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Comment'
   *                 lastUpdated:
   *                   type: string
   *                   format: date-time
   *       500:
   *         description: Internal server error
   */
  router.get("/stats", (req, res, next) => {
    commentController.getCommentStats(req, res, next);
  });

  /**
   * @swagger
   * /api/comments/health:
   *   get:
   *     summary: Comment service health check
   *     tags: [Comments]
   *     responses:
   *       200:
   *         description: Service is healthy
   *       503:
   *         description: Service is unhealthy
   */
  router.get("/health", (req, res, next) => {
    commentController.healthCheck(req, res, next);
  });

  /**
   * @swagger
   * /api/comments/{id}:
   *   get:
   *     summary: Get comment by ID
   *     tags: [Comments]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Comment ID
   *     responses:
   *       200:
   *         description: Comment retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Comment'
   *       404:
   *         description: Comment not found
   *       400:
   *         description: Invalid comment ID
   *       500:
   *         description: Internal server error
   */
  router.get("/:id", (req, res, next) => {
    commentController.getCommentById(req, res, next);
  });

  /**
   * @swagger
   * /api/comments/{id}:
   *   put:
   *     summary: Update comment by ID
   *     tags: [Comments]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Comment ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CommentUpdate'
   *           example:
   *             content: "Updated comment content with more insights."
   *             title: "Updated MBTI Insights"
   *     responses:
   *       200:
   *         description: Comment updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 comment:
   *                   $ref: '#/components/schemas/Comment'
   *       404:
   *         description: Comment not found
   *       400:
   *         description: Validation error
   *       500:
   *         description: Internal server error
   */
  router.put("/:id", (req, res, next) => {
    commentController.updateComment(req, res, next);
  });

  /**
   * @swagger
   * /api/comments/{id}:
   *   delete:
   *     summary: Delete comment by ID (soft delete)
   *     tags: [Comments]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Comment ID
   *     responses:
   *       200:
   *         description: Comment deleted successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 comment:
   *                   $ref: '#/components/schemas/Comment'
   *       404:
   *         description: Comment not found
   *       400:
   *         description: Invalid comment ID
   *       500:
   *         description: Internal server error
   */
  router.delete("/:id", (req, res, next) => {
    commentController.deleteComment(req, res, next);
  });

  return router;
};
