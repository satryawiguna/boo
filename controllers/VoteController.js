"use strict";

const VoteService = require("../services/VoteService");

/**
 * @swagger
 * tags:
 *   - name: Votes
 *     description: Voting operations for personality systems
 *   - name: Vote Statistics
 *     description: Vote analytics and statistics
 */

/**
 * Vote Controller
 * Handles HTTP requests for voting functionality
 * Implements comprehensive error handling and validation
 *
 * @class VoteController
 */
class VoteController {
  constructor() {
    this.voteService = new VoteService();
  }

  async submitVote(req, res, next) {
    try {
      const commentId = req.params.commentId;
      const voteData = {
        ...req.body,
        voterIdentifier: this._getVoterIdentifier(req),
        profileId: req.body.profileId || 1, // Default to profile ID 1
      };

      const result = await this.voteService.submitVote(commentId, voteData);

      const statusCode = result.isUpdate ? 200 : 201;
      res.status(statusCode).json(result);
    } catch (error) {
      console.error("Controller error submitting vote:", error);

      if (error.name === "ValidationError") {
        return res.status(400).json({
          error: "Validation Error",
          message: error.message,
          details: error.details,
        });
      }

      if (error.name === "NotFoundError") {
        return res.status(404).json({
          error: "Comment not found",
          message: error.message,
        });
      }

      if (error.name === "DuplicateVoteError") {
        return res.status(409).json({
          error: "Duplicate Vote",
          message: error.message,
        });
      }

      next(error);
    }
  }

  async removeVote(req, res, next) {
    try {
      const { commentId, personalitySystem } = req.params;
      const voterIdentifier = this._getVoterIdentifier(req);

      const vote = await this.voteService.removeVote(
        commentId,
        voterIdentifier,
        personalitySystem
      );

      if (!vote) {
        return res.status(404).json({
          error: "Vote not found",
          message:
            "No vote found for the specified comment and personality system",
        });
      }

      res.json({
        success: true,
        message: "Vote removed successfully",
        vote,
      });
    } catch (error) {
      console.error("Controller error removing vote:", error);

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

  async getUserVote(req, res, next) {
    try {
      const { commentId, personalitySystem } = req.params;
      const voterIdentifier = this._getVoterIdentifier(req);

      const vote = await this.voteService.getUserVote(
        commentId,
        voterIdentifier,
        personalitySystem
      );

      if (!vote) {
        return res.status(404).json({
          error: "Vote not found",
          message:
            "No vote found for the specified comment and personality system",
        });
      }

      res.json(vote);
    } catch (error) {
      console.error("Controller error getting user vote:", error);

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

  async getCommentVotes(req, res, next) {
    try {
      const commentId = req.params.commentId;
      const result = await this.voteService.getCommentVotes(
        commentId,
        req.query
      );

      res.json(result);
    } catch (error) {
      console.error("Controller error getting comment votes:", error);

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

  async getCommentVoteStats(req, res, next) {
    try {
      const commentId = req.params.commentId;
      const result = await this.voteService.getCommentVoteStats(commentId);

      res.json(result);
    } catch (error) {
      console.error("Controller error getting comment vote stats:", error);

      if (error.name === "ValidationError") {
        return res.status(400).json({
          error: "Validation Error",
          message: error.message,
          details: error.details,
        });
      }

      if (error.name === "NotFoundError") {
        return res.status(404).json({
          error: "Comment not found",
          message: error.message,
        });
      }

      next(error);
    }
  }

  async getVoteHistory(req, res, next) {
    try {
      const voterIdentifier = this._getVoterIdentifier(req);
      const result = await this.voteService.getVoteHistory(
        voterIdentifier,
        req.query
      );

      res.json(result);
    } catch (error) {
      console.error("Controller error getting vote history:", error);

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

  async getTopVotedComments(req, res, next) {
    try {
      const { personalitySystem } = req.query;
      const limit = parseInt(req.query.limit) || 10;

      const result = await this.voteService.getTopVotedComments(
        personalitySystem,
        limit
      );

      res.json(result);
    } catch (error) {
      console.error("Controller error getting top voted comments:", error);

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

  async getPersonalitySystemStats(req, res, next) {
    try {
      const commentId = req.query.commentId || null;
      const result = await this.voteService.getPersonalitySystemStats(
        commentId
      );

      res.json(result);
    } catch (error) {
      console.error(
        "Controller error getting personality system stats:",
        error
      );

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

  async getVoteCount(req, res, next) {
    try {
      const commentId = req.query.commentId || null;
      const personalitySystem = req.query.personalitySystem || null;

      const result = await this.voteService.getVoteCount(
        commentId,
        personalitySystem
      );

      res.json(result);
    } catch (error) {
      console.error("Controller error getting vote count:", error);

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

  async getValidPersonalityValues(req, res, next) {
    try {
      const values = this.voteService.getValidPersonalityValues();

      res.json({
        personalityValues: values,
        description: "Valid personality values for each system",
        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      console.error(
        "Controller error getting valid personality values:",
        error
      );
      next(error);
    }
  }

  // Bulk vote submission (for testing or admin purposes)
  async submitBulkVotes(req, res, next) {
    try {
      const { votes } = req.body;

      if (!Array.isArray(votes)) {
        return res.status(400).json({
          error: "Validation Error",
          message: "Votes must be an array",
        });
      }

      const results = [];
      const errors = [];

      for (const [index, voteData] of votes.entries()) {
        try {
          const result = await this.voteService.submitVote(voteData.commentId, {
            personalitySystem: voteData.personalitySystem,
            personalityValue: voteData.personalityValue,
            voterIdentifier:
              voteData.voterIdentifier || this._getVoterIdentifier(req),
            profileId: voteData.profileId || 1,
          });
          results.push({ index, success: true, result });
        } catch (error) {
          errors.push({
            index,
            error: error.message,
            details: error.details || {},
          });
        }
      }

      res.json({
        success: true,
        message: "Bulk vote submission completed",
        results,
        errors,
        summary: {
          total: votes.length,
          successful: results.length,
          failed: errors.length,
        },
      });
    } catch (error) {
      console.error("Controller error submitting bulk votes:", error);
      next(error);
    }
  }

  _getVoterIdentifier(req) {
    const forwarded = req.headers["x-forwarded-for"];
    const ip = forwarded
      ? forwarded.split(",")[0]
      : req.connection.remoteAddress;
    const userAgent = req.headers["user-agent"] || "";

    // Create a simple hash of IP + partial user agent for uniqueness
    const identifier = `${ip || "anonymous"}_${userAgent.substring(0, 50)}`;
    return identifier.replace(/[^a-zA-Z0-9_-]/g, ""); // Clean the identifier
  }

  // Health check endpoint
  async healthCheck(req, res) {
    try {
      const stats = await this.voteService.getVoteCount();
      res.json({
        status: "healthy",
        service: "votes",
        timestamp: new Date().toISOString(),
        totalVotes: stats.count,
      });
    } catch (error) {
      console.error("Vote service health check failed:", error);
      res.status(503).json({
        status: "unhealthy",
        service: "votes",
        timestamp: new Date().toISOString(),
        error: error.message,
      });
    }
  }
}

module.exports = VoteController;
