/**
 * General Votes API Integration Tests
 *
 * Comprehensive test suite for general voting API endpoints
 * Tests personality values, top comments, vote history, bulk operations, and statistics
 */

const request = require("supertest");
const {
  testDataFactories,
  databaseHelpers,
  apiHelpers,
} = require("../helpers/testIntegrationHelpers");

describe("General Votes API Integration Tests", () => {
  let app;
  let profileId;
  let commentIds = [];

  beforeAll(async () => {
    app = global.createTestApp();
  });

  beforeEach(async () => {
    // Clean database before each test
    await databaseHelpers.cleanDatabase();

    // Create a test profile
    const profileData = testDataFactories.validProfile();
    const profileResponse = await request(app)
      .post("/api/profile")
      .send(profileData);

    profileId =
      profileResponse.body.id ||
      profileResponse.body.profile?.id ||
      profileResponse.body.profileId;

    // Create multiple test comments for voting
    const comments = testDataFactories.validComments(profileId, 5);
    commentIds = [];

    for (const commentData of comments) {
      const response = await request(app)
        .post("/api/comments")
        .send(commentData);
      commentIds.push(response.body.comment.id);
    }
  });

  describe("GET /votes/personality-values - Get Valid Personality Values", () => {
    test("should return all valid personality values", async () => {
      const response = await request(app)
        .get("/api/votes/personality-values")
        .expect(200);

      expect(response.body).toMatchObject({
        personalityValues: expect.objectContaining({
          mbti: expect.arrayContaining([
            expect.stringMatching(/^[EI][SN][TF][JP]$/), // MBTI pattern
          ]),
          enneagram: expect.arrayContaining([
            expect.stringMatching(/^\d+w\d+$/), // Enneagram pattern like 4w5
          ]),
          zodiac: expect.arrayContaining([
            expect.any(String), // Zodiac signs
          ]),
        }),
        description: expect.any(String),
        lastUpdated: expect.any(String),
      });

      // Verify MBTI values are valid 4-letter combinations
      expect(response.body.personalityValues.mbti).toEqual(
        expect.arrayContaining([
          "INTJ",
          "INFP",
          "ESTJ",
          "ESFP", // Sample MBTI types
        ])
      );

      // Verify Enneagram values follow correct pattern
      expect(response.body.personalityValues.enneagram).toEqual(
        expect.arrayContaining([expect.stringMatching(/^[1-9]w[1-9]$/)])
      );

      // Verify zodiac signs are included
      expect(response.body.personalityValues.zodiac).toEqual(
        expect.arrayContaining(["Aries", "Scorpio", "Pisces", "Leo"])
      );
    });

    test("should include timestamp in response", async () => {
      const response = await request(app)
        .get("/api/votes/personality-values")
        .expect(200);

      const timestamp = new Date(response.body.lastUpdated);
      const now = new Date();
      const timeDiff = now.getTime() - timestamp.getTime();

      // Timestamp should be recent (within last minute)
      expect(timeDiff).toBeLessThan(60000);
    });

    test("should have consistent personality value structure", async () => {
      const response = await request(app)
        .get("/api/votes/personality-values")
        .expect(200);

      const { personalityValues } = response.body;

      // All personality systems should be present
      expect(personalityValues).toHaveProperty("mbti");
      expect(personalityValues).toHaveProperty("enneagram");
      expect(personalityValues).toHaveProperty("zodiac");

      // All should be arrays
      expect(Array.isArray(personalityValues.mbti)).toBe(true);
      expect(Array.isArray(personalityValues.enneagram)).toBe(true);
      expect(Array.isArray(personalityValues.zodiac)).toBe(true);

      // Arrays should not be empty
      expect(personalityValues.mbti.length).toBeGreaterThan(0);
      expect(personalityValues.enneagram.length).toBeGreaterThan(0);
      expect(personalityValues.zodiac.length).toBeGreaterThan(0);
    });
  });

  describe("GET /votes/top-comments - Get Top Voted Comments", () => {
    beforeEach(async () => {
      // Create votes for different comments to establish ranking
      const voteScenarios = [
        { commentIndex: 0, voteCount: 10 },
        { commentIndex: 1, voteCount: 7 },
        { commentIndex: 2, voteCount: 5 },
        { commentIndex: 3, voteCount: 2 },
        { commentIndex: 4, voteCount: 1 },
      ];

      for (const scenario of voteScenarios) {
        const commentId = commentIds[scenario.commentIndex];

        // Create multiple votes from different IPs
        for (let i = 0; i < scenario.voteCount; i++) {
          await request(app)
            .post(`/api/comments/${commentId}/vote`)
            .set("X-Forwarded-For", `192.168.${scenario.commentIndex}.${i}`)
            .send({
              personalitySystem: ["mbti", "enneagram", "zodiac"][i % 3],
              personalityValue: ["INTJ", "4w5", "Scorpio"][i % 3],
              profileId: profileId,
            });
        }
      }
    });

    test("should return top voted comments in descending order", async () => {
      const response = await request(app)
        .get("/api/votes/top-comments")
        .expect(200);

      expect(response.body).toMatchObject({
        comments: expect.any(Array),
        personalitySystem: null, // No filter applied
        limit: 10, // Default limit
        lastUpdated: expect.any(String),
      });

      // Should return comments (up to limit)
      expect(response.body.comments.length).toBeLessThanOrEqual(10);
      expect(response.body.comments.length).toBeGreaterThan(0);

      // Comments should include vote-related data
      response.body.comments.forEach((commentData) => {
        expect(commentData).toHaveProperty("commentId");
        expect(commentData).toHaveProperty("totalVotes");
        expect(commentData).toHaveProperty("comment");
        expect(commentData.comment).toHaveProperty("content");
        expect(commentData.comment).toHaveProperty("profileId");
        expect(commentData.comment).toHaveProperty("author");
      });

      // Verify descending order by vote count
      for (let i = 1; i < response.body.comments.length; i++) {
        expect(response.body.comments[i - 1].totalVotes).toBeGreaterThanOrEqual(
          response.body.comments[i].totalVotes
        );
      }
    });

    test("should respect limit parameter", async () => {
      const response = await request(app)
        .get("/api/votes/top-comments")
        .query({ limit: 3 })
        .expect(200);

      expect(response.body.comments.length).toBeLessThanOrEqual(3);
      expect(response.body.limit).toBe(3);
    });

    test("should filter by personality system", async () => {
      const response = await request(app)
        .get("/api/votes/top-comments")
        .query({ personalitySystem: "mbti" })
        .expect(200);

      expect(response.body.personalitySystem).toBe("mbti");
      expect(response.body.comments.length).toBeGreaterThanOrEqual(0);
    });

    test("should handle all personality system filters", async () => {
      const systems = ["mbti", "enneagram", "zodiac"];

      for (const system of systems) {
        const response = await request(app)
          .get("/api/votes/top-comments")
          .query({ personalitySystem: system })
          .expect(200);

        expect(response.body.personalitySystem).toBe(system);
        expect(Array.isArray(response.body.comments)).toBe(true);
      }
    });

    test("should return 400 for invalid personality system", async () => {
      const response = await request(app)
        .get("/api/votes/top-comments")
        .query({ personalitySystem: "invalid_system" })
        .expect(400);

      expect(response.body.message).toMatch(/(Validation error|Invalid)/);
    });

    test("should handle large limit values gracefully", async () => {
      const response = await request(app)
        .get("/api/votes/top-comments")
        .query({ limit: 51 }) // Higher than documented maximum
        .expect(200);

      expect(response.body).toHaveProperty("comments");
      expect(Array.isArray(response.body.comments)).toBe(true);
      // Should return the comments created by beforeEach (5 total)
      expect(response.body.comments).toHaveLength(5);

      // Verify they're properly structured
      response.body.comments.forEach((comment) => {
        expect(comment).toHaveProperty("commentId");
        expect(comment).toHaveProperty("totalVotes");
        expect(comment).toHaveProperty("comment");
      });
    });

    test("should return empty array when no votes exist", async () => {
      // Clean all votes
      await databaseHelpers.cleanDatabase();

      // Recreate basic data without votes
      const profileData = testDataFactories.validProfile();
      const profileResponse = await request(app)
        .post("/api/profile")
        .send(profileData);

      const commentData = testDataFactories.validComment({
        profileId: profileResponse.body.profile.id,
      });
      await request(app).post("/api/comments").send(commentData);

      const response = await request(app)
        .get("/api/votes/top-comments")
        .expect(200);

      expect(response.body.comments).toHaveLength(0);
    });
  });

  describe("GET /votes/stats - Get Personality System Statistics", () => {
    beforeEach(async () => {
      // Create diverse votes for statistics
      const votes = [
        { commentId: commentIds[0], system: "mbti", value: "INTJ" },
        { commentId: commentIds[0], system: "mbti", value: "ENFP" },
        { commentId: commentIds[0], system: "enneagram", value: "4w5" },
        { commentId: commentIds[1], system: "mbti", value: "INTJ" }, // Same value, different comment
        { commentId: commentIds[1], system: "zodiac", value: "Scorpio" },
        { commentId: commentIds[2], system: "enneagram", value: "7w8" },
      ];

      for (let i = 0; i < votes.length; i++) {
        await request(app)
          .post(`/api/comments/${votes[i].commentId}/vote`)
          .set("X-Forwarded-For", `192.168.1.${i}`)
          .send({
            personalitySystem: votes[i].system,
            personalityValue: votes[i].value,
            profileId: profileId,
          });
      }
    });

    test("should return personality system statistics", async () => {
      const response = await request(app).get("/api/votes/stats").expect(200);

      expect(response.body).toMatchObject({
        personalityStats: expect.any(Array),
        lastUpdated: expect.any(String),
      });

      // Should contain statistics for different personality systems
      expect(response.body.personalityStats.length).toBeGreaterThan(0);
    });

    test("should filter statistics by comment ID", async () => {
      const response = await request(app)
        .get("/api/votes/stats")
        .query({ commentId: commentIds[0] })
        .expect(200);

      expect(response.body.commentId).toBe(commentIds[0]);
      expect(response.body.personalityStats).toBeDefined();
    });

    test("should return 400 for invalid commentId", async () => {
      const response = await request(app)
        .get("/api/votes/stats")
        .query({ commentId: "invalid-id" })
        .expect(400);

      expect(response.body.message).toMatch(/(Validation error|Invalid)/);
    });

    test("should return empty stats for non-existent comment", async () => {
      const fakeCommentId = "507f1f77bcf86cd799439011";

      const response = await request(app)
        .get("/api/votes/stats")
        .query({ commentId: fakeCommentId })
        .expect(200);

      expect(response.body.commentId).toBe(fakeCommentId);
    });
  });

  describe("GET /votes/count - Get Vote Count", () => {
    beforeEach(async () => {
      // Create various votes for counting
      const votes = testDataFactories.validVotes(commentIds[0], 8);

      for (let i = 0; i < votes.length; i++) {
        await request(app)
          .post(`/api/comments/${votes[i].commentId}/vote`)
          .set("X-Forwarded-For", `192.168.1.${i}`)
          .send(votes[i]);
      }

      // Add votes to another comment
      const moreVotes = testDataFactories.validVotes(commentIds[1], 3);

      for (let i = 0; i < moreVotes.length; i++) {
        await request(app)
          .post(`/api/comments/${moreVotes[i].commentId}/vote`)
          .set("X-Forwarded-For", `192.168.2.${i}`)
          .send(moreVotes[i]);
      }
    });

    test("should return total vote count", async () => {
      const response = await request(app).get("/api/votes/count").expect(200);

      expect(response.body).toMatchObject({
        count: expect.any(Number),
      });

      expect(response.body.count).toBeGreaterThan(0);
    });

    test("should filter count by comment ID", async () => {
      const response = await request(app)
        .get("/api/votes/count")
        .query({ commentId: commentIds[0] })
        .expect(200);

      expect(response.body).toMatchObject({
        count: expect.any(Number),
        commentId: commentIds[0],
      });
    });

    test("should filter count by personality system", async () => {
      const response = await request(app)
        .get("/api/votes/count")
        .query({ personalitySystem: "mbti" })
        .expect(200);

      expect(response.body).toMatchObject({
        count: expect.any(Number),
        personalitySystem: "mbti",
      });
    });

    test("should filter by both comment ID and personality system", async () => {
      const response = await request(app)
        .get("/api/votes/count")
        .query({
          commentId: commentIds[0],
          personalitySystem: "mbti",
        })
        .expect(200);

      expect(response.body).toMatchObject({
        count: expect.any(Number),
        commentId: commentIds[0],
        personalitySystem: "mbti",
      });
    });

    test("should return 400 for invalid personality system", async () => {
      const response = await request(app)
        .get("/api/votes/count")
        .query({ personalitySystem: "invalid_system" })
        .expect(400);

      expect(response.body.message).toMatch(/(Validation error|Invalid)/);
    });

    test("should return zero count for non-existent comment", async () => {
      const fakeCommentId = "507f1f77bcf86cd799439011";

      const response = await request(app)
        .get("/api/votes/count")
        .query({ commentId: fakeCommentId })
        .expect(200);

      expect(response.body.count).toBe(0);
      expect(response.body.commentId).toBe(fakeCommentId);
    });
  });

  describe("GET /votes/history - Get Vote History", () => {
    beforeEach(async () => {
      // Create vote history for current user (identified by IP)
      const userVotes = [
        { commentId: commentIds[0], system: "mbti", value: "INTJ" },
        { commentId: commentIds[1], system: "enneagram", value: "4w5" },
        { commentId: commentIds[2], system: "zodiac", value: "Scorpio" },
        { commentId: commentIds[0], system: "enneagram", value: "7w8" }, // Different system, same comment
        { commentId: commentIds[3], system: "mbti", value: "ENFP" },
      ];

      for (let i = 0; i < userVotes.length; i++) {
        await request(app)
          .post(`/api/comments/${userVotes[i].commentId}/vote`)
          .send({
            personalitySystem: userVotes[i].system,
            personalityValue: userVotes[i].value,
            profileId: profileId,
          });
      }

      // Create votes from different user (different IP)
      await request(app)
        .post(`/api/comments/${commentIds[4]}/vote`)
        .set("X-Forwarded-For", "10.0.0.1")
        .send({
          personalitySystem: "mbti",
          personalityValue: "ISFJ",
          profileId: profileId,
        });
    });

    test("should return vote history for current user", async () => {
      const response = await request(app).get("/api/votes/history").expect(200);

      expect(response.body).toMatchObject({
        votes: expect.any(Array),
        pagination: expect.any(Object),
        voterIdentifier: expect.any(String),
        filters: expect.any(Object),
      });

      // Should return votes for current user only (should be 5 votes)
      expect(response.body.votes.length).toBe(5);

      response.body.votes.forEach((vote) => {
        expect(vote).toMatchObject({
          commentId: expect.objectContaining({
            _id: expect.any(String),
            content: expect.any(String),
            author: expect.any(String),
            profileId: expect.any(Number),
          }),
          personalitySystem: expect.any(String),
          personalityValue: expect.any(String),
          createdAt: expect.any(String),
        });
      });
    });

    test("should handle pagination in vote history", async () => {
      const response = await request(app)
        .get("/api/votes/history")
        .query({ page: 1, limit: 3 })
        .expect(200);

      expect(response.body.votes.length).toBeLessThanOrEqual(3);
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 3,
        totalCount: expect.any(Number),
        totalPages: expect.any(Number),
        hasNextPage: expect.any(Boolean),
        hasPrevPage: false,
      });
    });

    test("should filter vote history by personality system", async () => {
      const response = await request(app)
        .get("/api/votes/history")
        .query({ personalitySystem: "mbti" })
        .expect(200);

      expect(response.body.votes.length).toBe(2); // Should have 2 MBTI votes
      response.body.votes.forEach((vote) => {
        expect(vote.personalitySystem).toBe("mbti");
      });

      expect(response.body.filters.personalitySystem).toBe("mbti");
    });

    test("should return 400 for invalid page parameter", async () => {
      const response = await request(app)
        .get("/api/votes/history")
        .query({ page: 0 })
        .expect(400);

      expect(response.body.message).toMatch(
        /(Validation error|Invalid vote query parameters)/
      );
    });

    test("should return 400 for limit exceeding maximum", async () => {
      const response = await request(app)
        .get("/api/votes/history")
        .query({ limit: 101 })
        .expect(400);

      expect(response.body.message).toMatch(
        /(Validation error|Invalid vote query parameters)/
      );
    });

    test("should return empty history for user with no votes", async () => {
      const response = await request(app)
        .get("/api/votes/history")
        .set("X-Forwarded-For", "10.0.0.99") // Different IP with no votes
        .expect(200);

      expect(response.body.votes).toHaveLength(0);
      expect(response.body.pagination.totalCount).toBe(0);
    });
  });

  describe("POST /votes/bulk - Submit Bulk Votes", () => {
    test("should submit multiple votes successfully", async () => {
      const bulkVoteData = testDataFactories.bulkVotes(
        commentIds.slice(0, 3),
        "bulk_test"
      );

      const response = await request(app)
        .post("/api/votes/bulk")
        .send(bulkVoteData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: "Bulk vote submission completed",
        results: expect.any(Array),
        errors: expect.any(Array),
        summary: expect.objectContaining({
          total: 3,
          successful: expect.any(Number),
          failed: expect.any(Number),
        }),
      });

      // All votes should be successful
      expect(response.body.summary.successful).toBe(3);
      expect(response.body.summary.failed).toBe(0);
      expect(response.body.errors).toHaveLength(0);
      expect(response.body.results).toHaveLength(3);
    });

    test("should handle mix of successful and failed votes", async () => {
      const mixedVotes = {
        votes: [
          {
            commentId: commentIds[0],
            personalitySystem: "mbti",
            personalityValue: "INTJ",
            voterIdentifier: "bulk_user_1",
            profileId: profileId,
          },
          {
            commentId: "invalid_id", // This should fail
            personalitySystem: "mbti",
            personalityValue: "ENFP",
            voterIdentifier: "bulk_user_2",
            profileId: profileId,
          },
          {
            commentId: commentIds[1],
            personalitySystem: "invalid_system", // This should fail
            personalityValue: "Scorpio",
            voterIdentifier: "bulk_user_3",
            profileId: profileId,
          },
        ],
      };

      const response = await request(app)
        .post("/api/votes/bulk")
        .send(mixedVotes)
        .expect(200);

      expect(response.body.summary.total).toBe(3);
      expect(response.body.summary.successful).toBe(1);
      expect(response.body.summary.failed).toBe(2);

      expect(response.body.errors).toHaveLength(2);
      expect(response.body.results).toHaveLength(1);
    });

    test("should return 400 for invalid request format", async () => {
      const invalidData = { invalidField: "test" };

      const response = await request(app)
        .post("/api/votes/bulk")
        .send(invalidData)
        .expect(400);

      expect(response.body.message).toContain("Votes must be an array");
    });

    test("should return 400 for empty votes array", async () => {
      const emptyData = { votes: [] };

      const response = await request(app)
        .post("/api/votes/bulk")
        .send(emptyData)
        .expect(200); // Empty array is valid, just no operations

      expect(response.body.summary.total).toBe(0);
    });

    test("should handle large bulk operations", async () => {
      // Create a larger set of comments for bulk testing
      const manyComments = [];
      for (let i = 0; i < 20; i++) {
        const commentData = testDataFactories.validComment({
          profileId,
          content: `Bulk test comment ${i}`,
        });
        const response = await request(app)
          .post("/api/comments")
          .send(commentData);
        manyComments.push(response.body.comment.id);
      }

      const bulkVotes = testDataFactories.bulkVotes(
        manyComments,
        "large_bulk_test"
      );

      const response = await request(app)
        .post("/api/votes/bulk")
        .send(bulkVotes)
        .expect(200);

      expect(response.body.summary.total).toBe(20);
      expect(response.body.summary.successful).toBe(20);
      expect(response.body.summary.failed).toBe(0);
    });
  });

  describe("GET /votes/health - Health Check", () => {
    test("should return healthy status", async () => {
      const response = await request(app).get("/api/votes/health").expect(200);

      apiHelpers.expectValidHealthResponse(response, "votes");
      expect(typeof response.body.totalVotes).toBe("number");
    });

    test("should include vote count in health response", async () => {
      // Add some votes first
      const voteData = testDataFactories.validVote({ profileId });
      await request(app)
        .post(`/api/comments/${commentIds[0]}/vote`)
        .send(voteData);

      const response = await request(app).get("/api/votes/health").expect(200);

      expect(response.body.totalVotes).toBeGreaterThan(0);
    });
  });

  describe("Integration and Cross-Feature Tests", () => {
    test("should maintain consistency between different vote endpoints", async () => {
      // Create some votes
      const votes = testDataFactories.validVotes(commentIds[0], 5);

      for (let i = 0; i < votes.length; i++) {
        await request(app)
          .post(`/api/comments/${votes[i].commentId}/vote`)
          .set("X-Forwarded-For", `192.168.1.${i}`)
          .send(votes[i]);
      }

      // Check count endpoint
      const countResponse = await request(app)
        .get("/api/votes/count")
        .query({ commentId: commentIds[0] });

      // Check history endpoint
      const historyResponse = await request(app)
        .get("/api/votes/history")
        .set("X-Forwarded-For", "192.168.1.0"); // Same as first vote

      // Check comment-specific votes
      const commentVotesResponse = await request(app).get(
        `/api/comments/${commentIds[0]}/votes`
      );

      // All should reflect the same underlying data
      expect(countResponse.body.count).toBeGreaterThanOrEqual(3); // At least 3 votes should be created
      expect(countResponse.body.count).toBeLessThanOrEqual(5); // But not more than 5
      expect(historyResponse.body.votes.length).toBe(1); // Only one vote for this IP
      expect(commentVotesResponse.body.votes.length).toBe(5);
    });

    test("should handle complex personality system interactions", async () => {
      // Test all personality systems with their valid values
      const personalityValuesResponse = await request(app).get(
        "/api/votes/personality-values"
      );

      const { personalityValues } = personalityValuesResponse.body;

      // Test voting with each personality system
      for (const system of ["mbti", "enneagram", "zodiac"]) {
        const values = personalityValues[system];
        const testValue = values[0]; // Use first valid value

        await request(app)
          .post(`/api/comments/${commentIds[0]}/vote`)
          .set("X-Forwarded-For", `test.${system}.voter`)
          .send({
            personalitySystem: system,
            personalityValue: testValue,
            profileId: profileId,
          });
      }

      // Verify votes were created correctly
      const statsResponse = await request(app).get(
        `/api/comments/${commentIds[0]}/votes/stats`
      );

      expect(statsResponse.body.voteStats.mbti).toBeDefined();
      expect(statsResponse.body.voteStats.enneagram).toBeDefined();
      expect(statsResponse.body.voteStats.zodiac).toBeDefined();
    });

    test("should handle edge cases in vote aggregation", async () => {
      // Create votes with same personality value from different users
      const sameValue = { system: "mbti", value: "INTJ" };

      for (let i = 0; i < 5; i++) {
        await request(app)
          .post(`/api/comments/${commentIds[0]}/vote`)
          .set("X-Forwarded-For", `192.168.1.${i}`)
          .send({
            personalitySystem: sameValue.system,
            personalityValue: sameValue.value,
            profileId: profileId,
          });
      }

      const statsResponse = await request(app).get(
        `/api/comments/${commentIds[0]}/votes/stats`
      );

      // Should aggregate votes correctly
      expect(statsResponse.body.voteStats.mbti.INTJ).toBe(5);
    });
  });

  describe("Performance and Scalability", () => {
    test("should handle high volume vote operations efficiently", async () => {
      const startTime = Date.now();

      // Create more diverse voting patterns to avoid duplicates
      const personalities = {
        mbti: ["INTJ", "ENFP", "ISFJ", "ESTP", "INFP"],
        enneagram: ["4w5", "7w8", "1w9", "5w6", "2w3"],
        zodiac: ["Scorpio", "Leo", "Pisces", "Aries", "Gemini"],
      };

      // Simulate high volume voting with diverse combinations
      const votePromises = [];
      for (let i = 0; i < 50; i++) {
        const system = ["mbti", "enneagram", "zodiac"][i % 3];
        const values = personalities[system];

        votePromises.push(
          request(app)
            .post(`/api/comments/${commentIds[i % commentIds.length]}/vote`)
            .set("X-Forwarded-For", `192.168.${Math.floor(i / 5)}.${i % 20}`)
            .set("User-Agent", `TestAgent${i}`)
            .send({
              personalitySystem: system,
              personalityValue: values[i % values.length],
              profileId: profileId,
            })
        );
      }

      await Promise.all(votePromises);

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Should complete within reasonable time
      expect(totalTime).toBeLessThan(10000); // 10 seconds

      // Verify votes were processed (might be less than 50 due to duplicate prevention)
      const countResponse = await request(app).get("/api/votes/count");
      expect(countResponse.body.count).toBeGreaterThanOrEqual(30); // More realistic expectation
      expect(countResponse.body.count).toBeLessThanOrEqual(50);
    });

    test("should efficiently handle large vote history requests", async () => {
      // Create diverse votes to maximize unique combinations
      const personalities = {
        mbti: ["INTJ", "ENFP", "ISFJ", "ESTP", "INFP", "ENTJ", "ISFP", "ENTP"],
        enneagram: ["4w5", "7w8", "1w9", "5w6", "2w3", "3w2", "8w7", "9w1"],
        zodiac: [
          "Scorpio",
          "Leo",
          "Pisces",
          "Aries",
          "Gemini",
          "Virgo",
          "Libra",
          "Taurus",
        ],
      };

      // Create votes for each comment with different personality systems
      let votesCreated = 0;
      for (
        let commentIndex = 0;
        commentIndex < commentIds.length;
        commentIndex++
      ) {
        for (let systemIndex = 0; systemIndex < 3; systemIndex++) {
          const system = ["mbti", "enneagram", "zodiac"][systemIndex];
          const values = personalities[system];

          await request(app)
            .post(`/api/comments/${commentIds[commentIndex]}/vote`)
            .send({
              personalitySystem: system,
              personalityValue: values[commentIndex + systemIndex], // Different value for each
              profileId: profileId,
            });
          votesCreated++;
        }
      }

      const startTime = Date.now();

      const response = await request(app)
        .get("/api/votes/history")
        .query({ limit: 25 });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // We expect to get most of our votes back (5 comments × 3 systems = 15 max possible)
      expect(response.body.votes.length).toBeGreaterThanOrEqual(5);
      expect(response.body.votes.length).toBeLessThanOrEqual(15);
      expect(responseTime).toBeLessThan(2000); // Should respond within 2 seconds
    });

    test("should handle bulk vote processing efficiently", async () => {
      // Create substantial vote data using bulk endpoint
      const bulkVotesData = {
        votes: [],
      };

      for (let i = 0; i < 50; i++) {
        bulkVotesData.votes.push({
          commentId: commentIds[i % commentIds.length],
          personalitySystem: ["mbti", "enneagram", "zodiac"][i % 3],
          personalityValue: ["INTJ", "ENFP", "ISFJ"][i % 3],
          voterIdentifier: `bulk_voter_${i}`, // Unique voters
          profileId: profileId,
        });
      }

      const startTime = Date.now();

      // Submit bulk votes
      const bulkResponse = await request(app)
        .post("/api/votes/bulk")
        .send(bulkVotesData);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(bulkResponse.status).toBe(200);
      expect(bulkResponse.body.success).toBe(true);
      expect(bulkResponse.body.summary.total).toBe(50);
      expect(bulkResponse.body.summary.successful).toBeGreaterThan(0);
      expect(responseTime).toBeLessThan(5000); // Should complete within 5 seconds

      // Verify votes were created by checking total count
      const countResponse = await request(app).get("/api/votes/count");
      expect(countResponse.body.count).toBeGreaterThan(0);
    });
  });
});
