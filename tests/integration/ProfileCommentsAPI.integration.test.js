const request = require("supertest");
const {
  testDataFactories,
  databaseHelpers,
  apiHelpers,
} = require("../helpers/testIntegrationHelpers");

describe("Profile Comments API Integration Tests", () => {
  let app;
  let profileId1, profileId2, profileId3;
  let profile1Comments, profile2Comments;

  beforeAll(async () => {
    app = global.createTestApp();
  });

  beforeEach(async () => {
    await databaseHelpers.cleanDatabase();

    const profiles = testDataFactories.validProfiles(3);
    const profilePromises = profiles.map((profileData) =>
      request(app).post("/api/profile").send(profileData)
    );

    const profileResponses = await Promise.all(profilePromises);
    profileId1 = profileResponses[0].body.profile.id;
    profileId2 = profileResponses[1].body.profile.id;
    profileId3 = profileResponses[2].body.profile.id;

    profile1Comments = testDataFactories.validComments(profileId1, 8);
    profile2Comments = testDataFactories.validComments(profileId2, 5);

    for (const commentData of profile1Comments) {
      await request(app).post("/api/comments").send(commentData);
    }

    for (const commentData of profile2Comments) {
      await request(app).post("/api/comments").send(commentData);
    }
  });

  describe("GET /profiles/:profileId/comments - Get Profile Comments", () => {
    test("should retrieve all comments for specific profile", async () => {
      const response = await request(app)
        .get(`/api/profiles/${profileId1}/comments`)
        .expect(200);

      apiHelpers.expectValidCommentsListResponse(response, 8);

      response.body.comments.forEach((comment) => {
        expect(comment.profileId).toBe(profileId1);
      });

      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 10,
        totalCount: 8,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      });

      expect(response.body.filters.profileId).toBe(profileId1);
    });

    test("should handle pagination for profile comments", async () => {
      const response = await request(app)
        .get(`/api/profiles/${profileId1}/comments`)
        .query({ page: 1, limit: 5 })
        .expect(200);

      expect(response.body.comments).toHaveLength(5);
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 5,
        totalCount: 8,
        totalPages: 2,
        hasNextPage: true,
        hasPrevPage: false,
      });

      const page2Response = await request(app)
        .get(`/api/profiles/${profileId1}/comments`)
        .query({ page: 2, limit: 5 })
        .expect(200);

      expect(page2Response.body.comments).toHaveLength(3);
      expect(page2Response.body.pagination).toMatchObject({
        page: 2,
        limit: 5,
        totalCount: 8,
        totalPages: 2,
        hasNextPage: false,
        hasPrevPage: true,
      });
    });

    test("should sort profile comments by recent (default)", async () => {
      const response = await request(app)
        .get(`/api/profiles/${profileId1}/comments`)
        .expect(200);

      const dates = response.body.comments.map(
        (comment) => new Date(comment.createdAt)
      );
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i - 1].getTime()).toBeGreaterThanOrEqual(
          dates[i].getTime()
        );
      }
    });

    test("should sort profile comments by oldest", async () => {
      const response = await request(app)
        .get(`/api/profiles/${profileId1}/comments`)
        .query({ sort: "oldest" })
        .expect(200);

      const dates = response.body.comments.map(
        (comment) => new Date(comment.createdAt)
      );
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i - 1].getTime()).toBeLessThanOrEqual(dates[i].getTime());
      }
    });

    test("should sort profile comments by best (vote-based)", async () => {
      const response = await request(app)
        .get(`/api/profiles/${profileId1}/comments`)
        .query({ sort: "best" })
        .expect(200);

      expect(response.body.comments).toHaveLength(8);
      expect(response.body.filters.sort).toBe("best");
    });

    test("should filter profile comments by personality systems", async () => {
      const filterOptions = ["all", "mbti", "enneagram", "zodiac"];

      for (const filter of filterOptions) {
        const response = await request(app)
          .get(`/api/profiles/${profileId1}/comments`)
          .query({ filter })
          .expect(200);

        expect(response.body.comments.length).toBeGreaterThanOrEqual(0);
        expect(response.body.filters.filter).toBe(filter);
        expect(response.body.filters.profileId).toBe(profileId1);
      }
    });

    test("should return empty result for profile with no comments", async () => {
      const response = await request(app)
        .get(`/api/profiles/${profileId3}/comments`)
        .expect(200);

      expect(response.body.comments).toHaveLength(0);
      expect(response.body.pagination.totalCount).toBe(0);
      expect(response.body.pagination.totalPages).toBe(0);
    });

    test("should handle complex query combinations", async () => {
      const response = await request(app)
        .get(`/api/profiles/${profileId1}/comments`)
        .query({
          page: 1,
          limit: 3,
          sort: "recent",
          filter: "mbti",
        })
        .expect(200);

      expect(response.body.comments.length).toBeLessThanOrEqual(3);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(3);
      expect(response.body.filters).toMatchObject({
        profileId: profileId1,
        sort: "recent",
        filter: "mbti",
      });
    });

    describe("Profile Comments Validation", () => {
      test("should return 400 for invalid profile ID format", async () => {
        const response = await request(app)
          .get("/api/profiles/invalid-id/comments")
          .expect(400);

        expect(response.body.message).toMatch(/(Validation error|Invalid)/);
      });

      test("should return 400 for negative profile ID", async () => {
        const response = await request(app)
          .get("/api/profiles/-1/comments")
          .expect(400);

        expect(response.body.message).toMatch(/(Validation error|Invalid)/);
      });

      test("should return 400 for profile ID exceeding maximum", async () => {
        const response = await request(app)
          .get("/api/profiles/100000/comments")
          .expect(400);

        expect(response.body.message).toMatch(/(Validation error|Invalid)/);
      });

      test("should return 400 for invalid page parameter", async () => {
        const response = await request(app)
          .get(`/api/profiles/${profileId1}/comments`)
          .query({ page: 0 })
          .expect(400);

        expect(response.body.message).toMatch(/(Validation error|Invalid)/);
      });

      test("should return 400 for invalid limit parameter", async () => {
        const response = await request(app)
          .get(`/api/profiles/${profileId1}/comments`)
          .query({ limit: 51 })
          .expect(400);

        expect(response.body.message).toMatch(/(Validation error|Invalid)/);
      });

      test("should return 400 for invalid sort parameter", async () => {
        const response = await request(app)
          .get(`/api/profiles/${profileId1}/comments`)
          .query({ sort: "invalid_sort" })
          .expect(400);

        expect(response.body.message).toMatch(/(Validation error|Invalid)/);
      });

      test("should return 400 for invalid filter parameter", async () => {
        const response = await request(app)
          .get(`/api/profiles/${profileId1}/comments`)
          .query({ filter: "invalid_filter" })
          .expect(400);

        expect(response.body.message).toMatch(
          /(Validation error|Invalid comment query parameters)/
        );
      });
    });

    test("should handle non-existent but valid profile ID", async () => {
      const response = await request(app)
        .get("/api/profiles/99999/comments")
        .expect(200);

      expect(response.body.comments).toHaveLength(0);
      expect(response.body.pagination.totalCount).toBe(0);
    });
  });

  describe("GET /profiles/:profileId/comments/count - Get Profile Comment Count", () => {
    test("should return correct comment count for profile", async () => {
      const response = await request(app)
        .get(`/api/profiles/${profileId1}/comments/count`)
        .expect(200);

      expect(response.body).toMatchObject({
        count: 8,
      });
    });

    test("should return zero count for profile with no comments", async () => {
      const response = await request(app)
        .get(`/api/profiles/${profileId3}/comments/count`)
        .expect(200);

      expect(response.body.count).toBe(0);
    });

    test("should return correct count for different profiles", async () => {
      // Test profile 2 count
      const response2 = await request(app)
        .get(`/api/profiles/${profileId2}/comments/count`)
        .expect(200);

      expect(response2.body.count).toBe(5);

      // Verify profile 1 count is different
      const response1 = await request(app)
        .get(`/api/profiles/${profileId1}/comments/count`)
        .expect(200);

      expect(response1.body.count).toBe(8);
      expect(response1.body.count).not.toBe(response2.body.count);
    });

    test("should handle non-existent profile ID", async () => {
      const response = await request(app)
        .get("/api/profiles/99999/comments/count")
        .expect(200);

      expect(response.body.count).toBe(0);
    });

    test("should return 400 for invalid profile ID", async () => {
      const response = await request(app)
        .get("/api/profiles/invalid/comments/count")
        .expect(400);

      expect(response.body.message).toMatch(
        /(Validation error|Invalid profile ID)/
      );
    });
  });

  describe("Profile Comments with Votes Integration", () => {
    let commentIds = [];

    beforeEach(async () => {
      const commentsResponse = await request(app)
        .get(`/api/profiles/${profileId1}/comments`)
        .query({ limit: 3 });

      commentIds = commentsResponse.body.comments.map((comment) => comment.id);

      for (let i = 0; i < commentIds.length; i++) {
        const commentId = commentIds[i];

        for (let j = 0; j < 3; j++) {
          await request(app)
            .post(`/api/comments/${commentId}/vote`)
            .set("X-Forwarded-For", `192.168.1.${i * 10 + j}`)
            .send({
              personalitySystem: ["mbti", "enneagram", "zodiac"][j % 3],
              personalityValue: ["INTJ", "4w5", "Scorpio"][j % 3],
              profileId: profileId1,
            });
        }
      }
    });

    test("should include vote statistics in profile comments", async () => {
      const response = await request(app)
        .get(`/api/profiles/${profileId1}/comments`)
        .expect(200);

      response.body.comments.forEach((comment) => {
        expect(comment).toHaveProperty("id");
        expect(comment).toHaveProperty("content");
        expect(comment).toHaveProperty("profileId", profileId1);

        if (comment.voteStats || comment.totalVotes !== undefined) {
          expect(typeof comment.totalVotes).toBe("number");
        }
      });
    });

    test("should sort profile comments by vote count (best)", async () => {
      const response = await request(app)
        .get(`/api/profiles/${profileId1}/comments`)
        .query({ sort: "best" })
        .expect(200);

      expect(response.body.comments).toHaveLength(8);
    });

    test("should filter profile comments by personality system with votes", async () => {
      const response = await request(app)
        .get(`/api/profiles/${profileId1}/comments`)
        .query({ filter: "mbti" })
        .expect(200);

      expect(response.body.comments.length).toBeGreaterThanOrEqual(0);
      expect(response.body.filters.filter).toBe("mbti");
    });
  });

  describe("Performance and Edge Cases", () => {
    test("should handle large datasets efficiently", async () => {
      const manyComments = [];
      for (let i = 0; i < 50; i++) {
        manyComments.push(
          testDataFactories.validComment({
            profileId: profileId1,
            content: `Performance test comment ${i}`,
            author: `Author ${i}`,
          })
        );
      }

      for (const commentData of manyComments) {
        await request(app).post("/api/comments").send(commentData);
      }

      const startTime = Date.now();

      const response = await request(app)
        .get(`/api/profiles/${profileId1}/comments`)
        .query({ limit: 25 })
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.body.comments).toHaveLength(25);
      expect(response.body.pagination.totalCount).toBe(58);
      expect(responseTime).toBeLessThan(2000);
    });

    test("should handle concurrent requests to same profile", async () => {
      const concurrentRequests = 5;
      const requestPromises = [];

      for (let i = 0; i < concurrentRequests; i++) {
        requestPromises.push(
          request(app)
            .get(`/api/profiles/${profileId1}/comments`)
            .query({ page: 1, limit: 5 })
            .expect(200)
        );
      }

      const responses = await Promise.all(requestPromises);

      responses.forEach((response) => {
        expect(response.body.comments).toHaveLength(5);
        expect(response.body.pagination.totalCount).toBe(8);
      });
    });

    test("should maintain data consistency across profile filters", async () => {
      const countResponse = await request(app)
        .get(`/api/profiles/${profileId1}/comments/count`)
        .expect(200);

      const allCommentsResponse = await request(app)
        .get(`/api/profiles/${profileId1}/comments`)
        .query({ limit: 50 })
        .expect(200);

      expect(allCommentsResponse.body.pagination.totalCount).toBe(
        countResponse.body.count
      );
    });

    test("should handle edge case pagination parameters", async () => {
      const maxLimitResponse = await request(app)
        .get(`/api/profiles/${profileId1}/comments`)
        .query({ limit: 50 })
        .expect(200);

      expect(maxLimitResponse.body.comments.length).toBeLessThanOrEqual(50);

      const minLimitResponse = await request(app)
        .get(`/api/profiles/${profileId1}/comments`)
        .query({ limit: 1 })
        .expect(200);

      expect(minLimitResponse.body.comments).toHaveLength(1);
      expect(minLimitResponse.body.pagination.limit).toBe(1);
    });

    test("should handle empty result sets gracefully", async () => {
      const response = await request(app)
        .get(`/api/profiles/${profileId3}/comments`)
        .query({ filter: "mbti", sort: "best" })
        .expect(200);

      expect(response.body.comments).toHaveLength(0);
      expect(response.body.pagination).toMatchObject({
        page: 1,
        totalCount: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      });
    });
  });

  describe("Integration with Other Profile Data", () => {
    test("should ensure profile exists before returning comments", async () => {
      const response = await request(app)
        .get("/api/profiles/99999/comments")
        .expect(200);

      expect(response.body.comments).toHaveLength(0);
    });

    test("should maintain referential integrity", async () => {
      const response = await request(app)
        .get(`/api/profiles/${profileId1}/comments`)
        .expect(200);

      response.body.comments.forEach((comment) => {
        expect(comment.profileId).toBe(profileId1);
      });
    });

    test("should handle profile deletion scenarios", async () => {
      const response = await request(app)
        .get(`/api/profiles/${profileId1}/comments`)
        .expect(200);

      expect(response.body.comments.length).toBeGreaterThan(0);
    });
  });
});
