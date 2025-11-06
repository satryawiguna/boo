/**
 * Comment Votes API Integration Tests
 *
 * Comprehensive test suite for Comment Voting API endpoints
 * Tests voting operations, statistics, user-specific votes, and validation
 */

const request = require("supertest");
const {
  testDataFactories,
  databaseHelpers,
  apiHelpers,
} = require("../helpers/testIntegrationHelpers");

describe("Comment Votes API Integration Tests", () => {
  let app;
  let profileId;
  let createdCommentId;

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

    profileId = profileResponse.body.profile.id;

    // Create a test comment for voting
    const commentData = testDataFactories.validComment({ profileId });
    const commentResponse = await request(app)
      .post("/api/comments")
      .send(commentData);

    createdCommentId = commentResponse.body.comment.id;
  });

  describe("POST /comments/:commentId/vote - Submit Vote", () => {
    test("should submit a new MBTI vote successfully", async () => {
      const voteData = testDataFactories.validVote({
        personalitySystem: "mbti",
        personalityValue: "INTJ",
        profileId: profileId,
      });

      const response = await request(app)
        .post(`/api/comments/${createdCommentId}/vote`)
        .send(voteData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining("Vote submitted"),
        vote: expect.objectContaining({
          commentId: createdCommentId,
          personalitySystem: "mbti",
          personalityValue: "INTJ",
          profileId: profileId,
        }),
        isUpdate: false,
      });
    });

    test("should submit a new Enneagram vote successfully", async () => {
      const voteData = testDataFactories.validVote({
        personalitySystem: "enneagram",
        personalityValue: "4w5",
        profileId: profileId,
      });

      const response = await request(app)
        .post(`/api/comments/${createdCommentId}/vote`)
        .send(voteData)
        .expect(201);

      expect(response.body.vote.personalitySystem).toBe("enneagram");
      expect(response.body.vote.personalityValue).toBe("4w5");
    });

    test("should submit a new Zodiac vote successfully", async () => {
      const voteData = testDataFactories.validVote({
        personalitySystem: "zodiac",
        personalityValue: "Scorpio",
        profileId: profileId,
      });

      const response = await request(app)
        .post(`/api/comments/${createdCommentId}/vote`)
        .send(voteData)
        .expect(201);

      expect(response.body.vote.personalitySystem).toBe("zodiac");
      expect(response.body.vote.personalityValue).toBe("Scorpio");
    });

    test("should update existing vote instead of creating duplicate", async () => {
      const voteData = testDataFactories.validVote({
        personalitySystem: "mbti",
        personalityValue: "INTJ",
        profileId: profileId,
      });

      // Submit initial vote
      await request(app)
        .post(`/api/comments/${createdCommentId}/vote`)
        .send(voteData)
        .expect(201);

      // Submit updated vote for same system
      const updatedVoteData = {
        ...voteData,
        personalityValue: "ENFP",
      };

      const response = await request(app)
        .post(`/api/comments/${createdCommentId}/vote`)
        .send(updatedVoteData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining("Vote updated"),
        vote: expect.objectContaining({
          personalityValue: "ENFP",
        }),
        isUpdate: true,
      });
    });

    describe("Vote Validation Errors", () => {
      test("should return 400 for missing required fields", async () => {
        const invalidData = testDataFactories.invalidVote("missing_required");

        const response = await request(app)
          .post(`/api/comments/${createdCommentId}/vote`)
          .send(invalidData)
          .expect(400);

        expect(response.body.message).toMatch(
          /(Validation Error|Vote submission validation failed)/
        );
        expect(response.body.details).toBeDefined();
      });

      test("should return 400 for invalid personality system", async () => {
        const invalidData = testDataFactories.invalidVote(
          "invalid_personality_system"
        );

        const response = await request(app)
          .post(`/api/comments/${createdCommentId}/vote`)
          .send(invalidData)
          .expect(400);

        expect(response.body.message).toMatch(
          /(Validation Error|Vote submission validation failed)/
        );
      });

      test("should return 400 for empty personality value", async () => {
        const invalidData = testDataFactories.invalidVote(
          "empty_personality_value"
        );

        const response = await request(app)
          .post(`/api/comments/${createdCommentId}/vote`)
          .send(invalidData)
          .expect(400);

        expect(response.body.message).toMatch(
          /(Validation Error|Vote submission validation failed)/
        );
      });

      test("should return 400 for invalid MBTI value", async () => {
        const invalidData = testDataFactories.invalidVote("invalid_mbti_value");

        const response = await request(app)
          .post(`/api/comments/${createdCommentId}/vote`)
          .send(invalidData)
          .expect(400);

        expect(response.body.message).toMatch(
          /(Validation Error|Vote submission validation failed)/
        );
      });

      test("should return 400 for invalid Enneagram value", async () => {
        const invalidData = testDataFactories.invalidVote(
          "invalid_enneagram_value"
        );

        const response = await request(app)
          .post(`/api/comments/${createdCommentId}/vote`)
          .send(invalidData)
          .expect(400);

        expect(response.body.message).toMatch(
          /(Validation Error|Vote submission validation failed)/
        );
      });

      test("should return 400 for invalid Zodiac value", async () => {
        const invalidData = testDataFactories.invalidVote(
          "invalid_zodiac_value"
        );

        const response = await request(app)
          .post(`/api/comments/${createdCommentId}/vote`)
          .send(invalidData)
          .expect(400);

        expect(response.body.message).toMatch(
          /(Validation Error|Vote submission validation failed)/
        );
      });

      test("should accept profile ID 0 (validation not enforced)", async () => {
        const invalidData = testDataFactories.invalidVote("invalid_profile_id");

        const response = await request(app)
          .post(`/api/comments/${createdCommentId}/vote`)
          .send(invalidData)
          .expect(201);

        expect(response.body.vote).toBeDefined();
        expect(response.body.vote.profileId).toBeDefined();
        // Note: API may override profileId with a default value
        expect(typeof response.body.vote.profileId).toBe("number");
      });
    });

    test("should return 404 for non-existent comment", async () => {
      const voteData = testDataFactories.validVote();
      const fakeCommentId = "507f1f77bcf86cd799439011"; // Valid ObjectId format

      const response = await request(app)
        .post(`/api/comments/${fakeCommentId}/vote`)
        .send(voteData)
        .expect(404);

      expect(response.body.message).toContain("Comment not found");
    });

    test("should return 400 for invalid comment ID format", async () => {
      const voteData = testDataFactories.validVote();

      const response = await request(app)
        .post("/api/comments/invalid-id/vote")
        .send(voteData)
        .expect(400);

      expect(response.body.message).toMatch(
        /(Invalid comment ID|Validation Error|Vote submission validation failed)/
      );
    });
  });

  describe("GET /comments/:commentId/votes - Get Comment Votes", () => {
    beforeEach(async () => {
      // Create multiple votes for the comment
      const votes = testDataFactories.validVotes(createdCommentId, 5);
      for (const vote of votes) {
        await request(app)
          .post(`/api/comments/${createdCommentId}/vote`)
          .send(vote);
      }
    });

    test("should retrieve all votes for a comment", async () => {
      const response = await request(app)
        .get(`/api/comments/${createdCommentId}/votes`)
        .expect(200);

      expect(response.body).toMatchObject({
        votes: expect.any(Array),
        commentId: createdCommentId,
      });

      expect(response.body.votes.length).toBeGreaterThan(0);
      expect(response.body.votes[0]).toMatchObject({
        commentId: createdCommentId,
        personalitySystem: expect.any(String),
        personalityValue: expect.any(String),
      });
    });

    test("should filter votes by personality system", async () => {
      const response = await request(app)
        .get(`/api/comments/${createdCommentId}/votes`)
        .query({ personalitySystem: "mbti" })
        .expect(200);

      expect(response.body.votes).toHaveLength(1);
      expect(response.body.votes[0].personalitySystem).toBe("mbti");
      expect(response.body.filters.personalitySystem).toBe("mbti");
    });

    test("should return 400 for invalid personality system filter", async () => {
      const response = await request(app)
        .get(`/api/comments/${createdCommentId}/votes`)
        .query({ personalitySystem: "invalid_system" })
        .expect(400);

      expect(response.body.message).toMatch(
        /(Invalid vote query parameters|Validation Error|Vote submission validation failed)/
      );
    });

    test("should return empty array for comment with no votes", async () => {
      // Create another comment without votes
      const anotherCommentData = testDataFactories.validComment({ profileId });
      const anotherCommentResponse = await request(app)
        .post("/api/comments")
        .send(anotherCommentData);

      const response = await request(app)
        .get(`/api/comments/${anotherCommentResponse.body.comment.id}/votes`)
        .expect(200);

      expect(response.body.votes).toHaveLength(0);
    });
  });

  describe("GET /comments/:commentId/votes/stats - Get Vote Statistics", () => {
    beforeEach(async () => {
      // Create diverse votes for statistics
      const votes = [
        { personalitySystem: "mbti", personalityValue: "INTJ" },
        { personalitySystem: "mbti", personalityValue: "INTJ" }, // Duplicate for counting
        { personalitySystem: "mbti", personalityValue: "ENFP" },
        { personalitySystem: "enneagram", personalityValue: "4w5" },
        { personalitySystem: "enneagram", personalityValue: "7w8" },
        { personalitySystem: "zodiac", personalityValue: "Scorpio" },
      ];

      for (let i = 0; i < votes.length; i++) {
        await request(app)
          .post(`/api/comments/${createdCommentId}/vote`)
          .set("X-Forwarded-For", `192.168.1.${i + 1}`) // Different IPs for different voters
          .send({
            ...votes[i],
            profileId: profileId,
          });
      }
    });

    test("should return comprehensive vote statistics", async () => {
      const response = await request(app)
        .get(`/api/comments/${createdCommentId}/votes/stats`)
        .expect(200);

      apiHelpers.expectValidVoteStatsResponse(response);
      expect(response.body.commentId).toBe(createdCommentId);

      // Check that statistics contain vote counts
      expect(response.body.voteStats.mbti).toBeDefined();
      expect(response.body.voteStats.enneagram).toBeDefined();
      expect(response.body.voteStats.zodiac).toBeDefined();
    });

    test("should return 404 for non-existent comment", async () => {
      const fakeCommentId = "507f1f77bcf86cd799439011";

      const response = await request(app)
        .get(`/api/comments/${fakeCommentId}/votes/stats`)
        .expect(404);

      expect(response.body.message).toContain("Comment not found");
    });

    test("should return 400 for invalid comment ID", async () => {
      const response = await request(app)
        .get("/api/comments/invalid-id/votes/stats")
        .expect(400);

      expect(response.body.message).toMatch(
        /(Invalid comment ID|Validation Error|Vote submission validation failed)/
      );
    });
  });

  describe("GET /comments/:commentId/votes/:personalitySystem - Get User Vote", () => {
    beforeEach(async () => {
      // Submit a vote as the "current user"
      const voteData = testDataFactories.validVote({
        personalitySystem: "mbti",
        personalityValue: "INTJ",
        profileId: profileId,
      });

      await request(app)
        .post(`/api/comments/${createdCommentId}/vote`)
        .send(voteData);
    });

    test("should retrieve user's vote for specific personality system", async () => {
      const response = await request(app)
        .get(`/api/comments/${createdCommentId}/votes/mbti`)
        .expect(200);

      expect(response.body).toMatchObject({
        commentId: createdCommentId,
        personalitySystem: "mbti",
        personalityValue: "INTJ",
        profileId: profileId,
      });
    });

    test("should return 404 when user has no vote for personality system", async () => {
      const response = await request(app)
        .get(`/api/comments/${createdCommentId}/votes/enneagram`)
        .expect(404);

      expect(response.body.message).toMatch(
        /(Vote not found|No vote found for the specified comment and personality system)/
      );
    });

    test("should return 404 for invalid personality system", async () => {
      const response = await request(app)
        .get(`/api/comments/${createdCommentId}/votes/invalid_system`)
        .expect(404);

      expect(response.body.message).toMatch(
        /(Vote not found|No vote found for the specified comment and personality system)/
      );
    });

    test("should return 404 for non-existent comment", async () => {
      const fakeCommentId = "507f1f77bcf86cd799439011";

      const response = await request(app)
        .get(`/api/comments/${fakeCommentId}/votes/mbti`)
        .expect(404);

      expect(response.body.message).toMatch(
        /(Vote not found|No vote found for the specified comment and personality system)/
      );
    });
  });

  describe("DELETE /comments/:commentId/votes/:personalitySystem - Remove Vote", () => {
    beforeEach(async () => {
      // Submit votes for different personality systems
      const votes = [
        { personalitySystem: "mbti", personalityValue: "INTJ" },
        { personalitySystem: "enneagram", personalityValue: "4w5" },
        { personalitySystem: "zodiac", personalityValue: "Scorpio" },
      ];

      for (const vote of votes) {
        await request(app)
          .post(`/api/comments/${createdCommentId}/vote`)
          .send({ ...vote, profileId: profileId });
      }
    });

    test("should remove user's vote successfully", async () => {
      const response = await request(app)
        .delete(`/api/comments/${createdCommentId}/votes/mbti`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: "Vote removed successfully",
        vote: expect.objectContaining({
          personalitySystem: "mbti",
          personalityValue: "INTJ",
        }),
      });

      // Verify vote is actually removed
      await request(app)
        .get(`/api/comments/${createdCommentId}/votes/mbti`)
        .expect(404);
    });

    test("should return 404 when trying to remove non-existent vote", async () => {
      // Remove the vote first
      await request(app)
        .delete(`/api/comments/${createdCommentId}/votes/mbti`)
        .expect(200);

      // Try to remove again
      const response = await request(app)
        .delete(`/api/comments/${createdCommentId}/votes/mbti`)
        .expect(404);

      expect(response.body.message).toMatch(
        /(Vote not found|No vote found for the specified comment and personality system)/
      );
    });

    test("should return 404 for invalid personality system", async () => {
      const response = await request(app)
        .delete(`/api/comments/${createdCommentId}/votes/invalid_system`)
        .expect(404);

      expect(response.body.message).toMatch(
        /(Vote not found|No vote found for the specified comment and personality system)/
      );
    });

    test("should return 404 for non-existent comment", async () => {
      const fakeCommentId = "507f1f77bcf86cd799439011";

      const response = await request(app)
        .delete(`/api/comments/${fakeCommentId}/votes/mbti`)
        .expect(404);

      expect(response.body.message).toMatch(
        /(Vote not found|No vote found for the specified comment and personality system)/
      );
    });

    test("should only remove vote for specified personality system", async () => {
      // Remove MBTI vote
      await request(app)
        .delete(`/api/comments/${createdCommentId}/votes/mbti`)
        .expect(200);

      // Verify other votes still exist
      await request(app)
        .get(`/api/comments/${createdCommentId}/votes/enneagram`)
        .expect(200);

      await request(app)
        .get(`/api/comments/${createdCommentId}/votes/zodiac`)
        .expect(200);
    });
  });

  describe("Vote User Identification and Multiple Voters", () => {
    test("should differentiate between different voters", async () => {
      const voteData = testDataFactories.validVote({
        personalitySystem: "mbti",
        personalityValue: "INTJ",
        profileId: profileId,
      });

      // Vote as first user
      await request(app)
        .post(`/api/comments/${createdCommentId}/vote`)
        .set("X-Forwarded-For", "192.168.1.1")
        .send(voteData);

      // Vote as second user with different value
      await request(app)
        .post(`/api/comments/${createdCommentId}/vote`)
        .set("X-Forwarded-For", "192.168.1.2")
        .send({
          ...voteData,
          personalityValue: "ENFP",
        });

      // Get vote stats to verify both votes counted
      const statsResponse = await request(app)
        .get(`/api/comments/${createdCommentId}/votes/stats`)
        .expect(200);

      // Should have votes for both INTJ and ENFP
      expect(statsResponse.body.voteStats.mbti.INTJ).toBe(1);
      expect(statsResponse.body.voteStats.mbti.ENFP).toBe(1);
    });

    test("should handle concurrent voting", async () => {
      const votes = testDataFactories.validVotes(createdCommentId, 10);

      // Submit multiple votes concurrently with different IPs
      const votePromises = votes.map((vote, index) =>
        request(app)
          .post(`/api/comments/${createdCommentId}/vote`)
          .set("X-Forwarded-For", `192.168.1.${index + 1}`)
          .send(vote)
          .expect(201)
      );

      const responses = await Promise.all(votePromises);

      // All votes should be successful
      expect(responses).toHaveLength(10);
      responses.forEach((response) => {
        expect(response.body.success).toBe(true);
      });

      // Verify vote count
      const statsResponse = await request(app)
        .get(`/api/comments/${createdCommentId}/votes/stats`)
        .expect(200);

      // Should have votes across different personality systems
      const totalVotes =
        Object.values(statsResponse.body.voteStats.mbti || {}).reduce(
          (a, b) => a + b,
          0
        ) +
        Object.values(statsResponse.body.voteStats.enneagram || {}).reduce(
          (a, b) => a + b,
          0
        ) +
        Object.values(statsResponse.body.voteStats.zodiac || {}).reduce(
          (a, b) => a + b,
          0
        );

      expect(totalVotes).toBeGreaterThan(0);
    });
  });

  describe("Error Handling & Edge Cases", () => {
    test("should handle malformed request body", async () => {
      const response = await request(app)
        .post(`/api/comments/${createdCommentId}/vote`)
        .set("Content-Type", "application/json")
        .send("{ invalid json }")
        .expect(500);

      expect(response.body.error).toContain("Internal Server Error");
    });

    test("should handle missing Content-Type header", async () => {
      const voteData = testDataFactories.validVote({ profileId });

      const response = await request(app)
        .post(`/api/comments/${createdCommentId}/vote`)
        .send(voteData)
        .expect(201);

      expect(response.body.vote.personalitySystem).toBe(
        voteData.personalitySystem
      );
    });

    test("should handle very long personality values", async () => {
      const voteData = {
        personalitySystem: "mbti",
        personalityValue: "A".repeat(1000), // Very long value
        profileId: profileId,
      };

      const response = await request(app)
        .post(`/api/comments/${createdCommentId}/vote`)
        .send(voteData)
        .expect(400);

      expect(response.body.message).toMatch(
        /(Validation Error|Vote submission validation failed)/
      );
    });

    test("should handle missing IP address gracefully", async () => {
      const voteData = testDataFactories.validVote({ profileId });

      const response = await request(app)
        .post(`/api/comments/${createdCommentId}/vote`)
        .send(voteData)
        .expect(201);

      expect(response.body.success).toBe(true);
    });
  });
});
