const mongoose = require("mongoose");
const Comment = require("../../../models/Comment");
const { mockFactories } = require("../../helpers/testUnitHelpers");

jest.mock("mongoose", () => {
  const originalMongoose = jest.requireActual("mongoose");
  return {
    ...originalMongoose,
    connect: jest.fn(),
    connection: {
      readyState: 1,
    },
  };
});

describe("Comment Model", () => {
  let validCommentData;

  beforeEach(() => {
    validCommentData = {
      content: "This is a test comment",
      title: "Test Comment",
      author: "Test Author",
      profileId: 1,
      isVisible: true,
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Schema Validation", () => {
    describe("Required Fields", () => {
      it("should be valid with all required fields", async () => {
        const comment = new Comment(validCommentData);
        const validationError = comment.validateSync();

        expect(validationError).toBeUndefined();
      });

      it("should require content field", async () => {
        const comment = new Comment({
          ...validCommentData,
          content: undefined,
        });
        const validationError = comment.validateSync();

        expect(validationError).toBeDefined();
        expect(validationError.errors.content).toBeDefined();
        expect(validationError.errors.content.message).toContain("required");
      });

      it("should require author field", async () => {
        const comment = new Comment({
          ...validCommentData,
          author: undefined,
        });
        const validationError = comment.validateSync();

        expect(validationError).toBeDefined();
        expect(validationError.errors.author).toBeDefined();
        expect(validationError.errors.author.message).toContain("required");
      });

      it("should require profileId field", async () => {
        const comment = new Comment({
          ...validCommentData,
          profileId: undefined,
        });
        const validationError = comment.validateSync();

        expect(validationError).toBeDefined();
        expect(validationError.errors.profileId).toBeDefined();
        expect(validationError.errors.profileId.message).toContain("required");
      });
    });

    describe("Optional Fields", () => {
      it("should allow title to be undefined", async () => {
        const comment = new Comment({
          ...validCommentData,
          title: undefined,
        });
        const validationError = comment.validateSync();

        expect(validationError).toBeUndefined();
      });

      it("should set default value for isVisible", async () => {
        const comment = new Comment({
          ...validCommentData,
          isVisible: undefined,
        });

        expect(comment.isVisible).toBe(true);
      });

      it("should set default values for voteStats", async () => {
        const comment = new Comment(validCommentData);

        expect(comment.voteStats.mbti).toBeInstanceOf(Map);
        expect(comment.voteStats.enneagram).toBeInstanceOf(Map);
        expect(comment.voteStats.zodiac).toBeInstanceOf(Map);
      });

      it("should set default value for totalVotes", async () => {
        const comment = new Comment(validCommentData);

        expect(comment.totalVotes).toBe(0);
      });
    });

    describe("Field Length Validation", () => {
      it("should enforce minimum length for content", async () => {
        const comment = new Comment({
          ...validCommentData,
          content: "",
        });
        const validationError = comment.validateSync();

        expect(validationError).toBeDefined();
        expect(validationError.errors.content).toBeDefined();
      });

      it("should enforce maximum length for content", async () => {
        const comment = new Comment({
          ...validCommentData,
          content: "a".repeat(1001),
        });
        const validationError = comment.validateSync();

        expect(validationError).toBeDefined();
        expect(validationError.errors.content).toBeDefined();
      });

      it("should allow valid content length", async () => {
        const comment = new Comment({
          ...validCommentData,
          content: "a".repeat(500),
        });
        const validationError = comment.validateSync();

        expect(validationError).toBeUndefined();
      });

      it("should enforce maximum length for title", async () => {
        const comment = new Comment({
          ...validCommentData,
          title: "a".repeat(201),
        });
        const validationError = comment.validateSync();

        expect(validationError).toBeDefined();
        expect(validationError.errors.title).toBeDefined();
      });

      it("should enforce minimum length for author", async () => {
        const comment = new Comment({
          ...validCommentData,
          author: "",
        });
        const validationError = comment.validateSync();

        expect(validationError).toBeDefined();
        expect(validationError.errors.author).toBeDefined();
      });

      it("should enforce maximum length for author", async () => {
        const comment = new Comment({
          ...validCommentData,
          author: "a".repeat(101),
        });
        const validationError = comment.validateSync();

        expect(validationError).toBeDefined();
        expect(validationError.errors.author).toBeDefined();
      });
    });

    describe("Data Types", () => {
      it("should accept valid profileId as number", async () => {
        const comment = new Comment({
          ...validCommentData,
          profileId: 123,
        });
        const validationError = comment.validateSync();

        expect(validationError).toBeUndefined();
        expect(comment.profileId).toBe(123);
      });

      it("should accept valid isVisible as boolean", async () => {
        const comment = new Comment({
          ...validCommentData,
          isVisible: false,
        });
        const validationError = comment.validateSync();

        expect(validationError).toBeUndefined();
        expect(comment.isVisible).toBe(false);
      });
    });

    describe("Field Trimming", () => {
      it("should trim content field", async () => {
        const comment = new Comment({
          ...validCommentData,
          content: "  test content  ",
        });

        expect(comment.content).toBe("test content");
      });

      it("should trim title field", async () => {
        const comment = new Comment({
          ...validCommentData,
          title: "  test title  ",
        });

        expect(comment.title).toBe("test title");
      });

      it("should trim author field", async () => {
        const comment = new Comment({
          ...validCommentData,
          author: "  test author  ",
        });

        expect(comment.author).toBe("test author");
      });
    });
  });

  describe("Instance Methods", () => {
    let comment;

    beforeEach(() => {
      comment = new Comment(validCommentData);
      // Set up some initial vote stats
      comment.voteStats.mbti.set("INTJ", 5);
      comment.voteStats.enneagram.set("5w4", 3);
      comment.totalVotes = 8;
    });

    describe("toPublicJSON", () => {
      it("should return properly formatted public JSON", () => {
        const publicJSON = comment.toPublicJSON();

        expect(publicJSON).toHaveProperty("id");
        expect(publicJSON).toHaveProperty("content", validCommentData.content);
        expect(publicJSON).toHaveProperty("title", validCommentData.title);
        expect(publicJSON).toHaveProperty("author", validCommentData.author);
        expect(publicJSON).toHaveProperty(
          "profileId",
          validCommentData.profileId
        );
        expect(publicJSON).toHaveProperty("totalVotes", 8);
        expect(publicJSON).toHaveProperty("voteStats");
        expect(publicJSON).toHaveProperty("createdAt");
        expect(publicJSON).toHaveProperty("updatedAt");
      });

      it("should convert Map objects to plain objects in voteStats", () => {
        const publicJSON = comment.toPublicJSON();

        expect(publicJSON.voteStats.mbti).toEqual({ INTJ: 5 });
        expect(publicJSON.voteStats.enneagram).toEqual({ "5w4": 3 });
        expect(publicJSON.voteStats.zodiac).toEqual({});
      });

      it("should handle empty vote stats", () => {
        const emptyComment = new Comment(validCommentData);
        const publicJSON = emptyComment.toPublicJSON();

        expect(publicJSON.voteStats.mbti).toEqual({});
        expect(publicJSON.voteStats.enneagram).toEqual({});
        expect(publicJSON.voteStats.zodiac).toEqual({});
      });
    });

    describe("incrementVoteCount", () => {
      it("should increment vote count for existing personality value", () => {
        comment.incrementVoteCount("mbti", "INTJ");

        expect(comment.voteStats.mbti.get("INTJ")).toBe(6);
        expect(comment.totalVotes).toBe(9);
      });

      it("should initialize vote count for new personality value", () => {
        comment.incrementVoteCount("mbti", "ENFP");

        expect(comment.voteStats.mbti.get("ENFP")).toBe(1);
        expect(comment.totalVotes).toBe(9);
      });

      it("should initialize personality system if it does not exist", () => {
        comment.voteStats.zodiac = undefined;
        comment.incrementVoteCount("zodiac", "Aries");

        expect(comment.voteStats.zodiac).toBeInstanceOf(Map);
        expect(comment.voteStats.zodiac.get("Aries")).toBe(1);
        expect(comment.totalVotes).toBe(9);
      });

      it("should handle zero initial totalVotes", () => {
        comment.totalVotes = 0;
        comment.incrementVoteCount("mbti", "INTJ");

        expect(comment.totalVotes).toBe(1);
      });

      it("should handle undefined initial totalVotes", () => {
        comment.totalVotes = undefined;
        comment.incrementVoteCount("mbti", "INTJ");

        expect(comment.totalVotes).toBe(1);
      });
    });

    describe("decrementVoteCount", () => {
      it("should decrement vote count for existing personality value", () => {
        comment.decrementVoteCount("mbti", "INTJ");

        expect(comment.voteStats.mbti.get("INTJ")).toBe(4);
        expect(comment.totalVotes).toBe(7);
      });

      it("should not decrement below zero", () => {
        comment.voteStats.mbti.set("ENFP", 0);
        comment.decrementVoteCount("mbti", "ENFP");

        expect(comment.voteStats.mbti.get("ENFP")).toBe(0);
        expect(comment.totalVotes).toBe(8);
      });

      it("should handle non-existent personality value", () => {
        comment.decrementVoteCount("mbti", "NONEXISTENT");

        expect(comment.totalVotes).toBe(8);
      });

      it("should handle non-existent personality system", () => {
        comment.voteStats.nonexistent = undefined;
        comment.decrementVoteCount("nonexistent", "value");

        expect(comment.totalVotes).toBe(8);
      });

      it("should not allow totalVotes to go below zero", () => {
        comment.totalVotes = 1;
        comment.voteStats.mbti.set("INTJ", 5);
        comment.decrementVoteCount("mbti", "INTJ");

        expect(comment.totalVotes).toBe(0);
      });

      it("should handle undefined initial totalVotes", () => {
        comment.totalVotes = undefined;
        comment.decrementVoteCount("mbti", "INTJ");

        expect(comment.totalVotes).toBe(0);
      });
    });
  });

  describe("Static Methods", () => {
    const mockQuery = {
      find: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      countDocuments: jest.fn(),
    };

    beforeEach(() => {
      Comment.findByProfileId = jest.fn();
      Comment.countByProfileId = jest.fn();
      Comment.find = jest.fn().mockReturnValue(mockQuery);
      Comment.countDocuments = jest.fn();
    });

    describe("findByProfileId", () => {
      it("should be a function", () => {
        expect(typeof Comment.findByProfileId).toBe("function");
      });

      it("should be called with correct parameters", () => {
        const profileId = 123;
        const options = { sort: { createdAt: -1 }, limit: 10 };

        Comment.findByProfileId(profileId, options);

        expect(Comment.findByProfileId).toHaveBeenCalledWith(
          profileId,
          options
        );
      });

      it("should be called with profileId only", () => {
        const profileId = 456;

        Comment.findByProfileId(profileId);

        expect(Comment.findByProfileId).toHaveBeenCalledWith(profileId);
      });

      it("should handle different option combinations", () => {
        const profileId = 789;
        const options = {
          sort: { author: 1 },
          limit: 5,
          skip: 10,
        };

        Comment.findByProfileId(profileId, options);

        expect(Comment.findByProfileId).toHaveBeenCalledWith(
          profileId,
          options
        );
      });

      it("should handle empty options object", () => {
        const profileId = 123;

        Comment.findByProfileId(profileId, {});

        expect(Comment.findByProfileId).toHaveBeenCalledWith(profileId, {});
      });
    });

    describe("countByProfileId", () => {
      it("should be a function", () => {
        expect(typeof Comment.countByProfileId).toBe("function");
      });

      it("should be called with correct parameters", () => {
        const profileId = 456;

        Comment.countByProfileId(profileId);

        expect(Comment.countByProfileId).toHaveBeenCalledWith(profileId);
      });

      it("should return the mocked result", async () => {
        const profileId = 456;
        const expectedCount = 15;
        Comment.countByProfileId.mockResolvedValue(expectedCount);

        const result = await Comment.countByProfileId(profileId);

        expect(result).toBe(expectedCount);
      });
    });
  });

  describe("Schema Configuration", () => {
    it("should have timestamps enabled", () => {
      const comment = new Comment(validCommentData);

      expect(comment).toHaveProperty("createdAt");
      expect(comment).toHaveProperty("updatedAt");
    });

    describe("toJSON Transform", () => {
      it("should have toJSON method", () => {
        const comment = new Comment(validCommentData);

        expect(typeof comment.toJSON).toBe("function");
      });

      it("should have schema with toJSON transform configured", () => {
        expect(Comment.schema.options.toJSON).toBeDefined();
        expect(Comment.schema.options.toJSON.transform).toBeDefined();
        expect(typeof Comment.schema.options.toJSON.transform).toBe("function");
      });

      it("should have virtual id enabled in toJSON", () => {
        expect(Comment.schema.options.toJSON.virtuals).toBe(true);
      });
    });
  });

  describe("Model Integration", () => {
    it("should create a valid Comment instance", () => {
      const comment = new Comment(validCommentData);

      expect(comment).toBeInstanceOf(Comment);
      expect(comment.content).toBe(validCommentData.content);
      expect(comment.author).toBe(validCommentData.author);
      expect(comment.profileId).toBe(validCommentData.profileId);
    });

    it("should handle all field types correctly", () => {
      const fullCommentData = {
        ...validCommentData,
        title: "Full Test Title",
        isVisible: false,
        totalVotes: 25,
      };

      const comment = new Comment(fullCommentData);

      expect(comment.content).toBe(fullCommentData.content);
      expect(comment.title).toBe(fullCommentData.title);
      expect(comment.author).toBe(fullCommentData.author);
      expect(comment.profileId).toBe(fullCommentData.profileId);
      expect(comment.isVisible).toBe(false);
      expect(comment.totalVotes).toBe(25);
    });

    it("should validate complex vote stats operations", () => {
      const comment = new Comment(validCommentData);

      comment.incrementVoteCount("mbti", "INTJ");
      comment.incrementVoteCount("mbti", "ENFP");
      comment.incrementVoteCount("enneagram", "5w4");
      comment.incrementVoteCount("zodiac", "Scorpio");

      expect(comment.totalVotes).toBe(4);
      expect(comment.voteStats.mbti.get("INTJ")).toBe(1);
      expect(comment.voteStats.mbti.get("ENFP")).toBe(1);
      expect(comment.voteStats.enneagram.get("5w4")).toBe(1);
      expect(comment.voteStats.zodiac.get("Scorpio")).toBe(1);

      comment.decrementVoteCount("mbti", "INTJ");
      expect(comment.totalVotes).toBe(3);
      expect(comment.voteStats.mbti.get("INTJ")).toBe(0);
    });
  });
});
