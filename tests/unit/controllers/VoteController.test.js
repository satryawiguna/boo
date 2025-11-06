jest.mock("../../../models/Vote", () => jest.fn());
jest.mock("../../../repositories/VoteRepository", () => jest.fn());
jest.mock("../../../services/VoteService");

const VoteController = require("../../../controllers/VoteController");
const VoteService = require("../../../services/VoteService");
const {
  mockFactories,
  createMockService,
  testHelpers,
} = require("../../helpers/testHelpers");

describe("VoteController", () => {
  let voteController;
  let mockVoteService;
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    jest.clearAllMocks();

    mockVoteService = createMockService("VoteService");
    VoteService.mockImplementation(() => mockVoteService);

    voteController = new VoteController();

    mockReq = testHelpers.createMockReq();
    mockRes = testHelpers.createMockRes();
    mockNext = testHelpers.createMockNext();
  });

  describe("submitVote", () => {
    const commentId = "507f1f77bcf86cd799439011";
    const voteData = {
      personalitySystem: "mbti",
      personalityValue: "INTJ",
      profileId: 1,
    };

    it("should submit a new vote successfully", async () => {
      const expectedResult = {
        vote: mockFactories.vote({ commentId, ...voteData }),
        isUpdate: false,
        message: "Vote submitted successfully",
      };
      mockReq.params.commentId = commentId;
      mockReq.body = voteData;
      mockReq.headers["x-forwarded-for"] = "192.168.1.1";
      mockVoteService.submitVote.mockResolvedValue(expectedResult);

      await voteController.submitVote(mockReq, mockRes, mockNext);

      expect(mockVoteService.submitVote).toHaveBeenCalledWith(commentId, {
        ...voteData,
        voterIdentifier: expect.any(String), // The exact format depends on implementation details
        profileId: 1,
      });
      testHelpers.expectCreatedResponse(mockRes);
      expect(mockRes.json).toHaveBeenCalledWith(expectedResult);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should update an existing vote successfully", async () => {
      const expectedResult = {
        vote: mockFactories.vote({ commentId, ...voteData }),
        isUpdate: true,
        message: "Vote updated successfully",
      };
      mockReq.params.commentId = commentId;
      mockReq.body = voteData;
      mockVoteService.submitVote.mockResolvedValue(expectedResult);

      await voteController.submitVote(mockReq, mockRes, mockNext);

      testHelpers.expectSuccessResponse(mockRes);
      expect(mockRes.json).toHaveBeenCalledWith(expectedResult);
    });

    it("should use default profile ID when not provided", async () => {
      const voteDataWithoutProfile = {
        personalitySystem: "mbti",
        personalityValue: "ENFP",
      };
      const expectedResult = { vote: mockFactories.vote(), isUpdate: false };
      mockReq.params.commentId = commentId;
      mockReq.body = voteDataWithoutProfile;
      mockVoteService.submitVote.mockResolvedValue(expectedResult);

      await voteController.submitVote(mockReq, mockRes, mockNext);

      expect(mockVoteService.submitVote).toHaveBeenCalledWith(commentId, {
        ...voteDataWithoutProfile,
        voterIdentifier: expect.any(String),
        profileId: 1, // Default profile ID
      });
    });

    it("should handle validation errors", async () => {
      const validationError =
        mockFactories.validationError("Invalid vote data");
      mockReq.params.commentId = commentId;
      mockReq.body = { invalidField: "test" };
      mockVoteService.submitVote.mockRejectedValue(validationError);

      await voteController.submitVote(mockReq, mockRes, mockNext);

      testHelpers.expectValidationError(mockRes, "Invalid vote data");
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle comment not found error", async () => {
      const notFoundError = mockFactories.notFoundError("Comment not found");
      mockReq.params.commentId = "invalid-comment-id";
      mockReq.body = voteData;
      mockVoteService.submitVote.mockRejectedValue(notFoundError);

      await voteController.submitVote(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Comment not found",
        message: "Comment not found",
      });
    });

    it("should handle duplicate vote error", async () => {
      const duplicateVoteError = mockFactories.duplicateVoteError(
        "Vote already exists"
      );
      mockReq.params.commentId = commentId;
      mockReq.body = voteData;
      mockVoteService.submitVote.mockRejectedValue(duplicateVoteError);

      await voteController.submitVote(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Duplicate Vote",
        message: "Vote already exists",
      });
    });

    it("should handle unexpected errors", async () => {
      const unexpectedError = new Error("Database connection failed");
      mockReq.params.commentId = commentId;
      mockReq.body = voteData;
      mockVoteService.submitVote.mockRejectedValue(unexpectedError);

      await voteController.submitVote(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(unexpectedError);
    });
  });

  describe("removeVote", () => {
    const commentId = "507f1f77bcf86cd799439011";
    const personalitySystem = "mbti";

    it("should remove vote successfully", async () => {
      const removedVote = mockFactories.vote({ commentId, personalitySystem });
      mockReq.params = { commentId, personalitySystem };
      mockVoteService.removeVote.mockResolvedValue(removedVote);

      await voteController.removeVote(mockReq, mockRes, mockNext);

      expect(mockVoteService.removeVote).toHaveBeenCalledWith(
        commentId,
        expect.any(String), // voterIdentifier
        personalitySystem
      );
      testHelpers.expectSuccessResponse(mockRes);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "Vote removed successfully",
        vote: removedVote,
      });
    });

    it("should handle vote not found during removal", async () => {
      mockReq.params = { commentId, personalitySystem };
      mockVoteService.removeVote.mockResolvedValue(null);

      await voteController.removeVote(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Vote not found",
        message:
          "No vote found for the specified comment and personality system",
      });
    });

    it("should handle validation errors during removal", async () => {
      const validationError =
        mockFactories.validationError("Invalid parameters");
      mockReq.params = { commentId: "invalid", personalitySystem };
      mockVoteService.removeVote.mockRejectedValue(validationError);

      await voteController.removeVote(mockReq, mockRes, mockNext);

      testHelpers.expectValidationError(mockRes);
    });
  });

  describe("getUserVote", () => {
    const commentId = "507f1f77bcf86cd799439011";
    const personalitySystem = "enneagram";

    it("should get user vote successfully", async () => {
      const userVote = mockFactories.vote({ commentId, personalitySystem });
      mockReq.params = { commentId, personalitySystem };
      mockVoteService.getUserVote.mockResolvedValue(userVote);

      await voteController.getUserVote(mockReq, mockRes, mockNext);

      expect(mockVoteService.getUserVote).toHaveBeenCalledWith(
        commentId,
        expect.any(String),
        personalitySystem
      );
      testHelpers.expectSuccessResponse(mockRes);
      expect(mockRes.json).toHaveBeenCalledWith(userVote);
    });

    it("should handle user vote not found", async () => {
      mockReq.params = { commentId, personalitySystem };
      mockVoteService.getUserVote.mockResolvedValue(null);

      await voteController.getUserVote(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Vote not found",
        message:
          "No vote found for the specified comment and personality system",
      });
    });

    it("should handle validation errors", async () => {
      const validationError =
        mockFactories.validationError("Invalid comment ID");
      mockReq.params = { commentId: "invalid", personalitySystem };
      mockVoteService.getUserVote.mockRejectedValue(validationError);

      await voteController.getUserVote(mockReq, mockRes, mockNext);

      testHelpers.expectValidationError(mockRes);
    });
  });

  describe("getCommentVotes", () => {
    const commentId = "507f1f77bcf86cd799439011";

    it("should get comment votes successfully", async () => {
      const expectedResult = {
        votes: [mockFactories.vote({ commentId })],
        total: 1,
        page: 1,
        limit: 10,
      };
      mockReq.params.commentId = commentId;
      mockReq.query = { page: "1", limit: "10" };
      mockVoteService.getCommentVotes.mockResolvedValue(expectedResult);

      await voteController.getCommentVotes(mockReq, mockRes, mockNext);

      expect(mockVoteService.getCommentVotes).toHaveBeenCalledWith(
        commentId,
        mockReq.query
      );
      testHelpers.expectSuccessResponse(mockRes);
      expect(mockRes.json).toHaveBeenCalledWith(expectedResult);
    });

    it("should handle validation errors", async () => {
      const validationError = mockFactories.validationError(
        "Invalid query parameters"
      );
      mockReq.params.commentId = commentId;
      mockReq.query = { page: "invalid" };
      mockVoteService.getCommentVotes.mockRejectedValue(validationError);

      await voteController.getCommentVotes(mockReq, mockRes, mockNext);

      testHelpers.expectValidationError(mockRes);
    });
  });

  describe("getCommentVoteStats", () => {
    const commentId = "507f1f77bcf86cd799439011";

    it("should get comment vote stats successfully", async () => {
      const expectedStats = {
        commentId,
        totalVotes: 25,
        personalitySystemStats: {
          mbti: { totalVotes: 15, distribution: { INTJ: 5, ENFP: 10 } },
          enneagram: {
            totalVotes: 10,
            distribution: { "Type 5": 6, "Type 7": 4 },
          },
        },
      };
      mockReq.params.commentId = commentId;
      mockVoteService.getCommentVoteStats.mockResolvedValue(expectedStats);

      await voteController.getCommentVoteStats(mockReq, mockRes, mockNext);

      expect(mockVoteService.getCommentVoteStats).toHaveBeenCalledWith(
        commentId
      );
      testHelpers.expectSuccessResponse(mockRes);
      expect(mockRes.json).toHaveBeenCalledWith(expectedStats);
    });

    it("should handle validation errors", async () => {
      const validationError =
        mockFactories.validationError("Invalid comment ID");
      mockReq.params.commentId = "invalid";
      mockVoteService.getCommentVoteStats.mockRejectedValue(validationError);

      await voteController.getCommentVoteStats(mockReq, mockRes, mockNext);

      testHelpers.expectValidationError(mockRes);
    });

    it("should handle comment not found error", async () => {
      const notFoundError = mockFactories.notFoundError("Comment not found");
      mockReq.params.commentId = "nonexistent";
      mockVoteService.getCommentVoteStats.mockRejectedValue(notFoundError);

      await voteController.getCommentVoteStats(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Comment not found",
        message: "Comment not found",
      });
    });
  });

  describe("getVoteHistory", () => {
    it("should get vote history successfully", async () => {
      const expectedResult = {
        votes: [
          mockFactories.vote({ personalitySystem: "mbti" }),
          mockFactories.vote({ personalitySystem: "enneagram" }),
        ],
        total: 2,
        page: 1,
        limit: 10,
      };
      mockReq.query = { page: "1", limit: "10" };
      mockVoteService.getVoteHistory.mockResolvedValue(expectedResult);

      await voteController.getVoteHistory(mockReq, mockRes, mockNext);

      expect(mockVoteService.getVoteHistory).toHaveBeenCalledWith(
        expect.any(String), // voterIdentifier
        mockReq.query
      );
      testHelpers.expectSuccessResponse(mockRes);
      expect(mockRes.json).toHaveBeenCalledWith(expectedResult);
    });

    it("should handle validation errors", async () => {
      const validationError = mockFactories.validationError(
        "Invalid query parameters"
      );
      mockReq.query = { limit: "invalid" };
      mockVoteService.getVoteHistory.mockRejectedValue(validationError);

      await voteController.getVoteHistory(mockReq, mockRes, mockNext);

      testHelpers.expectValidationError(mockRes);
    });
  });

  describe("getTopVotedComments", () => {
    it("should get top voted comments successfully", async () => {
      const expectedResult = {
        comments: [
          { commentId: "1", voteCount: 25, personalityValue: "INTJ" },
          { commentId: "2", voteCount: 20, personalityValue: "ENFP" },
        ],
        personalitySystem: "mbti",
        limit: 10,
      };
      mockReq.query = { personalitySystem: "mbti", limit: "10" };
      mockVoteService.getTopVotedComments.mockResolvedValue(expectedResult);

      await voteController.getTopVotedComments(mockReq, mockRes, mockNext);

      expect(mockVoteService.getTopVotedComments).toHaveBeenCalledWith(
        "mbti",
        10
      );
      testHelpers.expectSuccessResponse(mockRes);
      expect(mockRes.json).toHaveBeenCalledWith(expectedResult);
    });

    it("should use default limit when not provided", async () => {
      const expectedResult = { comments: [], limit: 10 };
      mockReq.query = { personalitySystem: "enneagram" };
      mockVoteService.getTopVotedComments.mockResolvedValue(expectedResult);

      await voteController.getTopVotedComments(mockReq, mockRes, mockNext);

      expect(mockVoteService.getTopVotedComments).toHaveBeenCalledWith(
        "enneagram",
        10
      );
    });

    it("should handle validation errors", async () => {
      const validationError = mockFactories.validationError(
        "Invalid personality system"
      );
      mockReq.query = { personalitySystem: "invalid" };
      mockVoteService.getTopVotedComments.mockRejectedValue(validationError);

      await voteController.getTopVotedComments(mockReq, mockRes, mockNext);

      testHelpers.expectValidationError(mockRes);
    });
  });

  describe("getPersonalitySystemStats", () => {
    it("should get personality system stats successfully", async () => {
      const expectedStats = {
        mbti: { totalVotes: 150, uniqueVoters: 50 },
        enneagram: { totalVotes: 120, uniqueVoters: 45 },
        bigFive: { totalVotes: 80, uniqueVoters: 35 },
      };
      mockReq.query = {};
      mockVoteService.getPersonalitySystemStats.mockResolvedValue(
        expectedStats
      );

      await voteController.getPersonalitySystemStats(
        mockReq,
        mockRes,
        mockNext
      );

      expect(mockVoteService.getPersonalitySystemStats).toHaveBeenCalledWith(
        null
      );
      testHelpers.expectSuccessResponse(mockRes);
      expect(mockRes.json).toHaveBeenCalledWith(expectedStats);
    });

    it("should get stats for specific comment when commentId provided", async () => {
      const commentId = "507f1f77bcf86cd799439011";
      const expectedStats = { mbti: { totalVotes: 5, uniqueVoters: 5 } };
      mockReq.query = { commentId };
      mockVoteService.getPersonalitySystemStats.mockResolvedValue(
        expectedStats
      );

      await voteController.getPersonalitySystemStats(
        mockReq,
        mockRes,
        mockNext
      );

      expect(mockVoteService.getPersonalitySystemStats).toHaveBeenCalledWith(
        commentId
      );
      testHelpers.expectSuccessResponse(mockRes);
    });

    it("should handle validation errors", async () => {
      const validationError =
        mockFactories.validationError("Invalid comment ID");
      mockReq.query = { commentId: "invalid" };
      mockVoteService.getPersonalitySystemStats.mockRejectedValue(
        validationError
      );

      await voteController.getPersonalitySystemStats(
        mockReq,
        mockRes,
        mockNext
      );

      testHelpers.expectValidationError(mockRes);
    });
  });

  describe("getVoteCount", () => {
    it("should get vote count successfully", async () => {
      const expectedResult = { count: 250 };
      mockReq.query = {};
      mockVoteService.getVoteCount.mockResolvedValue(expectedResult);

      await voteController.getVoteCount(mockReq, mockRes, mockNext);

      expect(mockVoteService.getVoteCount).toHaveBeenCalledWith(null, null);
      testHelpers.expectSuccessResponse(mockRes);
      expect(mockRes.json).toHaveBeenCalledWith(expectedResult);
    });

    it("should get vote count with filters", async () => {
      const commentId = "507f1f77bcf86cd799439011";
      const personalitySystem = "mbti";
      const expectedResult = { count: 15, commentId, personalitySystem };
      mockReq.query = { commentId, personalitySystem };
      mockVoteService.getVoteCount.mockResolvedValue(expectedResult);

      await voteController.getVoteCount(mockReq, mockRes, mockNext);

      expect(mockVoteService.getVoteCount).toHaveBeenCalledWith(
        commentId,
        personalitySystem
      );
      testHelpers.expectSuccessResponse(mockRes);
    });

    it("should handle validation errors", async () => {
      const validationError =
        mockFactories.validationError("Invalid parameters");
      mockReq.query = { commentId: "invalid" };
      mockVoteService.getVoteCount.mockRejectedValue(validationError);

      await voteController.getVoteCount(mockReq, mockRes, mockNext);

      testHelpers.expectValidationError(mockRes);
    });
  });

  describe("getValidPersonalityValues", () => {
    it("should get valid personality values successfully", async () => {
      const validValues = {
        mbti: ["INTJ", "ENFP", "ISTP", "ESFJ"],
        enneagram: ["Type 1", "Type 2", "Type 3"],
        bigFive: ["openness", "conscientiousness"],
      };
      mockVoteService.getValidPersonalityValues.mockReturnValue(validValues);

      await voteController.getValidPersonalityValues(
        mockReq,
        mockRes,
        mockNext
      );

      expect(mockVoteService.getValidPersonalityValues).toHaveBeenCalled();
      testHelpers.expectSuccessResponse(mockRes);
      expect(mockRes.json).toHaveBeenCalledWith({
        personalityValues: validValues,
        description: "Valid personality values for each system",
        lastUpdated: expect.any(String),
      });
    });

    it("should handle errors in getting valid values", async () => {
      const error = new Error("Service unavailable");
      mockVoteService.getValidPersonalityValues.mockImplementation(() => {
        throw error;
      });

      await voteController.getValidPersonalityValues(
        mockReq,
        mockRes,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("submitBulkVotes", () => {
    const bulkVotes = [
      {
        commentId: "507f1f77bcf86cd799439011",
        personalitySystem: "mbti",
        personalityValue: "INTJ",
        profileId: 1,
      },
      {
        commentId: "507f1f77bcf86cd799439012",
        personalitySystem: "enneagram",
        personalityValue: "Type 5",
        profileId: 1,
      },
    ];

    it("should submit bulk votes successfully", async () => {
      mockReq.body = { votes: bulkVotes };
      mockVoteService.submitVote
        .mockResolvedValueOnce({ vote: mockFactories.vote(), isUpdate: false })
        .mockResolvedValueOnce({ vote: mockFactories.vote(), isUpdate: false });

      await voteController.submitBulkVotes(mockReq, mockRes, mockNext);

      expect(mockVoteService.submitVote).toHaveBeenCalledTimes(2);
      testHelpers.expectSuccessResponse(mockRes);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "Bulk vote submission completed",
        results: expect.arrayContaining([
          expect.objectContaining({ index: 0, success: true }),
          expect.objectContaining({ index: 1, success: true }),
        ]),
        errors: [],
        summary: {
          total: 2,
          successful: 2,
          failed: 0,
        },
      });
    });

    it("should handle validation error for non-array votes", async () => {
      mockReq.body = { votes: "not-an-array" };

      await voteController.submitBulkVotes(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Validation Error",
        message: "Votes must be an array",
      });
    });

    it("should handle mixed success and failure in bulk submission", async () => {
      mockReq.body = { votes: bulkVotes };
      mockVoteService.submitVote
        .mockResolvedValueOnce({ vote: mockFactories.vote(), isUpdate: false })
        .mockRejectedValueOnce(new Error("Invalid vote data"));

      await voteController.submitBulkVotes(mockReq, mockRes, mockNext);

      testHelpers.expectSuccessResponse(mockRes);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "Bulk vote submission completed",
        results: [expect.objectContaining({ index: 0, success: true })],
        errors: [
          expect.objectContaining({ index: 1, error: "Invalid vote data" }),
        ],
        summary: {
          total: 2,
          successful: 1,
          failed: 1,
        },
      });
    });

    it("should handle unexpected errors in bulk submission", async () => {
      // Arrange - Create a scenario where the outer try-catch triggers
      const unexpectedError = new Error("System error");
      mockReq.body = null; // This will cause an error when accessing mockReq.body.votes

      await voteController.submitBulkVotes(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("healthCheck", () => {
    it("should return healthy status", async () => {
      const mockStats = { count: 500 };
      mockVoteService.getVoteCount.mockResolvedValue(mockStats);

      await voteController.healthCheck(mockReq, mockRes);

      testHelpers.expectSuccessResponse(mockRes);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "healthy",
        service: "votes",
        timestamp: expect.any(String),
        totalVotes: 500,
      });
    });

    it("should return unhealthy status on service error", async () => {
      const error = new Error("Vote service unavailable");
      mockVoteService.getVoteCount.mockRejectedValue(error);

      await voteController.healthCheck(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(503);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "unhealthy",
        service: "votes",
        timestamp: expect.any(String),
        error: "Vote service unavailable",
      });
    });
  });

  describe("_getVoterIdentifier", () => {
    it("should create identifier from IP and user agent", () => {
      mockReq.headers["x-forwarded-for"] = "192.168.1.100";
      mockReq.headers["user-agent"] =
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";

      const identifier = voteController._getVoterIdentifier(mockReq);

      expect(identifier).toContain("1921681100");
      expect(identifier).toContain("Mozilla");
      expect(identifier).toMatch(/^[a-zA-Z0-9_-]+$/); // Only allowed characters
    });

    it("should handle missing user agent", () => {
      mockReq.headers["x-forwarded-for"] = "192.168.1.100";
      delete mockReq.headers["user-agent"];

      const identifier = voteController._getVoterIdentifier(mockReq);

      expect(identifier).toContain("1921681100");
      expect(identifier).toMatch(/^[a-zA-Z0-9_-]+$/);
    });

    it("should clean special characters from identifier", () => {
      mockReq.headers["x-forwarded-for"] = "192.168.1.100, 10.0.0.1";
      mockReq.headers["user-agent"] = "Test/Agent (Special; Characters)";

      const identifier = voteController._getVoterIdentifier(mockReq);

      expect(identifier).toMatch(/^[a-zA-Z0-9_-]+$/); // Only allowed characters
    });

    it("should use connection remote address when no x-forwarded-for", () => {
      delete mockReq.headers["x-forwarded-for"];
      mockReq.connection.remoteAddress = "127.0.0.1";
      mockReq.headers["user-agent"] = "TestAgent";

      const identifier = voteController._getVoterIdentifier(mockReq);

      expect(identifier).toContain("127001");
      expect(identifier).toContain("TestAgent");
      expect(identifier).toMatch(/^[a-zA-Z0-9_-]+$/);
    });

    it("should handle anonymous when no IP available", () => {
      delete mockReq.headers["x-forwarded-for"];
      delete mockReq.connection.remoteAddress;
      mockReq.headers["user-agent"] = "TestAgent";

      const identifier = voteController._getVoterIdentifier(mockReq);

      expect(identifier).toContain("anonymous");
      expect(identifier).toContain("TestAgent");
      expect(identifier).toMatch(/^[a-zA-Z0-9_-]+$/);
    });
  });
});
