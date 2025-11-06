jest.mock("../../../repositories/CommentRepository");
jest.mock("../../../validators/CommentValidator");

const CommentService = require("../../../services/CommentService");
const CommentRepository = require("../../../repositories/CommentRepository");
const { CommentValidator } = require("../../../validators/CommentValidator");
const {
  mockFactories,
  createMockRepository,
  createMockModel,
} = require("../../helpers/testHelpers");

describe("CommentService", () => {
  let commentService;
  let mockCommentRepository;

  beforeEach(() => {
    jest.clearAllMocks();

    mockCommentRepository = createMockRepository("CommentRepository");
    CommentRepository.mockImplementation(() => mockCommentRepository);

    commentService = new CommentService();
  });

  describe("createComment", () => {
    const validCommentData = {
      profileId: 1,
      text: "Test comment",
      categories: ["personality"],
    };

    it("should create a comment successfully", async () => {
      const validatedData = { ...validCommentData, validated: true };
      const mockComment = createMockModel({
        _id: "507f1f77bcf86cd799439011",
        ...validatedData,
      });

      CommentValidator.validateCreate.mockResolvedValue(validatedData);
      mockCommentRepository.create.mockResolvedValue(mockComment);
      mockComment.toPublicJSON.mockReturnValue({
        id: "507f1f77bcf86cd799439011",
        ...validatedData,
      });

      const result = await commentService.createComment(validCommentData);

      expect(CommentValidator.validateCreate).toHaveBeenCalledWith(
        validCommentData
      );
      expect(mockCommentRepository.create).toHaveBeenCalledWith(validatedData);
      expect(result).toEqual({
        success: true,
        message: "Comment created successfully",
        comment: {
          id: "507f1f77bcf86cd799439011",
          ...validatedData,
        },
      });
    });

    it("should handle validation errors", async () => {
      const validationError = mockFactories.validationError(
        "Invalid comment data"
      );
      CommentValidator.validateCreate.mockRejectedValue(validationError);

      await expect(
        commentService.createComment(validCommentData)
      ).rejects.toEqual(validationError);

      expect(mockCommentRepository.create).not.toHaveBeenCalled();
    });

    it("should handle repository errors", async () => {
      const validatedData = { ...validCommentData, validated: true };
      const repositoryError = new Error("Database error");

      CommentValidator.validateCreate.mockResolvedValue(validatedData);
      mockCommentRepository.create.mockRejectedValue(repositoryError);

      await expect(
        commentService.createComment(validCommentData)
      ).rejects.toThrow("Service error creating comment: Database error");

      expect(CommentValidator.validateCreate).toHaveBeenCalledWith(
        validCommentData
      );
      expect(mockCommentRepository.create).toHaveBeenCalledWith(validatedData);
    });
  });

  describe("getCommentById", () => {
    const commentId = "507f1f77bcf86cd799439011";

    it("should get comment by ID successfully", async () => {
      const mockComment = createMockModel({
        _id: commentId,
        text: "Test comment",
      });
      const publicJSON = { id: commentId, text: "Test comment" };

      CommentValidator.validateCommentId.mockResolvedValue(commentId);
      mockCommentRepository.findById.mockResolvedValue(mockComment);
      mockComment.toPublicJSON.mockReturnValue(publicJSON);

      const result = await commentService.getCommentById(commentId);

      expect(CommentValidator.validateCommentId).toHaveBeenCalledWith(
        commentId
      );
      expect(mockCommentRepository.findById).toHaveBeenCalledWith(commentId);
      expect(result).toEqual(publicJSON);
    });

    it("should return null when comment not found", async () => {
      CommentValidator.validateCommentId.mockResolvedValue(commentId);
      mockCommentRepository.findById.mockResolvedValue(null);

      const result = await commentService.getCommentById(commentId);

      expect(result).toBeNull();
    });

    it("should handle validation errors", async () => {
      const validationError =
        mockFactories.validationError("Invalid comment ID");
      CommentValidator.validateCommentId.mockRejectedValue(validationError);

      await expect(commentService.getCommentById("invalid")).rejects.toEqual(
        validationError
      );

      expect(mockCommentRepository.findById).not.toHaveBeenCalled();
    });

    it("should handle repository errors", async () => {
      const repositoryError = new Error("Database connection failed");
      CommentValidator.validateCommentId.mockResolvedValue(commentId);
      mockCommentRepository.findById.mockRejectedValue(repositoryError);

      await expect(commentService.getCommentById(commentId)).rejects.toThrow(
        "Service error getting comment by ID: Database connection failed"
      );
    });
  });

  describe("getCommentsByProfileId", () => {
    const profileId = "1";
    const options = { page: 1, limit: 10 };

    it("should get comments by profile ID successfully", async () => {
      const mockComments = [
        createMockModel({ _id: "1", text: "Comment 1" }),
        createMockModel({ _id: "2", text: "Comment 2" }),
      ];
      const repositoryResult = {
        comments: mockComments,
        pagination: { page: 1, limit: 10, total: 2 },
      };
      const validatedOptions = {
        ...options,
        profileId: "1",
        sort: "-createdAt",
      };

      CommentValidator.validateProfileId.mockResolvedValue(profileId);
      CommentValidator.validateCommentQuery.mockResolvedValue(validatedOptions);
      mockCommentRepository.findByProfileId.mockResolvedValue(repositoryResult);

      mockComments.forEach((comment, index) => {
        comment.toPublicJSON.mockReturnValue({
          id: `${index + 1}`,
          text: `Comment ${index + 1}`,
        });
      });

      const result = await commentService.getCommentsByProfileId(
        profileId,
        options
      );

      expect(CommentValidator.validateProfileId).toHaveBeenCalledWith(
        profileId
      );
      expect(CommentValidator.validateCommentQuery).toHaveBeenCalledWith({
        ...options,
        profileId: "1",
      });
      expect(mockCommentRepository.findByProfileId).toHaveBeenCalledWith(
        profileId,
        validatedOptions
      );
      expect(result).toEqual({
        comments: [
          { id: "1", text: "Comment 1" },
          { id: "2", text: "Comment 2" },
        ],
        pagination: { page: 1, limit: 10, total: 2 },
        filters: {
          profileId: "1",
          sort: "-createdAt",
          filter: undefined,
        },
      });
    });

    it("should handle comments without toPublicJSON method", async () => {
      const mockComments = [
        { _id: "1", content: "Comment 1", author: "Author 1", profileId: 1 },
      ];
      const repositoryResult = {
        comments: mockComments,
        pagination: { page: 1, limit: 10, total: 1 },
      };
      const validatedOptions = {
        ...options,
        profileId: "1",
        sort: "-createdAt",
      };

      CommentValidator.validateProfileId.mockResolvedValue(profileId);
      CommentValidator.validateCommentQuery.mockResolvedValue(validatedOptions);
      mockCommentRepository.findByProfileId.mockResolvedValue(repositoryResult);

      const result = await commentService.getCommentsByProfileId(
        profileId,
        options
      );

      expect(result.comments).toHaveLength(1);
      expect(result.comments[0]).toHaveProperty("id", "1");
      expect(result.comments[0]).toHaveProperty("content", "Comment 1");
    });

    it("should handle validation errors", async () => {
      const validationError =
        mockFactories.validationError("Invalid profile ID");
      CommentValidator.validateProfileId.mockRejectedValue(validationError);

      await expect(
        commentService.getCommentsByProfileId("invalid", options)
      ).rejects.toEqual(validationError);

      expect(mockCommentRepository.findByProfileId).not.toHaveBeenCalled();
    });
  });

  describe("getAllComments", () => {
    const options = { page: 1, limit: 10 };

    it("should get all comments successfully", async () => {
      const mockComments = [createMockModel({ _id: "1", text: "Comment 1" })];
      const repositoryResult = {
        comments: mockComments,
        pagination: { page: 1, limit: 10, total: 1 },
      };
      const validatedOptions = { ...options, sort: "-createdAt" };

      CommentValidator.validateCommentQuery.mockResolvedValue(validatedOptions);
      mockCommentRepository.findAll.mockResolvedValue(repositoryResult);
      mockComments[0].toPublicJSON.mockReturnValue({
        id: "1",
        text: "Comment 1",
      });

      const result = await commentService.getAllComments(options);

      expect(CommentValidator.validateCommentQuery).toHaveBeenCalledWith(
        options
      );
      expect(mockCommentRepository.findAll).toHaveBeenCalledWith(
        validatedOptions
      );
      expect(result).toEqual({
        comments: [{ id: "1", text: "Comment 1" }],
        pagination: { page: 1, limit: 10, total: 1 },
        filters: {
          sort: "-createdAt",
          filter: undefined,
        },
      });
    });

    it("should handle validation errors", async () => {
      const validationError = mockFactories.validationError(
        "Invalid query options"
      );
      CommentValidator.validateCommentQuery.mockRejectedValue(validationError);

      await expect(commentService.getAllComments(options)).rejects.toEqual(
        validationError
      );
    });
  });

  describe("updateComment", () => {
    const commentId = "507f1f77bcf86cd799439011";
    const updateData = { text: "Updated comment" };

    it("should update comment successfully", async () => {
      const validatedUpdateData = { ...updateData, validated: true };
      const mockComment = createMockModel({
        _id: commentId,
        ...validatedUpdateData,
      });
      const publicJSON = { id: commentId, ...validatedUpdateData };

      CommentValidator.validateCommentId.mockResolvedValue(commentId);
      CommentValidator.validateUpdate.mockResolvedValue(validatedUpdateData);
      mockCommentRepository.exists.mockResolvedValue(true);
      mockCommentRepository.updateById.mockResolvedValue(mockComment);
      mockComment.toPublicJSON.mockReturnValue(publicJSON);

      const result = await commentService.updateComment(commentId, updateData);

      expect(CommentValidator.validateCommentId).toHaveBeenCalledWith(
        commentId
      );
      expect(CommentValidator.validateUpdate).toHaveBeenCalledWith(updateData);
      expect(mockCommentRepository.exists).toHaveBeenCalledWith(commentId);
      expect(mockCommentRepository.updateById).toHaveBeenCalledWith(
        commentId,
        validatedUpdateData
      );
      expect(result).toEqual(publicJSON);
    });

    it("should return null when comment does not exist", async () => {
      CommentValidator.validateCommentId.mockResolvedValue(commentId);
      CommentValidator.validateUpdate.mockResolvedValue(updateData);
      mockCommentRepository.exists.mockResolvedValue(false);

      const result = await commentService.updateComment(commentId, updateData);

      expect(result).toBeNull();
      expect(mockCommentRepository.updateById).not.toHaveBeenCalled();
    });

    it("should return null when update returns null", async () => {
      CommentValidator.validateCommentId.mockResolvedValue(commentId);
      CommentValidator.validateUpdate.mockResolvedValue(updateData);
      mockCommentRepository.exists.mockResolvedValue(true);
      mockCommentRepository.updateById.mockResolvedValue(null);

      const result = await commentService.updateComment(commentId, updateData);

      expect(result).toBeNull();
    });

    it("should handle validation errors", async () => {
      const validationError = mockFactories.validationError(
        "Invalid update data"
      );
      CommentValidator.validateCommentId.mockResolvedValue(commentId);
      CommentValidator.validateUpdate.mockRejectedValue(validationError);

      await expect(
        commentService.updateComment(commentId, updateData)
      ).rejects.toEqual(validationError);

      expect(mockCommentRepository.exists).not.toHaveBeenCalled();
    });
  });

  describe("deleteComment", () => {
    const commentId = "507f1f77bcf86cd799439011";

    it("should delete comment successfully", async () => {
      const mockComment = createMockModel({
        _id: commentId,
        text: "Deleted comment",
      });
      const publicJSON = { id: commentId, text: "Deleted comment" };

      CommentValidator.validateCommentId.mockResolvedValue(commentId);
      mockCommentRepository.deleteById.mockResolvedValue(mockComment);
      mockComment.toPublicJSON.mockReturnValue(publicJSON);

      const result = await commentService.deleteComment(commentId);

      expect(CommentValidator.validateCommentId).toHaveBeenCalledWith(
        commentId
      );
      expect(mockCommentRepository.deleteById).toHaveBeenCalledWith(commentId);
      expect(result).toEqual(publicJSON);
    });

    it("should return null when comment not found", async () => {
      CommentValidator.validateCommentId.mockResolvedValue(commentId);
      mockCommentRepository.deleteById.mockResolvedValue(null);

      const result = await commentService.deleteComment(commentId);

      expect(result).toBeNull();
    });

    it("should handle validation errors", async () => {
      const validationError =
        mockFactories.validationError("Invalid comment ID");
      CommentValidator.validateCommentId.mockRejectedValue(validationError);

      await expect(commentService.deleteComment("invalid")).rejects.toEqual(
        validationError
      );
    });
  });

  describe("updateCommentVoteStats", () => {
    const commentId = "507f1f77bcf86cd799439011";
    const personalitySystem = "mbti";
    const personalityValue = "INTJ";

    it("should update comment vote stats successfully", async () => {
      const mockComment = createMockModel({ _id: commentId });
      const publicJSON = { id: commentId, voteStats: { mbti: { INTJ: 1 } } };

      CommentValidator.validateCommentId.mockResolvedValue(commentId);
      mockCommentRepository.updateVoteStats.mockResolvedValue(mockComment);
      mockComment.toPublicJSON.mockReturnValue(publicJSON);

      const result = await commentService.updateCommentVoteStats(
        commentId,
        personalitySystem,
        personalityValue,
        true
      );

      expect(CommentValidator.validateCommentId).toHaveBeenCalledWith(
        commentId
      );
      expect(mockCommentRepository.updateVoteStats).toHaveBeenCalledWith(
        commentId,
        personalitySystem,
        personalityValue,
        true
      );
      expect(result).toEqual(publicJSON);
    });

    it("should return null when comment not found", async () => {
      CommentValidator.validateCommentId.mockResolvedValue(commentId);
      mockCommentRepository.updateVoteStats.mockResolvedValue(null);

      const result = await commentService.updateCommentVoteStats(
        commentId,
        personalitySystem,
        personalityValue,
        false
      );

      expect(result).toBeNull();
    });

    it("should handle repository errors", async () => {
      const repositoryError = new Error("Database error");
      CommentValidator.validateCommentId.mockResolvedValue(commentId);
      mockCommentRepository.updateVoteStats.mockRejectedValue(repositoryError);

      await expect(
        commentService.updateCommentVoteStats(
          commentId,
          personalitySystem,
          personalityValue,
          true
        )
      ).rejects.toThrow(
        "Service error updating comment vote stats: Database error"
      );
    });
  });

  describe("getCommentStats", () => {
    it("should get comment stats successfully", async () => {
      const mockComments = [
        createMockModel({ _id: "1", text: "Comment 1" }),
        createMockModel({ _id: "2", text: "Comment 2" }),
      ];
      const repositoryStats = {
        totalComments: 100,
        topComments: mockComments,
      };

      mockCommentRepository.getCommentStats.mockResolvedValue(repositoryStats);
      mockComments.forEach((comment, index) => {
        comment.toPublicJSON.mockReturnValue({
          id: `${index + 1}`,
          text: `Comment ${index + 1}`,
        });
      });

      const result = await commentService.getCommentStats();

      expect(mockCommentRepository.getCommentStats).toHaveBeenCalled();
      expect(result).toEqual({
        totalComments: 100,
        topComments: [
          { id: "1", text: "Comment 1" },
          { id: "2", text: "Comment 2" },
        ],
        lastUpdated: expect.any(String),
      });
    });

    it("should handle repository errors", async () => {
      const repositoryError = new Error("Stats calculation failed");
      mockCommentRepository.getCommentStats.mockRejectedValue(repositoryError);

      await expect(commentService.getCommentStats()).rejects.toThrow(
        "Service error getting comment stats: Stats calculation failed"
      );
    });
  });

  describe("getCommentCount", () => {
    it("should get comment count without profile ID", async () => {
      mockCommentRepository.getCount.mockResolvedValue(25);

      const result = await commentService.getCommentCount();

      expect(mockCommentRepository.getCount).toHaveBeenCalledWith(null);
      expect(result).toEqual({ count: 25 });
    });

    it("should get comment count with profile ID", async () => {
      const profileId = "1";
      CommentValidator.validateProfileId.mockResolvedValue(profileId);
      mockCommentRepository.getCount.mockResolvedValue(10);

      const result = await commentService.getCommentCount(profileId);

      expect(CommentValidator.validateProfileId).toHaveBeenCalledWith(
        profileId
      );
      expect(mockCommentRepository.getCount).toHaveBeenCalledWith(profileId);
      expect(result).toEqual({ count: 10 });
    });

    it("should handle validation errors", async () => {
      const validationError =
        mockFactories.validationError("Invalid profile ID");
      CommentValidator.validateProfileId.mockRejectedValue(validationError);

      await expect(commentService.getCommentCount("invalid")).rejects.toEqual(
        validationError
      );
    });
  });

  describe("commentExists", () => {
    const commentId = "507f1f77bcf86cd799439011";

    it("should return true when comment exists", async () => {
      CommentValidator.validateCommentId.mockResolvedValue(commentId);
      mockCommentRepository.exists.mockResolvedValue(true);

      const result = await commentService.commentExists(commentId);

      expect(CommentValidator.validateCommentId).toHaveBeenCalledWith(
        commentId
      );
      expect(mockCommentRepository.exists).toHaveBeenCalledWith(commentId);
      expect(result).toBe(true);
    });

    it("should return false when comment does not exist", async () => {
      CommentValidator.validateCommentId.mockResolvedValue(commentId);
      mockCommentRepository.exists.mockResolvedValue(false);

      const result = await commentService.commentExists(commentId);

      expect(result).toBe(false);
    });

    it("should return false on validation errors", async () => {
      const validationError =
        mockFactories.validationError("Invalid comment ID");
      CommentValidator.validateCommentId.mockRejectedValue(validationError);

      const result = await commentService.commentExists("invalid");

      expect(result).toBe(false);
      expect(mockCommentRepository.exists).not.toHaveBeenCalled();
    });
  });

  describe("_formatComment", () => {
    it("should format lean comment object correctly", () => {
      const leanComment = {
        _id: "507f1f77bcf86cd799439011",
        content: "Test content",
        title: "Test title",
        author: "Test author",
        profileId: 1,
        voteStats: {
          mbti: new Map([["INTJ", 5]]),
          enneagram: { "Type 5": 3 },
        },
        totalVotes: 8,
        createdAt: new Date("2023-01-01"),
        updatedAt: new Date("2023-01-02"),
      };

      const result = commentService._formatComment(leanComment);

      expect(result).toEqual({
        id: "507f1f77bcf86cd799439011",
        content: "Test content",
        title: "Test title",
        author: "Test author",
        profileId: 1,
        voteStats: {
          mbti: { INTJ: 5 },
          enneagram: { "Type 5": 3 },
          zodiac: {},
        },
        totalVotes: 8,
        createdAt: new Date("2023-01-01"),
        updatedAt: new Date("2023-01-02"),
      });
    });

    it("should handle missing voteStats", () => {
      const leanComment = {
        _id: "507f1f77bcf86cd799439011",
        content: "Test content",
        profileId: 1,
      };

      const result = commentService._formatComment(leanComment);

      expect(result.voteStats).toEqual({
        mbti: {},
        enneagram: {},
        zodiac: {},
      });
      expect(result.totalVotes).toBe(0);
    });
  });
});
