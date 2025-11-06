"use strict";

const Vote = require("../models/Vote");
const mongoose = require("mongoose");

class VoteRepository {
  async create(voteData) {
    try {
      const vote = new Vote(voteData);
      await vote.save();
      return vote;
    } catch (error) {
      if (error.name === "ValidationError") {
        throw error;
      }
      if (error.code === 11000) {
        const duplicateError = new Error(
          "You have already voted on this comment for this personality system"
        );
        duplicateError.name = "DuplicateVoteError";
        throw duplicateError;
      }
      throw new Error(`Repository error creating vote: ${error.message}`);
    }
  }

  async findById(voteId) {
    try {
      return await Vote.findById(voteId);
    } catch (error) {
      throw new Error(`Repository error finding vote by ID: ${error.message}`);
    }
  }

  async findUserVote(commentId, voterIdentifier, personalitySystem) {
    try {
      return await Vote.findUserVote(
        commentId,
        voterIdentifier,
        personalitySystem
      );
    } catch (error) {
      throw new Error(`Repository error finding user vote: ${error.message}`);
    }
  }

  async findByCommentId(commentId, options = {}) {
    try {
      return await Vote.findByCommentId(commentId, options);
    } catch (error) {
      throw new Error(
        `Repository error finding votes by comment ID: ${error.message}`
      );
    }
  }

  async updateUserVote(
    commentId,
    voterIdentifier,
    personalitySystem,
    newPersonalityValue
  ) {
    try {
      const vote = await Vote.findOneAndUpdate(
        {
          commentId: commentId,
          voterIdentifier: voterIdentifier,
          personalitySystem: personalitySystem,
          isActive: true,
        },
        {
          personalityValue: newPersonalityValue,
          updatedAt: new Date(),
        },
        {
          new: true,
          runValidators: true,
        }
      );
      return vote;
    } catch (error) {
      if (error.name === "ValidationError") {
        throw error;
      }
      throw new Error(`Repository error updating user vote: ${error.message}`);
    }
  }

  async deleteUserVote(commentId, voterIdentifier, personalitySystem) {
    try {
      const vote = await Vote.findOneAndUpdate(
        {
          commentId: commentId,
          voterIdentifier: voterIdentifier,
          personalitySystem: personalitySystem,
          isActive: true,
        },
        {
          isActive: false,
        },
        {
          new: true,
        }
      );
      return vote;
    } catch (error) {
      throw new Error(`Repository error deleting user vote: ${error.message}`);
    }
  }

  async getVoteStatsByComment(commentId) {
    try {
      const stats = await Vote.getVoteStatsByComment(commentId);

      const formattedStats = {
        mbti: {},
        enneagram: {},
        zodiac: {},
      };

      stats.forEach((systemStats) => {
        const system = systemStats.personalitySystem;
        formattedStats[system] = {};

        systemStats.votes.forEach((vote) => {
          formattedStats[system][vote.value] = vote.count;
        });
      });

      return formattedStats;
    } catch (error) {
      throw new Error(`Repository error getting vote stats: ${error.message}`);
    }
  }

  async getVoteHistory(voterIdentifier, options = {}) {
    try {
      const { page = 1, limit = 20, personalitySystem = null } = options;

      const query = {
        voterIdentifier: voterIdentifier,
        isActive: true,
      };

      if (personalitySystem) {
        query.personalitySystem = personalitySystem;
      }

      const skip = (page - 1) * limit;

      const [votes, totalCount] = await Promise.all([
        Vote.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate("commentId", "content author profileId")
          .lean(),
        Vote.countDocuments(query),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return {
        votes,
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
        `Repository error getting vote history: ${error.message}`
      );
    }
  }

  async getTopVotedComments(personalitySystem = null, limit = 10) {
    try {
      const matchStage = { isActive: true };
      if (personalitySystem) {
        matchStage.personalitySystem = personalitySystem;
      }

      const pipeline = [
        { $match: matchStage },
        {
          $group: {
            _id: "$commentId",
            totalVotes: { $sum: 1 },
            personalitySystems: {
              $addToSet: "$personalitySystem",
            },
          },
        },
        { $sort: { totalVotes: -1 } },
        { $limit: limit },
        {
          $lookup: {
            from: "comments",
            localField: "_id",
            foreignField: "_id",
            as: "comment",
          },
        },
        {
          $unwind: "$comment",
        },
        {
          $project: {
            commentId: "$_id",
            totalVotes: 1,
            personalitySystems: 1,
            comment: {
              content: 1,
              title: 1,
              author: 1,
              profileId: 1,
              createdAt: 1,
            },
            _id: 0,
          },
        },
      ];

      return await Vote.aggregate(pipeline);
    } catch (error) {
      throw new Error(
        `Repository error getting top voted comments: ${error.message}`
      );
    }
  }

  async getPersonalitySystemStats(commentId = null) {
    try {
      const matchStage = { isActive: true };
      if (commentId) {
        matchStage.commentId = new mongoose.Types.ObjectId(commentId);
      }

      const pipeline = [
        { $match: matchStage },
        {
          $group: {
            _id: {
              personalitySystem: "$personalitySystem",
              personalityValue: "$personalityValue",
            },
            count: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: "$_id.personalitySystem",
            values: {
              $push: {
                value: "$_id.personalityValue",
                count: "$count",
              },
            },
            totalVotes: { $sum: "$count" },
          },
        },
        {
          $project: {
            personalitySystem: "$_id",
            values: 1,
            totalVotes: 1,
            _id: 0,
          },
        },
      ];

      return await Vote.aggregate(pipeline);
    } catch (error) {
      throw new Error(
        `Repository error getting personality system stats: ${error.message}`
      );
    }
  }

  async exists(voteId) {
    try {
      const vote = await Vote.findById(voteId).select("_id");
      return !!vote;
    } catch (error) {
      return false;
    }
  }

  async getCount(commentId = null, personalitySystem = null) {
    try {
      const query = { isActive: true };

      if (commentId) {
        query.commentId = commentId;
      }

      if (personalitySystem) {
        query.personalitySystem = personalitySystem;
      }

      return await Vote.countDocuments(query);
    } catch (error) {
      throw new Error(`Repository error getting count: ${error.message}`);
    }
  }

  async hardDeleteById(voteId) {
    try {
      return await Vote.findByIdAndDelete(voteId);
    } catch (error) {
      throw new Error(`Repository error hard deleting vote: ${error.message}`);
    }
  }
}

module.exports = VoteRepository;
