"use strict";

const Comment = require("../models/Comment");

class CommentRepository {
  async create(commentData) {
    try {
      const comment = new Comment(commentData);
      await comment.save();
      return comment;
    } catch (error) {
      if (error.name === "ValidationError") {
        throw error;
      }
      throw new Error(`Repository error creating comment: ${error.message}`);
    }
  }

  async findById(commentId) {
    try {
      return await Comment.findById(commentId);
    } catch (error) {
      throw new Error(
        `Repository error finding comment by ID: ${error.message}`
      );
    }
  }

  async findByProfileId(profileId, options = {}) {
    try {
      const { page = 1, limit = 10, sort = "recent", filter = "all" } = options;

      // Build sort criteria
      let sortCriteria = {};
      switch (sort) {
        case "recent":
          sortCriteria = { createdAt: -1 };
          break;
        case "best":
          sortCriteria = { totalVotes: -1, createdAt: -1 };
          break;
        case "oldest":
          sortCriteria = { createdAt: 1 };
          break;
        default:
          sortCriteria = { createdAt: -1 };
      }

      const query = {
        profileId: profileId,
        isVisible: true,
      };

      const skip = (page - 1) * limit;

      const [comments, totalCount] = await Promise.all([
        Comment.find(query).sort(sortCriteria).skip(skip).limit(limit).lean(),
        Comment.countDocuments(query),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return {
        comments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalCount,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    } catch (error) {
      throw new Error(
        `Repository error finding comments by profile ID: ${error.message}`
      );
    }
  }

  async findAll(options = {}) {
    try {
      const { page = 1, limit = 20, sort = "recent" } = options;

      let sortCriteria = {};
      switch (sort) {
        case "recent":
          sortCriteria = { createdAt: -1 };
          break;
        case "best":
          sortCriteria = { totalVotes: -1, createdAt: -1 };
          break;
        case "oldest":
          sortCriteria = { createdAt: 1 };
          break;
        default:
          sortCriteria = { createdAt: -1 };
      }

      const query = { isVisible: true };
      const skip = (page - 1) * limit;

      const [comments, totalCount] = await Promise.all([
        Comment.find(query).sort(sortCriteria).skip(skip).limit(limit).lean(),
        Comment.countDocuments(query),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return {
        comments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalCount,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    } catch (error) {
      throw new Error(
        `Repository error finding all comments: ${error.message}`
      );
    }
  }

  async updateById(commentId, updateData) {
    try {
      const comment = await Comment.findByIdAndUpdate(commentId, updateData, {
        new: true,
        runValidators: true,
      });
      return comment;
    } catch (error) {
      if (error.name === "ValidationError") {
        throw error;
      }
      throw new Error(`Repository error updating comment: ${error.message}`);
    }
  }

  async deleteById(commentId) {
    try {
      // Soft delete by setting isVisible to false
      const comment = await Comment.findByIdAndUpdate(
        commentId,
        { isVisible: false },
        { new: true }
      );
      return comment;
    } catch (error) {
      throw new Error(`Repository error deleting comment: ${error.message}`);
    }
  }

  async hardDeleteById(commentId) {
    try {
      const comment = await Comment.findByIdAndDelete(commentId);
      return comment;
    } catch (error) {
      throw new Error(
        `Repository error hard deleting comment: ${error.message}`
      );
    }
  }

  async updateVoteStats(
    commentId,
    personalitySystem,
    personalityValue,
    increment = true
  ) {
    try {
      const comment = await Comment.findById(commentId);
      if (!comment) {
        return null;
      }

      if (increment) {
        comment.incrementVoteCount(personalitySystem, personalityValue);
      } else {
        comment.decrementVoteCount(personalitySystem, personalityValue);
      }

      await comment.save();
      return comment;
    } catch (error) {
      throw new Error(`Repository error updating vote stats: ${error.message}`);
    }
  }

  async getCommentStats() {
    try {
      const [totalComments, topComments] = await Promise.all([
        Comment.countDocuments({ isVisible: true }),
        Comment.find({ isVisible: true })
          .sort({ totalVotes: -1, createdAt: -1 })
          .limit(10)
          .lean(),
      ]);

      return {
        totalComments,
        topComments,
      };
    } catch (error) {
      throw new Error(
        `Repository error getting comment stats: ${error.message}`
      );
    }
  }

  async exists(commentId) {
    try {
      const comment = await Comment.findById(commentId).select("_id");
      return !!comment;
    } catch (error) {
      return false;
    }
  }

  async getCount(profileId = null) {
    try {
      const query = { isVisible: true };
      if (profileId) {
        query.profileId = profileId;
      }
      return await Comment.countDocuments(query);
    } catch (error) {
      throw new Error(`Repository error getting count: ${error.message}`);
    }
  }
}

module.exports = CommentRepository;
