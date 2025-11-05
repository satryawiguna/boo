"use strict";

const VoteRepository = require("../repositories/VoteRepository");
const CommentService = require("./CommentService");
const { VoteValidator } = require("../validators/VoteValidator");

class VoteService {
  constructor() {
    this.voteRepository = new VoteRepository();
    this.commentService = new CommentService();
  }

  async submitVote(commentId, voteData) {
    try {
      const validatedCommentId = await VoteValidator.validateCommentId(
        commentId
      );
      const validatedVoteData = await VoteValidator.validateVoteSubmission(
        voteData
      );

      // Check if comment exists
      const commentExists = await this.commentService.commentExists(
        validatedCommentId
      );
      if (!commentExists) {
        const error = new Error("Comment not found");
        error.name = "NotFoundError";
        throw error;
      }

      const existingVote = await this.voteRepository.findUserVote(
        validatedCommentId,
        validatedVoteData.voterIdentifier,
        validatedVoteData.personalitySystem
      );

      let vote;
      let isUpdate = false;
      let oldPersonalityValue = null;

      if (existingVote) {
        oldPersonalityValue = existingVote.personalityValue;

        if (oldPersonalityValue === validatedVoteData.personalityValue) {
          return {
            success: true,
            message: "Vote unchanged",
            vote: existingVote.toPublicJSON(),
            isUpdate: true,
          };
        }

        vote = await this.voteRepository.updateUserVote(
          validatedCommentId,
          validatedVoteData.voterIdentifier,
          validatedVoteData.personalitySystem,
          validatedVoteData.personalityValue
        );
        isUpdate = true;
      } else {
        const newVoteData = {
          commentId: validatedCommentId,
          profileId: voteData.profileId || 1,
          voterIdentifier: validatedVoteData.voterIdentifier,
          personalitySystem: validatedVoteData.personalitySystem,
          personalityValue: validatedVoteData.personalityValue,
        };

        vote = await this.voteRepository.create(newVoteData);
      }

      if (isUpdate && oldPersonalityValue) {
        await this.commentService.updateCommentVoteStats(
          validatedCommentId,
          validatedVoteData.personalitySystem,
          oldPersonalityValue,
          false
        );
      }

      await this.commentService.updateCommentVoteStats(
        validatedCommentId,
        validatedVoteData.personalitySystem,
        validatedVoteData.personalityValue,
        true
      );

      return {
        success: true,
        message: isUpdate
          ? "Vote updated successfully"
          : "Vote submitted successfully",
        vote: vote.toPublicJSON(),
        isUpdate,
      };
    } catch (error) {
      if (
        error.name === "ValidationError" ||
        error.name === "NotFoundError" ||
        error.name === "DuplicateVoteError"
      ) {
        throw error;
      }
      throw new Error(`Service error submitting vote: ${error.message}`);
    }
  }

  async removeVote(commentId, voterIdentifier, personalitySystem) {
    try {
      const validatedCommentId = await VoteValidator.validateCommentId(
        commentId
      );

      const vote = await this.voteRepository.findUserVote(
        validatedCommentId,
        voterIdentifier,
        personalitySystem
      );

      if (!vote) {
        return null;
      }

      const deletedVote = await this.voteRepository.deleteUserVote(
        validatedCommentId,
        voterIdentifier,
        personalitySystem
      );

      if (deletedVote) {
        await this.commentService.updateCommentVoteStats(
          validatedCommentId,
          personalitySystem,
          vote.personalityValue,
          false
        );
      }

      return deletedVote ? deletedVote.toPublicJSON() : null;
    } catch (error) {
      if (error.name === "ValidationError") {
        throw error;
      }
      throw new Error(`Service error removing vote: ${error.message}`);
    }
  }

  async getUserVote(commentId, voterIdentifier, personalitySystem) {
    try {
      const validatedCommentId = await VoteValidator.validateCommentId(
        commentId
      );

      const vote = await this.voteRepository.findUserVote(
        validatedCommentId,
        voterIdentifier,
        personalitySystem
      );

      return vote ? vote.toPublicJSON() : null;
    } catch (error) {
      if (error.name === "ValidationError") {
        throw error;
      }
      throw new Error(`Service error getting user vote: ${error.message}`);
    }
  }

  async getCommentVotes(commentId, options = {}) {
    try {
      const validatedCommentId = await VoteValidator.validateCommentId(
        commentId
      );
      const validatedOptions = await VoteValidator.validateVoteQuery(options);

      const votes = await this.voteRepository.findByCommentId(
        validatedCommentId,
        validatedOptions
      );

      return {
        votes: votes.map((vote) => vote.toPublicJSON()),
        commentId: validatedCommentId,
        filters: {
          personalitySystem: validatedOptions.personalitySystem,
        },
      };
    } catch (error) {
      if (error.name === "ValidationError") {
        throw error;
      }
      throw new Error(`Service error getting comment votes: ${error.message}`);
    }
  }

  async getCommentVoteStats(commentId) {
    try {
      const validatedCommentId = await VoteValidator.validateCommentId(
        commentId
      );

      // Check if comment exists
      const commentExists = await this.commentService.commentExists(
        validatedCommentId
      );
      if (!commentExists) {
        const error = new Error("Comment not found");
        error.name = "NotFoundError";
        throw error;
      }

      const stats = await this.voteRepository.getVoteStatsByComment(
        validatedCommentId
      );

      return {
        commentId: validatedCommentId,
        voteStats: stats,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      if (error.name === "ValidationError" || error.name === "NotFoundError") {
        throw error;
      }
      throw new Error(
        `Service error getting comment vote stats: ${error.message}`
      );
    }
  }

  async getVoteHistory(voterIdentifier, options = {}) {
    try {
      const validatedOptions = await VoteValidator.validateVoteQuery({
        ...options,
        voterIdentifier,
      });

      const result = await this.voteRepository.getVoteHistory(
        voterIdentifier,
        validatedOptions
      );

      return {
        votes: result.votes.map((vote) => ({
          ...vote,
          comment: vote.commentId
            ? {
                id: vote.commentId._id,
                content: vote.commentId.content,
                author: vote.commentId.author,
                profileId: vote.commentId.profileId,
              }
            : null,
        })),
        pagination: result.pagination,
        voterIdentifier,
        filters: {
          personalitySystem: validatedOptions.personalitySystem,
        },
      };
    } catch (error) {
      if (error.name === "ValidationError") {
        throw error;
      }
      throw new Error(`Service error getting vote history: ${error.message}`);
    }
  }

  async getTopVotedComments(personalitySystem = null, limit = 10) {
    try {
      if (personalitySystem) {
        await VoteValidator.validateVoteQuery({ personalitySystem });
      }

      const topComments = await this.voteRepository.getTopVotedComments(
        personalitySystem,
        limit
      );

      return {
        comments: topComments,
        personalitySystem,
        limit,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      if (error.name === "ValidationError") {
        throw error;
      }
      throw new Error(
        `Service error getting top voted comments: ${error.message}`
      );
    }
  }

  async getPersonalitySystemStats(commentId = null) {
    try {
      let validatedCommentId = null;
      if (commentId) {
        validatedCommentId = await VoteValidator.validateCommentId(commentId);
      }

      const stats = await this.voteRepository.getPersonalitySystemStats(
        validatedCommentId
      );

      return {
        commentId: validatedCommentId,
        personalityStats: stats,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      if (error.name === "ValidationError") {
        throw error;
      }
      throw new Error(
        `Service error getting personality system stats: ${error.message}`
      );
    }
  }

  async getVoteCount(commentId = null, personalitySystem = null) {
    try {
      let validatedCommentId = null;
      if (commentId) {
        validatedCommentId = await VoteValidator.validateCommentId(commentId);
      }

      if (personalitySystem) {
        await VoteValidator.validateVoteQuery({ personalitySystem });
      }

      const count = await this.voteRepository.getCount(
        validatedCommentId,
        personalitySystem
      );

      return {
        count,
        commentId: validatedCommentId,
        personalitySystem,
      };
    } catch (error) {
      if (error.name === "ValidationError") {
        throw error;
      }
      throw new Error(`Service error getting vote count: ${error.message}`);
    }
  }

  getValidPersonalityValues() {
    return VoteValidator.getValidPersonalityValues();
  }
}

module.exports = VoteService;
