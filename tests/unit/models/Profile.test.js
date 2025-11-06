const mongoose = require("mongoose");
const Profile = require("../../../models/Profile");
const { mockFactories } = require("../../helpers/testHelpers");

jest.mock("mongoose", () => {
  const originalMongoose = jest.requireActual("mongoose");
  return {
    ...originalMongoose,
    connect: jest.fn(),
    connection: {
      readyState: 1,
    },
  };
});

describe("Profile Model", () => {
  let validProfileData;

  beforeEach(() => {
    validProfileData = {
      profileId: 1,
      name: "Test Profile",
      description: "This is a test profile description",
      mbti: "INTJ",
      enneagram: "5w4",
      variant: "sp/sx",
      tritype: 514,
      socionics: "ILI",
      sloan: "RCOEI",
      psyche: "VLEF",
      image: "https://example.com/image.jpg",
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Schema Validation", () => {
    describe("Required Fields", () => {
      it("should be valid with all required fields", () => {
        const profile = new Profile(validProfileData);
        const validationError = profile.validateSync();

        expect(validationError).toBeUndefined();
      });

      const requiredFields = [
        "profileId",
        "name",
        "description",
        "mbti",
        "enneagram",
        "variant",
        "tritype",
        "socionics",
        "sloan",
        "psyche",
        "image",
      ];

      requiredFields.forEach((field) => {
        it(`should require ${field} field`, () => {
          const profile = new Profile({
            ...validProfileData,
            [field]: undefined,
          });
          const validationError = profile.validateSync();

          expect(validationError).toBeDefined();
          expect(validationError.errors[field]).toBeDefined();
          expect(validationError.errors[field].message).toContain("required");
        });
      });
    });

    describe("ProfileId Validation", () => {
      it("should accept valid profileId as number", () => {
        const profile = new Profile({
          ...validProfileData,
          profileId: 123,
        });
        const validationError = profile.validateSync();

        expect(validationError).toBeUndefined();
        expect(profile.profileId).toBe(123);
      });

      it("should enforce unique profileId constraint in schema", () => {
        const profile = new Profile(validProfileData);

        expect(profile.schema.paths.profileId.options.unique).toBe(true);
      });
    });

    describe("MBTI Validation", () => {
      const validMbtiTypes = [
        "INTJ",
        "INTP",
        "ENTJ",
        "ENTP",
        "INFJ",
        "INFP",
        "ENFJ",
        "ENFP",
        "ISTJ",
        "ISFJ",
        "ESTJ",
        "ESFJ",
        "ISTP",
        "ISFP",
        "ESTP",
        "ESFP",
      ];

      validMbtiTypes.forEach((mbtiType) => {
        it(`should accept valid MBTI type: ${mbtiType}`, () => {
          const profile = new Profile({
            ...validProfileData,
            mbti: mbtiType,
          });
          const validationError = profile.validateSync();

          expect(validationError).toBeUndefined();
        });
      });

      it("should convert MBTI to uppercase", () => {
        const profile = new Profile({
          ...validProfileData,
          mbti: "intj",
        });

        expect(profile.mbti).toBe("INTJ");
      });

      const invalidMbtiTypes = [
        "INTF",
        "INT",
        "ABCD",
        "XXXX",
        "1234",
        "",
        "intj-invalid",
      ];

      invalidMbtiTypes.forEach((invalidType) => {
        it(`should reject invalid MBTI type: ${invalidType}`, () => {
          const profile = new Profile({
            ...validProfileData,
            mbti: invalidType,
          });
          const validationError = profile.validateSync();

          expect(validationError).toBeDefined();
          expect(validationError.errors.mbti).toBeDefined();

          if (invalidType === "") {
            expect(validationError.errors.mbti.message).toContain("required");
          } else {
            expect(validationError.errors.mbti.message).toContain(
              "valid 4-letter type"
            );
          }
        });
      });
    });

    describe("Tritype Validation", () => {
      it("should accept valid tritype within range", () => {
        const validTritypes = [123, 456, 789, 147, 258, 369];

        validTritypes.forEach((tritype) => {
          const profile = new Profile({
            ...validProfileData,
            tritype: tritype,
          });
          const validationError = profile.validateSync();

          expect(validationError).toBeUndefined();
        });
      });

      it("should reject tritype below minimum", () => {
        const profile = new Profile({
          ...validProfileData,
          tritype: 99,
        });
        const validationError = profile.validateSync();

        expect(validationError).toBeDefined();
        expect(validationError.errors.tritype).toBeDefined();
      });

      it("should reject tritype above maximum", () => {
        const profile = new Profile({
          ...validProfileData,
          tritype: 1000,
        });
        const validationError = profile.validateSync();

        expect(validationError).toBeDefined();
        expect(validationError.errors.tritype).toBeDefined();
      });
    });

    describe("Image URL Validation", () => {
      const validImageUrls = [
        "https://example.com/image.jpg",
        "http://test.com/photo.jpeg",
        "https://cdn.example.com/pic.png",
        "http://images.site.com/avatar.gif",
        "https://media.example.com/profile.webp",
      ];

      validImageUrls.forEach((url) => {
        it(`should accept valid image URL: ${url}`, () => {
          const profile = new Profile({
            ...validProfileData,
            image: url,
          });
          const validationError = profile.validateSync();

          expect(validationError).toBeUndefined();
        });
      });

      const invalidImageUrls = [
        "not-a-url",
        "ftp://example.com/image.jpg",
        "https://example.com/document.pdf",
        "http://example.com/file.txt",
        "https://example.com/image",
        "example.com/image.jpg",
      ];

      invalidImageUrls.forEach((url) => {
        it(`should reject invalid image URL: ${url}`, () => {
          const profile = new Profile({
            ...validProfileData,
            image: url,
          });
          const validationError = profile.validateSync();

          expect(validationError).toBeDefined();
          expect(validationError.errors.image).toBeDefined();
          expect(validationError.errors.image.message).toContain("valid URL");
        });
      });
    });

    describe("Field Trimming and Case Conversion", () => {
      it("should trim name field", () => {
        const profile = new Profile({
          ...validProfileData,
          name: "  Test Name  ",
        });

        expect(profile.name).toBe("Test Name");
      });

      it("should convert socionics to uppercase", () => {
        const profile = new Profile({
          ...validProfileData,
          socionics: "ili",
        });

        expect(profile.socionics).toBe("ILI");
      });

      it("should convert sloan to uppercase", () => {
        const profile = new Profile({
          ...validProfileData,
          sloan: "rcoei",
        });

        expect(profile.sloan).toBe("RCOEI");
      });

      it("should convert psyche to uppercase", () => {
        const profile = new Profile({
          ...validProfileData,
          psyche: "vlef",
        });

        expect(profile.psyche).toBe("VLEF");
      });
    });

    describe("Data Types", () => {
      it("should accept string fields as strings", () => {
        const profile = new Profile(validProfileData);

        expect(typeof profile.name).toBe("string");
        expect(typeof profile.description).toBe("string");
        expect(typeof profile.mbti).toBe("string");
        expect(typeof profile.enneagram).toBe("string");
        expect(typeof profile.variant).toBe("string");
        expect(typeof profile.socionics).toBe("string");
        expect(typeof profile.sloan).toBe("string");
        expect(typeof profile.psyche).toBe("string");
        expect(typeof profile.image).toBe("string");
      });

      it("should accept profileId as number", () => {
        const profile = new Profile(validProfileData);

        expect(typeof profile.profileId).toBe("number");
      });

      it("should accept tritype as number", () => {
        const profile = new Profile(validProfileData);

        expect(typeof profile.tritype).toBe("number");
      });
    });
  });

  describe("Instance Methods", () => {
    let profile;

    beforeEach(() => {
      profile = new Profile(validProfileData);
    });

    describe("toPublicJSON", () => {
      it("should return properly formatted public JSON", () => {
        const publicJSON = profile.toPublicJSON();

        expect(publicJSON).toHaveProperty("id", validProfileData.profileId);
        expect(publicJSON).toHaveProperty("name", validProfileData.name);
        expect(publicJSON).toHaveProperty(
          "description",
          validProfileData.description
        );
        expect(publicJSON).toHaveProperty("mbti", validProfileData.mbti);
        expect(publicJSON).toHaveProperty(
          "enneagram",
          validProfileData.enneagram
        );
        expect(publicJSON).toHaveProperty("variant", validProfileData.variant);
        expect(publicJSON).toHaveProperty("tritype", validProfileData.tritype);
        expect(publicJSON).toHaveProperty(
          "socionics",
          validProfileData.socionics
        );
        expect(publicJSON).toHaveProperty("sloan", validProfileData.sloan);
        expect(publicJSON).toHaveProperty("psyche", validProfileData.psyche);
        expect(publicJSON).toHaveProperty("image", validProfileData.image);
      });

      it("should not include internal fields", () => {
        const publicJSON = profile.toPublicJSON();

        expect(publicJSON).not.toHaveProperty("_id");
        expect(publicJSON).not.toHaveProperty("__v");
        expect(publicJSON).not.toHaveProperty("createdAt");
        expect(publicJSON).not.toHaveProperty("updatedAt");
      });

      it("should use profileId as id", () => {
        const publicJSON = profile.toPublicJSON();

        expect(publicJSON.id).toBe(validProfileData.profileId);
      });
    });
  });

  describe("Static Methods", () => {
    beforeEach(() => {
      Profile.findOne = jest.fn();
    });

    describe("findByProfileId", () => {
      it("should find profile with correct query parameters", () => {
        const profileId = 123;
        Profile.findByProfileId(profileId);

        expect(Profile.findOne).toHaveBeenCalledWith({ profileId: profileId });
      });

      it("should return the result from findOne", async () => {
        const profileId = 456;
        const expectedProfile = { profileId: 456, name: "Test" };
        Profile.findOne.mockResolvedValue(expectedProfile);

        const result = await Profile.findByProfileId(profileId);

        expect(result).toBe(expectedProfile);
      });

      it("should handle null result", async () => {
        const profileId = 999;
        Profile.findOne.mockResolvedValue(null);

        const result = await Profile.findByProfileId(profileId);

        expect(result).toBeNull();
      });
    });
  });

  describe("Schema Configuration", () => {
    it("should have timestamps enabled", () => {
      const profile = new Profile(validProfileData);

      expect(profile).toHaveProperty("createdAt");
      expect(profile).toHaveProperty("updatedAt");
    });

    describe("toJSON Transform", () => {
      it("should use profileId as id in JSON output", () => {
        const profile = new Profile(validProfileData);
        const json = profile.toJSON();

        expect(json.id).toBe(validProfileData.profileId);
        expect(json).not.toHaveProperty("profileId");
      });

      it("should remove _id and __v from JSON output", () => {
        const profile = new Profile(validProfileData);
        const json = profile.toJSON();

        expect(json).not.toHaveProperty("_id");
        expect(json).not.toHaveProperty("__v");
      });

      it("should include virtual id field", () => {
        const profile = new Profile(validProfileData);
        const json = profile.toJSON();

        expect(json).toHaveProperty("id");
      });
    });

    describe("Indexes", () => {
      it("should have index on profileId field", () => {
        const indexes = Profile.schema.indexes();
        const profileIdIndex = indexes.find(
          (index) => index[0].profileId !== undefined
        );

        expect(profileIdIndex).toBeDefined();
      });

      it("should have index on name field", () => {
        const indexes = Profile.schema.indexes();
        const nameIndex = indexes.find((index) => index[0].name !== undefined);

        expect(nameIndex).toBeDefined();
      });
    });
  });

  describe("Model Integration", () => {
    it("should create a valid Profile instance", () => {
      const profile = new Profile(validProfileData);

      expect(profile).toBeInstanceOf(Profile);
      expect(profile.profileId).toBe(validProfileData.profileId);
      expect(profile.name).toBe(validProfileData.name);
      expect(profile.mbti).toBe(validProfileData.mbti);
    });

    it("should handle all personality type fields correctly", () => {
      const complexProfileData = {
        ...validProfileData,
        mbti: "enfp",
        enneagram: "7w8",
        variant: "sx/so",
        tritype: 738,
        socionics: "iee",
        sloan: "sluei",
        psyche: "fvel",
      };

      const profile = new Profile(complexProfileData);

      expect(profile.mbti).toBe("ENFP");
      expect(profile.enneagram).toBe("7w8");
      expect(profile.variant).toBe("sx/so");
      expect(profile.tritype).toBe(738);
      expect(profile.socionics).toBe("IEE");
      expect(profile.sloan).toBe("SLUEI");
      expect(profile.psyche).toBe("FVEL");
    });

    it("should validate complete profile workflow", () => {
      // Create profile
      const profile = new Profile(validProfileData);
      expect(profile.validateSync()).toBeUndefined();

      // Get public JSON
      const publicJSON = profile.toPublicJSON();
      expect(publicJSON.id).toBe(validProfileData.profileId);

      // Test static method structure
      expect(typeof Profile.findByProfileId).toBe("function");
    });

    it("should handle edge case values", () => {
      const edgeCaseData = {
        ...validProfileData,
        tritype: 100,
        mbti: "isfp",
        name: "   Trimmed Name   ",
        image: "https://example.com/image.JPEG",
      };

      const profile = new Profile(edgeCaseData);
      const validationError = profile.validateSync();

      expect(validationError).toBeUndefined();
      expect(profile.tritype).toBe(100);
      expect(profile.mbti).toBe("ISFP");
      expect(profile.name).toBe("Trimmed Name");
    });
  });

  describe("Error Scenarios", () => {
    it("should provide meaningful error messages for validation failures", () => {
      const invalidProfile = new Profile({
        profileId: "not-a-number",
        name: "",
        mbti: "invalid",
        tritype: 50,
        image: "not-a-url",
      });

      const validationError = invalidProfile.validateSync();

      expect(validationError).toBeDefined();
      expect(Object.keys(validationError.errors)).toContain("mbti");
      expect(Object.keys(validationError.errors)).toContain("tritype");
      expect(Object.keys(validationError.errors)).toContain("image");
    });

    it("should handle missing required fields gracefully", () => {
      const incompleteProfile = new Profile({
        profileId: 1,
        name: "Test",
      });

      const validationError = incompleteProfile.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors).toBeDefined();

      const errorFields = Object.keys(validationError.errors);
      expect(errorFields).toContain("description");
      expect(errorFields).toContain("mbti");
      expect(errorFields).toContain("enneagram");
    });
  });
});
