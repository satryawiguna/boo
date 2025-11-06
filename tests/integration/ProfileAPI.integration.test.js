const request = require("supertest");
const {
  testDataFactories,
  databaseHelpers,
  apiHelpers,
  testUtils,
} = require("../helpers/testIntegrationHelpers");

require("../../models/Profile");

describe("Profile API Integration Tests", () => {
  let app;
  let testProfile;
  let testProfiles;

  beforeAll(async () => {
    app = global.createTestApp();
  });

  beforeEach(async () => {
    await databaseHelpers.cleanDatabase();

    testProfile = testDataFactories.validProfile();
    testProfiles = testDataFactories.validProfiles(5);
  });

  describe("GET /api/profile", () => {
    describe("Success Cases", () => {
      test("should return empty list when no profiles exist", async () => {
        const response = await request(app).get("/api/profile");

        apiHelpers.expectValidProfilesListResponse(response, 0);
        expect(response.body.profiles).toEqual([]);
      });

      test("should return all profiles when no pagination specified", async () => {
        await databaseHelpers.seedDatabase(testProfiles);

        const response = await request(app).get("/api/profile");

        apiHelpers.expectValidProfilesListResponse(response, 5);
        expect(response.body.profiles).toHaveLength(5);

        const profile = response.body.profiles[0];
        expect(profile).toHaveProperty("id");
        expect(profile).toHaveProperty("name");
        expect(profile).toHaveProperty("mbti");
        expect(profile).toHaveProperty("description");
        expect(profile).toHaveProperty("image");
      });

      test("should return paginated profiles when pagination params provided", async () => {
        await databaseHelpers.seedDatabase(testProfiles);

        const response = await request(app)
          .get("/api/profile")
          .query({ page: 1, limit: 3 });

        apiHelpers.expectValidProfilesListResponse(response, 3);

        expect(response.body.pagination).toEqual({
          currentPage: 1,
          itemsPerPage: 3,
          totalItems: 5,
          totalPages: 2,
          hasNext: true,
          hasPrev: false,
        });
      });

      test("should return correct second page of paginated results", async () => {
        await databaseHelpers.seedDatabase(testProfiles);

        const response = await request(app)
          .get("/api/profile")
          .query({ page: 2, limit: 3 });

        apiHelpers.expectValidProfilesListResponse(response, 2);

        expect(response.body.pagination).toEqual({
          currentPage: 2,
          itemsPerPage: 3,
          totalItems: 5,
          totalPages: 2,
          hasNext: false,
          hasPrev: true,
        });
      });
    });

    describe("Validation Cases", () => {
      test("should handle invalid page parameter", async () => {
        const response = await request(app)
          .get("/api/profile")
          .query({ page: 0, limit: 10 });

        apiHelpers.expectValidationError(response);
      });

      test("should handle invalid limit parameter", async () => {
        const response = await request(app)
          .get("/api/profile")
          .query({ page: 1, limit: 0 });

        apiHelpers.expectValidationError(response);
      });

      test("should handle limit exceeding maximum", async () => {
        const response = await request(app)
          .get("/api/profile")
          .query({ page: 1, limit: 150 });

        apiHelpers.expectValidationError(response);
      });
    });
  });

  describe("GET /api/profile/:id", () => {
    describe("Success Cases", () => {
      test("should return profile by valid ID", async () => {
        const createdProfile = await databaseHelpers.createProfile(testProfile);

        const response = await request(app).get(
          `/api/profile/${testProfile.profileId}`
        );

        apiHelpers.expectValidProfileResponse(response, testProfile);
        expect(response.body.id).toBe(testProfile.profileId);
        expect(response.body.name).toBe(testProfile.name);
        expect(response.body.mbti).toBe(testProfile.mbti);
      });
    });

    describe("Error Cases", () => {
      test("should return 404 for non-existent profile ID", async () => {
        const response = await request(app).get("/api/profile/99999");

        apiHelpers.expectNotFoundError(
          response,
          "Profile with ID 99999 does not exist"
        );
      });

      test("should return validation error for invalid ID format", async () => {
        const response = await request(app).get("/api/profile/invalid");

        apiHelpers.expectValidationError(response);
      });

      test("should return validation error for ID out of range", async () => {
        const response = await request(app).get("/api/profile/100000");

        apiHelpers.expectValidationError(response);
      });

      test("should return validation error for negative ID", async () => {
        const response = await request(app).get("/api/profile/-1");

        apiHelpers.expectValidationError(response);
      });
    });
  });

  describe("POST /api/profile", () => {
    describe("Success Cases", () => {
      test("should create profile with valid data", async () => {
        const response = await request(app)
          .post("/api/profile")
          .send(testProfile);

        apiHelpers.expectCreatedResponse(response, testProfile);

        const dbProfile = await databaseHelpers.findProfileByProfileId(
          testProfile.profileId
        );
        expect(dbProfile).toBeTruthy();
        expect(dbProfile.name).toBe(testProfile.name);
        expect(dbProfile.mbti).toBe(testProfile.mbti);
      });

      test("should create profile with minimum required fields", async () => {
        const minimalProfile = testDataFactories.validProfile({
          name: "Minimal Profile",
          description:
            "This is the minimum required description for testing purposes.",
        });

        const response = await request(app)
          .post("/api/profile")
          .send(minimalProfile);

        apiHelpers.expectCreatedResponse(response, minimalProfile);
      });

      test("should transform data correctly (uppercase MBTI, etc.)", async () => {
        const profileWithLowerCase = testDataFactories.validProfile({
          mbti: "intj",
          socionics: "ili",
        });

        const response = await request(app)
          .post("/api/profile")
          .send(profileWithLowerCase);

        apiHelpers.expectCreatedResponse(response);
        expect(response.body.profile.mbti).toBe("INTJ");
        expect(response.body.profile.socionics).toBe("ILI");
      });
    });

    describe("Validation Error Cases", () => {
      test("should return validation error for missing required fields", async () => {
        const invalidProfile =
          testDataFactories.invalidProfile("missing_required");

        const response = await request(app)
          .post("/api/profile")
          .send(invalidProfile);

        apiHelpers.expectValidationError(response);
      });

      test("should return validation error for invalid MBTI format", async () => {
        const invalidProfile = testDataFactories.invalidProfile("invalid_mbti");

        const response = await request(app)
          .post("/api/profile")
          .send(invalidProfile);

        apiHelpers.expectValidationError(
          response,
          "MBTI must be a valid 4-letter type"
        );
      });

      test("should return validation error for invalid tritype", async () => {
        const invalidProfile =
          testDataFactories.invalidProfile("invalid_tritype");

        const response = await request(app)
          .post("/api/profile")
          .send(invalidProfile);

        apiHelpers.expectValidationError(response);
      });

      test("should return validation error for invalid image URL", async () => {
        const invalidProfile =
          testDataFactories.invalidProfile("invalid_image");

        const response = await request(app)
          .post("/api/profile")
          .send(invalidProfile);

        apiHelpers.expectValidationError(
          response,
          "Image must be a valid image file"
        );
      });

      test("should return validation error for name too short", async () => {
        const invalidProfile = testDataFactories.invalidProfile("short_name");

        const response = await request(app)
          .post("/api/profile")
          .send(invalidProfile);

        apiHelpers.expectValidationError(response);
      });

      test("should return validation error for description too short", async () => {
        const invalidProfile =
          testDataFactories.invalidProfile("short_description");

        const response = await request(app)
          .post("/api/profile")
          .send(invalidProfile);

        apiHelpers.expectValidationError(response);
      });

      test("should return validation error for profileId out of range", async () => {
        const invalidProfile = testDataFactories.validProfile({
          profileId: 100000,
        });

        const response = await request(app)
          .post("/api/profile")
          .send(invalidProfile);

        apiHelpers.expectValidationError(response);
      });
    });

    describe("Duplicate Error Cases", () => {
      test("should return duplicate error for existing profileId", async () => {
        await databaseHelpers.createProfile(testProfile);

        const duplicateProfile = testDataFactories.validProfile({
          profileId: testProfile.profileId,
          name: "Different Name",
        });

        const response = await request(app)
          .post("/api/profile")
          .send(duplicateProfile);

        apiHelpers.expectDuplicateError(response);
      });
    });
  });

  describe("PUT /api/profile/:id", () => {
    beforeEach(async () => {
      await databaseHelpers.createProfile(testProfile);
    });

    describe("Success Cases", () => {
      test("should update profile with valid data", async () => {
        const updateData = testDataFactories.updateProfile({
          name: "Updated Profile Name",
          mbti: "ENFP",
        });

        const response = await request(app)
          .put(`/api/profile/${testProfile.profileId}`)
          .send(updateData);

        apiHelpers.expectUpdatedResponse(response);
        expect(response.body.profile.name).toBe(updateData.name);
        expect(response.body.profile.mbti).toBe(updateData.mbti);

        const dbProfile = await databaseHelpers.findProfileByProfileId(
          testProfile.profileId
        );
        expect(dbProfile.name).toBe(updateData.name);
        expect(dbProfile.mbti).toBe(updateData.mbti);
      });

      test("should update single field", async () => {
        const updateData = { name: "Single Field Update" };

        const response = await request(app)
          .put(`/api/profile/${testProfile.profileId}`)
          .send(updateData);

        apiHelpers.expectUpdatedResponse(response);
        expect(response.body.profile.name).toBe(updateData.name);
        expect(response.body.profile.mbti).toBe(testProfile.mbti);
      });

      test("should handle empty update data", async () => {
        const response = await request(app)
          .put(`/api/profile/${testProfile.profileId}`)
          .send({});

        apiHelpers.expectUpdatedResponse(response);
        expect(response.body.profile.name).toBe(testProfile.name);
      });
    });

    describe("Error Cases", () => {
      test("should return 404 for non-existent profile", async () => {
        const updateData = testDataFactories.updateProfile();

        const response = await request(app)
          .put("/api/profile/99999")
          .send(updateData);

        apiHelpers.expectNotFoundError(
          response,
          "Profile with ID 99999 does not exist"
        );
      });

      test("should return validation error for invalid update data", async () => {
        const invalidUpdate = {
          name: "A",
        };

        const response = await request(app)
          .put(`/api/profile/${testProfile.profileId}`)
          .send(invalidUpdate);

        apiHelpers.expectValidationError(response);
      });

      test("should return validation error for invalid MBTI in update", async () => {
        const invalidUpdate = {
          mbti: "INVALID",
        };

        const response = await request(app)
          .put(`/api/profile/${testProfile.profileId}`)
          .send(invalidUpdate);

        apiHelpers.expectValidationError(response);
      });
    });
  });

  describe("DELETE /api/profile/:id", () => {
    beforeEach(async () => {
      await databaseHelpers.createProfile(testProfile);
    });

    describe("Success Cases", () => {
      test("should delete existing profile", async () => {
        const response = await request(app).delete(
          `/api/profile/${testProfile.profileId}`
        );

        apiHelpers.expectDeletedResponse(response);
        expect(response.body.profile.id).toBe(testProfile.profileId);

        const dbProfile = await databaseHelpers.findProfileByProfileId(
          testProfile.profileId
        );
        expect(dbProfile).toBeNull();
      });
    });

    describe("Error Cases", () => {
      test("should return 404 for non-existent profile", async () => {
        const response = await request(app).delete("/api/profile/99999");

        apiHelpers.expectNotFoundError(
          response,
          "Profile with ID 99999 does not exist"
        );
      });

      test("should return validation error for invalid ID", async () => {
        const response = await request(app).delete("/api/profile/invalid");

        apiHelpers.expectValidationError(response);
      });
    });
  });

  describe("GET /api/profile/stats", () => {
    describe("Success Cases", () => {
      test("should return stats with no profiles", async () => {
        const response = await request(app).get("/api/profile/stats");

        apiHelpers.expectValidStatsResponse(response);
        expect(response.body.totalProfiles).toBe(0);
        expect(response.body.mbtiDistribution).toEqual({});
      });

      test("should return correct stats with profiles", async () => {
        const statsProfiles = [
          testDataFactories.validProfile({ profileId: 10001, mbti: "INTJ" }),
          testDataFactories.validProfile({ profileId: 10002, mbti: "INTJ" }),
          testDataFactories.validProfile({ profileId: 10003, mbti: "ENFP" }),
          testDataFactories.validProfile({ profileId: 10004, mbti: "ISFJ" }),
        ];

        await databaseHelpers.seedDatabase(statsProfiles);

        const response = await request(app).get("/api/profile/stats");

        apiHelpers.expectValidStatsResponse(response);
        expect(response.body.totalProfiles).toBe(4);
        expect(response.body.mbtiDistribution).toEqual({
          INTJ: 2,
          ENFP: 1,
          ISFJ: 1,
        });
      });
    });
  });

  describe("Integration Test Scenarios", () => {
    test("should handle complete CRUD lifecycle", async () => {
      const uniqueId = testUtils.generateUniqueProfileId();
      const profileData = testDataFactories.validProfile({
        profileId: uniqueId,
        name: "CRUD Test Profile",
      });

      const createResponse = await request(app)
        .post("/api/profile")
        .send(profileData);

      apiHelpers.expectCreatedResponse(createResponse, profileData);

      const readResponse = await request(app).get(`/api/profile/${uniqueId}`);
      apiHelpers.expectValidProfileResponse(readResponse, profileData);

      const updateData = { name: "Updated CRUD Profile" };
      const updateResponse = await request(app)
        .put(`/api/profile/${uniqueId}`)
        .send(updateData);

      apiHelpers.expectUpdatedResponse(updateResponse);
      expect(updateResponse.body.profile.name).toBe(updateData.name);

      const deleteResponse = await request(app).delete(
        `/api/profile/${uniqueId}`
      );
      apiHelpers.expectDeletedResponse(deleteResponse);

      const verifyResponse = await request(app).get(`/api/profile/${uniqueId}`);
      apiHelpers.expectNotFoundError(verifyResponse);
    });

    test("should handle concurrent profile creation", async () => {
      const profiles = testDataFactories.validProfiles(3);

      const promises = profiles.map((profile) =>
        request(app).post("/api/profile").send(profile)
      );

      const responses = await Promise.all(promises);

      responses.forEach((response, index) => {
        apiHelpers.expectCreatedResponse(response, profiles[index]);
      });

      const profileCount = await databaseHelpers.getProfileCount();
      expect(profileCount).toBe(3);
    });

    test("should handle pagination with real data", async () => {
      const manyProfiles = testDataFactories.validProfiles(10);
      await databaseHelpers.seedDatabase(manyProfiles);

      const page1 = await request(app)
        .get("/api/profile")
        .query({ page: 1, limit: 4 });

      apiHelpers.expectValidProfilesListResponse(page1, 4);
      expect(page1.body.pagination.totalItems).toBe(10);
      expect(page1.body.pagination.totalPages).toBe(3);

      const page2 = await request(app)
        .get("/api/profile")
        .query({ page: 2, limit: 4 });

      apiHelpers.expectValidProfilesListResponse(page2, 4);
      expect(page2.body.pagination.hasNext).toBe(true);
      expect(page2.body.pagination.hasPrev).toBe(true);

      const page3 = await request(app)
        .get("/api/profile")
        .query({ page: 3, limit: 4 });

      apiHelpers.expectValidProfilesListResponse(page3, 2);
      expect(page3.body.pagination.hasNext).toBe(false);
      expect(page3.body.pagination.hasPrev).toBe(true);
    });

    test("should validate MBTI format variations", async () => {
      const mbtiVariations = [
        { mbti: "INTJ", shouldSucceed: true },
        { mbti: "intj", shouldSucceed: true },
        { mbti: "ENFP", shouldSucceed: true },
        { mbti: "INVALID", shouldSucceed: false },
        { mbti: "INT", shouldSucceed: false },
        { mbti: "INTJX", shouldSucceed: false },
        { mbti: "ZNTJ", shouldSucceed: false },
      ];

      for (const variation of mbtiVariations) {
        const profileData = testDataFactories.validProfile({
          profileId: testUtils.generateUniqueProfileId(),
          mbti: variation.mbti,
        });

        const response = await request(app)
          .post("/api/profile")
          .send(profileData);

        if (variation.shouldSucceed) {
          apiHelpers.expectCreatedResponse(response);
          expect(response.body.profile.mbti).toBe(variation.mbti.toUpperCase());
        } else {
          apiHelpers.expectValidationError(response);
        }

        await testUtils.wait(50);
      }
    });
  });

  describe("Error Handling and Edge Cases", () => {
    test("should handle malformed JSON", async () => {
      const response = await request(app)
        .post("/api/profile")
        .set("Content-Type", "application/json")
        .send("{ invalid json }");

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("error");
    });

    test("should handle very large profileId", async () => {
      const profileData = testDataFactories.validProfile({
        profileId: 99999,
      });

      const response = await request(app)
        .post("/api/profile")
        .send(profileData);

      apiHelpers.expectCreatedResponse(response, profileData);
    });

    test("should handle special characters in profile data", async () => {
      const profileData = testDataFactories.validProfile({
        name: "Special Characters Test: !@#$%^&*()",
        description:
          "Description with unicode: 测试 🎭 émojis and speciál chàracters",
      });

      const response = await request(app)
        .post("/api/profile")
        .send(profileData);

      apiHelpers.expectCreatedResponse(response, profileData);
      expect(response.body.profile.name).toBe(profileData.name);
    });
  });
});
