"use strict";

const CommentService = require("../services/CommentService");

/**
 * @swagger
 * tags:
 *   - name: Comments
 *     description: Comment management operations
 *   - name: Comment Statistics
 *     description: Comment analytics and statistics
 */

/**
 * Comment Controller
 * Handles HTTP requests and coordinates with CommentService
 * Implements comprehensive error handling and validation
 *
 * @class CommentController
 */
class CommentController {
  constructor() {
    this.commentService = new CommentService();
  }

  async createComment(req, res, next) {
    try {
      const result = await this.commentService.createComment(req.body);
      res.status(201).json(result);
    } catch (error) {
      console.error("Controller error creating comment:", error);

      if (error.name === "ValidationError") {
        return res.status(400).json({
          error: "Validation Error",
          message: error.message,
          details: error.details,
        });
      }

      next(error);
    }
  }

  async getCommentById(req, res, next) {
    try {
      const comment = await this.commentService.getCommentById(req.params.id);

      if (!comment) {
        return res.status(404).json({
          error: "Comment not found",
          message: `Comment with ID ${req.params.id} does not exist`,
        });
      }

      res.json(comment);
    } catch (error) {
      console.error("Controller error getting comment by ID:", error);

      if (error.name === "ValidationError") {
        return res.status(400).json({
          error: "Validation Error",
          message: error.message,
          details: error.details,
        });
      }

      next(error);
    }
  }

  async getCommentsByProfileId(req, res, next) {
    try {
      const result = await this.commentService.getCommentsByProfileId(
        req.params.profileId,
        req.query
      );

      res.json(result);
    } catch (error) {
      console.error("Controller error getting comments by profile ID:", error);

      if (error.name === "ValidationError") {
        return res.status(400).json({
          error: "Validation Error",
          message: error.message,
          details: error.details,
        });
      }

      next(error);
    }
  }

  async getAllComments(req, res, next) {
    try {
      const result = await this.commentService.getAllComments(req.query);
      res.json(result);
    } catch (error) {
      console.error("Controller error getting all comments:", error);

      if (error.name === "ValidationError") {
        return res.status(400).json({
          error: "Validation Error",
          message: error.message,
          details: error.details,
        });
      }

      next(error);
    }
  }

  async updateComment(req, res, next) {
    try {
      const comment = await this.commentService.updateComment(
        req.params.id,
        req.body
      );

      if (!comment) {
        return res.status(404).json({
          error: "Comment not found",
          message: `Comment with ID ${req.params.id} does not exist`,
        });
      }

      res.json({
        success: true,
        message: "Comment updated successfully",
        comment,
      });
    } catch (error) {
      console.error("Controller error updating comment:", error);

      if (error.name === "ValidationError") {
        return res.status(400).json({
          error: "Validation Error",
          message: error.message,
          details: error.details,
        });
      }

      next(error);
    }
  }

  async deleteComment(req, res, next) {
    try {
      const comment = await this.commentService.deleteComment(req.params.id);

      if (!comment) {
        return res.status(404).json({
          error: "Comment not found",
          message: `Comment with ID ${req.params.id} does not exist`,
        });
      }

      res.json({
        success: true,
        message: "Comment deleted successfully",
        comment,
      });
    } catch (error) {
      console.error("Controller error deleting comment:", error);

      if (error.name === "ValidationError") {
        return res.status(400).json({
          error: "Validation Error",
          message: error.message,
          details: error.details,
        });
      }

      next(error);
    }
  }

  async getCommentStats(req, res, next) {
    try {
      const stats = await this.commentService.getCommentStats();
      res.json(stats);
    } catch (error) {
      console.error("Controller error getting comment stats:", error);
      next(error);
    }
  }

  async getCommentCount(req, res, next) {
    try {
      const profileId = req.query.profileId || req.params.profileId || null;
      const result = await this.commentService.getCommentCount(profileId);
      res.json(result);
    } catch (error) {
      console.error("Controller error getting comment count:", error);

      if (error.name === "ValidationError") {
        return res.status(400).json({
          error: "Validation Error",
          message: error.message,
          details: error.details,
        });
      }

      next(error);
    }
  }

  _getVoterIdentifier(req) {
    const forwarded = req.headers["x-forwarded-for"];
    const ip = forwarded
      ? forwarded.split(",")[0]
      : req.connection.remoteAddress;
    return ip || "anonymous";
  }

  async healthCheck(req, res) {
    try {
      const stats = await this.commentService.getCommentCount();
      res.json({
        status: "healthy",
        service: "comments",
        timestamp: new Date().toISOString(),
        totalComments: stats.count,
      });
    } catch (error) {
      console.error("Comment service health check failed:", error);
      res.status(503).json({
        status: "unhealthy",
        service: "comments",
        timestamp: new Date().toISOString(),
        error: error.message,
      });
    }
  }
}

module.exports = CommentController;
