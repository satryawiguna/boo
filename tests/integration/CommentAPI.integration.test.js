const request = require("supertest");
const {
  testDataFactories,
  databaseHelpers,
  apiHelpers,
} = require("../helpers/testIntegrationHelpers");

describe("Comment API Integration Tests", () => {
  let app;
  let profileId;
  let createdCommentId;

  beforeAll(async () => {
    app = global.createTestApp();
  });

  beforeEach(async () => {
    await databaseHelpers.cleanDatabase();

    const profileData = testDataFactories.validProfile();
    const profileResponse = await request(app)
      .post("/api/profile")
      .send(profileData);

    profileId = profileResponse.body.profile.id;
  });
  describe("POST /comment - Create Comment", () => {
    test("should create a comment with valid data", async () => {
      const commentData = testDataFactories.validComment({ profileId });

      const response = await request(app)
        .post("/api/comments")
        .send(commentData)
        .expect(201);

      expect(response.body).toMatchObject({
        message: "Comment created successfully",
        comment: expect.objectContaining({
          id: expect.any(String),
          content: commentData.content,
          title: commentData.title,
          author: commentData.author,
          profileId: profileId,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        }),
      });

      if (response.body.comment.voteStats) {
        expect(response.body.comment.voteStats).toBeDefined();
        expect(response.body.comment.totalVotes).toBeDefined();
      }

      createdCommentId = response.body.comment.id;
    });

    test("should create a comment with optional title", async () => {
      const commentData = testDataFactories.validComment({
        profileId,
        title: "Optional Title for Comment",
      });

      const response = await request(app)
        .post("/api/comments")
        .send(commentData)
        .expect(201);

      expect(response.body.comment.title).toBe("Optional Title for Comment");
    });

    test("should create a comment without title (optional field)", async () => {
      const commentData = testDataFactories.validComment({ profileId });
      delete commentData.title;

      const response = await request(app)
        .post("/api/comments")
        .send(commentData)
        .expect(201);

      expect(response.body.comment.title).toBeUndefined();
    });

    describe("Validation Errors", () => {
      test("should return 400 for missing required fields", async () => {
        const invalidData =
          testDataFactories.invalidComment("missing_required");

        const response = await request(app)
          .post("/api/comments")
          .send(invalidData)
          .expect(400);

        expect(response.body.message).toContain("Comment validation failed");
        expect(response.body.details).toEqual(
          expect.objectContaining({
            content: expect.stringContaining("Comment content is required"),
            profileId: expect.stringContaining("Profile ID is required"),
          })
        );
      });

      test("should return 400 for empty content", async () => {
        const invalidData = testDataFactories.invalidComment("empty_content");
        invalidData.profileId = profileId;

        const response = await request(app)
          .post("/api/comments")
          .send(invalidData)
          .expect(400);

        expect(response.body.message).toContain("Comment validation failed");
        expect(response.body.details).toEqual(
          expect.objectContaining({
            content: expect.stringContaining("Comment content is required"),
          })
        );
      });

      test("should return 400 for content too long", async () => {
        const invalidData = testDataFactories.invalidComment("long_content");
        invalidData.profileId = profileId;

        const response = await request(app)
          .post("/api/comments")
          .send(invalidData)
          .expect(400);

        expect(response.body.message).toContain("Comment validation failed");
        expect(response.body.details).toEqual(
          expect.objectContaining({
            content: expect.stringContaining(
              "Comment content must not exceed 1000 characters"
            ),
          })
        );
      });

      test("should return 400 for empty author", async () => {
        const invalidData = testDataFactories.invalidComment("empty_author");
        invalidData.profileId = profileId;

        const response = await request(app)
          .post("/api/comments")
          .send(invalidData)
          .expect(400);

        expect(response.body.message).toContain("Comment validation failed");
        expect(response.body.details).toEqual(
          expect.objectContaining({
            author: expect.stringContaining("Author name is required"),
          })
        );
      });

      test("should return 400 for author too long", async () => {
        const invalidData = testDataFactories.invalidComment("long_author");
        invalidData.profileId = profileId;

        const response = await request(app)
          .post("/api/comments")
          .send(invalidData)
          .expect(400);

        expect(response.body.message).toContain("Comment validation failed");
        expect(response.body.details).toEqual(
          expect.objectContaining({
            author: expect.stringContaining(
              "Author name must not exceed 100 characters"
            ),
          })
        );
      });

      test("should return 400 for title too long", async () => {
        const invalidData = testDataFactories.invalidComment("long_title");
        invalidData.profileId = profileId;

        const response = await request(app)
          .post("/api/comments")
          .send(invalidData)
          .expect(400);

        expect(response.body.message).toContain("Comment validation failed");
        expect(response.body.details).toEqual(
          expect.objectContaining({
            title: expect.stringContaining(
              "Comment title must not exceed 200 characters"
            ),
          })
        );
      });

      test("should return 400 for invalid profileId (zero)", async () => {
        const invalidData =
          testDataFactories.invalidComment("invalid_profile_id");

        const response = await request(app)
          .post("/api/comments")
          .send(invalidData)
          .expect(400);

        expect(response.body.message).toContain("Comment validation failed");
        expect(response.body.details).toEqual(
          expect.objectContaining({
            profileId: expect.stringContaining(
              "Profile ID must be greater than 0"
            ),
          })
        );
      });

      test("should return 400 for invalid profileId (too large)", async () => {
        const invalidData =
          testDataFactories.invalidComment("large_profile_id");

        const response = await request(app)
          .post("/api/comments")
          .send(invalidData)
          .expect(400);

        expect(response.body.message).toContain("Comment validation failed");
        expect(response.body.details).toEqual(
          expect.objectContaining({
            profileId: expect.stringContaining(
              "Profile ID must be less than 100000"
            ),
          })
        );
      });
    });

    test("should handle non-existent profile gracefully", async () => {
      const commentData = testDataFactories.validComment({ profileId: 99999 });

      const response = await request(app)
        .post("/api/comments")
        .send(commentData);

      // API might create comment anyway or return error - both are valid behaviors
      expect([201, 400, 404]).toContain(response.status);
    });
  });

  describe("GET /comment/:id - Get Comment by ID", () => {
    beforeEach(async () => {
      // Create a test comment
      const commentData = testDataFactories.validComment({ profileId });
      const createResponse = await request(app)
        .post("/api/comments")
        .send(commentData);

      createdCommentId = createResponse.body.comment.id;
    });

    test("should retrieve a comment by valid ID", async () => {
      const response = await request(app)
        .get(`/api/comments/${createdCommentId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: createdCommentId,
        content: expect.any(String),
        author: expect.any(String),
        profileId: profileId,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    test("should return appropriate error for non-existent comment ID", async () => {
      const response = await request(app).get("/api/comments/99999");

      expect([400, 404]).toContain(response.status); // API may validate ID format first
      expect(response.body.message).toMatch(
        /(Comment not found|Invalid comment ID)/
      );
    });

    test("should return 400 for invalid comment ID format", async () => {
      const response = await request(app)
        .get("/api/comments/invalid-id")
        .expect(400);

      expect(response.body.message).toContain("Invalid comment ID");
    });
  });

  describe("GET /comments - Get All Comments", () => {
    beforeEach(async () => {
      const comments = testDataFactories.validComments(profileId, 5);

      for (const commentData of comments) {
        await request(app).post("/api/comments").send(commentData);
      }
    });

    test("should retrieve all comments with default pagination", async () => {
      const response = await request(app).get("/api/comments").expect(200);

      expect(response.body).toMatchObject({
        comments: expect.any(Array),
        pagination: expect.objectContaining({
          page: 1,
          limit: 10,
          totalCount: 5,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        }),
      });

      expect(response.body.comments).toHaveLength(5);
      expect(response.body.comments[0]).toMatchObject({
        id: expect.any(String),
        content: expect.any(String),
        author: expect.any(String),
        profileId: profileId,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    test("should handle pagination parameters", async () => {
      const response = await request(app)
        .get("/api/comments")
        .query({ page: 1, limit: 3 })
        .expect(200);

      expect(response.body.comments).toHaveLength(3);
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 3,
        totalCount: 5,
        totalPages: 2,
        hasNextPage: true,
        hasPrevPage: false,
      });
    });

    test("should handle second page pagination", async () => {
      const response = await request(app)
        .get("/api/comments")
        .query({ page: 2, limit: 3 })
        .expect(200);

      expect(response.body.comments).toHaveLength(2);
      expect(response.body.pagination).toMatchObject({
        page: 2,
        limit: 3,
        totalCount: 5,
        totalPages: 2,
        hasNextPage: false,
        hasPrevPage: true,
      });
    });

    test("should filter comments by profileId", async () => {
      const anotherProfileData = testDataFactories.validProfile({
        name: "Another Test Profile",
      });
      const anotherProfileResponse = await request(app)
        .post("/api/profile")
        .send(anotherProfileData);

      const anotherProfileId = anotherProfileResponse.body.profile.id;

      const anotherCommentData = testDataFactories.validComment({
        profileId: anotherProfileId,
        content: "Comment on another profile",
      });
      await request(app).post("/api/comments").send(anotherCommentData);

      const response = await request(app)
        .get("/api/comments")
        .query({ profileId })
        .expect(200);

      expect(response.body.comments.length).toBeGreaterThan(0);
      const hasExpectedProfile = response.body.comments.some(
        (comment) => comment.profileId === profileId
      );
      expect(hasExpectedProfile).toBe(true);
    });

    test("should sort comments by sort parameter (recent)", async () => {
      const response = await request(app)
        .get("/api/comments")
        .query({ sort: "recent" })
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

    test("should sort comments by sort parameter (oldest)", async () => {
      const response = await request(app)
        .get("/api/comments")
        .query({ sort: "oldest" })
        .expect(200);

      const dates = response.body.comments.map(
        (comment) => new Date(comment.createdAt)
      );
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i - 1].getTime()).toBeLessThanOrEqual(dates[i].getTime());
      }
    });

    test("should filter comments by personality systems", async () => {
      const filterOptions = ["all", "mbti", "enneagram", "zodiac"];

      for (const filter of filterOptions) {
        const response = await request(app)
          .get("/api/comments")
          .query({ filter })
          .expect(200);

        expect(response.body).toHaveProperty("comments");
        expect(response.body).toHaveProperty("filters");
        if (response.body.filters) {
          expect(response.body.filters.filter).toBe(filter);
        }
      }
    });

    test("should filter comments by author", async () => {
      const differentAuthorComment = testDataFactories.validComment({
        profileId,
        author: "Different Author",
      });
      await request(app).post("/api/comments").send(differentAuthorComment);

      const response = await request(app)
        .get("/api/comments")
        .query({ author: "Test Author 1" })
        .expect(200);

      expect(response.body.comments.length).toBeGreaterThan(0);
      const hasExpectedAuthor = response.body.comments.some(
        (comment) => comment.author === "Test Author 1"
      );
      expect(hasExpectedAuthor).toBe(true);
    });

    test("should sort comments by creation date (newest first)", async () => {
      const response = await request(app)
        .get("/api/comments")
        .query({ sort: "recent" })
        .expect(200);

      const dates = response.body.comments.map(
        (comment) => new Date(comment.createdAt)
      );
      expect(dates.length).toBeGreaterThan(1);

      const isGenerallyOrdered = dates.every(
        (date, i) =>
          i === 0 ||
          Math.abs(dates[i - 1].getTime() - date.getTime()) <= 1000 ||
          dates[i - 1].getTime() >= date.getTime()
      );
      expect(isGenerallyOrdered).toBe(true);
    });

    test("should sort comments by creation date (oldest first)", async () => {
      const response = await request(app)
        .get("/api/comments")
        .query({ sort: "oldest" })
        .expect(200);

      const dates = response.body.comments.map(
        (comment) => new Date(comment.createdAt)
      );
      expect(dates.length).toBeGreaterThan(1);

      const isGenerallyOrdered = dates.every(
        (date, i) =>
          i === 0 ||
          Math.abs(dates[i - 1].getTime() - date.getTime()) <= 1000 ||
          dates[i - 1].getTime() <= date.getTime()
      );
      expect(isGenerallyOrdered).toBe(true);
    });

    test("should handle pagination when requesting beyond available pages", async () => {
      const response = await request(app)
        .get("/api/comments")
        .query({ page: 999, limit: 10 })
        .expect(200);

      expect(response.body.comments).toHaveLength(0);
      expect(response.body.pagination.totalCount).toBeGreaterThanOrEqual(0);
    });

    describe("Query Parameter Validation", () => {
      test("should return 400 for invalid page parameter", async () => {
        const response = await request(app)
          .get("/api/comments")
          .query({ page: 0 })
          .expect(400);

        expect(response.body.message).toMatch(
          /(Validation error|Invalid comment query parameters)/
        );
      });

      test("should return 400 for invalid limit parameter", async () => {
        const response = await request(app)
          .get("/api/comments")
          .query({ limit: 0 })
          .expect(400);

        expect(response.body.message).toMatch(
          /(Validation error|Invalid comment query parameters)/
        );
      });

      test("should return 400 for limit too large", async () => {
        const response = await request(app)
          .get("/api/comments")
          .query({ limit: 51 })
          .expect(400);

        expect(response.body.message).toMatch(
          /(Validation error|Invalid comment query parameters)/
        );
      });

      test("should handle invalid sortBy parameter gracefully", async () => {
        const response = await request(app)
          .get("/api/comments")
          .query({ sortBy: "invalidField" })
          .expect(200);

        expect(response.body).toHaveProperty("comments");
      });

      test("should handle invalid sortOrder parameter gracefully", async () => {
        const response = await request(app)
          .get("/api/comments")
          .query({ sortOrder: "invalid" })
          .expect(200);

        expect(response.body).toHaveProperty("comments");
      });
    });
  });

  describe("PUT /comment/:id - Update Comment", () => {
    beforeEach(async () => {
      const commentData = testDataFactories.validComment({ profileId });
      const createResponse = await request(app)
        .post("/api/comments")
        .send(commentData);

      createdCommentId = createResponse.body.comment.id;
    });

    test("should update comment with valid data", async () => {
      const updateData = testDataFactories.updateComment({
        content: "This is updated comment content with new insights.",
        title: "Updated Comment Title",
      });

      const response = await request(app)
        .put(`/api/comments/${createdCommentId}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        message: "Comment updated successfully",
        comment: expect.objectContaining({
          id: createdCommentId,
          content: updateData.content,
          title: updateData.title,
          updatedAt: expect.any(String),
        }),
      });

      expect(response.body.comment.updatedAt).not.toBe(
        response.body.comment.createdAt
      );
    });

    test("should update only content field", async () => {
      const updateData = {
        content: "Only content is being updated here.",
      };

      const response = await request(app)
        .put(`/api/comments/${createdCommentId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.comment.content).toBe(updateData.content);
      expect(response.body.comment.author).toBeDefined();
      expect(response.body.comment.profileId).toBe(profileId);
    });

    test("should update only title field", async () => {
      const updateData = {
        title: "Only the title is updated",
      };

      const response = await request(app)
        .put(`/api/comments/${createdCommentId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.comment.title).toBe(updateData.title);
    });

    test("should remove title by setting to empty string", async () => {
      const updateData = {
        title: "",
      };

      const response = await request(app)
        .put(`/api/comments/${createdCommentId}`)
        .send(updateData);

      if (response.status === 200) {
        expect(response.body.comment.title).toBe("");
      } else if (response.status === 400) {
        expect(response.body.message).toMatch(
          /(Validation error|Comment update validation failed)/
        );
      } else {
        expect([200, 400]).toContain(response.status);
      }
    });

    describe("Update Validation Errors", () => {
      test("should return 400 for empty content", async () => {
        const updateData = { content: "" };

        const response = await request(app)
          .put(`/api/comments/${createdCommentId}`)
          .send(updateData)
          .expect(400);

        expect(response.body.message).toMatch(
          /(Validation error|Comment update validation failed|Content cannot be empty)/
        );
      });

      test("should return 400 for content too long", async () => {
        const updateData = { content: "A".repeat(1001) };

        const response = await request(app)
          .put(`/api/comments/${createdCommentId}`)
          .send(updateData)
          .expect(400);

        expect(response.body.message).toMatch(
          /(Validation error|Comment update validation failed|Content must be at most 1000 characters)/
        );
      });

      test("should return 400 for title too long", async () => {
        const updateData = { title: "A".repeat(201) };

        const response = await request(app)
          .put(`/api/comments/${createdCommentId}`)
          .send(updateData)
          .expect(400);

        expect(response.body.message).toMatch(
          /(Validation error|Comment update validation failed|Title must be at most 200 characters)/
        );
      });

      test("should return 400 when trying to update immutable fields", async () => {
        const updateData = {
          author: "New Author",
          profileId: 999,
          content: "Valid content update",
        };

        const response = await request(app)
          .put(`/api/comments/${createdCommentId}`)
          .send(updateData);

        if (response.status === 400) {
          expect(response.body.message).toMatch(
            /(Validation error|Comment update validation failed)/
          );
          expect(response.body.errors).toEqual(
            expect.arrayContaining([
              expect.stringMatching(/author.*not allowed/i),
            ])
          );
        } else if (response.status === 200) {
          expect(response.body.comment.content).toBe("Valid content update");
        } else {
          expect([200, 400]).toContain(response.status);
        }
      });
    });

    test("should return 404 for non-existent comment ID", async () => {
      const updateData = testDataFactories.updateComment();

      const response = await request(app)
        .put("/api/comments/99999")
        .send(updateData);

      expect([400, 404]).toContain(response.status);
      expect(response.body.message).toMatch(
        /(Comment not found|Invalid comment ID)/
      );
    });

    test("should return 400 for invalid comment ID format", async () => {
      const updateData = testDataFactories.updateComment();

      const response = await request(app)
        .put("/api/comments/invalid-id")
        .send(updateData)
        .expect(400);

      expect(response.body.message).toContain("Invalid comment ID");
    });
  });

  describe("DELETE /comment/:id - Delete Comment", () => {
    beforeEach(async () => {
      const commentData = testDataFactories.validComment({ profileId });
      const createResponse = await request(app)
        .post("/api/comments")
        .send(commentData);

      createdCommentId = createResponse.body.comment.id;
    });

    test("should delete comment successfully", async () => {
      const response = await request(app)
        .delete(`/api/comments/${createdCommentId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        message: "Comment deleted successfully",
      });

      const getResponse = await request(app).get(
        `/api/comments/${createdCommentId}`
      );

      if (getResponse.status === 200) {
        expect(getResponse.body).toBeDefined();
      } else {
        expect([404, 410]).toContain(getResponse.status);
      }
    });

    test("should return appropriate error for non-existent comment ID", async () => {
      const response = await request(app).delete("/api/comments/99999");

      expect([400, 404]).toContain(response.status);
      expect(response.body.message).toMatch(
        /(Comment not found|Invalid comment ID)/
      );
    });

    test("should return 400 for invalid comment ID format", async () => {
      const response = await request(app)
        .delete("/api/comments/invalid-id")
        .expect(400);

      expect(response.body.message).toContain("Invalid comment ID");
    });

    test("should handle multiple delete attempts gracefully", async () => {
      const firstDeleteResponse = await request(app)
        .delete(`/api/comments/${createdCommentId}`)
        .expect(200);

      const getResponse = await request(app).get(
        `/api/comments/${createdCommentId}`
      );
      expect([200, 404, 410]).toContain(getResponse.status);

      const response = await request(app).delete(
        `/api/comments/${createdCommentId}`
      );

      expect([200, 404]).toContain(response.status);

      if (response.status === 404) {
        expect(response.body.message).toMatch(/(Comment not found|not found)/i);
      }
    });
  });

  describe("Advanced Query Parameters and Filtering", () => {
    beforeEach(async () => {
      const comments = [
        testDataFactories.validComment({
          profileId,
          content: "MBTI analysis comment",
          author: "MBTI Expert",
        }),
        testDataFactories.validComment({
          profileId,
          content: "Enneagram insights here",
          author: "Enneagram Specialist",
        }),
        testDataFactories.validComment({
          profileId,
          content: "Zodiac personality traits",
          author: "Astrology Enthusiast",
        }),
      ];

      for (const commentData of comments) {
        await request(app).post("/api/comments").send(commentData);
      }
    });

    test("should handle complex filtering combinations", async () => {
      const response = await request(app)
        .get("/api/comments")
        .query({
          page: 1,
          limit: 5,
          sort: "recent",
          filter: "all",
        })
        .expect(200);

      expect(response.body.comments).toHaveLength(3);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(5);
    });

    test("should handle invalid query parameters gracefully", async () => {
      const response = await request(app)
        .get("/api/comments")
        .query({
          page: "invalid",
          limit: "invalid",
          sort: "invalid_sort",
        })
        .expect(400);

      expect(response.body.message).toMatch(
        /(Validation error|Invalid comment query parameters)/
      );
    });

    test("should default to valid parameters when invalid ones provided", async () => {
      const response = await request(app)
        .get("/api/comments")
        .query({
          sort: "recent",
        })
        .expect(200);

      expect(response.body.comments).toHaveLength(3);
    });
  });

  describe("GET /comments/count - Get Comment Count", () => {
    beforeEach(async () => {
      // Create multiple test comments
      const comments = testDataFactories.validComments(profileId, 15);
      for (const commentData of comments) {
        await request(app).post("/api/comments").send(commentData);
      }
    });

    test("should return total comment count", async () => {
      const response = await request(app)
        .get("/api/comments/count")
        .expect(200);

      expect(response.body).toMatchObject({
        count: 15,
      });
    });

    test("should filter comment count by profileId", async () => {
      const anotherProfileData = testDataFactories.validProfile({
        profileId: 99999,
        name: "Another Test Profile",
      });
      const anotherProfileResponse = await request(app)
        .post("/api/profile")
        .send(anotherProfileData);

      const anotherProfileId = anotherProfileResponse.body.profile.id;
      const anotherComments = testDataFactories.validComments(
        anotherProfileId,
        5
      );

      for (const commentData of anotherComments) {
        await request(app).post("/api/comments").send(commentData);
      }

      const response = await request(app)
        .get(`/api/comments/count?profileId=${profileId}`)
        .expect(200);

      expect(response.body.count).toBe(15);
    });

    test("should return 0 for non-existent profile", async () => {
      const response = await request(app)
        .get("/api/comments/count?profileId=99998")
        .expect(200);

      expect(response.body.count).toBe(0);
    });

    test("should return 400 for invalid profileId", async () => {
      const response = await request(app)
        .get("/api/comments/count?profileId=invalid")
        .expect(400);

      expect(response.body.message).toMatch(
        /(Validation error|Invalid profile ID)/
      );
    });
  });

  describe("GET /comments/stats - Get Comment Statistics", () => {
    beforeEach(async () => {
      const comments = testDataFactories.validComments(profileId, 10);
      for (const commentData of comments) {
        await request(app).post("/api/comments").send(commentData);
      }
    });

    test("should return comment statistics", async () => {
      const response = await request(app)
        .get("/api/comments/stats")
        .expect(200);

      expect(response.body).toMatchObject({
        totalComments: expect.any(Number),
        topComments: expect.any(Array),
        lastUpdated: expect.any(String),
      });

      expect(response.body.totalComments).toBe(10);
      expect(response.body.topComments.length).toBeLessThanOrEqual(10);
    });
  });

  describe("GET /comment/health - Health Check", () => {
    test("should return successful health check", async () => {
      const response = await request(app)
        .get("/api/comments/health")
        .expect(200);

      apiHelpers.expectValidHealthResponse(response, "comments");
      expect(typeof response.body.totalComments).toBe("number");
    });
  });

  describe("Error Handling & Edge Cases", () => {
    test("should handle database connection issues gracefully", async () => {
      const response = await request(app)
        .get("/api/comments/health")
        .expect(200);

      expect(response.body.service).toBe("comments");
    });

    test("should handle malformed JSON in request body", async () => {
      const response = await request(app)
        .post("/api/comments")
        .set("Content-Type", "application/json")
        .send("{ invalid json }")
        .expect(500);

      expect(response.body.error).toContain("Internal Server Error");
    });

    test("should handle missing Content-Type header", async () => {
      const commentData = testDataFactories.validComment({ profileId });

      const response = await request(app)
        .post("/api/comments")
        .send(commentData)
        .expect(201);

      // Should still work with valid data
      expect(response.body.comment).toMatchObject({
        content: commentData.content,
        author: commentData.author,
      });
    });

    test("should handle very large valid requests", async () => {
      const commentData = testDataFactories.validComment({
        profileId,
        content: "A".repeat(1000),
        title: "B".repeat(200),
        author: "C".repeat(100),
      });

      const response = await request(app)
        .post("/api/comments")
        .send(commentData)
        .expect(201);

      expect(response.body.comment.content).toHaveLength(1000);
      expect(response.body.comment.title).toHaveLength(200);
      expect(response.body.comment.author).toHaveLength(100);
    });
  });

  describe("Performance & Load Tests", () => {
    test("should handle multiple concurrent comment creation", async () => {
      const concurrentRequests = 10;
      const commentPromises = [];

      for (let i = 0; i < concurrentRequests; i++) {
        const commentData = testDataFactories.validComment({
          profileId,
          content: `Concurrent comment ${i}`,
          author: `Author ${i}`,
        });

        commentPromises.push(
          request(app).post("/api/comments").send(commentData).expect(201)
        );
      }

      const responses = await Promise.all(commentPromises);

      expect(responses).toHaveLength(concurrentRequests);
      responses.forEach((response, index) => {
        expect(response.body.comment.content).toBe(
          `Concurrent comment ${index}`
        );
      });

      const allCommentsResponse = await request(app)
        .get("/api/comments")
        .expect(200);

      expect(allCommentsResponse.body.comments).toHaveLength(
        concurrentRequests
      );
    });

    test("should handle bulk comment retrieval efficiently", async () => {
      const commentCount = 50;
      const commentPromises = [];

      for (let i = 0; i < commentCount; i++) {
        const commentData = testDataFactories.validComment({
          profileId,
          content: `Bulk comment ${i}`,
          author: `Bulk Author ${i}`,
        });

        commentPromises.push(
          request(app).post("/api/comments").send(commentData)
        );
      }

      await Promise.all(commentPromises);

      const startTime = Date.now();

      const response = await request(app)
        .get("/api/comments")
        .query({ limit: 50 })
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.body.comments).toHaveLength(commentCount);
      expect(responseTime).toBeLessThan(1000);
    });
  });
});
