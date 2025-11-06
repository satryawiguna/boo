jest.mock("../../../models/Comment", () => jest.fn());
jest.mock("../../../repositories/CommentRepository", () => jest.fn());
jest.mock("../../../services/CommentService");

const CommentController = require("../../../controllers/CommentController");
const CommentService = require("../../../services/CommentService");
const {
  mockFactories,
  createMockService,
  testHelpers,
} = require("../../helpers/testHelpers");

describe("CommentController", () => {
  let commentController;
  let mockCommentService;
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    jest.clearAllMocks();

    mockCommentService = createMockService("CommentService");
    CommentService.mockImplementation(() => mockCommentService);

    commentController = new CommentController();

    mockReq = testHelpers.createMockReq();
    mockRes = testHelpers.createMockRes();
    mockNext = testHelpers.createMockNext();
  });

  describe("createComment", () => {
    const mockCommentData = {
      profileId: 1,
      text: "Test comment",
      categories: ["personality"],
    };

    it("should create a comment successfully", async () => {
      const expectedResult = mockFactories.comment(mockCommentData);
      mockReq.body = mockCommentData;
      mockCommentService.createComment.mockResolvedValue(expectedResult);

      await commentController.createComment(mockReq, mockRes, mockNext);

      expect(mockCommentService.createComment).toHaveBeenCalledWith(
        mockCommentData
      );
      testHelpers.expectCreatedResponse(mockRes);
      expect(mockRes.json).toHaveBeenCalledWith(expectedResult);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle validation errors", async () => {
      const validationError = mockFactories.validationError(
        "Invalid comment data"
      );
      mockReq.body = { invalidField: "test" };
      mockCommentService.createComment.mockRejectedValue(validationError);

      await commentController.createComment(mockReq, mockRes, mockNext);

      testHelpers.expectValidationError(mockRes, "Invalid comment data");
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle unexpected errors by calling next", async () => {
      const unexpectedError = new Error("Database connection failed");
      mockReq.body = mockCommentData;
      mockCommentService.createComment.mockRejectedValue(unexpectedError);

      await commentController.createComment(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(unexpectedError);
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe("getCommentById", () => {
    const commentId = "507f1f77bcf86cd799439011";

    it("should get comment by ID successfully", async () => {
      const expectedComment = mockFactories.comment({ _id: commentId });
      mockReq.params.id = commentId;
      mockCommentService.getCommentById.mockResolvedValue(expectedComment);

      await commentController.getCommentById(mockReq, mockRes, mockNext);

      expect(mockCommentService.getCommentById).toHaveBeenCalledWith(commentId);
      testHelpers.expectSuccessResponse(mockRes);
      expect(mockRes.json).toHaveBeenCalledWith(expectedComment);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle comment not found", async () => {
      mockReq.params.id = commentId;
      mockCommentService.getCommentById.mockResolvedValue(null);

      await commentController.getCommentById(mockReq, mockRes, mockNext);

      testHelpers.expectNotFoundError(
        mockRes,
        `Comment with ID ${commentId} does not exist`
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle validation errors", async () => {
      const validationError =
        mockFactories.validationError("Invalid comment ID");
      mockReq.params.id = "invalid-id";
      mockCommentService.getCommentById.mockRejectedValue(validationError);

      await commentController.getCommentById(mockReq, mockRes, mockNext);

      testHelpers.expectValidationError(mockRes, "Invalid comment ID");
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle unexpected errors", async () => {
      const unexpectedError = new Error("Database error");
      mockReq.params.id = commentId;
      mockCommentService.getCommentById.mockRejectedValue(unexpectedError);

      await commentController.getCommentById(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(unexpectedError);
    });
  });

  describe("getCommentsByProfileId", () => {
    const profileId = "1";

    it("should get comments by profile ID successfully", async () => {
      const expectedComments = {
        comments: [mockFactories.comment({ profileId: 1 })],
        total: 1,
        page: 1,
        limit: 10,
      };
      mockReq.params.profileId = profileId;
      mockReq.query = { page: "1", limit: "10" };
      mockCommentService.getCommentsByProfileId.mockResolvedValue(
        expectedComments
      );

      await commentController.getCommentsByProfileId(
        mockReq,
        mockRes,
        mockNext
      );

      expect(mockCommentService.getCommentsByProfileId).toHaveBeenCalledWith(
        profileId,
        mockReq.query
      );
      testHelpers.expectSuccessResponse(mockRes);
      expect(mockRes.json).toHaveBeenCalledWith(expectedComments);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle validation errors", async () => {
      const validationError =
        mockFactories.validationError("Invalid profile ID");
      mockReq.params.profileId = "invalid";
      mockCommentService.getCommentsByProfileId.mockRejectedValue(
        validationError
      );

      await commentController.getCommentsByProfileId(
        mockReq,
        mockRes,
        mockNext
      );

      testHelpers.expectValidationError(mockRes);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("getAllComments", () => {
    it("should get all comments successfully", async () => {
      const expectedResult = {
        comments: [mockFactories.comment()],
        total: 1,
        page: 1,
        limit: 10,
      };
      mockReq.query = { page: "1", limit: "10" };
      mockCommentService.getAllComments.mockResolvedValue(expectedResult);

      await commentController.getAllComments(mockReq, mockRes, mockNext);

      expect(mockCommentService.getAllComments).toHaveBeenCalledWith(
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
      mockCommentService.getAllComments.mockRejectedValue(validationError);

      await commentController.getAllComments(mockReq, mockRes, mockNext);

      testHelpers.expectValidationError(mockRes);
    });
  });

  describe("updateComment", () => {
    const commentId = "507f1f77bcf86cd799439011";
    const updateData = { text: "Updated comment text" };

    it("should update comment successfully", async () => {
      const updatedComment = mockFactories.comment({
        _id: commentId,
        ...updateData,
      });
      mockReq.params.id = commentId;
      mockReq.body = updateData;
      mockCommentService.updateComment.mockResolvedValue(updatedComment);

      await commentController.updateComment(mockReq, mockRes, mockNext);

      expect(mockCommentService.updateComment).toHaveBeenCalledWith(
        commentId,
        updateData
      );
      testHelpers.expectSuccessResponse(mockRes);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "Comment updated successfully",
        comment: updatedComment,
      });
    });

    it("should handle comment not found during update", async () => {
      mockReq.params.id = commentId;
      mockReq.body = updateData;
      mockCommentService.updateComment.mockResolvedValue(null);

      await commentController.updateComment(mockReq, mockRes, mockNext);

      testHelpers.expectNotFoundError(
        mockRes,
        `Comment with ID ${commentId} does not exist`
      );
    });

    it("should handle validation errors during update", async () => {
      const validationError = mockFactories.validationError(
        "Invalid update data"
      );
      mockReq.params.id = commentId;
      mockReq.body = { invalidField: "test" };
      mockCommentService.updateComment.mockRejectedValue(validationError);

      await commentController.updateComment(mockReq, mockRes, mockNext);

      testHelpers.expectValidationError(mockRes);
    });
  });

  describe("deleteComment", () => {
    const commentId = "507f1f77bcf86cd799439011";

    it("should delete comment successfully", async () => {
      const deletedComment = mockFactories.comment({ _id: commentId });
      mockReq.params.id = commentId;
      mockCommentService.deleteComment.mockResolvedValue(deletedComment);

      await commentController.deleteComment(mockReq, mockRes, mockNext);

      expect(mockCommentService.deleteComment).toHaveBeenCalledWith(commentId);
      testHelpers.expectSuccessResponse(mockRes);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "Comment deleted successfully",
        comment: deletedComment,
      });
    });

    it("should handle comment not found during deletion", async () => {
      mockReq.params.id = commentId;
      mockCommentService.deleteComment.mockResolvedValue(null);

      await commentController.deleteComment(mockReq, mockRes, mockNext);

      testHelpers.expectNotFoundError(
        mockRes,
        `Comment with ID ${commentId} does not exist`
      );
    });

    it("should handle validation errors during deletion", async () => {
      const validationError =
        mockFactories.validationError("Invalid comment ID");
      mockReq.params.id = "invalid";
      mockCommentService.deleteComment.mockRejectedValue(validationError);

      await commentController.deleteComment(mockReq, mockRes, mockNext);

      testHelpers.expectValidationError(mockRes);
    });
  });

  describe("getCommentStats", () => {
    it("should get comment stats successfully", async () => {
      const expectedStats = {
        totalComments: 100,
        averageLength: 150,
        topCategories: ["personality", "psychology"],
      };
      mockCommentService.getCommentStats.mockResolvedValue(expectedStats);

      await commentController.getCommentStats(mockReq, mockRes, mockNext);

      expect(mockCommentService.getCommentStats).toHaveBeenCalled();
      testHelpers.expectSuccessResponse(mockRes);
      expect(mockRes.json).toHaveBeenCalledWith(expectedStats);
    });

    it("should handle errors in stats retrieval", async () => {
      const error = new Error("Stats calculation failed");
      mockCommentService.getCommentStats.mockRejectedValue(error);

      await commentController.getCommentStats(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("getCommentCount", () => {
    it("should get comment count successfully with profile ID in query", async () => {
      const profileId = "1";
      const expectedResult = { count: 25, profileId };
      mockReq.query.profileId = profileId;
      mockCommentService.getCommentCount.mockResolvedValue(expectedResult);

      await commentController.getCommentCount(mockReq, mockRes, mockNext);

      expect(mockCommentService.getCommentCount).toHaveBeenCalledWith(
        profileId
      );
      testHelpers.expectSuccessResponse(mockRes);
      expect(mockRes.json).toHaveBeenCalledWith(expectedResult);
    });

    it("should get comment count successfully with profile ID in params", async () => {
      const profileId = "1";
      const expectedResult = { count: 25, profileId };
      mockReq.params.profileId = profileId;
      mockCommentService.getCommentCount.mockResolvedValue(expectedResult);

      await commentController.getCommentCount(mockReq, mockRes, mockNext);

      expect(mockCommentService.getCommentCount).toHaveBeenCalledWith(
        profileId
      );
      testHelpers.expectSuccessResponse(mockRes);
    });

    it("should get comment count successfully without profile ID", async () => {
      const expectedResult = { count: 100 };
      mockCommentService.getCommentCount.mockResolvedValue(expectedResult);

      await commentController.getCommentCount(mockReq, mockRes, mockNext);

      expect(mockCommentService.getCommentCount).toHaveBeenCalledWith(null);
      testHelpers.expectSuccessResponse(mockRes);
    });

    it("should handle validation errors", async () => {
      const validationError =
        mockFactories.validationError("Invalid profile ID");
      mockReq.query.profileId = "invalid";
      mockCommentService.getCommentCount.mockRejectedValue(validationError);

      await commentController.getCommentCount(mockReq, mockRes, mockNext);

      testHelpers.expectValidationError(mockRes);
    });
  });

  describe("healthCheck", () => {
    it("should return healthy status", async () => {
      const mockStats = { count: 100 };
      mockCommentService.getCommentCount.mockResolvedValue(mockStats);

      await commentController.healthCheck(mockReq, mockRes);

      testHelpers.expectSuccessResponse(mockRes);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "healthy",
        service: "comments",
        timestamp: expect.any(String),
        totalComments: 100,
      });
    });

    it("should return unhealthy status on service error", async () => {
      const error = new Error("Service unavailable");
      mockCommentService.getCommentCount.mockRejectedValue(error);

      await commentController.healthCheck(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(503);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "unhealthy",
        service: "comments",
        timestamp: expect.any(String),
        error: "Service unavailable",
      });
    });
  });

  describe("_getVoterIdentifier", () => {
    it("should extract IP from x-forwarded-for header", () => {
      mockReq.headers["x-forwarded-for"] = "192.168.1.100, 10.0.0.1";

      const identifier = commentController._getVoterIdentifier(mockReq);

      expect(identifier).toBe("192.168.1.100");
    });

    it("should use connection remote address when no x-forwarded-for", () => {
      delete mockReq.headers["x-forwarded-for"];
      mockReq.connection.remoteAddress = "127.0.0.1";

      const identifier = commentController._getVoterIdentifier(mockReq);

      expect(identifier).toBe("127.0.0.1");
    });

    it("should return anonymous when no IP available", () => {
      delete mockReq.headers["x-forwarded-for"];
      delete mockReq.connection.remoteAddress;

      const identifier = commentController._getVoterIdentifier(mockReq);

      expect(identifier).toBe("anonymous");
    });
  });
});
