const mongoose = require("mongoose");
const request = require("supertest");

const testDataFactories = {
  validProfile: (overrides = {}) => ({
    profileId: Math.floor(Math.random() * 90000) + 10000,
    name: "Integration Test Profile",
    description:
      "This is a comprehensive test profile description for integration testing purposes.",
    mbti: "INTJ",
    enneagram: "5w4",
    variant: "sx/sp",
    tritype: 548,
    socionics: "ILI",
    sloan: "RCUAI",
    psyche: "FLVE",
    image: "https://example.com/test-image.png",
    ...overrides,
  }),

  validProfiles: (count = 3) => {
    const profiles = [];
    const baseId = Math.floor(Math.random() * 80000) + 10000;

    for (let i = 0; i < count; i++) {
      profiles.push({
        profileId: baseId + i,
        name: `Test Profile ${i + 1}`,
        description: `This is test profile ${
          i + 1
        } description for integration testing with comprehensive details.`,
        mbti: ["INTJ", "ENFP", "ISFJ", "ESTP"][i % 4],
        enneagram: [`${(i % 9) + 1}w${((i + 1) % 9) + 1}`, "9w1", "7w8"][i % 3],
        variant: ["sx/sp", "so/sx", "sp/so"][i % 3],
        tritype: [548, 739, 261][i % 3],
        socionics: ["ILI", "ENFp", "ESI"][i % 3],
        sloan: ["RCUAI", "ACRUI", "IRCAU"][i % 3],
        psyche: ["FLVE", "FEVL", "VELF"][i % 3],
        image: `https://example.com/test-image-${i + 1}.png`,
      });
    }
    return profiles;
  },

  invalidProfile: (type = "missing_required") => {
    const invalidData = {
      missing_required: {
        name: "Test Profile",
      },
      invalid_mbti: {
        profileId: 99998,
        name: "Invalid MBTI Profile",
        description: "Profile with invalid MBTI type for testing validation.",
        mbti: "INVALID",
        enneagram: "5w4",
        variant: "sx/sp",
        tritype: 548,
        socionics: "ILI",
        sloan: "RCUAI",
        psyche: "FLVE",
        image: "https://example.com/test-image.png",
      },
      invalid_tritype: {
        profileId: 99997,
        name: "Invalid Tritype Profile",
        description: "Profile with invalid tritype for testing validation.",
        mbti: "INTJ",
        enneagram: "5w4",
        variant: "sx/sp",
        tritype: 50,
        socionics: "ILI",
        sloan: "RCUAI",
        psyche: "FLVE",
        image: "https://example.com/test-image.png",
      },
      invalid_image: {
        profileId: 99996,
        name: "Invalid Image Profile",
        description: "Profile with invalid image URL for testing validation.",
        mbti: "INTJ",
        enneagram: "5w4",
        variant: "sx/sp",
        tritype: 548,
        socionics: "ILI",
        sloan: "RCOEI",
        psyche: "LVEF",
        image: "not-a-valid-url",
      },
      short_name: {
        profileId: 99995,
        name: "A",
        description: "Profile with name too short for testing validation.",
        mbti: "INTJ",
        enneagram: "5w4",
        variant: "sx/sp",
        tritype: 548,
        socionics: "ILI",
        sloan: "RCUAI",
        psyche: "FLVE",
        image: "https://example.com/test-image.png",
      },
      short_description: {
        profileId: 99994,
        name: "Short Description Profile",
        description: "Too short",
        mbti: "INTJ",
        enneagram: "5w4",
        variant: "sx/sp",
        tritype: 548,
        socionics: "ILI",
        sloan: "RCUAI",
        psyche: "FLVE",
        image: "https://example.com/test-image.jpg",
      },
    };

    return invalidData[type] || invalidData.missing_required;
  },

  // Update profile data
  updateProfile: (overrides = {}) => ({
    name: "Updated Profile Name",
    description:
      "This is an updated profile description with comprehensive new information.",
    mbti: "ENFP",
    enneagram: "7w8",
    ...overrides,
  }),

  // Valid comment data for creation
  validComment: (overrides = {}) => ({
    content:
      "This is a thoughtful comment about personality types and their interactions.",
    title: "Insightful Analysis",
    author: "Integration Test User",
    profileId: 1, // Default to profile ID 1, should be overridden with actual profile ID
    ...overrides,
  }),

  // Multiple valid comments for bulk operations
  validComments: (profileId = 1, count = 3) => {
    const comments = [];

    for (let i = 0; i < count; i++) {
      comments.push({
        content: `This is test comment ${
          i + 1
        } content with comprehensive analysis of personality types and their fascinating interactions.`,
        title: `Test Comment ${i + 1}`,
        author: `Test Author ${i + 1}`,
        profileId: profileId,
      });
    }
    return comments;
  },

  // Invalid comment data for error testing
  invalidComment: (type = "missing_required") => {
    const invalidData = {
      missing_required: {
        author: "Test User",
        // Missing required fields
      },
      empty_content: {
        content: "", // Empty content
        author: "Test User",
        profileId: 1,
      },
      long_content: {
        content: "A".repeat(1001), // Too long (max 1000 chars)
        author: "Test User",
        profileId: 1,
      },
      empty_author: {
        content: "Valid comment content for testing purposes.",
        author: "", // Empty author
        profileId: 1,
      },
      long_author: {
        content: "Valid comment content for testing purposes.",
        author: "A".repeat(101), // Too long (max 100 chars)
        profileId: 1,
      },
      long_title: {
        content: "Valid comment content for testing purposes.",
        title: "A".repeat(201), // Too long (max 200 chars)
        author: "Test User",
        profileId: 1,
      },
      invalid_profile_id: {
        content: "Valid comment content for testing purposes.",
        author: "Test User",
        profileId: 0, // Invalid: must be > 0
      },
      large_profile_id: {
        content: "Valid comment content for testing purposes.",
        author: "Test User",
        profileId: 100000, // Invalid: must be < 100000
      },
    };

    return invalidData[type] || invalidData.missing_required;
  },

  // Update comment data
  updateComment: (overrides = {}) => ({
    content: "This is an updated comment with new insights and analysis.",
    title: "Updated Analysis",
    ...overrides,
  }),

  // Valid vote data for creation
  validVote: (overrides = {}) => ({
    personalitySystem: "mbti",
    personalityValue: "INTJ",
    profileId: 1,
    ...overrides,
  }),

  // Multiple valid votes for bulk operations
  validVotes: (commentId, count = 3) => {
    const votes = [];
    const personalitySystems = ["mbti", "enneagram", "zodiac"];
    const personalityValues = {
      mbti: ["INTJ", "ENFP", "ISFJ", "ESTP"],
      enneagram: ["4w5", "7w8", "1w9", "5w6"],
      zodiac: ["Scorpio", "Leo", "Pisces", "Aries"],
    };

    for (let i = 0; i < count; i++) {
      const system = personalitySystems[i % personalitySystems.length];
      const values = personalityValues[system];
      votes.push({
        commentId: commentId,
        personalitySystem: system,
        personalityValue: values[i % values.length],
        voterIdentifier: `test_voter_${i + 1}`,
        profileId: 1,
      });
    }
    return votes;
  },

  // Invalid vote data for error testing
  invalidVote: (type = "missing_required") => {
    const invalidData = {
      missing_required: {
        personalitySystem: "mbti",
        // Missing personalityValue
      },
      invalid_personality_system: {
        personalitySystem: "invalid_system",
        personalityValue: "INTJ",
        profileId: 1,
      },
      empty_personality_value: {
        personalitySystem: "mbti",
        personalityValue: "",
        profileId: 1,
      },
      invalid_mbti_value: {
        personalitySystem: "mbti",
        personalityValue: "INVALID",
        profileId: 1,
      },
      invalid_enneagram_value: {
        personalitySystem: "enneagram",
        personalityValue: "99w99",
        profileId: 1,
      },
      invalid_zodiac_value: {
        personalitySystem: "zodiac",
        personalityValue: "InvalidSign",
        profileId: 1,
      },
      invalid_profile_id: {
        personalitySystem: "mbti",
        personalityValue: "INTJ",
        profileId: 0,
      },
    };

    return invalidData[type] || invalidData.missing_required;
  },

  // Bulk vote data for testing bulk operations
  bulkVotes: (commentIds = [], voterIdentifier = "bulk_test_voter") => ({
    votes: commentIds.map((commentId, index) => ({
      commentId,
      personalitySystem: ["mbti", "enneagram", "zodiac"][index % 3],
      personalityValue: ["INTJ", "4w5", "Scorpio"][index % 3],
      voterIdentifier: `${voterIdentifier}_${index}`,
      profileId: 1,
    })),
  }),
};

const databaseHelpers = {
  async cleanDatabase() {
    try {
      // Clean all collections that exist
      const Profile = mongoose.model("Profile");
      await Profile.deleteMany({});

      // Try to clean Comment model if it exists
      try {
        const Comment = mongoose.model("Comment");
        await Comment.deleteMany({});
      } catch (commentError) {
        // Comment model might not be registered yet
        console.log("Comment model not found, skipping comment cleanup");
      }

      // Try to clean Vote model if it exists
      try {
        const Vote = mongoose.model("Vote");
        await Vote.deleteMany({});
      } catch (voteError) {
        // Vote model might not be registered yet
        console.log("Vote model not found, skipping vote cleanup");
      }

      console.log("Database cleaned successfully");
    } catch (error) {
      console.error("Error cleaning database:", error);
      throw error;
    }
  },

  async seedDatabase(profiles = []) {
    try {
      const Profile = mongoose.model("Profile");

      if (profiles.length > 0) {
        await Profile.insertMany(profiles);
        console.log(`Seeded ${profiles.length} profiles`);
      }

      return profiles;
    } catch (error) {
      console.error("Error seeding database:", error);
      throw error;
    }
  },

  async createProfile(profileData) {
    try {
      const Profile = mongoose.model("Profile");
      const profile = new Profile(profileData);
      return await profile.save();
    } catch (error) {
      console.error("Error creating profile:", error);
      throw error;
    }
  },

  async getProfileCount() {
    try {
      const Profile = mongoose.model("Profile");
      return await Profile.countDocuments();
    } catch (error) {
      console.error("Error counting profiles:", error);
      throw error;
    }
  },

  async findProfileByProfileId(profileId) {
    try {
      const Profile = mongoose.model("Profile");
      return await Profile.findOne({ profileId });
    } catch (error) {
      console.error("Error finding profile:", error);
      throw error;
    }
  },

  // Comment helper methods
  async createComment(commentData) {
    try {
      const Comment = mongoose.model("Comment");
      const comment = new Comment(commentData);
      return await comment.save();
    } catch (error) {
      console.error("Error creating comment:", error);
      if (error.message.includes("Schema hasn't been registered")) {
        console.log("Comment model not available, using API instead");
        return null;
      }
      throw error;
    }
  },

  async getCommentCount() {
    try {
      const Comment = mongoose.model("Comment");
      return await Comment.countDocuments();
    } catch (error) {
      console.error("Error counting comments:", error);
      if (error.message.includes("Schema hasn't been registered")) {
        return 0;
      }
      throw error;
    }
  },

  async findCommentById(commentId) {
    try {
      const Comment = mongoose.model("Comment");
      return await Comment.findById(commentId);
    } catch (error) {
      console.error("Error finding comment:", error);
      if (error.message.includes("Schema hasn't been registered")) {
        return null;
      }
      throw error;
    }
  },

  // Vote helper methods
  async createVote(voteData) {
    try {
      const Vote = mongoose.model("Vote");
      const vote = new Vote(voteData);
      return await vote.save();
    } catch (error) {
      console.error("Error creating vote:", error);
      if (error.message.includes("Schema hasn't been registered")) {
        console.log("Vote model not available, using API instead");
        return null;
      }
      throw error;
    }
  },

  async getVoteCount() {
    try {
      const Vote = mongoose.model("Vote");
      return await Vote.countDocuments();
    } catch (error) {
      console.error("Error counting votes:", error);
      if (error.message.includes("Schema hasn't been registered")) {
        return 0;
      }
      throw error;
    }
  },

  async findVotesByCommentId(commentId) {
    try {
      const Vote = mongoose.model("Vote");
      return await Vote.find({ commentId });
    } catch (error) {
      console.error("Error finding votes by comment ID:", error);
      if (error.message.includes("Schema hasn't been registered")) {
        return [];
      }
      throw error;
    }
  },
};

const apiHelpers = {
  expectValidResponse(response, expectedStatus = 200) {
    expect(response.status).toBe(expectedStatus);
    expect(response.headers["content-type"]).toMatch(/json/);
  },

  expectValidProfileResponse(response, profileData = null) {
    this.expectValidResponse(response, 200);

    expect(response.body).toHaveProperty("id");
    expect(response.body).toHaveProperty("name");
    expect(response.body).toHaveProperty("description");
    expect(response.body).toHaveProperty("mbti");
    expect(response.body).toHaveProperty("enneagram");
    expect(response.body).toHaveProperty("variant");
    expect(response.body).toHaveProperty("tritype");
    expect(response.body).toHaveProperty("socionics");
    expect(response.body).toHaveProperty("sloan");
    expect(response.body).toHaveProperty("psyche");
    expect(response.body).toHaveProperty("image");

    if (profileData) {
      expect(response.body.id).toBe(profileData.profileId);
      expect(response.body.name).toBe(profileData.name);
      expect(response.body.mbti).toBe(profileData.mbti);
    }
  },

  expectValidProfilesListResponse(response, expectedCount = null) {
    this.expectValidResponse(response, 200);

    expect(response.body).toHaveProperty("profiles");
    expect(Array.isArray(response.body.profiles)).toBe(true);

    if (expectedCount !== null) {
      expect(response.body.profiles).toHaveLength(expectedCount);
    }

    if (response.body.pagination) {
      expect(response.body.pagination).toHaveProperty("currentPage");
      expect(response.body.pagination).toHaveProperty("itemsPerPage");
      expect(response.body.pagination).toHaveProperty("totalItems");
      expect(response.body.pagination).toHaveProperty("totalPages");
      expect(response.body.pagination).toHaveProperty("hasNext");
      expect(response.body.pagination).toHaveProperty("hasPrev");
    }
  },

  expectCreatedResponse(response, profileData = null) {
    this.expectValidResponse(response, 201);

    expect(response.body).toHaveProperty("success", true);
    expect(response.body).toHaveProperty("message");
    expect(response.body).toHaveProperty("profile");

    if (profileData) {
      expect(response.body.profile.id).toBe(profileData.profileId);
      expect(response.body.profile.name).toBe(profileData.name);
    }
  },

  expectUpdatedResponse(response) {
    this.expectValidResponse(response, 200);

    expect(response.body).toHaveProperty("success", true);
    expect(response.body).toHaveProperty("message");
    expect(response.body).toHaveProperty("profile");
  },

  expectDeletedResponse(response) {
    this.expectValidResponse(response, 200);

    expect(response.body).toHaveProperty("success", true);
    expect(response.body).toHaveProperty("message");
    expect(response.body).toHaveProperty("profile");
  },

  expectValidationError(response, expectedMessage = null) {
    this.expectValidResponse(response, 400);

    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toMatch(/validation/i);

    if (expectedMessage) {
      // Check in details object or main message
      const detailsString = response.body.details
        ? JSON.stringify(response.body.details)
        : "";
      const messageString = response.body.message || "";
      const combinedString = messageString + " " + detailsString;
      expect(combinedString).toContain(expectedMessage);
    }
  },

  expectNotFoundError(response, expectedMessage = null) {
    this.expectValidResponse(response, 404);

    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toMatch(/not found/i);

    if (expectedMessage) {
      expect(response.body.message).toContain(expectedMessage);
    }
  },

  expectDuplicateError(response) {
    this.expectValidResponse(response, 409);

    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toMatch(/duplicate/i);
  },

  expectValidStatsResponse(response) {
    this.expectValidResponse(response, 200);

    expect(response.body).toHaveProperty("totalProfiles");
    expect(response.body).toHaveProperty("mbtiDistribution");
    expect(response.body).toHaveProperty("lastUpdated");

    expect(typeof response.body.totalProfiles).toBe("number");
    expect(typeof response.body.mbtiDistribution).toBe("object");
    expect(typeof response.body.lastUpdated).toBe("string");
  },

  // Comment-specific helper methods
  expectValidCommentResponse(response, commentData = null) {
    this.expectValidResponse(response, 200);

    expect(response.body).toHaveProperty("id");
    expect(response.body).toHaveProperty("content");
    expect(response.body).toHaveProperty("author");
    expect(response.body).toHaveProperty("profileId");
    expect(response.body).toHaveProperty("createdAt");
    expect(response.body).toHaveProperty("updatedAt");

    if (commentData) {
      expect(response.body.content).toBe(commentData.content);
      expect(response.body.author).toBe(commentData.author);
      expect(response.body.profileId).toBe(commentData.profileId);
    }
  },

  expectValidCommentsListResponse(response, expectedCount = null) {
    this.expectValidResponse(response, 200);

    expect(response.body).toHaveProperty("comments");
    expect(Array.isArray(response.body.comments)).toBe(true);

    if (expectedCount !== null) {
      expect(response.body.comments).toHaveLength(expectedCount);
    }

    if (response.body.pagination) {
      expect(response.body.pagination).toHaveProperty("page");
      expect(response.body.pagination).toHaveProperty("limit");
      expect(response.body.pagination).toHaveProperty("totalCount");
      expect(response.body.pagination).toHaveProperty("totalPages");
    }
  },

  // Vote-specific helper methods
  expectValidVoteResponse(response, voteData = null) {
    this.expectValidResponse(response, 201);

    expect(response.body).toHaveProperty("success", true);
    expect(response.body).toHaveProperty("message");
    expect(response.body).toHaveProperty("vote");

    if (voteData) {
      expect(response.body.vote.personalitySystem).toBe(
        voteData.personalitySystem
      );
      expect(response.body.vote.personalityValue).toBe(
        voteData.personalityValue
      );
    }
  },

  expectValidVoteStatsResponse(response) {
    this.expectValidResponse(response, 200);

    expect(response.body).toHaveProperty("voteStats");
    expect(typeof response.body.voteStats).toBe("object");
    expect(response.body).toHaveProperty("commentId");

    // Check that vote stats contain personality system objects
    if (response.body.voteStats.mbti) {
      expect(typeof response.body.voteStats.mbti).toBe("object");
    }
    if (response.body.voteStats.enneagram) {
      expect(typeof response.body.voteStats.enneagram).toBe("object");
    }
    if (response.body.voteStats.zodiac) {
      expect(typeof response.body.voteStats.zodiac).toBe("object");
    }
  },

  expectValidHealthResponse(response, serviceName = "comments") {
    this.expectValidResponse(response, 200);

    expect(response.body).toHaveProperty("status", "healthy");
    expect(response.body).toHaveProperty("service", serviceName);
    expect(response.body).toHaveProperty("timestamp");
    expect(typeof response.body.timestamp).toBe("string");
  },
};

const testUtils = {
  async wait(ms = 100) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },

  generateUniqueProfileId() {
    return Math.floor(Math.random() * 90000) + 10000;
  },

  generateUniqueTestData(baseName = "Test Profile") {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);

    return {
      profileId: this.generateUniqueProfileId(),
      name: `${baseName} ${timestamp}${random}`,
      description: `Generated test profile description ${timestamp} for integration testing purposes.`,
    };
  },
};

module.exports = {
  testDataFactories,
  databaseHelpers,
  apiHelpers,
  testUtils,
};
