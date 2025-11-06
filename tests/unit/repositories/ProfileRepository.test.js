const mockProfile = jest.fn().mockImplementation(function (data = {}) {
  return {
    ...data,
    _id: data._id || "507f1f77bcf86cd799439012",
    save: jest.fn().mockResolvedValue({
      ...data,
      _id: data._id || "507f1f77bcf86cd799439012",
    }),
  };
});

mockProfile.findByProfileId = jest.fn();
mockProfile.find = jest.fn();
mockProfile.findOne = jest.fn();
mockProfile.findOneAndUpdate = jest.fn();
mockProfile.findOneAndDelete = jest.fn();
mockProfile.countDocuments = jest.fn();

jest.mock("../../../models/Profile", () => mockProfile);

const ProfileRepository = require("../../../repositories/ProfileRepository");
const Profile = require("../../../models/Profile");
const { mockFactories } = require("../../helpers/testHelpers");

describe("ProfileRepository", () => {
  let profileRepository;
  let mockProfile;

  beforeEach(() => {
    jest.clearAllMocks();

    Profile.mockClear();
    Profile.findByProfileId.mockReset();
    Profile.find.mockReset().mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([]),
    });
    Profile.findOne.mockReset().mockReturnValue({
      sort: jest.fn().mockResolvedValue(null),
    });
    Profile.findOneAndUpdate.mockReset();
    Profile.findOneAndDelete.mockReset();
    Profile.countDocuments.mockReset();

    profileRepository = new ProfileRepository();
  });

  describe("findByProfileId", () => {
    const profileId = 1;

    it("should find profile by profile ID successfully", async () => {
      const mockProfileDoc = mockFactories.profile({ profileId });
      Profile.findByProfileId.mockResolvedValue(mockProfileDoc);

      const result = await profileRepository.findByProfileId(profileId);

      expect(Profile.findByProfileId).toHaveBeenCalledWith(profileId);
      expect(result).toEqual(mockProfileDoc);
    });

    it("should return null when profile not found", async () => {
      Profile.findByProfileId.mockResolvedValue(null);

      const result = await profileRepository.findByProfileId(profileId);

      expect(result).toBeNull();
    });

    it("should handle database errors", async () => {
      const databaseError = new Error("Database connection failed");
      Profile.findByProfileId.mockRejectedValue(databaseError);

      await expect(
        profileRepository.findByProfileId(profileId)
      ).rejects.toThrow(
        `Error finding profile by ID ${profileId}: Database connection failed`
      );
    });
  });

  describe("findAll", () => {
    it("should find all profiles with default options", async () => {
      const mockProfiles = [
        mockFactories.profile({ profileId: 1 }),
        mockFactories.profile({ profileId: 2 }),
      ];

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockProfiles),
      };

      Profile.find.mockReturnValue(mockQuery);

      const result = await profileRepository.findAll();

      expect(Profile.find).toHaveBeenCalled();
      expect(mockQuery.sort).toHaveBeenCalledWith({ profileId: 1 });
      expect(mockQuery.exec).toHaveBeenCalled();
      expect(result).toEqual(mockProfiles);
    });

    it("should find profiles with custom options", async () => {
      const options = {
        sort: { name: 1 },
        limit: 5,
        skip: 10,
      };

      const mockProfiles = [mockFactories.profile()];

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockProfiles),
      };

      Profile.find.mockReturnValue(mockQuery);

      const result = await profileRepository.findAll(options);

      expect(mockQuery.sort).toHaveBeenCalledWith({ name: 1 });
      expect(mockQuery.skip).toHaveBeenCalledWith(10);
      expect(mockQuery.limit).toHaveBeenCalledWith(5);
      expect(result).toEqual(mockProfiles);
    });

    it("should handle database errors", async () => {
      const databaseError = new Error("Database connection failed");
      Profile.find.mockImplementation(() => {
        throw databaseError;
      });

      await expect(profileRepository.findAll()).rejects.toThrow(
        "Error finding profiles: Database connection failed"
      );
    });
  });

  describe("findFirst", () => {
    it("should find first profile successfully", async () => {
      const mockProfileDoc = mockFactories.profile({ profileId: 1 });

      const mockQuery = {
        sort: jest.fn().mockResolvedValue(mockProfileDoc),
      };

      Profile.findOne.mockReturnValue(mockQuery);

      const result = await profileRepository.findFirst();

      expect(Profile.findOne).toHaveBeenCalled();
      expect(mockQuery.sort).toHaveBeenCalledWith({ profileId: 1 });
      expect(result).toEqual(mockProfileDoc);
    });

    it("should return null when no profiles exist", async () => {
      const mockQuery = {
        sort: jest.fn().mockResolvedValue(null),
      };

      Profile.findOne.mockReturnValue(mockQuery);

      const result = await profileRepository.findFirst();

      expect(result).toBeNull();
    });

    it("should handle database errors", async () => {
      const databaseError = new Error("Database connection failed");
      Profile.findOne.mockImplementation(() => {
        throw databaseError;
      });

      await expect(profileRepository.findFirst()).rejects.toThrow(
        "Error finding first profile: Database connection failed"
      );
    });
  });

  describe("create", () => {
    const profileData = {
      profileId: 1,
      name: "Test Profile",
      bio: "Test bio",
    };

    it("should create profile successfully", async () => {
      const savedProfile = {
        _id: "507f1f77bcf86cd799439012",
        ...profileData,
      };

      const mockProfileInstance = {
        save: jest.fn().mockResolvedValue(savedProfile),
      };

      Profile.mockReturnValue(mockProfileInstance);

      const result = await profileRepository.create(profileData);

      expect(Profile).toHaveBeenCalledWith(profileData);
      expect(mockProfileInstance.save).toHaveBeenCalled();
      expect(result).toEqual(savedProfile);
    });

    it("should handle validation errors", async () => {
      const validationError = new Error("Validation failed");
      validationError.name = "ValidationError";
      validationError.errors = {
        name: { message: "Name is required" },
        profileId: { message: "Profile ID is required" },
      };

      const mockProfileInstance = {
        save: jest.fn().mockRejectedValue(validationError),
      };

      Profile.mockReturnValue(mockProfileInstance);

      await expect(profileRepository.create(profileData)).rejects.toThrow(
        "Validation failed"
      );
    });

    it("should handle duplicate profile error", async () => {
      const duplicateError = new Error("Duplicate key");
      duplicateError.code = 11000;

      const mockProfileInstance = {
        save: jest.fn().mockRejectedValue(duplicateError),
      };

      Profile.mockReturnValue(mockProfileInstance);

      await expect(profileRepository.create(profileData)).rejects.toThrow(
        "Profile with this ID already exists"
      );
    });

    it("should handle database errors", async () => {
      const databaseError = new Error("Database connection failed");

      const mockProfileInstance = {
        save: jest.fn().mockRejectedValue(databaseError),
      };

      Profile.mockReturnValue(mockProfileInstance);

      await expect(profileRepository.create(profileData)).rejects.toThrow(
        "Error creating profile: Database connection failed"
      );
    });
  });

  describe("updateByProfileId", () => {
    const profileId = 1;
    const updateData = { name: "Updated Profile Name" };

    it("should update profile successfully", async () => {
      const updatedProfile = mockFactories.profile({
        profileId,
        ...updateData,
      });

      Profile.findOneAndUpdate.mockResolvedValue(updatedProfile);

      const result = await profileRepository.updateByProfileId(
        profileId,
        updateData
      );

      expect(Profile.findOneAndUpdate).toHaveBeenCalledWith(
        { profileId },
        updateData,
        { new: true, runValidators: true }
      );
      expect(result).toEqual(updatedProfile);
    });

    it("should return null when profile not found", async () => {
      Profile.findOneAndUpdate.mockResolvedValue(null);

      const result = await profileRepository.updateByProfileId(
        profileId,
        updateData
      );

      expect(result).toBeNull();
    });

    it("should handle database errors", async () => {
      const databaseError = new Error("Database connection failed");
      Profile.findOneAndUpdate.mockRejectedValue(databaseError);

      await expect(
        profileRepository.updateByProfileId(profileId, updateData)
      ).rejects.toThrow(
        `Error updating profile ${profileId}: Database connection failed`
      );
    });
  });

  describe("deleteByProfileId", () => {
    const profileId = 1;

    it("should delete profile successfully", async () => {
      const deletedProfile = mockFactories.profile({ profileId });
      Profile.findOneAndDelete.mockResolvedValue(deletedProfile);

      const result = await profileRepository.deleteByProfileId(profileId);

      expect(Profile.findOneAndDelete).toHaveBeenCalledWith({ profileId });
      expect(result).toEqual(deletedProfile);
    });

    it("should return null when profile not found", async () => {
      Profile.findOneAndDelete.mockResolvedValue(null);

      const result = await profileRepository.deleteByProfileId(profileId);

      expect(result).toBeNull();
    });

    it("should handle database errors", async () => {
      const databaseError = new Error("Database connection failed");
      Profile.findOneAndDelete.mockRejectedValue(databaseError);

      await expect(
        profileRepository.deleteByProfileId(profileId)
      ).rejects.toThrow(
        `Error deleting profile ${profileId}: Database connection failed`
      );
    });
  });

  describe("existsByProfileId", () => {
    const profileId = 1;

    it("should return true when profile exists", async () => {
      Profile.countDocuments.mockResolvedValue(1);

      const result = await profileRepository.existsByProfileId(profileId);

      expect(Profile.countDocuments).toHaveBeenCalledWith({ profileId });
      expect(result).toBe(true);
    });

    it("should return false when profile does not exist", async () => {
      Profile.countDocuments.mockResolvedValue(0);

      const result = await profileRepository.existsByProfileId(profileId);

      expect(result).toBe(false);
    });

    it("should handle database errors", async () => {
      const databaseError = new Error("Database connection failed");
      Profile.countDocuments.mockRejectedValue(databaseError);

      await expect(
        profileRepository.existsByProfileId(profileId)
      ).rejects.toThrow(
        `Error checking profile existence ${profileId}: Database connection failed`
      );
    });
  });

  describe("getCount", () => {
    it("should get total profile count", async () => {
      Profile.countDocuments.mockResolvedValue(50);

      const result = await profileRepository.getCount();

      expect(Profile.countDocuments).toHaveBeenCalledWith();
      expect(result).toBe(50);
    });

    it("should handle database errors", async () => {
      const databaseError = new Error("Database connection failed");
      Profile.countDocuments.mockRejectedValue(databaseError);

      await expect(profileRepository.getCount()).rejects.toThrow(
        "Error getting profiles count: Database connection failed"
      );
    });
  });

  describe("findWithPagination", () => {
    it("should find profiles with pagination", async () => {
      const mockProfiles = [
        mockFactories.profile({ profileId: 1 }),
        mockFactories.profile({ profileId: 2 }),
      ];

      // Mock findAll method
      profileRepository.findAll = jest.fn().mockResolvedValue(mockProfiles);
      profileRepository.getCount = jest.fn().mockResolvedValue(25);

      const result = await profileRepository.findWithPagination(2, 5);

      expect(profileRepository.findAll).toHaveBeenCalledWith({
        limit: 5,
        skip: 5,
      });
      expect(profileRepository.getCount).toHaveBeenCalled();
      expect(result).toEqual({
        profiles: mockProfiles,
        pagination: {
          currentPage: 2,
          totalPages: 5,
          totalItems: 25,
          itemsPerPage: 5,
          hasNext: true,
          hasPrev: true,
        },
      });
    });

    it("should handle first page pagination", async () => {
      const mockProfiles = [mockFactories.profile()];

      profileRepository.findAll = jest.fn().mockResolvedValue(mockProfiles);
      profileRepository.getCount = jest.fn().mockResolvedValue(5);

      const result = await profileRepository.findWithPagination(1, 10);

      expect(result.pagination).toEqual({
        currentPage: 1,
        totalPages: 1,
        totalItems: 5,
        itemsPerPage: 10,
        hasNext: false,
        hasPrev: false,
      });
    });

    it("should handle last page pagination", async () => {
      const mockProfiles = [mockFactories.profile()];

      profileRepository.findAll = jest.fn().mockResolvedValue(mockProfiles);
      profileRepository.getCount = jest.fn().mockResolvedValue(25);

      const result = await profileRepository.findWithPagination(5, 5);

      expect(result.pagination.hasNext).toBe(false);
      expect(result.pagination.hasPrev).toBe(true);
    });

    it("should handle database errors", async () => {
      const databaseError = new Error("Database connection failed");
      profileRepository.findAll = jest.fn().mockRejectedValue(databaseError);

      await expect(profileRepository.findWithPagination(1, 10)).rejects.toThrow(
        "Error finding profiles with pagination: Database connection failed"
      );
    });
  });

  describe("Edge cases and integration scenarios", () => {
    it("should handle empty results gracefully", async () => {
      Profile.findByProfileId.mockResolvedValue(null);
      Profile.countDocuments.mockResolvedValue(0);

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };
      Profile.find.mockReturnValue(mockQuery);

      const profileResult = await profileRepository.findByProfileId(999);
      const allProfilesResult = await profileRepository.findAll();
      const countResult = await profileRepository.getCount();

      expect(profileResult).toBeNull();
      expect(allProfilesResult).toEqual([]);
      expect(countResult).toBe(0);
    });

    it("should handle multiple concurrent operations", async () => {
      const profiles = [
        mockFactories.profile({ profileId: 1 }),
        mockFactories.profile({ profileId: 2 }),
        mockFactories.profile({ profileId: 3 }),
      ];

      Profile.findByProfileId.mockImplementation((id) =>
        Promise.resolve(profiles.find((p) => p.profileId === id) || null)
      );

      const results = await Promise.all([
        profileRepository.findByProfileId(1),
        profileRepository.findByProfileId(2),
        profileRepository.findByProfileId(999),
      ]);

      expect(results[0]).toEqual(profiles[0]);
      expect(results[1]).toEqual(profiles[1]);
      expect(results[2]).toBeNull();
    });
  });
});
