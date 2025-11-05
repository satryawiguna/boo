"use strict";

const express = require("express");
const router = express.Router();
const CommentController = require("../controllers/CommentController");

/**
 * Profile Comments Routes
 * Routes for getting comments related to specific profiles
 */

module.exports = function () {
  const commentController = new CommentController();

  /**
   * @swagger
   * /api/profiles/{profileId}/comments:
   *   get:
   *     summary: Get comments for a specific profile
   *     tags: [Comments]
   *     description: |
   *       Retrieve all comments associated with a specific personality profile with advanced filtering and sorting.
   *
   *       **Features:**
   *       - Profile-specific comment filtering with validation
   *       - Pagination support with customizable page size (1-50 comments per page)
   *       - Multiple sorting options: recent, best (by votes), oldest
   *       - Advanced filtering by personality systems (MBTI, Enneagram, Zodiac)
   *       - Integrated vote statistics and personality insights for each comment
   *       - Efficient database queries with proper indexing
   *       - Profile validation to ensure profile exists
   *       - Returns comprehensive pagination and filter metadata
   *
   *       **Use Cases:**
   *       - View all discussions about a specific personality profile
   *       - Analyze community opinions on personality types
   *       - Track engagement and voting patterns per profile
   *       - Moderate profile-specific content
   *
   *       **Sorting & Filtering:**
   *       - Same advanced options as general comments endpoint
   *       - Results are automatically filtered by the specified profileId
   *       - Maintains full sorting and personality system filtering capabilities
   *
   *       **Examples:**
   *       - `GET /api/profiles/1/comments` - Get recent comments for profile 1
   *       - `GET /api/profiles/5/comments?sort=best&limit=20` - Top 20 comments for profile 5
   *       - `GET /api/profiles/2/comments?filter=mbti&page=2` - MBTI comments for profile 2, page 2
   *     parameters:
   *       - in: path
   *         name: profileId
   *         required: true
   *         schema:
   *           type: integer
   *         description: Profile ID
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
   *         description: Profile comments retrieved successfully
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
   *                   properties:
   *                     profileId:
   *                       type: integer
   *                     sort:
   *                       type: string
   *                     filter:
   *                       type: string
   *       400:
   *         description: Validation error
   *       500:
   *         description: Internal server error
   */
  router.get("/:profileId/comments", (req, res, next) => {
    commentController.getCommentsByProfileId(req, res, next);
  });

  /**
   * @swagger
   * /api/profiles/{profileId}/comments/count:
   *   get:
   *     summary: Get comment count for a specific profile
   *     tags: [Comment Statistics]
   *     parameters:
   *       - in: path
   *         name: profileId
   *         required: true
   *         schema:
   *           type: integer
   *         description: Profile ID
   *     responses:
   *       200:
   *         description: Profile comment count retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 count:
   *                   type: integer
   *       400:
   *         description: Validation error
   *       500:
   *         description: Internal server error
   */
  router.get("/:profileId/comments/count", (req, res, next) => {
    commentController.getCommentCount(req, res, next);
  });

  return router;
};
