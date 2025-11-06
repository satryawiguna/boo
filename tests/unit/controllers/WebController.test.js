jest.mock("../../../models/Profile", () => jest.fn());
jest.mock("../../../repositories/ProfileRepository", () => jest.fn());
jest.mock("../../../services/ProfileService");

const WebController = require("../../../controllers/WebController");
const ProfileService = require("../../../services/ProfileService");
const {
  mockFactories,
  createMockService,
  testHelpers,
} = require("../../helpers/testUnitHelpers");

describe("WebController", () => {
  let webController;
  let mockProfileService;
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    jest.clearAllMocks();

    mockProfileService = createMockService("ProfileService");
    ProfileService.mockImplementation(() => mockProfileService);

    webController = new WebController();

    mockReq = testHelpers.createMockReq();
    mockRes = testHelpers.createMockRes();
    mockNext = testHelpers.createMockNext();
  });

  describe("profile", () => {
    it("should render profile template with specific profile ID", async () => {
      const profileId = "2";
      const expectedProfile = mockFactories.profile({
        id: 2,
        name: "Specific Profile",
        bio: "This is a specific profile for testing",
      });
      mockReq.params.id = profileId;
      mockProfileService.getProfileById.mockResolvedValue(expectedProfile);

      await webController.profile(mockReq, mockRes, mockNext);

      expect(mockProfileService.getProfileById).toHaveBeenCalledWith(2, false);
      expect(mockRes.render).toHaveBeenCalledWith("profile_template", {
        profile: expectedProfile,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should render profile template with default profile (ID 1) when no ID provided", async () => {
      const expectedProfile = mockFactories.profile({
        id: 1,
        name: "Default Profile",
        bio: "This is the default profile",
      });
      mockProfileService.getProfileById.mockResolvedValue(expectedProfile);

      await webController.profile(mockReq, mockRes, mockNext);

      expect(mockProfileService.getProfileById).toHaveBeenCalledWith(1, true);
      expect(mockRes.render).toHaveBeenCalledWith("profile_template", {
        profile: expectedProfile,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle string ID parameter correctly", async () => {
      const profileId = "5";
      const expectedProfile = mockFactories.profile({
        id: 5,
        name: "Profile Five",
      });
      mockReq.params.id = profileId;
      mockProfileService.getProfileById.mockResolvedValue(expectedProfile);

      await webController.profile(mockReq, mockRes, mockNext);

      expect(mockProfileService.getProfileById).toHaveBeenCalledWith(5, false);
      expect(mockRes.render).toHaveBeenCalledWith("profile_template", {
        profile: expectedProfile,
      });
    });

    it("should handle profile not found with 404 error page", async () => {
      const profileId = "999";
      mockReq.params.id = profileId;
      mockProfileService.getProfileById.mockResolvedValue(null);

      await webController.profile(mockReq, mockRes, mockNext);

      expect(mockProfileService.getProfileById).toHaveBeenCalledWith(
        999,
        false
      );
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.render).toHaveBeenCalledWith("error", {
        message: "Profile not found",
        error: { status: 404 },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle profile not found when no ID provided", async () => {
      mockProfileService.getProfileById.mockResolvedValue(null);

      await webController.profile(mockReq, mockRes, mockNext);

      expect(mockProfileService.getProfileById).toHaveBeenCalledWith(1, true);
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.render).toHaveBeenCalledWith("error", {
        message: "Profile not found",
        error: { status: 404 },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle service errors by calling next", async () => {
      const serviceError = new Error("Database connection failed");
      const profileId = "1";
      mockReq.params.id = profileId;
      mockProfileService.getProfileById.mockRejectedValue(serviceError);

      await webController.profile(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(serviceError);
      expect(mockRes.render).not.toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it("should handle validation errors by calling next", async () => {
      const validationError =
        mockFactories.validationError("Invalid profile ID");
      const profileId = "invalid";
      mockReq.params.id = profileId;
      mockProfileService.getProfileById.mockRejectedValue(validationError);

      await webController.profile(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(validationError);
      expect(mockRes.render).not.toHaveBeenCalled();
    });

    it("should handle zero ID parameter", async () => {
      const profileId = "0";
      const expectedProfile = mockFactories.profile({
        id: 0,
        name: "Zero Profile",
      });
      mockReq.params.id = profileId;
      mockProfileService.getProfileById.mockResolvedValue(expectedProfile);

      await webController.profile(mockReq, mockRes, mockNext);

      expect(mockProfileService.getProfileById).toHaveBeenCalledWith(0, false);
      expect(mockRes.render).toHaveBeenCalledWith("profile_template", {
        profile: expectedProfile,
      });
    });

    it("should handle negative ID parameter", async () => {
      const profileId = "-1";
      mockReq.params.id = profileId;
      mockProfileService.getProfileById.mockResolvedValue(null);

      await webController.profile(mockReq, mockRes, mockNext);

      expect(mockProfileService.getProfileById).toHaveBeenCalledWith(-1, false);
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.render).toHaveBeenCalledWith("error", {
        message: "Profile not found",
        error: { status: 404 },
      });
    });
  });

  describe("defaultProfile", () => {
    it("should render default profile template successfully", async () => {
      const expectedProfile = mockFactories.profile({
        id: 1,
        name: "Default Profile",
        bio: "This is the default profile for the application",
      });
      mockProfileService.getProfileById.mockResolvedValue(expectedProfile);

      await webController.defaultProfile(mockReq, mockRes, mockNext);

      expect(mockProfileService.getProfileById).toHaveBeenCalledWith(1, true);
      expect(mockRes.render).toHaveBeenCalledWith("profile_template", {
        profile: expectedProfile,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle no default profile found with 404 error", async () => {
      mockProfileService.getProfileById.mockResolvedValue(null);

      await webController.defaultProfile(mockReq, mockRes, mockNext);

      expect(mockProfileService.getProfileById).toHaveBeenCalledWith(1, true);
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.render).toHaveBeenCalledWith("error", {
        message: "No profiles found",
        error: { status: 404 },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle undefined profile response", async () => {
      mockProfileService.getProfileById.mockResolvedValue(undefined);

      await webController.defaultProfile(mockReq, mockRes, mockNext);

      expect(mockProfileService.getProfileById).toHaveBeenCalledWith(1, true);
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.render).toHaveBeenCalledWith("error", {
        message: "No profiles found",
        error: { status: 404 },
      });
    });

    it("should handle service errors by calling next", async () => {
      const serviceError = new Error("Profile service unavailable");
      mockProfileService.getProfileById.mockRejectedValue(serviceError);

      await webController.defaultProfile(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(serviceError);
      expect(mockRes.render).not.toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it("should handle database connection errors", async () => {
      const dbError = new Error("Database connection timeout");
      mockProfileService.getProfileById.mockRejectedValue(dbError);

      await webController.defaultProfile(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(dbError);
      expect(mockRes.render).not.toHaveBeenCalled();
    });

    it("should handle validation errors from service", async () => {
      const validationError = mockFactories.validationError(
        "Invalid default profile configuration"
      );
      mockProfileService.getProfileById.mockRejectedValue(validationError);

      await webController.defaultProfile(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(validationError);
      expect(mockRes.render).not.toHaveBeenCalled();
    });
  });

  describe("Integration scenarios", () => {
    it("should handle multiple profile requests correctly", async () => {
      const profile1 = mockFactories.profile({ id: 1, name: "Profile 1" });
      const profile2 = mockFactories.profile({ id: 2, name: "Profile 2" });

      mockProfileService.getProfileById
        .mockResolvedValueOnce(profile1)
        .mockResolvedValueOnce(profile2);

      mockReq.params.id = "1";
      await webController.profile(mockReq, mockRes, mockNext);

      expect(mockProfileService.getProfileById).toHaveBeenCalledWith(1, false);
      expect(mockRes.render).toHaveBeenCalledWith("profile_template", {
        profile: profile1,
      });

      mockRes.render.mockClear();

      mockReq.params.id = "2";
      await webController.profile(mockReq, mockRes, mockNext);

      expect(mockProfileService.getProfileById).toHaveBeenCalledWith(2, false);
      expect(mockRes.render).toHaveBeenCalledWith("profile_template", {
        profile: profile2,
      });
    });

    it("should maintain proper isolation between profile and defaultProfile methods", async () => {
      const specificProfile = mockFactories.profile({
        id: 5,
        name: "Specific Profile",
      });
      const defaultProfile = mockFactories.profile({
        id: 1,
        name: "Default Profile",
      });

      mockProfileService.getProfileById
        .mockResolvedValueOnce(specificProfile)
        .mockResolvedValueOnce(defaultProfile);

      mockReq.params.id = "5";
      await webController.profile(mockReq, mockRes, mockNext);

      mockRes.render.mockClear();
      mockProfileService.getProfileById.mockClear();
      mockProfileService.getProfileById.mockResolvedValue(defaultProfile);

      await webController.defaultProfile(mockReq, mockRes, mockNext);

      expect(mockProfileService.getProfileById).toHaveBeenCalledWith(1, true);
      expect(mockRes.render).toHaveBeenCalledWith("profile_template", {
        profile: defaultProfile,
      });
    });
  });

  describe("Error handling edge cases", () => {
    it("should handle empty string ID parameter", async () => {
      mockReq.params.id = "";
      const expectedProfile = mockFactories.profile({ id: 1 });
      mockProfileService.getProfileById.mockResolvedValue(expectedProfile);

      await webController.profile(mockReq, mockRes, mockNext);

      expect(mockProfileService.getProfileById).toHaveBeenCalledWith(1, true);
      expect(mockRes.render).toHaveBeenCalledWith("profile_template", {
        profile: expectedProfile,
      });
    });

    it("should handle NaN ID parameter", async () => {
      mockReq.params.id = "not-a-number";
      mockProfileService.getProfileById.mockResolvedValue(null);

      await webController.profile(mockReq, mockRes, mockNext);

      expect(mockProfileService.getProfileById).toHaveBeenCalledWith(
        NaN,
        false
      );
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.render).toHaveBeenCalledWith("error", {
        message: "Profile not found",
        error: { status: 404 },
      });
    });

    it("should handle service returning falsy values correctly", async () => {
      const falsyValues = [null, undefined, false, 0, "", NaN];

      for (const falsyValue of falsyValues) {
        mockRes.status.mockClear();
        mockRes.render.mockClear();
        mockProfileService.getProfileById.mockClear();

        mockReq.params.id = "1";
        mockProfileService.getProfileById.mockResolvedValue(falsyValue);

        await webController.profile(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(404);
        expect(mockRes.render).toHaveBeenCalledWith("error", {
          message: "Profile not found",
          error: { status: 404 },
        });
      }
    });
  });

  describe("Service isolation and mocking", () => {
    it("should not call actual ProfileService", () => {
      expect(ProfileService).toHaveBeenCalled();
      expect(mockProfileService.getProfileById).toBeDefined();
      expect(typeof mockProfileService.getProfileById).toBe("function");
    });

    it("should reset service calls between tests", () => {
      expect(mockProfileService.getProfileById).not.toHaveBeenCalled();
    });
  });
});
