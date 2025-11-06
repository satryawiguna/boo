const VoteRepository = require("../../../repositories/VoteRepository");
const {
  mockFactories,
  createMockMongooseModel,
} = require("../../helpers/testHelpers");

jest.mock("../../../models/Vote", () => {
  const mockVote = jest.fn().mockImplementation(function (data = {}) {
    const instance = {
      ...data,
      _id: data._id || "507f1f77bcf86cd799439013",
      save: jest.fn().mockResolvedValue({
        ...data,
        _id: data._id || "507f1f77bcf86cd799439013",
      }),
    };
    return instance;
  });

  mockVote.findById = jest.fn();
  mockVote.find = jest.fn();
  mockVote.findOneAndUpdate = jest.fn();
  mockVote.findOneAndDelete = jest.fn();
  mockVote.findByIdAndDelete = jest.fn();
  mockVote.countDocuments = jest.fn();
  mockVote.aggregate = jest.fn();

  mockVote.findUserVote = jest.fn();
  mockVote.findByCommentId = jest.fn();
  mockVote.getVoteStatsByComment = jest.fn();

  return mockVote;
});

jest.mock("mongoose", () => ({
  Types: {
    ObjectId: function (id) {
      return id || "507f1f77bcf86cd799439011";
    },
  },
}));

const Vote = require("../../../models/Vote");
const mongoose = require("mongoose");

describe("VoteRepository", () => {
  let voteRepository;
  let mockVote;

  beforeEach(() => {
    jest.clearAllMocks();

    voteRepository = new VoteRepository();
  });

  describe("create", () => {
    const voteData = {
      commentId: "507f1f77bcf86cd799439011",
      profileId: 1,
      personalitySystem: "mbti",
      personalityValue: "INTJ",
      voterIdentifier: "voter123",
    };

    it("should create vote successfully", async () => {
      const savedVote = {
        _id: "507f1f77bcf86cd799439013",
        ...voteData,
      };

      const mockVoteInstance = {
        save: jest.fn().mockResolvedValue(savedVote),
      };

      Vote.mockReturnValue(mockVoteInstance);

      const result = await voteRepository.create(voteData);

      expect(Vote).toHaveBeenCalledWith(voteData);
      expect(mockVoteInstance.save).toHaveBeenCalled();
      expect(result).toEqual(mockVoteInstance);
    });

    it("should handle validation errors", async () => {
      const validationError = new Error("Validation failed");
      validationError.name = "ValidationError";

      const mockVoteInstance = {
        save: jest.fn().mockRejectedValue(validationError),
      };

      Vote.mockReturnValue(mockVoteInstance);

      await expect(voteRepository.create(voteData)).rejects.toEqual(
        validationError
      );
    });

    it("should handle duplicate vote error", async () => {
      const duplicateError = new Error("Duplicate key");
      duplicateError.code = 11000;

      const mockVoteInstance = {
        save: jest.fn().mockRejectedValue(duplicateError),
      };

      Vote.mockReturnValue(mockVoteInstance);

      await expect(voteRepository.create(voteData)).rejects.toEqual(
        expect.objectContaining({
          name: "DuplicateVoteError",
          message:
            "You have already voted on this comment for this personality system",
        })
      );
    });

    it("should handle database errors", async () => {
      const databaseError = new Error("Database connection failed");

      const mockVoteInstance = {
        save: jest.fn().mockRejectedValue(databaseError),
      };

      Vote.mockReturnValue(mockVoteInstance);

      await expect(voteRepository.create(voteData)).rejects.toThrow(
        "Repository error creating vote: Database connection failed"
      );
    });
  });

  describe("findById", () => {
    const voteId = "507f1f77bcf86cd799439013";

    it("should find vote by ID successfully", async () => {
      const mockVoteDoc = mockFactories.vote({ _id: voteId });
      Vote.findById.mockResolvedValue(mockVoteDoc);

      const result = await voteRepository.findById(voteId);

      expect(Vote.findById).toHaveBeenCalledWith(voteId);
      expect(result).toEqual(mockVoteDoc);
    });

    it("should return null when vote not found", async () => {
      Vote.findById.mockResolvedValue(null);

      const result = await voteRepository.findById(voteId);

      expect(result).toBeNull();
    });

    it("should handle database errors", async () => {
      const databaseError = new Error("Database connection failed");
      Vote.findById.mockRejectedValue(databaseError);

      await expect(voteRepository.findById(voteId)).rejects.toThrow(
        "Repository error finding vote by ID: Database connection failed"
      );
    });
  });

  describe("findUserVote", () => {
    const commentId = "507f1f77bcf86cd799439011";
    const voterIdentifier = "voter123";
    const personalitySystem = "mbti";

    it("should find user vote successfully", async () => {
      const mockVoteDoc = mockFactories.vote({
        commentId,
        voterIdentifier,
        personalitySystem,
      });

      Vote.findUserVote.mockResolvedValue(mockVoteDoc);

      const result = await voteRepository.findUserVote(
        commentId,
        voterIdentifier,
        personalitySystem
      );

      expect(Vote.findUserVote).toHaveBeenCalledWith(
        commentId,
        voterIdentifier,
        personalitySystem
      );
      expect(result).toEqual(mockVoteDoc);
    });

    it("should return null when user vote not found", async () => {
      Vote.findUserVote.mockResolvedValue(null);

      const result = await voteRepository.findUserVote(
        commentId,
        voterIdentifier,
        personalitySystem
      );

      expect(result).toBeNull();
    });

    it("should handle database errors", async () => {
      const databaseError = new Error("Database connection failed");
      Vote.findUserVote.mockRejectedValue(databaseError);

      await expect(
        voteRepository.findUserVote(
          commentId,
          voterIdentifier,
          personalitySystem
        )
      ).rejects.toThrow(
        "Repository error finding user vote: Database connection failed"
      );
    });
  });

  describe("findByCommentId", () => {
    const commentId = "507f1f77bcf86cd799439011";
    const options = { personalitySystem: "mbti" };

    it("should find votes by comment ID successfully", async () => {
      const mockVotes = [
        mockFactories.vote({ commentId, personalityValue: "INTJ" }),
        mockFactories.vote({ commentId, personalityValue: "ENFP" }),
      ];

      Vote.findByCommentId.mockResolvedValue(mockVotes);

      const result = await voteRepository.findByCommentId(commentId, options);

      expect(Vote.findByCommentId).toHaveBeenCalledWith(commentId, options);
      expect(result).toEqual(mockVotes);
    });

    it("should handle database errors", async () => {
      const databaseError = new Error("Database connection failed");
      Vote.findByCommentId.mockRejectedValue(databaseError);

      await expect(
        voteRepository.findByCommentId(commentId, options)
      ).rejects.toThrow(
        "Repository error finding votes by comment ID: Database connection failed"
      );
    });
  });

  describe("updateUserVote", () => {
    const commentId = "507f1f77bcf86cd799439011";
    const voterIdentifier = "voter123";
    const personalitySystem = "mbti";
    const newPersonalityValue = "ENFP";

    it("should update user vote successfully", async () => {
      const updatedVote = mockFactories.vote({
        commentId,
        voterIdentifier,
        personalitySystem,
        personalityValue: newPersonalityValue,
      });

      Vote.findOneAndUpdate.mockResolvedValue(updatedVote);

      const result = await voteRepository.updateUserVote(
        commentId,
        voterIdentifier,
        personalitySystem,
        newPersonalityValue
      );

      expect(Vote.findOneAndUpdate).toHaveBeenCalledWith(
        {
          commentId: commentId,
          voterIdentifier: voterIdentifier,
          personalitySystem: personalitySystem,
          isActive: true,
        },
        {
          personalityValue: newPersonalityValue,
          updatedAt: expect.any(Date),
        },
        {
          new: true,
          runValidators: true,
        }
      );
      expect(result).toEqual(updatedVote);
    });

    it("should return null when vote not found", async () => {
      Vote.findOneAndUpdate.mockResolvedValue(null);

      const result = await voteRepository.updateUserVote(
        commentId,
        voterIdentifier,
        personalitySystem,
        newPersonalityValue
      );

      expect(result).toBeNull();
    });

    it("should handle validation errors", async () => {
      const validationError = new Error("Validation failed");
      validationError.name = "ValidationError";
      Vote.findOneAndUpdate.mockRejectedValue(validationError);

      await expect(
        voteRepository.updateUserVote(
          commentId,
          voterIdentifier,
          personalitySystem,
          newPersonalityValue
        )
      ).rejects.toEqual(validationError);
    });

    it("should handle database errors", async () => {
      const databaseError = new Error("Database connection failed");
      Vote.findOneAndUpdate.mockRejectedValue(databaseError);

      await expect(
        voteRepository.updateUserVote(
          commentId,
          voterIdentifier,
          personalitySystem,
          newPersonalityValue
        )
      ).rejects.toThrow(
        "Repository error updating user vote: Database connection failed"
      );
    });
  });

  describe("deleteUserVote", () => {
    const commentId = "507f1f77bcf86cd799439011";
    const voterIdentifier = "voter123";
    const personalitySystem = "mbti";

    it("should delete user vote successfully (soft delete)", async () => {
      const deletedVote = mockFactories.vote({
        commentId,
        voterIdentifier,
        personalitySystem,
        isActive: false,
      });

      Vote.findOneAndUpdate.mockResolvedValue(deletedVote);

      const result = await voteRepository.deleteUserVote(
        commentId,
        voterIdentifier,
        personalitySystem
      );

      expect(Vote.findOneAndUpdate).toHaveBeenCalledWith(
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
      expect(result).toEqual(deletedVote);
    });

    it("should return null when vote not found", async () => {
      Vote.findOneAndUpdate.mockResolvedValue(null);

      const result = await voteRepository.deleteUserVote(
        commentId,
        voterIdentifier,
        personalitySystem
      );

      expect(result).toBeNull();
    });

    it("should handle database errors", async () => {
      const databaseError = new Error("Database connection failed");
      Vote.findOneAndUpdate.mockRejectedValue(databaseError);

      await expect(
        voteRepository.deleteUserVote(
          commentId,
          voterIdentifier,
          personalitySystem
        )
      ).rejects.toThrow(
        "Repository error deleting user vote: Database connection failed"
      );
    });
  });

  describe("getVoteStatsByComment", () => {
    const commentId = "507f1f77bcf86cd799439011";

    it("should get vote stats by comment successfully", async () => {
      const mockStats = [
        {
          personalitySystem: "mbti",
          votes: [
            { value: "INTJ", count: 5 },
            { value: "ENFP", count: 3 },
          ],
        },
        {
          personalitySystem: "enneagram",
          votes: [
            { value: "Type 5", count: 4 },
            { value: "Type 7", count: 2 },
          ],
        },
      ];

      Vote.getVoteStatsByComment.mockResolvedValue(mockStats);

      const result = await voteRepository.getVoteStatsByComment(commentId);

      expect(Vote.getVoteStatsByComment).toHaveBeenCalledWith(commentId);
      expect(result).toEqual({
        mbti: {
          INTJ: 5,
          ENFP: 3,
        },
        enneagram: {
          "Type 5": 4,
          "Type 7": 2,
        },
        zodiac: {},
      });
    });

    it("should handle database errors", async () => {
      const databaseError = new Error("Database connection failed");
      Vote.getVoteStatsByComment.mockRejectedValue(databaseError);

      await expect(
        voteRepository.getVoteStatsByComment(commentId)
      ).rejects.toThrow(
        "Repository error getting vote stats: Database connection failed"
      );
    });
  });

  describe("getVoteHistory", () => {
    const voterIdentifier = "voter123";
    const options = { page: 1, limit: 10, personalitySystem: "mbti" };

    beforeEach(() => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      };

      Vote.find.mockReturnValue(mockQuery);
      Vote.countDocuments.mockResolvedValue(0);
    });

    it("should get vote history successfully", async () => {
      const mockVotes = [
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
      ];

      Vote.find().lean.mockResolvedValue(mockVotes);
      Vote.countDocuments.mockResolvedValue(1);

      const result = await voteRepository.getVoteHistory(
        voterIdentifier,
        options
      );

      expect(Vote.find).toHaveBeenCalledWith({
        voterIdentifier: voterIdentifier,
        isActive: true,
        personalitySystem: "mbti",
      });
      expect(Vote.find().sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(Vote.find().skip).toHaveBeenCalledWith(0);
      expect(Vote.find().limit).toHaveBeenCalledWith(10);
      expect(Vote.find().populate).toHaveBeenCalledWith(
        "commentId",
        "content author profileId"
      );
      expect(result).toEqual({
        votes: mockVotes,
        pagination: {
          page: 1,
          limit: 10,
          totalCount: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      });
    });

    it("should handle options without personalitySystem", async () => {
      const optionsWithoutSystem = { page: 1, limit: 10 };
      Vote.find().lean.mockResolvedValue([]);

      await voteRepository.getVoteHistory(
        voterIdentifier,
        optionsWithoutSystem
      );

      expect(Vote.find).toHaveBeenCalledWith({
        voterIdentifier: voterIdentifier,
        isActive: true,
      });
    });

    it("should handle database errors", async () => {
      const databaseError = new Error("Database connection failed");
      Vote.find.mockImplementation(() => {
        throw databaseError;
      });

      await expect(
        voteRepository.getVoteHistory(voterIdentifier, options)
      ).rejects.toThrow(
        "Repository error getting vote history: Database connection failed"
      );
    });
  });

  describe("getTopVotedComments", () => {
    const personalitySystem = "mbti";
    const limit = 5;

    it("should get top voted comments successfully", async () => {
      const mockResults = [
        {
          commentId: "comment1",
          totalVotes: 10,
          personalitySystems: ["mbti"],
          comment: {
            content: "Top comment",
            title: "Top Title",
            author: "Author 1",
            profileId: 1,
            createdAt: new Date(),
          },
        },
      ];

      Vote.aggregate.mockResolvedValue(mockResults);

      const result = await voteRepository.getTopVotedComments(
        personalitySystem,
        limit
      );

      expect(Vote.aggregate).toHaveBeenCalledWith([
        { $match: { isActive: true, personalitySystem: "mbti" } },
        {
          $group: {
            _id: "$commentId",
            totalVotes: { $sum: 1 },
            personalitySystems: { $addToSet: "$personalitySystem" },
          },
        },
        { $sort: { totalVotes: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "comments",
            localField: "_id",
            foreignField: "_id",
            as: "comment",
          },
        },
        { $unwind: "$comment" },
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
      ]);
      expect(result).toEqual(mockResults);
    });

    it("should get top voted comments without personality system filter", async () => {
      const mockResults = [];
      Vote.aggregate.mockResolvedValue(mockResults);

      const result = await voteRepository.getTopVotedComments(null, limit);

      expect(Vote.aggregate).toHaveBeenCalledWith(
        expect.arrayContaining([{ $match: { isActive: true } }])
      );
    });

    it("should handle database errors", async () => {
      const databaseError = new Error("Database connection failed");
      Vote.aggregate.mockRejectedValue(databaseError);

      await expect(
        voteRepository.getTopVotedComments(personalitySystem, limit)
      ).rejects.toThrow(
        "Repository error getting top voted comments: Database connection failed"
      );
    });
  });

  describe("getPersonalitySystemStats", () => {
    it("should get personality system stats for specific comment", async () => {
      const commentId = "507f1f77bcf86cd799439011";
      const mockResults = [
        {
          personalitySystem: "mbti",
          values: [
            { value: "INTJ", count: 5 },
            { value: "ENFP", count: 3 },
          ],
          totalVotes: 8,
        },
      ];

      Vote.aggregate.mockResolvedValue(mockResults);

      const result = await voteRepository.getPersonalitySystemStats(commentId);

      expect(Vote.aggregate).toHaveBeenCalledWith([
        {
          $match: {
            isActive: true,
            commentId: new mongoose.Types.ObjectId(commentId),
          },
        },
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
      ]);
      expect(result).toEqual(mockResults);
    });

    it("should get personality system stats for all comments", async () => {
      const mockResults = [];
      Vote.aggregate.mockResolvedValue(mockResults);

      const result = await voteRepository.getPersonalitySystemStats();

      expect(Vote.aggregate).toHaveBeenCalledWith(
        expect.arrayContaining([{ $match: { isActive: true } }])
      );
    });

    it("should handle database errors", async () => {
      const databaseError = new Error("Database connection failed");
      Vote.aggregate.mockRejectedValue(databaseError);

      await expect(voteRepository.getPersonalitySystemStats()).rejects.toThrow(
        "Repository error getting personality system stats: Database connection failed"
      );
    });
  });

  describe("exists", () => {
    const voteId = "507f1f77bcf86cd799439013";

    it("should return true when vote exists", async () => {
      const mockQuery = {
        select: jest.fn().mockResolvedValue({ _id: voteId }),
      };
      Vote.findById.mockReturnValue(mockQuery);

      const result = await voteRepository.exists(voteId);

      expect(Vote.findById).toHaveBeenCalledWith(voteId);
      expect(mockQuery.select).toHaveBeenCalledWith("_id");
      expect(result).toBe(true);
    });

    it("should return false when vote does not exist", async () => {
      const mockQuery = {
        select: jest.fn().mockResolvedValue(null),
      };
      Vote.findById.mockReturnValue(mockQuery);

      const result = await voteRepository.exists(voteId);

      expect(result).toBe(false);
    });

    it("should return false on database errors", async () => {
      const databaseError = new Error("Database connection failed");
      Vote.findById.mockImplementation(() => {
        throw databaseError;
      });

      const result = await voteRepository.exists(voteId);

      expect(result).toBe(false);
    });
  });

  describe("getCount", () => {
    it("should get total count without filters", async () => {
      Vote.countDocuments.mockResolvedValue(100);

      const result = await voteRepository.getCount();

      expect(Vote.countDocuments).toHaveBeenCalledWith({ isActive: true });
      expect(result).toBe(100);
    });

    it("should get count with comment ID filter", async () => {
      const commentId = "507f1f77bcf86cd799439011";
      Vote.countDocuments.mockResolvedValue(25);

      const result = await voteRepository.getCount(commentId);

      expect(Vote.countDocuments).toHaveBeenCalledWith({
        isActive: true,
        commentId: commentId,
      });
      expect(result).toBe(25);
    });

    it("should get count with personality system filter", async () => {
      const personalitySystem = "mbti";
      Vote.countDocuments.mockResolvedValue(75);

      const result = await voteRepository.getCount(null, personalitySystem);

      expect(Vote.countDocuments).toHaveBeenCalledWith({
        isActive: true,
        personalitySystem: personalitySystem,
      });
      expect(result).toBe(75);
    });

    it("should get count with both filters", async () => {
      const commentId = "507f1f77bcf86cd799439011";
      const personalitySystem = "mbti";
      Vote.countDocuments.mockResolvedValue(15);

      const result = await voteRepository.getCount(
        commentId,
        personalitySystem
      );

      expect(Vote.countDocuments).toHaveBeenCalledWith({
        isActive: true,
        commentId: commentId,
        personalitySystem: personalitySystem,
      });
      expect(result).toBe(15);
    });

    it("should handle database errors", async () => {
      const databaseError = new Error("Database connection failed");
      Vote.countDocuments.mockRejectedValue(databaseError);

      await expect(voteRepository.getCount()).rejects.toThrow(
        "Repository error getting count: Database connection failed"
      );
    });
  });

  describe("hardDeleteById", () => {
    const voteId = "507f1f77bcf86cd799439013";

    it("should hard delete vote successfully", async () => {
      const deletedVote = mockFactories.vote({ _id: voteId });
      Vote.findByIdAndDelete.mockResolvedValue(deletedVote);

      const result = await voteRepository.hardDeleteById(voteId);

      expect(Vote.findByIdAndDelete).toHaveBeenCalledWith(voteId);
      expect(result).toEqual(deletedVote);
    });

    it("should return null when vote not found", async () => {
      Vote.findByIdAndDelete.mockResolvedValue(null);

      const result = await voteRepository.hardDeleteById(voteId);

      expect(result).toBeNull();
    });

    it("should handle database errors", async () => {
      const databaseError = new Error("Database connection failed");
      Vote.findByIdAndDelete.mockRejectedValue(databaseError);

      await expect(voteRepository.hardDeleteById(voteId)).rejects.toThrow(
        "Repository error hard deleting vote: Database connection failed"
      );
    });
  });
});
