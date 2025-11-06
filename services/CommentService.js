"use strict";

const CommentRepository = require("../repositories/CommentRepository");
const { CommentValidator } = require("../validators/CommentValidator");

class CommentService {
  constructor() {
    this.commentRepository = new CommentRepository();
  }

  async createComment(commentData) {
    try {
      const validatedData = await CommentValidator.validateCreate(commentData);

      const comment = await this.commentRepository.create(validatedData);

      return {
        success: true,
        message: "Comment created successfully",
        comment: comment.toPublicJSON(),
      };
    } catch (error) {
      if (error.name === "ValidationError") {
        throw error;
      }
      throw new Error(`Service error creating comment: ${error.message}`);
    }
  }

  async getCommentById(commentId) {
    try {
      const validatedCommentId = await CommentValidator.validateCommentId(
        commentId
      );

      const comment = await this.commentRepository.findById(validatedCommentId);

      if (!comment) {
        return null;
      }

      return comment.toPublicJSON();
    } catch (error) {
      if (error.name === "ValidationError") {
        throw error;
      }
      throw new Error(`Service error getting comment by ID: ${error.message}`);
    }
  }

  async getCommentsByProfileId(profileId, options = {}) {
    try {
      const validatedProfileId = await CommentValidator.validateProfileId(
        profileId
      );
      const validatedOptions = await CommentValidator.validateCommentQuery({
        ...options,
        profileId: validatedProfileId,
      });

      const result = await this.commentRepository.findByProfileId(
        validatedProfileId,
        validatedOptions
      );

      return {
        comments: result.comments.map((comment) =>
          comment.toPublicJSON
            ? comment.toPublicJSON()
            : this._formatComment(comment)
        ),
        pagination: result.pagination,
        filters: {
          profileId: validatedProfileId,
          sort: validatedOptions.sort,
          filter: validatedOptions.filter,
        },
      };
    } catch (error) {
      if (error.name === "ValidationError") {
        throw error;
      }
      throw new Error(
        `Service error getting comments by profile ID: ${error.message}`
      );
    }
  }

  async getAllComments(options = {}) {
    try {
      const validatedOptions = await CommentValidator.validateCommentQuery(
        options
      );

      const result = await this.commentRepository.findAll(validatedOptions);

      return {
        comments: result.comments.map((comment) =>
          comment.toPublicJSON
            ? comment.toPublicJSON()
            : this._formatComment(comment)
        ),
        pagination: result.pagination,
        filters: {
          sort: validatedOptions.sort,
          filter: validatedOptions.filter,
        },
      };
    } catch (error) {
      if (error.name === "ValidationError") {
        throw error;
      }
      throw new Error(`Service error getting all comments: ${error.message}`);
    }
  }

  async updateComment(commentId, updateData) {
    try {
      const validatedCommentId = await CommentValidator.validateCommentId(
        commentId
      );
      const validatedUpdateData = await CommentValidator.validateUpdate(
        updateData
      );

      const exists = await this.commentRepository.exists(validatedCommentId);
      if (!exists) {
        return null;
      }

      const comment = await this.commentRepository.updateById(
        validatedCommentId,
        validatedUpdateData
      );

      return comment ? comment.toPublicJSON() : null;
    } catch (error) {
      if (error.name === "ValidationError") {
        throw error;
      }
      throw new Error(`Service error updating comment: ${error.message}`);
    }
  }

  async deleteComment(commentId) {
    try {
      const validatedCommentId = await CommentValidator.validateCommentId(
        commentId
      );

      const comment = await this.commentRepository.deleteById(
        validatedCommentId
      );

      return comment ? comment.toPublicJSON() : null;
    } catch (error) {
      if (error.name === "ValidationError") {
        throw error;
      }
      throw new Error(`Service error deleting comment: ${error.message}`);
    }
  }

  async updateCommentVoteStats(
    commentId,
    personalitySystem,
    personalityValue,
    increment = true
  ) {
    try {
      const validatedCommentId = await CommentValidator.validateCommentId(
        commentId
      );

      const comment = await this.commentRepository.updateVoteStats(
        validatedCommentId,
        personalitySystem,
        personalityValue,
        increment
      );

      return comment ? comment.toPublicJSON() : null;
    } catch (error) {
      throw new Error(
        `Service error updating comment vote stats: ${error.message}`
      );
    }
  }

  async getCommentStats() {
    try {
      const stats = await this.commentRepository.getCommentStats();

      return {
        totalComments: stats.totalComments,
        topComments: stats.topComments.map((comment) =>
          comment.toPublicJSON
            ? comment.toPublicJSON()
            : this._formatComment(comment)
        ),
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(`Service error getting comment stats: ${error.message}`);
    }
  }

  async getCommentCount(profileId = null) {
    try {
      let validatedProfileId = null;
      if (profileId) {
        validatedProfileId = await CommentValidator.validateProfileId(
          profileId
        );
      }

      const count = await this.commentRepository.getCount(validatedProfileId);
      return { count };
    } catch (error) {
      if (error.name === "ValidationError") {
        throw error;
      }
      throw new Error(`Service error getting comment count: ${error.message}`);
    }
  }

  // Helper method to format lean comment objects
  _formatComment(comment) {
    return {
      id: comment._id,
      content: comment.content,
      title: comment.title,
      author: comment.author,
      profileId: comment.profileId,
      voteStats: {
        mbti: comment.voteStats?.mbti
          ? comment.voteStats.mbti instanceof Map
            ? Object.fromEntries(comment.voteStats.mbti)
            : comment.voteStats.mbti
          : {},
        enneagram: comment.voteStats?.enneagram
          ? comment.voteStats.enneagram instanceof Map
            ? Object.fromEntries(comment.voteStats.enneagram)
            : comment.voteStats.enneagram
          : {},
        zodiac: comment.voteStats?.zodiac
          ? comment.voteStats.zodiac instanceof Map
            ? Object.fromEntries(comment.voteStats.zodiac)
            : comment.voteStats.zodiac
          : {},
      },
      totalVotes: comment.totalVotes || 0,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    };
  }

  async commentExists(commentId) {
    try {
      const validatedCommentId = await CommentValidator.validateCommentId(
        commentId
      );
      return await this.commentRepository.exists(validatedCommentId);
    } catch (error) {
      return false;
    }
  }
}

module.exports = CommentService;
