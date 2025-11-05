"use strict";

const express = require("express");
const router = express.Router();
const VoteController = require("../controllers/VoteController");

/**
 * Comment Voting Routes
 * Routes for voting on specific comments
 */

module.exports = function () {
  const voteController = new VoteController();

  /**
   * @swagger
   * /api/comments/{commentId}/vote:
   *   post:
   *     summary: Submit a vote for a comment
   *     tags: [Votes]
   *     parameters:
   *       - in: path
   *         name: commentId
   *         required: true
   *         schema:
   *           type: string
   *         description: Comment ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/VoteSubmission'
   *           example:
   *             personalitySystem: "mbti"
   *             personalityValue: "INTJ"
   *             profileId: 1
   *     responses:
   *       201:
   *         description: Vote submitted successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 vote:
   *                   $ref: '#/components/schemas/Vote'
   *                 isUpdate:
   *                   type: boolean
   *       200:
   *         description: Vote updated successfully
   *       400:
   *         description: Validation error
   *       404:
   *         description: Comment not found
   *       409:
   *         description: Duplicate vote error
   *       500:
   *         description: Internal server error
   */
  router.post("/:commentId/vote", (req, res, next) => {
    voteController.submitVote(req, res, next);
  });

  /**
   * @swagger
   * /api/comments/{commentId}/votes:
   *   get:
   *     summary: Get all votes for a comment
   *     tags: [Votes]
   *     parameters:
   *       - in: path
   *         name: commentId
   *         required: true
   *         schema:
   *           type: string
   *         description: Comment ID
   *       - in: query
   *         name: personalitySystem
   *         schema:
   *           type: string
   *           enum: [mbti, enneagram, zodiac]
   *         description: Filter by personality system
   *     responses:
   *       200:
   *         description: Comment votes retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 votes:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Vote'
   *                 commentId:
   *                   type: string
   *                 filters:
   *                   type: object
   *       400:
   *         description: Validation error
   *       500:
   *         description: Internal server error
   */
  router.get("/:commentId/votes", (req, res, next) => {
    voteController.getCommentVotes(req, res, next);
  });

  /**
   * @swagger
   * /api/comments/{commentId}/votes/stats:
   *   get:
   *     summary: Get vote statistics for a comment
   *     tags: [Vote Statistics]
   *     parameters:
   *       - in: path
   *         name: commentId
   *         required: true
   *         schema:
   *           type: string
   *         description: Comment ID
   *     responses:
   *       200:
   *         description: Comment vote statistics retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/VoteStats'
   *       400:
   *         description: Validation error
   *       404:
   *         description: Comment not found
   *       500:
   *         description: Internal server error
   */
  router.get("/:commentId/votes/stats", (req, res, next) => {
    voteController.getCommentVoteStats(req, res, next);
  });

  /**
   * @swagger
   * /api/comments/{commentId}/votes/{personalitySystem}:
   *   get:
   *     summary: Get user's vote for a specific comment and personality system
   *     tags: [Votes]
   *     parameters:
   *       - in: path
   *         name: commentId
   *         required: true
   *         schema:
   *           type: string
   *         description: Comment ID
   *       - in: path
   *         name: personalitySystem
   *         required: true
   *         schema:
   *           type: string
   *           enum: [mbti, enneagram, zodiac]
   *         description: Personality system
   *     responses:
   *       200:
   *         description: User vote retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Vote'
   *       404:
   *         description: Vote not found
   *       400:
   *         description: Validation error
   *       500:
   *         description: Internal server error
   */
  router.get("/:commentId/votes/:personalitySystem", (req, res, next) => {
    voteController.getUserVote(req, res, next);
  });

  /**
   * @swagger
   * /api/comments/{commentId}/votes/{personalitySystem}:
   *   delete:
   *     summary: Remove user's vote for a specific comment and personality system
   *     tags: [Votes]
   *     parameters:
   *       - in: path
   *         name: commentId
   *         required: true
   *         schema:
   *           type: string
   *         description: Comment ID
   *       - in: path
   *         name: personalitySystem
   *         required: true
   *         schema:
   *           type: string
   *           enum: [mbti, enneagram, zodiac]
   *         description: Personality system
   *     responses:
   *       200:
   *         description: Vote removed successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 vote:
   *                   $ref: '#/components/schemas/Vote'
   *       404:
   *         description: Vote not found
   *       400:
   *         description: Validation error
   *       500:
   *         description: Internal server error
   */
  router.delete("/:commentId/votes/:personalitySystem", (req, res, next) => {
    voteController.removeVote(req, res, next);
  });

  return router;
};
