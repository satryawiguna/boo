const mongoose = require("mongoose");
const Vote = require("../../../models/Vote");
const { mockFactories } = require("../../helpers/testUnitHelpers");

jest.mock("mongoose", () => {
  const originalMongoose = jest.requireActual("mongoose");

  function MockObjectId(id) {
    const objectIdString = id || "507f1f77bcf86cd799439011";

    const mockId = {
      toString: () => objectIdString,
      valueOf: () => objectIdString,
      toHexString: () => objectIdString,
      equals: (other) =>
        objectIdString === (other.toString ? other.toString() : other),
      _bsontype: "ObjectID",
    };

    Object.defineProperty(mockId, Symbol.toPrimitive, {
      value: () => objectIdString,
      configurable: false,
      enumerable: false,
    });

    return mockId;
  }

  return {
    ...originalMongoose,
    connect: jest.fn(),
    connection: {
      readyState: 1,
    },
    Types: {
      ObjectId: MockObjectId,
    },
  };
});

describe("Vote Model", () => {
  let validVoteData;

  beforeEach(() => {
    validVoteData = {
      commentId: "507f1f77bcf86cd799439011",
      profileId: 1,
      voterIdentifier: "voter_123",
      personalitySystem: "mbti",
      personalityValue: "INTJ",
      isActive: true,
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Schema Validation", () => {
    describe("Required Fields", () => {
      it("should be valid with all required fields", () => {
        const vote = new Vote(validVoteData);
        const validationError = vote.validateSync();

        expect(validationError).toBeUndefined();
      });

      const requiredFields = [
        "commentId",
        "profileId",
        "voterIdentifier",
        "personalitySystem",
        "personalityValue",
      ];

      requiredFields.forEach((field) => {
        it(`should require ${field} field`, () => {
          const vote = new Vote({
            ...validVoteData,
            [field]: undefined,
          });
          const validationError = vote.validateSync();

          expect(validationError).toBeDefined();
          expect(validationError.errors[field]).toBeDefined();
          expect(validationError.errors[field].message).toContain("required");
        });
      });
    });

    describe("Default Values", () => {
      it("should set default value for isActive", () => {
        const vote = new Vote({
          ...validVoteData,
          isActive: undefined,
        });

        expect(vote.isActive).toBe(true);
      });
    });

    describe("Personality System Validation", () => {
      const validSystems = ["mbti", "enneagram", "zodiac"];

      validSystems.forEach((system) => {
        it(`should accept valid personality system: ${system}`, () => {
          const vote = new Vote({
            ...validVoteData,
            personalitySystem: system,
          });
          const validationError = vote.validateSync();

          expect(validationError).toBeUndefined();
        });
      });

      it("should convert personality system to lowercase", () => {
        const vote = new Vote({
          ...validVoteData,
          personalitySystem: "MBTI",
        });

        expect(vote.personalitySystem).toBe("mbti");
      });

      const invalidSystems = ["invalid", "bigfive", "disc", ""];

      invalidSystems.forEach((system) => {
        it(`should reject invalid personality system: ${system}`, () => {
          const vote = new Vote({
            ...validVoteData,
            personalitySystem: system,
          });
          const validationError = vote.validateSync();

          expect(validationError).toBeDefined();
          expect(validationError.errors.personalitySystem).toBeDefined();
        });
      });
    });

    describe("Field Trimming", () => {
      it("should trim voterIdentifier field", () => {
        const vote = new Vote({
          ...validVoteData,
          voterIdentifier: "  voter_123  ",
        });

        expect(vote.voterIdentifier).toBe("voter_123");
      });

      it("should trim personalityValue field", () => {
        const vote = new Vote({
          ...validVoteData,
          personalityValue: "  INTJ  ",
        });

        expect(vote.personalityValue).toBe("INTJ");
      });
    });

    describe("Data Types", () => {
      it("should accept ObjectId for commentId", () => {
        const objectIdString = "507f1f77bcf86cd799439022";
        const vote = new Vote({
          ...validVoteData,
          commentId: objectIdString,
        });

        expect(vote.commentId.toString()).toBe(objectIdString);
      });

      it("should accept number for profileId", () => {
        const vote = new Vote({
          ...validVoteData,
          profileId: 456,
        });

        expect(vote.profileId).toBe(456);
        expect(typeof vote.profileId).toBe("number");
      });

      it("should accept boolean for isActive", () => {
        const vote = new Vote({
          ...validVoteData,
          isActive: false,
        });

        expect(vote.isActive).toBe(false);
        expect(typeof vote.isActive).toBe("boolean");
      });
    });
  });

  describe("Pre-validation Hooks", () => {
    describe("MBTI Validation", () => {
      const validMbtiValues = [
        "INTJ",
        "INTP",
        "ENTJ",
        "ENTP",
        "INFJ",
        "INFP",
        "ENFJ",
        "ENFP",
        "ISTJ",
        "ISFJ",
        "ESTJ",
        "ESFJ",
        "ISTP",
        "ISFP",
        "ESTP",
        "ESFP",
      ];

      validMbtiValues.forEach((value) => {
        it(`should accept valid MBTI value: ${value}`, async () => {
          const vote = new Vote({
            ...validVoteData,
            personalitySystem: "mbti",
            personalityValue: value,
          });

          await expect(vote.validate()).resolves.not.toThrow();
        });
      });

      const invalidMbtiValues = ["XXXX", "INT", "INVALID", "1234", ""];

      invalidMbtiValues.forEach((value) => {
        it(`should reject invalid MBTI value: ${value}`, async () => {
          const vote = new Vote({
            ...validVoteData,
            personalitySystem: "mbti",
            personalityValue: value,
          });

          await expect(vote.validate()).rejects.toThrow();
        });
      });
    });

    describe("Enneagram Validation", () => {
      const validEnneagramValues = [
        "1w9",
        "1w2",
        "2w1",
        "2w3",
        "3w2",
        "3w4",
        "4w3",
        "4w5",
        "5w4",
        "5w6",
        "6w5",
        "6w7",
        "7w6",
        "7w8",
        "8w7",
        "8w9",
        "9w8",
        "9w1",
      ];

      validEnneagramValues.forEach((value) => {
        it(`should accept valid Enneagram value: ${value}`, async () => {
          const vote = new Vote({
            ...validVoteData,
            personalitySystem: "enneagram",
            personalityValue: value,
          });

          await expect(vote.validate()).resolves.not.toThrow();
        });
      });

      const invalidEnneagramValues = ["10w1", "0w9", "1w3", "invalid", ""];

      invalidEnneagramValues.forEach((value) => {
        it(`should reject invalid Enneagram value: ${value}`, async () => {
          const vote = new Vote({
            ...validVoteData,
            personalitySystem: "enneagram",
            personalityValue: value,
          });

          await expect(vote.validate()).rejects.toThrow();
        });
      });
    });

    describe("Zodiac Validation", () => {
      const validZodiacValues = [
        "Aries",
        "Taurus",
        "Gemini",
        "Cancer",
        "Leo",
        "Virgo",
        "Libra",
        "Scorpio",
        "Sagittarius",
        "Capricorn",
        "Aquarius",
        "Pisces",
      ];

      validZodiacValues.forEach((value) => {
        it(`should accept valid Zodiac value: ${value}`, async () => {
          const vote = new Vote({
            ...validVoteData,
            personalitySystem: "zodiac",
            personalityValue: value,
          });

          await expect(vote.validate()).resolves.not.toThrow();
        });
      });

      const invalidZodiacValues = ["Invalid", "Ophiuchus", "13th", "", "aries"];

      invalidZodiacValues.forEach((value) => {
        it(`should reject invalid Zodiac value: ${value}`, async () => {
          const vote = new Vote({
            ...validVoteData,
            personalitySystem: "zodiac",
            personalityValue: value,
          });

          await expect(vote.validate()).rejects.toThrow();
        });
      });
    });

    it("should provide meaningful error messages for invalid values", async () => {
      const vote = new Vote({
        ...validVoteData,
        personalitySystem: "mbti",
        personalityValue: "INVALID",
      });

      try {
        await vote.validate();
        fail("Expected validation to throw");
      } catch (error) {
        expect(error.message).toContain("Invalid mbti value: INVALID");
        expect(error.message).toContain("Valid values are:");
        expect(error.name).toBe("ValidationError");
      }
    });

    it("should skip validation for valid personality systems without specific values", async () => {
      const vote = new Vote({
        ...validVoteData,
        personalitySystem: "mbti",
        personalityValue: "INTJ",
      });

      await expect(vote.validate()).resolves.not.toThrow();
    });
  });

  describe("Instance Methods", () => {
    let vote;

    beforeEach(() => {
      vote = new Vote(validVoteData);
    });

    describe("toPublicJSON", () => {
      it("should return properly formatted public JSON", () => {
        const publicJSON = vote.toPublicJSON();

        expect(publicJSON).toHaveProperty("id");
        expect(publicJSON).toHaveProperty("commentId");
        expect(publicJSON.commentId.toString()).toBe(validVoteData.commentId);
        expect(publicJSON).toHaveProperty("profileId", validVoteData.profileId);
        expect(publicJSON).toHaveProperty(
          "personalitySystem",
          validVoteData.personalitySystem
        );
        expect(publicJSON).toHaveProperty(
          "personalityValue",
          validVoteData.personalityValue
        );
        expect(publicJSON).toHaveProperty("createdAt");
      });

      it("should not include internal fields", () => {
        const publicJSON = vote.toPublicJSON();

        expect(publicJSON).not.toHaveProperty("_id");
        expect(publicJSON).not.toHaveProperty("__v");
        expect(publicJSON).not.toHaveProperty("voterIdentifier");
        expect(publicJSON).not.toHaveProperty("isActive");
        expect(publicJSON).not.toHaveProperty("updatedAt");
      });

      it("should use _id as id", () => {
        const publicJSON = vote.toPublicJSON();

        expect(publicJSON.id).toBeDefined();
        expect(publicJSON.id).toBe(vote._id);
      });
    });
  });

  describe("Static Methods", () => {
    const mockQuery = {
      find: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      findOne: jest.fn(),
      aggregate: jest.fn(),
    };

    beforeEach(() => {
      Vote.find = jest.fn().mockReturnValue(mockQuery);
      Vote.findOne = jest.fn();
      Vote.aggregate = jest.fn();
    });

    describe("findByCommentId", () => {
      it("should find votes with correct query parameters", () => {
        const commentId = new mongoose.Types.ObjectId();
        Vote.findByCommentId(commentId);

        expect(Vote.find).toHaveBeenCalledWith({
          commentId: commentId,
          isActive: true,
        });
      });

      it("should apply personality system filter when provided", () => {
        const commentId = new mongoose.Types.ObjectId();
        const options = { personalitySystem: "mbti" };
        Vote.findByCommentId(commentId, options);

        expect(Vote.find).toHaveBeenCalledWith({
          commentId: commentId,
          isActive: true,
          personalitySystem: "mbti",
        });
      });

      it("should apply default sorting by createdAt descending", () => {
        const commentId = new mongoose.Types.ObjectId();
        Vote.findByCommentId(commentId);

        expect(mockQuery.sort).toHaveBeenCalledWith({ createdAt: -1 });
      });

      it("should apply custom sort options", () => {
        const commentId = new mongoose.Types.ObjectId();
        const options = { sort: { personalityValue: 1 } };
        Vote.findByCommentId(commentId, options);

        expect(mockQuery.sort).toHaveBeenCalledWith({ personalityValue: 1 });
      });

      it("should handle empty options object", () => {
        const commentId = new mongoose.Types.ObjectId();
        Vote.findByCommentId(commentId, {});

        expect(Vote.find).toHaveBeenCalledWith({
          commentId: commentId,
          isActive: true,
        });
        expect(mockQuery.sort).toHaveBeenCalledWith({ createdAt: -1 });
      });
    });

    describe("findUserVote", () => {
      it("should find user vote with correct query parameters", () => {
        const commentId = new mongoose.Types.ObjectId();
        const voterIdentifier = "voter_123";
        const personalitySystem = "mbti";

        Vote.findUserVote(commentId, voterIdentifier, personalitySystem);

        expect(Vote.findOne).toHaveBeenCalledWith({
          commentId: commentId,
          voterIdentifier: voterIdentifier,
          personalitySystem: personalitySystem,
          isActive: true,
        });
      });

      it("should return the result from findOne", async () => {
        const commentId = new mongoose.Types.ObjectId();
        const voterIdentifier = "voter_456";
        const personalitySystem = "enneagram";
        const expectedVote = { _id: "vote-id", personalityValue: "5w4" };

        Vote.findOne.mockResolvedValue(expectedVote);

        const result = await Vote.findUserVote(
          commentId,
          voterIdentifier,
          personalitySystem
        );

        expect(result).toBe(expectedVote);
      });
    });

    describe("getVoteStatsByComment", () => {
      it("should execute aggregation with correct pipeline", () => {
        const commentId = "507f1f77bcf86cd799439011";

        Vote.getVoteStatsByComment(commentId);

        expect(Vote.aggregate).toHaveBeenCalledTimes(1);
        const actualPipeline = Vote.aggregate.mock.calls[0][0];

        expect(actualPipeline).toHaveLength(4);

        expect(actualPipeline[0]).toHaveProperty("$match");
        expect(actualPipeline[0].$match.isActive).toBe(true);
        expect(actualPipeline[0].$match.commentId.toString()).toBe(commentId);

        expect(actualPipeline[1]).toEqual({
          $group: {
            _id: {
              personalitySystem: "$personalitySystem",
              personalityValue: "$personalityValue",
            },
            count: { $sum: 1 },
          },
        });

        expect(actualPipeline[2]).toEqual({
          $group: {
            _id: "$_id.personalitySystem",
            votes: {
              $push: {
                value: "$_id.personalityValue",
                count: "$count",
              },
            },
            totalVotes: { $sum: "$count" },
          },
        });

        expect(actualPipeline[3]).toEqual({
          $project: {
            personalitySystem: "$_id",
            votes: 1,
            totalVotes: 1,
            _id: 0,
          },
        });
      });

      it("should return the aggregation result", async () => {
        const commentId = "507f1f77bcf86cd799439011";
        const expectedStats = [
          {
            personalitySystem: "mbti",
            votes: [{ value: "INTJ", count: 5 }],
            totalVotes: 5,
          },
        ];

        Vote.aggregate.mockResolvedValue(expectedStats);

        const result = await Vote.getVoteStatsByComment(commentId);

        expect(result).toBe(expectedStats);
      });
    });
  });

  describe("Schema Configuration", () => {
    it("should have timestamps enabled", () => {
      const vote = new Vote(validVoteData);

      expect(vote).toHaveProperty("createdAt");
      expect(vote).toHaveProperty("updatedAt");
    });

    describe("toJSON Transform", () => {
      it("should remove _id and __v from JSON output", () => {
        const vote = new Vote(validVoteData);
        const json = vote.toJSON();

        expect(json).not.toHaveProperty("_id");
        expect(json).not.toHaveProperty("__v");
      });

      it("should include virtual id field", () => {
        const vote = new Vote(validVoteData);
        const json = vote.toJSON();

        expect(json).toHaveProperty("id");
      });
    });

    describe("Indexes", () => {
      it("should have compound unique index", () => {
        const indexes = Vote.schema.indexes();
        const uniqueIndex = indexes.find(
          (index) => index[1] && index[1].unique === true
        );

        expect(uniqueIndex).toBeDefined();
        expect(uniqueIndex[0]).toHaveProperty("commentId");
        expect(uniqueIndex[0]).toHaveProperty("voterIdentifier");
        expect(uniqueIndex[0]).toHaveProperty("personalitySystem");
      });

      it("should have index on commentId and personalitySystem", () => {
        const indexes = Vote.schema.indexes();
        const commentPersonalityIndex = indexes.find(
          (index) =>
            index[0].commentId !== undefined &&
            index[0].personalitySystem !== undefined
        );

        expect(commentPersonalityIndex).toBeDefined();
      });

      it("should have index on profileId", () => {
        const indexes = Vote.schema.indexes();
        const profileIdIndex = indexes.find(
          (index) => index[0].profileId !== undefined
        );

        expect(profileIdIndex).toBeDefined();
      });

      it("should have index on createdAt", () => {
        const indexes = Vote.schema.indexes();
        const createdAtIndex = indexes.find(
          (index) => index[0].createdAt !== undefined
        );

        expect(createdAtIndex).toBeDefined();
      });
    });
  });

  describe("Model Integration", () => {
    it("should create a valid Vote instance", () => {
      const vote = new Vote(validVoteData);

      expect(vote).toBeInstanceOf(Vote);
      expect(vote.commentId.toString()).toBe(validVoteData.commentId);
      expect(vote.profileId).toBe(validVoteData.profileId);
      expect(vote.personalitySystem).toBe(validVoteData.personalitySystem);
      expect(vote.personalityValue).toBe(validVoteData.personalityValue);
    });

    it("should handle all personality systems correctly", async () => {
      const testCases = [
        { system: "mbti", value: "ENFP" },
        { system: "enneagram", value: "7w8" },
        { system: "zodiac", value: "Leo" },
      ];

      for (const testCase of testCases) {
        const vote = new Vote({
          ...validVoteData,
          personalitySystem: testCase.system,
          personalityValue: testCase.value,
        });

        await expect(vote.validate()).resolves.not.toThrow();
        expect(vote.personalitySystem).toBe(testCase.system);
        expect(vote.personalityValue).toBe(testCase.value);
      }
    });

    it("should validate complete vote workflow", async () => {
      // Create vote
      const vote = new Vote(validVoteData);
      await expect(vote.validate()).resolves.not.toThrow();

      const publicJSON = vote.toPublicJSON();
      expect(publicJSON.personalitySystem).toBe(
        validVoteData.personalitySystem
      );

      expect(typeof Vote.findByCommentId).toBe("function");
      expect(typeof Vote.findUserVote).toBe("function");
      expect(typeof Vote.getVoteStatsByComment).toBe("function");
    });

    it("should handle case conversion and trimming", () => {
      const vote = new Vote({
        ...validVoteData,
        personalitySystem: "MBTI",
        voterIdentifier: "  voter_456  ",
        personalityValue: "  ENFP  ",
      });

      expect(vote.personalitySystem).toBe("mbti");
      expect(vote.voterIdentifier).toBe("voter_456");
      expect(vote.personalityValue).toBe("ENFP");
    });
  });

  describe("Error Scenarios", () => {
    it("should provide meaningful error messages for validation failures", async () => {
      const invalidVote = new Vote({
        commentId: "not-an-objectid",
        profileId: "not-a-number",
        personalitySystem: "invalid-system",
        personalityValue: "INVALID_MBTI",
      });

      try {
        await invalidVote.validate();
        fail("Expected validation to throw");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should handle missing required fields gracefully", () => {
      const incompleteVote = new Vote({
        commentId: new mongoose.Types.ObjectId(),
      });

      const validationError = incompleteVote.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors).toBeDefined();

      const errorFields = Object.keys(validationError.errors);
      expect(errorFields).toContain("profileId");
      expect(errorFields).toContain("voterIdentifier");
      expect(errorFields).toContain("personalitySystem");
      expect(errorFields).toContain("personalityValue");
    });

    it("should handle pre-validation hook errors", async () => {
      const vote = new Vote({
        ...validVoteData,
        personalitySystem: "enneagram",
        personalityValue: "invalid_enneagram",
      });

      try {
        await vote.validate();
        fail("Expected validation to throw");
      } catch (error) {
        expect(error.name).toBe("ValidationError");
        expect(error.message).toContain("Invalid enneagram value");
      }
    });
  });
});
