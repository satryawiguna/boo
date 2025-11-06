jest.mock("../../../repositories/VoteRepository");
jest.mock("../../../services/CommentService");
jest.mock("../../../validators/VoteValidator");

const VoteService = require("../../../services/VoteService");
const VoteRepository = require("../../../repositories/VoteRepository");
const CommentService = require("../../../services/CommentService");
const { VoteValidator } = require("../../../validators/VoteValidator");
const {
  mockFactories,
  createMockRepository,
  createMockService,
  createMockModel,
} = require("../../helpers/testHelpers");

describe("VoteService", () => {
  let voteService;
  let mockVoteRepository;
  let mockCommentService;

  beforeEach(() => {
    jest.clearAllMocks();

    mockVoteRepository = createMockRepository("VoteRepository");
    mockCommentService = createMockService("CommentService");

    VoteRepository.mockImplementation(() => mockVoteRepository);
    CommentService.mockImplementation(() => mockCommentService);

    voteService = new VoteService();
  });

  describe("submitVote", () => {
    const commentId = "507f1f77bcf86cd799439011";
    const voteData = {
      personalitySystem: "mbti",
      personalityValue: "INTJ",
      voterIdentifier: "voter123",
      profileId: 1,
    };

    it("should submit new vote successfully", async () => {
      const validatedCommentId = commentId;
      const validatedVoteData = { ...voteData, validated: true };
      const mockVote = createMockModel({
        _id: "507f1f77bcf86cd799439013",
        commentId,
        ...validatedVoteData,
      });
      const publicJSON = {
        id: "507f1f77bcf86cd799439013",
        ...validatedVoteData,
      };

      VoteValidator.validateCommentId.mockResolvedValue(validatedCommentId);
      VoteValidator.validateVoteSubmission.mockResolvedValue(validatedVoteData);
      mockCommentService.commentExists.mockResolvedValue(true);
      mockVoteRepository.findUserVote.mockResolvedValue(null);
      mockVoteRepository.create.mockResolvedValue(mockVote);
      mockCommentService.updateCommentVoteStats.mockResolvedValue({});
      mockVote.toPublicJSON.mockReturnValue(publicJSON);

      const result = await voteService.submitVote(commentId, voteData);
      expect(VoteValidator.validateCommentId).toHaveBeenCalledWith(commentId);
      expect(VoteValidator.validateVoteSubmission).toHaveBeenCalledWith(
        voteData
      );
      expect(mockCommentService.commentExists).toHaveBeenCalledWith(
        validatedCommentId
      );
      expect(mockVoteRepository.findUserVote).toHaveBeenCalledWith(
        validatedCommentId,
        validatedVoteData.voterIdentifier,
        validatedVoteData.personalitySystem
      );
      expect(mockVoteRepository.create).toHaveBeenCalledWith({
        commentId: validatedCommentId,
        profileId: 1,
        voterIdentifier: validatedVoteData.voterIdentifier,
        personalitySystem: validatedVoteData.personalitySystem,
        personalityValue: validatedVoteData.personalityValue,
      });
      expect(mockCommentService.updateCommentVoteStats).toHaveBeenCalledWith(
        validatedCommentId,
        validatedVoteData.personalitySystem,
        validatedVoteData.personalityValue,
        true
      );
      expect(result).toEqual({
        success: true,
        message: "Vote submitted successfully",
        vote: publicJSON,
        isUpdate: false,
      });
    });

    it("should update existing vote successfully", async () => {
      const validatedCommentId = commentId;
      const validatedVoteData = { ...voteData, validated: true };
      const existingVote = createMockModel({
        personalityValue: "ENFP",
      });
      const updatedVote = createMockModel({
        _id: "507f1f77bcf86cd799439013",
        personalityValue: "INTJ",
      });
      const publicJSON = {
        id: "507f1f77bcf86cd799439013",
        personalityValue: "INTJ",
      };

      VoteValidator.validateCommentId.mockResolvedValue(validatedCommentId);
      VoteValidator.validateVoteSubmission.mockResolvedValue(validatedVoteData);
      mockCommentService.commentExists.mockResolvedValue(true);
      mockVoteRepository.findUserVote.mockResolvedValue(existingVote);
      mockVoteRepository.updateUserVote.mockResolvedValue(updatedVote);
      mockCommentService.updateCommentVoteStats.mockResolvedValue({});
      updatedVote.toPublicJSON.mockReturnValue(publicJSON);

      const result = await voteService.submitVote(commentId, voteData);
      expect(mockVoteRepository.updateUserVote).toHaveBeenCalledWith(
        validatedCommentId,
        validatedVoteData.voterIdentifier,
        validatedVoteData.personalitySystem,
        validatedVoteData.personalityValue
      );
      expect(mockCommentService.updateCommentVoteStats).toHaveBeenCalledWith(
        validatedCommentId,
        validatedVoteData.personalitySystem,
        "ENFP",
        false
      );
      expect(mockCommentService.updateCommentVoteStats).toHaveBeenCalledWith(
        validatedCommentId,
        validatedVoteData.personalitySystem,
        validatedVoteData.personalityValue,
        true
      );
      expect(result).toEqual({
        success: true,
        message: "Vote updated successfully",
        vote: publicJSON,
        isUpdate: true,
      });
    });

    it("should return unchanged when voting same value", async () => {
      const validatedCommentId = commentId;
      const validatedVoteData = { ...voteData, validated: true };
      const existingVote = createMockModel({
        personalityValue: "INTJ",
      });
      const publicJSON = {
        id: "507f1f77bcf86cd799439013",
        personalityValue: "INTJ",
      };

      VoteValidator.validateCommentId.mockResolvedValue(validatedCommentId);
      VoteValidator.validateVoteSubmission.mockResolvedValue(validatedVoteData);
      mockCommentService.commentExists.mockResolvedValue(true);
      mockVoteRepository.findUserVote.mockResolvedValue(existingVote);
      existingVote.toPublicJSON.mockReturnValue(publicJSON);

      const result = await voteService.submitVote(commentId, voteData);
      expect(mockVoteRepository.updateUserVote).not.toHaveBeenCalled();
      expect(mockCommentService.updateCommentVoteStats).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: "Vote unchanged",
        vote: publicJSON,
        isUpdate: true,
      });
    });

    it("should handle comment not found error", async () => {
      VoteValidator.validateCommentId.mockResolvedValue(commentId);
      VoteValidator.validateVoteSubmission.mockResolvedValue(voteData);
      mockCommentService.commentExists.mockResolvedValue(false);

      await expect(voteService.submitVote(commentId, voteData)).rejects.toEqual(
        expect.objectContaining({
          name: "NotFoundError",
          message: "Comment not found",
        })
      );

      expect(mockVoteRepository.findUserVote).not.toHaveBeenCalled();
    });

    it("should handle validation errors", async () => {
      const validationError =
        mockFactories.validationError("Invalid vote data");
      VoteValidator.validateCommentId.mockResolvedValue(commentId);
      VoteValidator.validateVoteSubmission.mockRejectedValue(validationError);

      await expect(voteService.submitVote(commentId, voteData)).rejects.toEqual(
        validationError
      );
    });

    it("should handle repository errors", async () => {
      const repositoryError = new Error("Database error");
      VoteValidator.validateCommentId.mockResolvedValue(commentId);
      VoteValidator.validateVoteSubmission.mockResolvedValue(voteData);
      mockCommentService.commentExists.mockResolvedValue(true);
      mockVoteRepository.findUserVote.mockRejectedValue(repositoryError);

      await expect(voteService.submitVote(commentId, voteData)).rejects.toThrow(
        "Service error submitting vote: Database error"
      );
    });
  });

  describe("removeVote", () => {
    const commentId = "507f1f77bcf86cd799439011";
    const voterIdentifier = "voter123";
    const personalitySystem = "mbti";

    it("should remove vote successfully", async () => {
      const existingVote = createMockModel({
        personalityValue: "INTJ",
      });
      const deletedVote = createMockModel({
        _id: "507f1f77bcf86cd799439013",
      });
      const publicJSON = { id: "507f1f77bcf86cd799439013" };

      VoteValidator.validateCommentId.mockResolvedValue(commentId);
      mockVoteRepository.findUserVote.mockResolvedValue(existingVote);
      mockVoteRepository.deleteUserVote.mockResolvedValue(deletedVote);
      mockCommentService.updateCommentVoteStats.mockResolvedValue({});
      deletedVote.toPublicJSON.mockReturnValue(publicJSON);

      const result = await voteService.removeVote(
        commentId,
        voterIdentifier,
        personalitySystem
      );
      expect(VoteValidator.validateCommentId).toHaveBeenCalledWith(commentId);
      expect(mockVoteRepository.findUserVote).toHaveBeenCalledWith(
        commentId,
        voterIdentifier,
        personalitySystem
      );
      expect(mockVoteRepository.deleteUserVote).toHaveBeenCalledWith(
        commentId,
        voterIdentifier,
        personalitySystem
      );
      expect(mockCommentService.updateCommentVoteStats).toHaveBeenCalledWith(
        commentId,
        personalitySystem,
        "INTJ",
        false
      );
      expect(result).toEqual(publicJSON);
    });

    it("should return null when vote not found", async () => {
      VoteValidator.validateCommentId.mockResolvedValue(commentId);
      mockVoteRepository.findUserVote.mockResolvedValue(null);

      const result = await voteService.removeVote(
        commentId,
        voterIdentifier,
        personalitySystem
      );
      expect(result).toBeNull();
      expect(mockVoteRepository.deleteUserVote).not.toHaveBeenCalled();
      expect(mockCommentService.updateCommentVoteStats).not.toHaveBeenCalled();
    });

    it("should return null when delete returns null", async () => {
      const existingVote = createMockModel({ personalityValue: "INTJ" });

      VoteValidator.validateCommentId.mockResolvedValue(commentId);
      mockVoteRepository.findUserVote.mockResolvedValue(existingVote);
      mockVoteRepository.deleteUserVote.mockResolvedValue(null);

      const result = await voteService.removeVote(
        commentId,
        voterIdentifier,
        personalitySystem
      );
      expect(result).toBeNull();
      expect(mockCommentService.updateCommentVoteStats).not.toHaveBeenCalled();
    });

    it("should handle validation errors", async () => {
      const validationError =
        mockFactories.validationError("Invalid comment ID");
      VoteValidator.validateCommentId.mockRejectedValue(validationError);

      await expect(
        voteService.removeVote("invalid", voterIdentifier, personalitySystem)
      ).rejects.toEqual(validationError);
    });
  });

  describe("getUserVote", () => {
    const commentId = "507f1f77bcf86cd799439011";
    const voterIdentifier = "voter123";
    const personalitySystem = "mbti";

    it("should get user vote successfully", async () => {
      const mockVote = createMockModel({
        _id: "507f1f77bcf86cd799439013",
        personalityValue: "INTJ",
      });
      const publicJSON = {
        id: "507f1f77bcf86cd799439013",
        personalityValue: "INTJ",
      };

      VoteValidator.validateCommentId.mockResolvedValue(commentId);
      mockVoteRepository.findUserVote.mockResolvedValue(mockVote);
      mockVote.toPublicJSON.mockReturnValue(publicJSON);

      const result = await voteService.getUserVote(
        commentId,
        voterIdentifier,
        personalitySystem
      );
      expect(VoteValidator.validateCommentId).toHaveBeenCalledWith(commentId);
      expect(mockVoteRepository.findUserVote).toHaveBeenCalledWith(
        commentId,
        voterIdentifier,
        personalitySystem
      );
      expect(result).toEqual(publicJSON);
    });

    it("should return null when vote not found", async () => {
      VoteValidator.validateCommentId.mockResolvedValue(commentId);
      mockVoteRepository.findUserVote.mockResolvedValue(null);

      const result = await voteService.getUserVote(
        commentId,
        voterIdentifier,
        personalitySystem
      );
      expect(result).toBeNull();
    });
  });

  describe("getCommentVotes", () => {
    const commentId = "507f1f77bcf86cd799439011";
    const options = { personalitySystem: "mbti" };

    it("should get comment votes successfully", async () => {
      const mockVotes = [
        createMockModel({ _id: "1", personalityValue: "INTJ" }),
        createMockModel({ _id: "2", personalityValue: "ENFP" }),
      ];
      const validatedOptions = { personalitySystem: "mbti" };

      VoteValidator.validateCommentId.mockResolvedValue(commentId);
      VoteValidator.validateVoteQuery.mockResolvedValue(validatedOptions);
      mockVoteRepository.findByCommentId.mockResolvedValue(mockVotes);

      mockVotes.forEach((vote, index) => {
        vote.toPublicJSON.mockReturnValue({
          id: `${index + 1}`,
          personalityValue: index === 0 ? "INTJ" : "ENFP",
        });
      });

      const result = await voteService.getCommentVotes(commentId, options);
      expect(VoteValidator.validateCommentId).toHaveBeenCalledWith(commentId);
      expect(VoteValidator.validateVoteQuery).toHaveBeenCalledWith(options);
      expect(mockVoteRepository.findByCommentId).toHaveBeenCalledWith(
        commentId,
        validatedOptions
      );
      expect(result).toEqual({
        votes: [
          { id: "1", personalityValue: "INTJ" },
          { id: "2", personalityValue: "ENFP" },
        ],
        commentId,
        filters: {
          personalitySystem: "mbti",
        },
      });
    });
  });

  describe("getCommentVoteStats", () => {
    const commentId = "507f1f77bcf86cd799439011";

    it("should get comment vote stats successfully", async () => {
      const mockStats = {
        mbti: { INTJ: 5, ENFP: 3 },
        enneagram: { "Type 5": 4, "Type 7": 2 },
      };

      VoteValidator.validateCommentId.mockResolvedValue(commentId);
      mockCommentService.commentExists.mockResolvedValue(true);
      mockVoteRepository.getVoteStatsByComment.mockResolvedValue(mockStats);

      const result = await voteService.getCommentVoteStats(commentId);
      expect(VoteValidator.validateCommentId).toHaveBeenCalledWith(commentId);
      expect(mockCommentService.commentExists).toHaveBeenCalledWith(commentId);
      expect(mockVoteRepository.getVoteStatsByComment).toHaveBeenCalledWith(
        commentId
      );
      expect(result).toEqual({
        commentId,
        voteStats: mockStats,
        lastUpdated: expect.any(String),
      });
    });

    it("should handle comment not found error", async () => {
      VoteValidator.validateCommentId.mockResolvedValue(commentId);
      mockCommentService.commentExists.mockResolvedValue(false);

      await expect(voteService.getCommentVoteStats(commentId)).rejects.toEqual(
        expect.objectContaining({
          name: "NotFoundError",
          message: "Comment not found",
        })
      );

      expect(mockVoteRepository.getVoteStatsByComment).not.toHaveBeenCalled();
    });
  });

  describe("getVoteHistory", () => {
    const voterIdentifier = "voter123";
    const options = { page: 1, limit: 10 };

    it("should get vote history successfully", async () => {
      const validatedOptions = { ...options, voterIdentifier };
      const mockResult = {
        votes: [
          {
            _id: "1",
            personalityValue: "INTJ",
            commentId: {
              _id: "comment1",
              content: "Test comment",
              author: "Author 1",
              profileId: 1,
            },
          },
        ],
        pagination: { page: 1, limit: 10, total: 1 },
      };

      VoteValidator.validateVoteQuery.mockResolvedValue(validatedOptions);
      mockVoteRepository.getVoteHistory.mockResolvedValue(mockResult);

      const result = await voteService.getVoteHistory(voterIdentifier, options);
      expect(VoteValidator.validateVoteQuery).toHaveBeenCalledWith({
        ...options,
        voterIdentifier,
      });
      expect(mockVoteRepository.getVoteHistory).toHaveBeenCalledWith(
        voterIdentifier,
        validatedOptions
      );
      expect(result).toEqual({
        votes: [
          {
            _id: "1",
            personalityValue: "INTJ",
            commentId: {
              _id: "comment1",
              content: "Test comment",
              author: "Author 1",
              profileId: 1,
            },
            comment: {
              id: "comment1",
              content: "Test comment",
              author: "Author 1",
              profileId: 1,
            },
          },
        ],
        pagination: { page: 1, limit: 10, total: 1 },
        voterIdentifier,
        filters: {
          personalitySystem: undefined,
        },
      });
    });

    it("should handle votes without commentId", async () => {
      const validatedOptions = { ...options, voterIdentifier };
      const mockResult = {
        votes: [
          {
            _id: "1",
            personalityValue: "INTJ",
            commentId: null,
          },
        ],
        pagination: { page: 1, limit: 10, total: 1 },
      };

      VoteValidator.validateVoteQuery.mockResolvedValue(validatedOptions);
      mockVoteRepository.getVoteHistory.mockResolvedValue(mockResult);

      const result = await voteService.getVoteHistory(voterIdentifier, options);
      expect(result.votes[0].comment).toBeNull();
    });
  });

  describe("getTopVotedComments", () => {
    it("should get top voted comments successfully", async () => {
      const personalitySystem = "mbti";
      const limit = 5;
      const mockComments = [
        { commentId: "comment1", voteCount: 10, personalityValue: "INTJ" },
        { commentId: "comment2", voteCount: 8, personalityValue: "ENFP" },
      ];

      VoteValidator.validateVoteQuery.mockResolvedValue({ personalitySystem });
      mockVoteRepository.getTopVotedComments.mockResolvedValue(mockComments);

      const result = await voteService.getTopVotedComments(
        personalitySystem,
        limit
      );
      expect(VoteValidator.validateVoteQuery).toHaveBeenCalledWith({
        personalitySystem,
      });
      expect(mockVoteRepository.getTopVotedComments).toHaveBeenCalledWith(
        personalitySystem,
        limit
      );
      expect(result).toEqual({
        comments: mockComments,
        personalitySystem,
        limit,
        lastUpdated: expect.any(String),
      });
    });

    it("should work without personality system filter", async () => {
      const limit = 10;
      const mockComments = [];

      mockVoteRepository.getTopVotedComments.mockResolvedValue(mockComments);

      const result = await voteService.getTopVotedComments(null, limit);
      expect(VoteValidator.validateVoteQuery).not.toHaveBeenCalled();
      expect(mockVoteRepository.getTopVotedComments).toHaveBeenCalledWith(
        null,
        limit
      );
      expect(result.personalitySystem).toBeNull();
    });
  });

  describe("getPersonalitySystemStats", () => {
    it("should get personality system stats successfully", async () => {
      const commentId = "507f1f77bcf86cd799439011";
      const mockStats = {
        mbti: { totalVotes: 25, uniqueVoters: 20 },
        enneagram: { totalVotes: 15, uniqueVoters: 12 },
      };

      VoteValidator.validateCommentId.mockResolvedValue(commentId);
      mockVoteRepository.getPersonalitySystemStats.mockResolvedValue(mockStats);

      const result = await voteService.getPersonalitySystemStats(commentId);
      expect(VoteValidator.validateCommentId).toHaveBeenCalledWith(commentId);
      expect(mockVoteRepository.getPersonalitySystemStats).toHaveBeenCalledWith(
        commentId
      );
      expect(result).toEqual({
        commentId,
        personalityStats: mockStats,
        lastUpdated: expect.any(String),
      });
    });

    it("should work without comment ID", async () => {
      const mockStats = { mbti: { totalVotes: 100 } };

      mockVoteRepository.getPersonalitySystemStats.mockResolvedValue(mockStats);

      const result = await voteService.getPersonalitySystemStats();
      expect(VoteValidator.validateCommentId).not.toHaveBeenCalled();
      expect(mockVoteRepository.getPersonalitySystemStats).toHaveBeenCalledWith(
        null
      );
      expect(result.commentId).toBeNull();
    });
  });

  describe("getVoteCount", () => {
    it("should get vote count with filters", async () => {
      const commentId = "507f1f77bcf86cd799439011";
      const personalitySystem = "mbti";
      const count = 25;

      VoteValidator.validateCommentId.mockResolvedValue(commentId);
      VoteValidator.validateVoteQuery.mockResolvedValue({ personalitySystem });
      mockVoteRepository.getCount.mockResolvedValue(count);

      const result = await voteService.getVoteCount(
        commentId,
        personalitySystem
      );
      expect(VoteValidator.validateCommentId).toHaveBeenCalledWith(commentId);
      expect(VoteValidator.validateVoteQuery).toHaveBeenCalledWith({
        personalitySystem,
      });
      expect(mockVoteRepository.getCount).toHaveBeenCalledWith(
        commentId,
        personalitySystem
      );
      expect(result).toEqual({
        count,
        commentId,
        personalitySystem,
      });
    });

    it("should get total vote count without filters", async () => {
      const count = 100;

      mockVoteRepository.getCount.mockResolvedValue(count);

      const result = await voteService.getVoteCount();
      expect(VoteValidator.validateCommentId).not.toHaveBeenCalled();
      expect(VoteValidator.validateVoteQuery).not.toHaveBeenCalled();
      expect(mockVoteRepository.getCount).toHaveBeenCalledWith(null, null);
      expect(result).toEqual({
        count,
        commentId: null,
        personalitySystem: null,
      });
    });
  });

  describe("getValidPersonalityValues", () => {
    it("should return valid personality values", () => {
      const validValues = {
        mbti: ["INTJ", "ENFP", "ISTP"],
        enneagram: ["Type 1", "Type 5", "Type 7"],
      };

      VoteValidator.getValidPersonalityValues = jest
        .fn()
        .mockReturnValue(validValues);

      const result = voteService.getValidPersonalityValues();
      expect(VoteValidator.getValidPersonalityValues).toHaveBeenCalled();
      expect(result).toEqual(validValues);
    });
  });

  describe("Error handling and edge cases", () => {
    it("should handle service errors correctly", async () => {
      const serviceError = new Error("Unknown service error");
      VoteValidator.validateCommentId.mockResolvedValue("comment1");
      VoteValidator.validateVoteSubmission.mockResolvedValue({});
      mockCommentService.commentExists.mockRejectedValue(serviceError);

      await expect(voteService.submitVote("comment1", {})).rejects.toThrow(
        "Service error submitting vote: Unknown service error"
      );
    });

    it("should maintain proper error types", async () => {
      const notFoundError = mockFactories.notFoundError("Comment not found");
      VoteValidator.validateCommentId.mockResolvedValue("comment1");
      VoteValidator.validateVoteSubmission.mockResolvedValue({});
      mockCommentService.commentExists.mockRejectedValue(notFoundError);

      await expect(voteService.submitVote("comment1", {})).rejects.toEqual(
        notFoundError
      );
    });
  });
});
