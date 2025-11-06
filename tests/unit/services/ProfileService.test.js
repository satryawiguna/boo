jest.mock("../../../repositories/ProfileRepository");
jest.mock("../../../validators/ProfileValidator");

const ProfileService = require("../../../services/ProfileService");
const ProfileRepository = require("../../../repositories/ProfileRepository");
const { ProfileValidator } = require("../../../validators/ProfileValidator");
const {
  mockFactories,
  createMockRepository,
  createMockModel,
} = require("../../helpers/testHelpers");

describe("ProfileService", () => {
  let profileService;
  let mockProfileRepository;

  beforeEach(() => {
    jest.clearAllMocks();

    mockProfileRepository = createMockRepository("ProfileRepository");
    ProfileRepository.mockImplementation(() => mockProfileRepository);

    profileService = new ProfileService();
  });

  describe("getProfileById", () => {
    const profileId = "1";

    it("should get profile by ID successfully without fallback", async () => {
      const mockProfile = createMockModel({
        _id: "507f1f77bcf86cd799439012",
        id: 1,
        name: "Test Profile",
      });
      const publicJSON = { id: "1", name: "Test Profile" };

      ProfileValidator.validateProfileId.mockResolvedValue(profileId);
      mockProfileRepository.findByProfileId.mockResolvedValue(mockProfile);
      mockProfile.toPublicJSON.mockReturnValue(publicJSON);

      const result = await profileService.getProfileById(profileId, false);

      expect(ProfileValidator.validateProfileId).toHaveBeenCalledWith(
        profileId
      );
      expect(mockProfileRepository.findByProfileId).toHaveBeenCalledWith(
        profileId
      );
      expect(result).toEqual(publicJSON);
    });

    it("should get profile by ID with fallback when profile not found", async () => {
      const mockProfile = createMockModel({
        _id: "507f1f77bcf86cd799439012",
        id: 1,
        name: "Default Profile",
      });
      const publicJSON = { id: "1", name: "Default Profile" };

      mockProfileRepository.findByProfileId.mockResolvedValue(null);
      mockProfileRepository.findFirst.mockResolvedValue(mockProfile);
      mockProfile.toPublicJSON.mockReturnValue(publicJSON);

      const result = await profileService.getProfileById(profileId, true);

      expect(ProfileValidator.validateProfileId).not.toHaveBeenCalled();
      expect(mockProfileRepository.findByProfileId).toHaveBeenCalledWith(
        profileId
      );
      expect(mockProfileRepository.findFirst).toHaveBeenCalled();
      expect(result).toEqual(publicJSON);
    });

    it("should return null when profile not found and no fallback", async () => {
      ProfileValidator.validateProfileId.mockResolvedValue(profileId);
      mockProfileRepository.findByProfileId.mockResolvedValue(null);

      const result = await profileService.getProfileById(profileId, false);

      expect(result).toBeNull();
      expect(mockProfileRepository.findFirst).not.toHaveBeenCalled();
    });

    it("should return null when profile not found and fallback also returns null", async () => {
      mockProfileRepository.findByProfileId.mockResolvedValue(null);
      mockProfileRepository.findFirst.mockResolvedValue(null);

      const result = await profileService.getProfileById(profileId, true);

      expect(result).toBeNull();
    });

    it("should handle validation errors", async () => {
      const validationError =
        mockFactories.validationError("Invalid profile ID");
      ProfileValidator.validateProfileId.mockRejectedValue(validationError);

      await expect(
        profileService.getProfileById("invalid", false)
      ).rejects.toEqual(validationError);

      expect(mockProfileRepository.findByProfileId).not.toHaveBeenCalled();
    });

    it("should handle repository errors", async () => {
      const repositoryError = new Error("Database connection failed");
      ProfileValidator.validateProfileId.mockResolvedValue(profileId);
      mockProfileRepository.findByProfileId.mockRejectedValue(repositoryError);

      await expect(
        profileService.getProfileById(profileId, false)
      ).rejects.toThrow(
        "Service error getting profile by ID: Database connection failed"
      );
    });
  });

  describe("getAllProfiles", () => {
    it("should get all profiles with pagination", async () => {
      const options = { page: 1, limit: 10 };
      const validatedPagination = { page: 1, limit: 10 };
      const mockProfiles = [
        createMockModel({ id: 1, name: "Profile 1" }),
        createMockModel({ id: 2, name: "Profile 2" }),
      ];
      const repositoryResult = {
        profiles: mockProfiles,
        pagination: { page: 1, limit: 10, total: 2 },
      };

      ProfileValidator.validatePagination.mockResolvedValue(
        validatedPagination
      );
      mockProfileRepository.findWithPagination.mockResolvedValue(
        repositoryResult
      );

      mockProfiles.forEach((profile, index) => {
        profile.toPublicJSON.mockReturnValue({
          id: index + 1,
          name: `Profile ${index + 1}`,
        });
      });

      const result = await profileService.getAllProfiles(options);

      expect(ProfileValidator.validatePagination).toHaveBeenCalledWith(options);
      expect(mockProfileRepository.findWithPagination).toHaveBeenCalledWith(
        1,
        10
      );
      expect(result).toEqual({
        profiles: [
          { id: 1, name: "Profile 1" },
          { id: 2, name: "Profile 2" },
        ],
        pagination: { page: 1, limit: 10, total: 2 },
      });
    });

    it("should get all profiles without pagination", async () => {
      const options = {};
      const validatedPagination = {};
      const mockProfiles = [createMockModel({ id: 1, name: "Profile 1" })];

      ProfileValidator.validatePagination.mockResolvedValue(
        validatedPagination
      );
      mockProfileRepository.findAll.mockResolvedValue(mockProfiles);
      mockProfiles[0].toPublicJSON.mockReturnValue({
        id: 1,
        name: "Profile 1",
      });

      const result = await profileService.getAllProfiles(options);

      expect(mockProfileRepository.findAll).toHaveBeenCalled();
      expect(result).toEqual({
        profiles: [{ id: 1, name: "Profile 1" }],
      });
    });

    it("should handle validation errors", async () => {
      const validationError = mockFactories.validationError(
        "Invalid pagination options"
      );
      ProfileValidator.validatePagination.mockRejectedValue(validationError);

      await expect(
        profileService.getAllProfiles({ page: "invalid" })
      ).rejects.toEqual(validationError);
    });

    it("should handle repository errors", async () => {
      const repositoryError = new Error("Database error");
      ProfileValidator.validatePagination.mockResolvedValue({
        page: 1,
        limit: 10,
      });
      mockProfileRepository.findWithPagination.mockRejectedValue(
        repositoryError
      );

      await expect(
        profileService.getAllProfiles({ page: 1, limit: 10 })
      ).rejects.toThrow("Service error getting all profiles: Database error");
    });
  });

  describe("createProfile", () => {
    const profileData = {
      profileId: 1,
      name: "New Profile",
      bio: "Test bio",
      personalityTraits: { mbti: "INTJ" },
    };

    it("should create profile successfully", async () => {
      const validatedData = { ...profileData, validated: true };
      const mockProfile = createMockModel({
        _id: "507f1f77bcf86cd799439012",
        ...validatedData,
      });
      const publicJSON = { id: "507f1f77bcf86cd799439012", ...validatedData };

      ProfileValidator.validateCreate.mockResolvedValue(validatedData);
      mockProfileRepository.existsByProfileId.mockResolvedValue(false);
      mockProfileRepository.create.mockResolvedValue(mockProfile);
      mockProfile.toPublicJSON.mockReturnValue(publicJSON);

      const result = await profileService.createProfile(profileData);

      expect(ProfileValidator.validateCreate).toHaveBeenCalledWith(profileData);
      expect(mockProfileRepository.existsByProfileId).toHaveBeenCalledWith(
        validatedData.profileId
      );
      expect(mockProfileRepository.create).toHaveBeenCalledWith(validatedData);
      expect(result).toEqual({
        success: true,
        message: "Profile created successfully",
        profile: publicJSON,
      });
    });

    it("should handle duplicate profile error", async () => {
      const validatedData = { ...profileData, validated: true };

      ProfileValidator.validateCreate.mockResolvedValue(validatedData);
      mockProfileRepository.existsByProfileId.mockResolvedValue(true);

      await expect(profileService.createProfile(profileData)).rejects.toEqual(
        expect.objectContaining({
          name: "DuplicateError",
          message: "Profile with ID 1 already exists",
          field: "profileId",
        })
      );

      expect(mockProfileRepository.create).not.toHaveBeenCalled();
    });

    it("should handle validation errors", async () => {
      const validationError = mockFactories.validationError(
        "Invalid profile data"
      );
      ProfileValidator.validateCreate.mockRejectedValue(validationError);

      await expect(profileService.createProfile(profileData)).rejects.toEqual(
        validationError
      );

      expect(mockProfileRepository.existsByProfileId).not.toHaveBeenCalled();
    });

    it("should handle repository errors", async () => {
      const validatedData = { ...profileData, validated: true };
      const repositoryError = new Error("Database connection failed");

      ProfileValidator.validateCreate.mockResolvedValue(validatedData);
      mockProfileRepository.existsByProfileId.mockResolvedValue(false);
      mockProfileRepository.create.mockRejectedValue(repositoryError);

      await expect(profileService.createProfile(profileData)).rejects.toThrow(
        "Service error creating profile: Database connection failed"
      );
    });
  });

  describe("updateProfile", () => {
    const profileId = "1";
    const updateData = {
      name: "Updated Profile",
      bio: "Updated bio",
    };

    it("should update profile successfully", async () => {
      const validatedData = { ...updateData, validated: true };
      const mockProfile = createMockModel({
        _id: "507f1f77bcf86cd799439012",
        id: 1,
        ...validatedData,
      });
      const publicJSON = { id: "1", ...validatedData };

      ProfileValidator.validateProfileId.mockResolvedValue(profileId);
      mockProfileRepository.existsByProfileId.mockResolvedValue(true);
      ProfileValidator.validateUpdate.mockResolvedValue(validatedData);
      mockProfileRepository.updateByProfileId.mockResolvedValue(mockProfile);
      mockProfile.toPublicJSON.mockReturnValue(publicJSON);

      const result = await profileService.updateProfile(profileId, updateData);

      expect(ProfileValidator.validateProfileId).toHaveBeenCalledWith(
        profileId
      );
      expect(mockProfileRepository.existsByProfileId).toHaveBeenCalledWith(
        profileId
      );
      expect(ProfileValidator.validateUpdate).toHaveBeenCalledWith(updateData);
      expect(mockProfileRepository.updateByProfileId).toHaveBeenCalledWith(
        profileId,
        validatedData
      );
      expect(result).toEqual(publicJSON);
    });

    it("should return null when profile does not exist", async () => {
      ProfileValidator.validateProfileId.mockResolvedValue(profileId);
      mockProfileRepository.existsByProfileId.mockResolvedValue(false);

      const result = await profileService.updateProfile(profileId, updateData);

      expect(result).toBeNull();
      expect(ProfileValidator.validateUpdate).not.toHaveBeenCalled();
      expect(mockProfileRepository.updateByProfileId).not.toHaveBeenCalled();
    });

    it("should return null when update returns null", async () => {
      ProfileValidator.validateProfileId.mockResolvedValue(profileId);
      mockProfileRepository.existsByProfileId.mockResolvedValue(true);
      ProfileValidator.validateUpdate.mockResolvedValue(updateData);
      mockProfileRepository.updateByProfileId.mockResolvedValue(null);

      const result = await profileService.updateProfile(profileId, updateData);

      expect(result).toBeNull();
    });

    it("should handle validation errors", async () => {
      const validationError =
        mockFactories.validationError("Invalid profile ID");
      ProfileValidator.validateProfileId.mockRejectedValue(validationError);

      await expect(
        profileService.updateProfile("invalid", updateData)
      ).rejects.toEqual(validationError);

      expect(mockProfileRepository.existsByProfileId).not.toHaveBeenCalled();
    });

    it("should handle repository errors", async () => {
      const repositoryError = new Error("Database error");
      ProfileValidator.validateProfileId.mockResolvedValue(profileId);
      mockProfileRepository.existsByProfileId.mockRejectedValue(
        repositoryError
      );

      await expect(
        profileService.updateProfile(profileId, updateData)
      ).rejects.toThrow("Service error updating profile: Database error");
    });
  });

  describe("deleteProfile", () => {
    const profileId = "1";

    it("should delete profile successfully", async () => {
      const mockProfile = createMockModel({
        _id: "507f1f77bcf86cd799439012",
        id: 1,
        name: "Deleted Profile",
      });
      const publicJSON = { id: "1", name: "Deleted Profile" };

      ProfileValidator.validateProfileId.mockResolvedValue(profileId);
      mockProfileRepository.deleteByProfileId.mockResolvedValue(mockProfile);
      mockProfile.toPublicJSON.mockReturnValue(publicJSON);

      const result = await profileService.deleteProfile(profileId);

      expect(ProfileValidator.validateProfileId).toHaveBeenCalledWith(
        profileId
      );
      expect(mockProfileRepository.deleteByProfileId).toHaveBeenCalledWith(
        profileId
      );
      expect(result).toEqual(publicJSON);
    });

    it("should return null when profile not found", async () => {
      ProfileValidator.validateProfileId.mockResolvedValue(profileId);
      mockProfileRepository.deleteByProfileId.mockResolvedValue(null);

      const result = await profileService.deleteProfile(profileId);

      expect(result).toBeNull();
    });

    it("should handle validation errors", async () => {
      const validationError =
        mockFactories.validationError("Invalid profile ID");
      ProfileValidator.validateProfileId.mockRejectedValue(validationError);

      await expect(profileService.deleteProfile("invalid")).rejects.toEqual(
        validationError
      );

      expect(mockProfileRepository.deleteByProfileId).not.toHaveBeenCalled();
    });

    it("should handle repository errors", async () => {
      const repositoryError = new Error("Database error");
      ProfileValidator.validateProfileId.mockResolvedValue(profileId);
      mockProfileRepository.deleteByProfileId.mockRejectedValue(
        repositoryError
      );

      await expect(profileService.deleteProfile(profileId)).rejects.toThrow(
        "Service error deleting profile: Database error"
      );
    });
  });

  describe("getProfileStats", () => {
    it("should get profile stats successfully", async () => {
      const mockProfiles = [
        { mbti: "INTJ" },
        { mbti: "ENFP" },
        { mbti: "INTJ" },
        { mbti: "ISTP" },
      ];

      mockProfileRepository.getCount.mockResolvedValue(4);
      mockProfileRepository.findAll.mockResolvedValue(mockProfiles);

      const result = await profileService.getProfileStats();

      expect(mockProfileRepository.getCount).toHaveBeenCalled();
      expect(mockProfileRepository.findAll).toHaveBeenCalled();
      expect(result).toEqual({
        totalProfiles: 4,
        mbtiDistribution: {
          INTJ: 2,
          ENFP: 1,
          ISTP: 1,
        },
        lastUpdated: expect.any(String),
      });
    });

    it("should handle empty profiles list", async () => {
      mockProfileRepository.getCount.mockResolvedValue(0);
      mockProfileRepository.findAll.mockResolvedValue([]);

      const result = await profileService.getProfileStats();

      expect(result).toEqual({
        totalProfiles: 0,
        mbtiDistribution: {},
        lastUpdated: expect.any(String),
      });
    });

    it("should handle profiles without mbti", async () => {
      const mockProfiles = [
        { mbti: "INTJ" },
        { name: "Profile without MBTI" },
        { mbti: undefined },
      ];

      mockProfileRepository.getCount.mockResolvedValue(3);
      mockProfileRepository.findAll.mockResolvedValue(mockProfiles);

      const result = await profileService.getProfileStats();

      expect(result.mbtiDistribution).toEqual({
        INTJ: 1,
        undefined: 2,
      });
    });

    it("should handle repository errors", async () => {
      const repositoryError = new Error("Database connection failed");
      mockProfileRepository.getCount.mockRejectedValue(repositoryError);

      await expect(profileService.getProfileStats()).rejects.toThrow(
        "Service error getting profile stats: Database connection failed"
      );
    });

    it("should handle error in findAll", async () => {
      const repositoryError = new Error("Failed to fetch profiles");
      mockProfileRepository.getCount.mockResolvedValue(5);
      mockProfileRepository.findAll.mockRejectedValue(repositoryError);

      await expect(profileService.getProfileStats()).rejects.toThrow(
        "Service error getting profile stats: Failed to fetch profiles"
      );
    });
  });

  describe("Integration scenarios", () => {
    it("should handle multiple method calls correctly", async () => {
      const profileId = "1";
      const mockProfile = createMockModel({ id: 1, name: "Test Profile" });
      const publicJSON = { id: "1", name: "Test Profile" };

      ProfileValidator.validateProfileId.mockResolvedValue(profileId);
      mockProfileRepository.findByProfileId.mockResolvedValue(mockProfile);
      mockProfile.toPublicJSON.mockReturnValue(publicJSON);

      // Act - Multiple calls
      const result1 = await profileService.getProfileById(profileId, false);
      const result2 = await profileService.getProfileById(profileId, false);

      expect(ProfileValidator.validateProfileId).toHaveBeenCalledTimes(2);
      expect(mockProfileRepository.findByProfileId).toHaveBeenCalledTimes(2);
      expect(result1).toEqual(publicJSON);
      expect(result2).toEqual(publicJSON);
    });

    it("should maintain proper state isolation between tests", () => {
      // This test ensures that mocks are properly isolated
      expect(ProfileValidator.validateProfileId).not.toHaveBeenCalled();
      expect(mockProfileRepository.findByProfileId).not.toHaveBeenCalled();
      expect(mockProfileRepository.create).not.toHaveBeenCalled();
    });
  });
});
