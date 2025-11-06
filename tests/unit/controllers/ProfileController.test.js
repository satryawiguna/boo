jest.mock("../../../models/Profile", () => jest.fn());
jest.mock("../../../repositories/ProfileRepository", () => jest.fn());
jest.mock("../../../services/ProfileService");

const ProfileController = require("../../../controllers/ProfileController");
const ProfileService = require("../../../services/ProfileService");
const {
  mockFactories,
  createMockService,
  testHelpers,
} = require("../../helpers/testUnitHelpers");

describe("ProfileController", () => {
  let profileController;
  let mockProfileService;
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    jest.clearAllMocks();

    mockProfileService = createMockService("ProfileService");
    ProfileService.mockImplementation(() => mockProfileService);

    profileController = new ProfileController();

    mockReq = testHelpers.createMockReq();
    mockRes = testHelpers.createMockRes();
    mockNext = testHelpers.createMockNext();
  });

  describe("getAllProfiles", () => {
    it("should get all profiles successfully", async () => {
      const expectedResult = {
        profiles: [
          mockFactories.profile({ id: 1 }),
          mockFactories.profile({ id: 2, name: "Profile 2" }),
        ],
        total: 2,
        page: 1,
        limit: 10,
      };
      mockReq.query = { page: "1", limit: "10" };
      mockProfileService.getAllProfiles.mockResolvedValue(expectedResult);

      await profileController.getAllProfiles(mockReq, mockRes, mockNext);

      expect(mockProfileService.getAllProfiles).toHaveBeenCalledWith(
        mockReq.query
      );
      testHelpers.expectSuccessResponse(mockRes);
      expect(mockRes.json).toHaveBeenCalledWith(expectedResult);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle validation errors in query parameters", async () => {
      const validationError = mockFactories.validationError(
        "Invalid query parameters"
      );
      mockReq.query = { page: "invalid", limit: "invalid" };
      mockProfileService.getAllProfiles.mockRejectedValue(validationError);

      await profileController.getAllProfiles(mockReq, mockRes, mockNext);

      testHelpers.expectValidationError(mockRes, "Invalid query parameters");
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle unexpected errors", async () => {
      const unexpectedError = new Error("Database connection failed");
      mockReq.query = {};
      mockProfileService.getAllProfiles.mockRejectedValue(unexpectedError);

      await profileController.getAllProfiles(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(unexpectedError);
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe("getProfileById", () => {
    const profileId = "1";

    it("should get profile by ID successfully", async () => {
      const expectedProfile = mockFactories.profile({ id: 1 });
      mockReq.params.id = profileId;
      mockProfileService.getProfileById.mockResolvedValue(expectedProfile);

      await profileController.getProfileById(mockReq, mockRes, mockNext);

      expect(mockProfileService.getProfileById).toHaveBeenCalledWith(profileId);
      testHelpers.expectSuccessResponse(mockRes);
      expect(mockRes.json).toHaveBeenCalledWith(expectedProfile);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle profile not found", async () => {
      mockReq.params.id = profileId;
      mockProfileService.getProfileById.mockResolvedValue(null);

      await profileController.getProfileById(mockReq, mockRes, mockNext);

      testHelpers.expectNotFoundError(
        mockRes,
        `Profile with ID ${profileId} does not exist`
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle validation errors", async () => {
      const validationError =
        mockFactories.validationError("Invalid profile ID");
      mockReq.params.id = "invalid-id";
      mockProfileService.getProfileById.mockRejectedValue(validationError);

      await profileController.getProfileById(mockReq, mockRes, mockNext);

      testHelpers.expectValidationError(mockRes, "Invalid profile ID");
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle unexpected errors", async () => {
      const unexpectedError = new Error("Database error");
      mockReq.params.id = profileId;
      mockProfileService.getProfileById.mockRejectedValue(unexpectedError);

      await profileController.getProfileById(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(unexpectedError);
    });
  });

  describe("createProfile", () => {
    const mockProfileData = {
      name: "New Profile",
      bio: "This is a new profile",
      personalityTraits: {
        mbti: "ENFP",
        bigFive: {
          openness: 0.9,
          conscientiousness: 0.6,
          extraversion: 0.8,
          agreeableness: 0.7,
          neuroticism: 0.3,
        },
      },
    };

    it("should create a profile successfully", async () => {
      const expectedResult = mockFactories.profile(mockProfileData);
      mockReq.body = mockProfileData;
      mockProfileService.createProfile.mockResolvedValue(expectedResult);

      await profileController.createProfile(mockReq, mockRes, mockNext);

      expect(mockProfileService.createProfile).toHaveBeenCalledWith(
        mockProfileData
      );
      testHelpers.expectCreatedResponse(mockRes);
      expect(mockRes.json).toHaveBeenCalledWith(expectedResult);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle validation errors", async () => {
      const validationError = mockFactories.validationError(
        "Invalid profile data",
        {
          field: "name",
          message: "Name is required",
        }
      );
      mockReq.body = { invalidField: "test" };
      mockProfileService.createProfile.mockRejectedValue(validationError);

      await profileController.createProfile(mockReq, mockRes, mockNext);

      testHelpers.expectValidationError(mockRes, "Invalid profile data");
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle duplicate profile errors", async () => {
      const duplicateError = mockFactories.duplicateError(
        "Profile with this name already exists",
        "name"
      );
      mockReq.body = mockProfileData;
      mockProfileService.createProfile.mockRejectedValue(duplicateError);

      await profileController.createProfile(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Duplicate Profile",
        message: "Profile with this name already exists",
        field: "name",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle unexpected errors by calling next", async () => {
      const unexpectedError = new Error("Database connection failed");
      mockReq.body = mockProfileData;
      mockProfileService.createProfile.mockRejectedValue(unexpectedError);

      await profileController.createProfile(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(unexpectedError);
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe("updateProfile", () => {
    const profileId = "1";
    const updateData = {
      name: "Updated Profile Name",
      bio: "Updated bio",
    };

    it("should update profile successfully", async () => {
      const updatedProfile = mockFactories.profile({ id: 1, ...updateData });
      mockReq.params.id = profileId;
      mockReq.body = updateData;
      mockProfileService.updateProfile.mockResolvedValue(updatedProfile);

      await profileController.updateProfile(mockReq, mockRes, mockNext);

      expect(mockProfileService.updateProfile).toHaveBeenCalledWith(
        profileId,
        updateData
      );
      testHelpers.expectSuccessResponse(mockRes);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "Profile updated successfully",
        profile: updatedProfile,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle profile not found during update", async () => {
      mockReq.params.id = profileId;
      mockReq.body = updateData;
      mockProfileService.updateProfile.mockResolvedValue(null);

      await profileController.updateProfile(mockReq, mockRes, mockNext);

      testHelpers.expectNotFoundError(
        mockRes,
        `Profile with ID ${profileId} does not exist`
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle validation errors during update", async () => {
      const validationError = mockFactories.validationError(
        "Invalid update data"
      );
      mockReq.params.id = profileId;
      mockReq.body = { invalidField: "test" };
      mockProfileService.updateProfile.mockRejectedValue(validationError);

      await profileController.updateProfile(mockReq, mockRes, mockNext);

      testHelpers.expectValidationError(mockRes, "Invalid update data");
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle unexpected errors during update", async () => {
      const unexpectedError = new Error("Database error");
      mockReq.params.id = profileId;
      mockReq.body = updateData;
      mockProfileService.updateProfile.mockRejectedValue(unexpectedError);

      await profileController.updateProfile(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(unexpectedError);
    });
  });

  describe("deleteProfile", () => {
    const profileId = "1";

    it("should delete profile successfully", async () => {
      const deletedProfile = mockFactories.profile({ id: 1 });
      mockReq.params.id = profileId;
      mockProfileService.deleteProfile.mockResolvedValue(deletedProfile);

      await profileController.deleteProfile(mockReq, mockRes, mockNext);

      expect(mockProfileService.deleteProfile).toHaveBeenCalledWith(profileId);
      testHelpers.expectSuccessResponse(mockRes);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "Profile deleted successfully",
        profile: deletedProfile,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle profile not found during deletion", async () => {
      mockReq.params.id = profileId;
      mockProfileService.deleteProfile.mockResolvedValue(null);

      await profileController.deleteProfile(mockReq, mockRes, mockNext);

      testHelpers.expectNotFoundError(
        mockRes,
        `Profile with ID ${profileId} does not exist`
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle validation errors during deletion", async () => {
      const validationError =
        mockFactories.validationError("Invalid profile ID");
      mockReq.params.id = "invalid";
      mockProfileService.deleteProfile.mockRejectedValue(validationError);

      await profileController.deleteProfile(mockReq, mockRes, mockNext);

      testHelpers.expectValidationError(mockRes, "Invalid profile ID");
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle unexpected errors during deletion", async () => {
      const unexpectedError = new Error("Database error");
      mockReq.params.id = profileId;
      mockProfileService.deleteProfile.mockRejectedValue(unexpectedError);

      await profileController.deleteProfile(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(unexpectedError);
    });
  });

  describe("getProfileStats", () => {
    it("should get profile stats successfully", async () => {
      const expectedStats = {
        totalProfiles: 50,
        activeProfiles: 45,
        personalityDistribution: {
          mbti: {
            INTJ: 5,
            ENFP: 8,
            ISTP: 3,
          },
          enneagram: {
            "Type 1": 6,
            "Type 2": 4,
            "Type 5": 7,
          },
        },
        averageBigFiveScores: {
          openness: 0.7,
          conscientiousness: 0.6,
          extraversion: 0.5,
          agreeableness: 0.65,
          neuroticism: 0.4,
        },
      };
      mockProfileService.getProfileStats.mockResolvedValue(expectedStats);

      await profileController.getProfileStats(mockReq, mockRes, mockNext);

      expect(mockProfileService.getProfileStats).toHaveBeenCalled();
      testHelpers.expectSuccessResponse(mockRes);
      expect(mockRes.json).toHaveBeenCalledWith(expectedStats);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle errors in stats retrieval", async () => {
      const error = new Error("Stats calculation failed");
      mockProfileService.getProfileStats.mockRejectedValue(error);

      await profileController.getProfileStats(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it("should handle service unavailable errors", async () => {
      const serviceError = new Error("Profile service unavailable");
      mockProfileService.getProfileStats.mockRejectedValue(serviceError);

      await profileController.getProfileStats(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(serviceError);
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });

  describe("Integration scenarios", () => {
    it("should handle multiple successive calls correctly", async () => {
      const profile1 = mockFactories.profile({ id: 1, name: "Profile 1" });
      const profile2 = mockFactories.profile({ id: 2, name: "Profile 2" });

      mockProfileService.getProfileById
        .mockResolvedValueOnce(profile1)
        .mockResolvedValueOnce(profile2);

      // Act & Assert - First call
      mockReq.params.id = "1";
      await profileController.getProfileById(mockReq, mockRes, mockNext);

      expect(mockProfileService.getProfileById).toHaveBeenCalledWith("1");
      expect(mockRes.json).toHaveBeenCalledWith(profile1);

      // Reset mocks for second call
      mockRes.status.mockClear();
      mockRes.json.mockClear();

      // Act & Assert - Second call
      mockReq.params.id = "2";
      await profileController.getProfileById(mockReq, mockRes, mockNext);

      expect(mockProfileService.getProfileById).toHaveBeenCalledWith("2");
      expect(mockRes.json).toHaveBeenCalledWith(profile2);
    });

    it("should maintain service isolation between test runs", async () => {
      // This test ensures that mocks are properly isolated
      expect(mockProfileService.getAllProfiles).not.toHaveBeenCalled();
      expect(mockProfileService.createProfile).not.toHaveBeenCalled();
      expect(mockProfileService.updateProfile).not.toHaveBeenCalled();
      expect(mockProfileService.deleteProfile).not.toHaveBeenCalled();
    });
  });

  describe("Error handling edge cases", () => {
    it("should handle null response from service gracefully", async () => {
      mockReq.params.id = "999";
      mockProfileService.getProfileById.mockResolvedValue(null);

      await profileController.getProfileById(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Profile not found",
        message: "Profile with ID 999 does not exist",
      });
    });

    it("should handle undefined response from service gracefully", async () => {
      mockReq.params.id = "999";
      mockProfileService.getProfileById.mockResolvedValue(undefined);

      await profileController.getProfileById(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Profile not found",
        message: "Profile with ID 999 does not exist",
      });
    });
  });
});
