const mockComment = jest.fn().mockImplementation(function (data = {}) {
  return {
    ...data,
    _id: data._id || "507f1f77bcf86cd799439011",
    save: jest.fn().mockResolvedValue({
      ...data,
      _id: data._id || "507f1f77bcf86cd799439011",
    }),
    incrementVoteCount: jest.fn(),
    decrementVoteCount: jest.fn(),
  };
});

mockComment.findById = jest.fn();
mockComment.find = jest.fn();
mockComment.findByIdAndUpdate = jest.fn();
mockComment.findByIdAndDelete = jest.fn();
mockComment.countDocuments = jest.fn();

jest.mock("../../../models/Comment", () => mockComment);

const CommentRepository = require("../../../repositories/CommentRepository");
const Comment = require("../../../models/Comment");
const { mockFactories } = require("../../helpers/testHelpers");

describe("CommentRepository", () => {
  let commentRepository;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Reset Comment constructor and static methods
    Comment.mockClear();
    Comment.findById.mockReset();
    Comment.find.mockReset().mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    });
    Comment.findByIdAndUpdate.mockReset();
    Comment.findByIdAndDelete.mockReset();
    Comment.countDocuments.mockReset();

    commentRepository = new CommentRepository();
  });

  describe("create", () => {
    const commentData = {
      profileId: 1,
      text: "Test comment",
      categories: ["personality"],
    };

    it("should create a comment successfully", async () => {
      const savedComment = {
        _id: "507f1f77bcf86cd799439011",
        ...commentData,
      };

      const mockCommentInstance = {
        save: jest.fn().mockResolvedValue(savedComment),
      };

      Comment.mockReturnValue(mockCommentInstance);

      const result = await commentRepository.create(commentData);

      expect(Comment).toHaveBeenCalledWith(commentData);
      expect(mockCommentInstance.save).toHaveBeenCalled();
      expect(result).toEqual(mockCommentInstance);
    });

    it("should handle validation errors", async () => {
      const validationError = new Error("Validation failed");
      validationError.name = "ValidationError";

      const mockCommentInstance = {
        save: jest.fn().mockRejectedValue(validationError),
      };

      Comment.mockReturnValue(mockCommentInstance);

      await expect(commentRepository.create(commentData)).rejects.toEqual(
        validationError
      );
    });

    it("should handle database errors", async () => {
      const databaseError = new Error("Database connection failed");

      const mockCommentInstance = {
        save: jest.fn().mockRejectedValue(databaseError),
      };

      Comment.mockReturnValue(mockCommentInstance);

      await expect(commentRepository.create(commentData)).rejects.toThrow(
        "Repository error creating comment: Database connection failed"
      );
    });
  });

  describe("findById", () => {
    const commentId = "507f1f77bcf86cd799439011";

    it("should find comment by ID successfully", async () => {
      const mockCommentDoc = mockFactories.comment({ _id: commentId });
      Comment.findById.mockResolvedValue(mockCommentDoc);

      const result = await commentRepository.findById(commentId);

      expect(Comment.findById).toHaveBeenCalledWith(commentId);
      expect(result).toEqual(mockCommentDoc);
    });

    it("should return null when comment not found", async () => {
      Comment.findById.mockResolvedValue(null);

      const result = await commentRepository.findById(commentId);

      expect(result).toBeNull();
    });

    it("should handle database errors", async () => {
      const databaseError = new Error("Database connection failed");
      Comment.findById.mockRejectedValue(databaseError);

      await expect(commentRepository.findById(commentId)).rejects.toThrow(
        "Repository error finding comment by ID: Database connection failed"
      );
    });
  });

  describe("findByProfileId", () => {
    const profileId = 1;
    const defaultOptions = {
      page: 1,
      limit: 10,
      sort: "recent",
      filter: "all",
    };

    beforeEach(() => {
      // Setup query chain mocks
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      };

      Comment.find.mockReturnValue(mockQuery);
      Comment.countDocuments.mockResolvedValue(0);
    });

    it("should find comments by profile ID with default options", async () => {
      const mockComments = [
        mockFactories.comment({ profileId, _id: "1" }),
        mockFactories.comment({ profileId, _id: "2" }),
      ];

      Comment.find().lean.mockResolvedValue(mockComments);
      Comment.countDocuments.mockResolvedValue(2);

      const result = await commentRepository.findByProfileId(profileId);

      expect(Comment.find).toHaveBeenCalledWith({
        profileId: profileId,
        isVisible: true,
      });
      expect(Comment.find().sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(Comment.find().skip).toHaveBeenCalledWith(0);
      expect(Comment.find().limit).toHaveBeenCalledWith(10);
      expect(result).toEqual({
        comments: mockComments,
        pagination: {
          page: 1,
          limit: 10,
          totalCount: 2,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      });
    });

    it("should handle custom options", async () => {
      const options = { page: 2, limit: 5, sort: "best" };
      Comment.find().lean.mockResolvedValue([]);
      Comment.countDocuments.mockResolvedValue(15);

      const result = await commentRepository.findByProfileId(
        profileId,
        options
      );

      expect(Comment.find().sort).toHaveBeenCalledWith({
        totalVotes: -1,
        createdAt: -1,
      });
      expect(Comment.find().skip).toHaveBeenCalledWith(5);
      expect(Comment.find().limit).toHaveBeenCalledWith(5);
      expect(result.pagination).toEqual({
        page: 2,
        limit: 5,
        totalCount: 15,
        totalPages: 3,
        hasNextPage: true,
        hasPrevPage: true,
      });
    });

    it("should handle oldest sort option", async () => {
      const options = { sort: "oldest" };
      Comment.find().lean.mockResolvedValue([]);

      await commentRepository.findByProfileId(profileId, options);

      expect(Comment.find().sort).toHaveBeenCalledWith({ createdAt: 1 });
    });

    it("should handle database errors", async () => {
      const databaseError = new Error("Database connection failed");
      Comment.find.mockImplementation(() => {
        throw databaseError;
      });

      await expect(
        commentRepository.findByProfileId(profileId)
      ).rejects.toThrow(
        "Repository error finding comments by profile ID: Database connection failed"
      );
    });
  });

  describe("findAll", () => {
    beforeEach(() => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      };

      Comment.find.mockReturnValue(mockQuery);
      Comment.countDocuments.mockResolvedValue(0);
    });

    it("should find all comments with default options", async () => {
      const mockComments = [
        mockFactories.comment({ _id: "1" }),
        mockFactories.comment({ _id: "2" }),
      ];

      Comment.find().lean.mockResolvedValue(mockComments);
      Comment.countDocuments.mockResolvedValue(2);

      const result = await commentRepository.findAll();

      expect(Comment.find).toHaveBeenCalledWith({ isVisible: true });
      expect(Comment.find().sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(Comment.find().populate).toHaveBeenCalledWith("profileId", "name");
      expect(result).toEqual({
        comments: mockComments,
        pagination: {
          page: 1,
          limit: 20,
          totalCount: 2,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      });
    });

    it("should handle custom options", async () => {
      const options = { page: 3, limit: 5, sort: "best" };
      Comment.find().lean.mockResolvedValue([]);
      Comment.countDocuments.mockResolvedValue(25);

      const result = await commentRepository.findAll(options);

      expect(Comment.find().sort).toHaveBeenCalledWith({
        totalVotes: -1,
        createdAt: -1,
      });
      expect(Comment.find().skip).toHaveBeenCalledWith(10);
      expect(Comment.find().limit).toHaveBeenCalledWith(5);
      expect(result.pagination.page).toBe(3);
      expect(result.pagination.totalPages).toBe(5);
    });
  });

  describe("updateById", () => {
    const commentId = "507f1f77bcf86cd799439011";
    const updateData = { text: "Updated comment text" };

    it("should update comment successfully", async () => {
      const updatedComment = mockFactories.comment({
        _id: commentId,
        ...updateData,
      });

      Comment.findByIdAndUpdate.mockResolvedValue(updatedComment);

      const result = await commentRepository.updateById(commentId, updateData);

      expect(Comment.findByIdAndUpdate).toHaveBeenCalledWith(
        commentId,
        updateData,
        { new: true, runValidators: true }
      );
      expect(result).toEqual(updatedComment);
    });

    it("should return null when comment not found", async () => {
      Comment.findByIdAndUpdate.mockResolvedValue(null);

      const result = await commentRepository.updateById(commentId, updateData);

      expect(result).toBeNull();
    });

    it("should handle validation errors", async () => {
      const validationError = new Error("Validation failed");
      validationError.name = "ValidationError";
      Comment.findByIdAndUpdate.mockRejectedValue(validationError);

      await expect(
        commentRepository.updateById(commentId, updateData)
      ).rejects.toEqual(validationError);
    });

    it("should handle database errors", async () => {
      const databaseError = new Error("Database connection failed");
      Comment.findByIdAndUpdate.mockRejectedValue(databaseError);

      await expect(
        commentRepository.updateById(commentId, updateData)
      ).rejects.toThrow(
        "Repository error updating comment: Database connection failed"
      );
    });
  });

  describe("deleteById", () => {
    const commentId = "507f1f77bcf86cd799439011";

    it("should soft delete comment successfully", async () => {
      const deletedComment = mockFactories.comment({
        _id: commentId,
        isVisible: false,
      });

      Comment.findByIdAndUpdate.mockResolvedValue(deletedComment);

      const result = await commentRepository.deleteById(commentId);

      expect(Comment.findByIdAndUpdate).toHaveBeenCalledWith(
        commentId,
        { isVisible: false },
        { new: true }
      );
      expect(result).toEqual(deletedComment);
    });

    it("should return null when comment not found", async () => {
      Comment.findByIdAndUpdate.mockResolvedValue(null);

      const result = await commentRepository.deleteById(commentId);

      expect(result).toBeNull();
    });

    it("should handle database errors", async () => {
      const databaseError = new Error("Database connection failed");
      Comment.findByIdAndUpdate.mockRejectedValue(databaseError);

      await expect(commentRepository.deleteById(commentId)).rejects.toThrow(
        "Repository error deleting comment: Database connection failed"
      );
    });
  });

  describe("hardDeleteById", () => {
    const commentId = "507f1f77bcf86cd799439011";

    it("should hard delete comment successfully", async () => {
      const deletedComment = mockFactories.comment({ _id: commentId });
      Comment.findByIdAndDelete.mockResolvedValue(deletedComment);

      const result = await commentRepository.hardDeleteById(commentId);

      expect(Comment.findByIdAndDelete).toHaveBeenCalledWith(commentId);
      expect(result).toEqual(deletedComment);
    });

    it("should return null when comment not found", async () => {
      Comment.findByIdAndDelete.mockResolvedValue(null);

      const result = await commentRepository.hardDeleteById(commentId);

      expect(result).toBeNull();
    });
  });

  describe("updateVoteStats", () => {
    const commentId = "507f1f77bcf86cd799439011";
    const personalitySystem = "mbti";
    const personalityValue = "INTJ";

    it("should increment vote stats successfully", async () => {
      const mockCommentDoc = {
        _id: commentId,
        incrementVoteCount: jest.fn(),
        save: jest.fn().mockResolvedValue(this),
      };

      Comment.findById.mockResolvedValue(mockCommentDoc);

      const result = await commentRepository.updateVoteStats(
        commentId,
        personalitySystem,
        personalityValue,
        true
      );

      expect(Comment.findById).toHaveBeenCalledWith(commentId);
      expect(mockCommentDoc.incrementVoteCount).toHaveBeenCalledWith(
        personalitySystem,
        personalityValue
      );
      expect(mockCommentDoc.save).toHaveBeenCalled();
      expect(result).toEqual(mockCommentDoc);
    });

    it("should decrement vote stats successfully", async () => {
      const mockCommentDoc = {
        _id: commentId,
        decrementVoteCount: jest.fn(),
        save: jest.fn().mockResolvedValue(this),
      };

      Comment.findById.mockResolvedValue(mockCommentDoc);

      const result = await commentRepository.updateVoteStats(
        commentId,
        personalitySystem,
        personalityValue,
        false
      );

      expect(mockCommentDoc.decrementVoteCount).toHaveBeenCalledWith(
        personalitySystem,
        personalityValue
      );
    });

    it("should return null when comment not found", async () => {
      Comment.findById.mockResolvedValue(null);

      const result = await commentRepository.updateVoteStats(
        commentId,
        personalitySystem,
        personalityValue
      );

      expect(result).toBeNull();
    });

    it("should handle database errors", async () => {
      const databaseError = new Error("Database connection failed");
      Comment.findById.mockRejectedValue(databaseError);

      await expect(
        commentRepository.updateVoteStats(
          commentId,
          personalitySystem,
          personalityValue
        )
      ).rejects.toThrow(
        "Repository error updating vote stats: Database connection failed"
      );
    });
  });

  describe("getCommentStats", () => {
    it("should get comment stats successfully", async () => {
      const mockTopComments = [
        mockFactories.comment({ _id: "1", totalVotes: 10 }),
        mockFactories.comment({ _id: "2", totalVotes: 8 }),
      ];

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockTopComments),
      };

      Comment.countDocuments.mockResolvedValue(25);
      Comment.find.mockReturnValue(mockQuery);

      const result = await commentRepository.getCommentStats();

      expect(Comment.countDocuments).toHaveBeenCalledWith({ isVisible: true });
      expect(Comment.find).toHaveBeenCalledWith({ isVisible: true });
      expect(mockQuery.sort).toHaveBeenCalledWith({
        totalVotes: -1,
        createdAt: -1,
      });
      expect(mockQuery.limit).toHaveBeenCalledWith(10);
      expect(mockQuery.populate).toHaveBeenCalledWith("profileId", "name");
      expect(result).toEqual({
        totalComments: 25,
        topComments: mockTopComments,
      });
    });

    it("should handle database errors", async () => {
      const databaseError = new Error("Database connection failed");
      Comment.countDocuments.mockRejectedValue(databaseError);

      await expect(commentRepository.getCommentStats()).rejects.toThrow(
        "Repository error getting comment stats: Database connection failed"
      );
    });
  });

  describe("exists", () => {
    const commentId = "507f1f77bcf86cd799439011";

    it("should return true when comment exists", async () => {
      const mockQuery = {
        select: jest.fn().mockResolvedValue({ _id: commentId }),
      };
      Comment.findById.mockReturnValue(mockQuery);

      const result = await commentRepository.exists(commentId);

      expect(Comment.findById).toHaveBeenCalledWith(commentId);
      expect(mockQuery.select).toHaveBeenCalledWith("_id");
      expect(result).toBe(true);
    });

    it("should return false when comment does not exist", async () => {
      const mockQuery = {
        select: jest.fn().mockResolvedValue(null),
      };
      Comment.findById.mockReturnValue(mockQuery);

      const result = await commentRepository.exists(commentId);

      expect(result).toBe(false);
    });

    it("should return false on database errors", async () => {
      const databaseError = new Error("Database connection failed");
      Comment.findById.mockImplementation(() => {
        throw databaseError;
      });

      const result = await commentRepository.exists(commentId);

      expect(result).toBe(false);
    });
  });

  describe("getCount", () => {
    it("should get total count without profile filter", async () => {
      Comment.countDocuments.mockResolvedValue(100);

      const result = await commentRepository.getCount();

      expect(Comment.countDocuments).toHaveBeenCalledWith({ isVisible: true });
      expect(result).toBe(100);
    });

    it("should get count with profile filter", async () => {
      const profileId = 1;
      Comment.countDocuments.mockResolvedValue(15);

      const result = await commentRepository.getCount(profileId);

      expect(Comment.countDocuments).toHaveBeenCalledWith({
        isVisible: true,
        profileId: profileId,
      });
      expect(result).toBe(15);
    });

    it("should handle database errors", async () => {
      const databaseError = new Error("Database connection failed");
      Comment.countDocuments.mockRejectedValue(databaseError);

      await expect(commentRepository.getCount()).rejects.toThrow(
        "Repository error getting count: Database connection failed"
      );
    });
  });
});
