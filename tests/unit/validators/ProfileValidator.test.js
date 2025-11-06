"use strict";

const {
  ProfileValidator,
  createProfileSchema,
  updateProfileSchema,
  profileIdSchema,
  paginationSchema,
} = require("../../../validators/ProfileValidator");

describe("ProfileValidator", () => {
  describe("validateCreate", () => {
    const validProfileData = {
      profileId: 1,
      name: "John Doe",
      description: "A test profile description that meets minimum length",
      mbti: "INTJ",
      enneagram: "5w4",
      variant: "sp/sx",
      tritype: 548,
      socionics: "ILI",
      sloan: "RCUAI",
      psyche: "FLVE",
      image: "https://example.com/image.jpg",
    };

    it("should validate valid profile data successfully", async () => {
      const result = await ProfileValidator.validateCreate(validProfileData);
      expect(result).toEqual(validProfileData);
    });

    it("should trim and normalize string fields", async () => {
      const dataWithWhitespace = {
        ...validProfileData,
        name: "  John Doe  ",
        description: "  A test profile description that meets minimum length  ",
        mbti: "intj",
        enneagram: "  5w4  ",
        variant: "  sp/sx  ",
        socionics: "ili",
        sloan: "rcuai",
        psyche: "flve",
      };

      const result = await ProfileValidator.validateCreate(dataWithWhitespace);

      expect(result.name).toBe("John Doe");
      expect(result.description).toBe(
        "A test profile description that meets minimum length"
      );
      expect(result.mbti).toBe("INTJ");
      expect(result.enneagram).toBe("5w4");
      expect(result.variant).toBe("sp/sx");
      expect(result.socionics).toBe("ILI");
      expect(result.sloan).toBe("RCUAI");
      expect(result.psyche).toBe("FLVE");
    });

    it("should strip unknown fields", async () => {
      const dataWithUnknownFields = {
        ...validProfileData,
        unknownField: "should be removed",
        anotherUnknown: 123,
      };

      const result = await ProfileValidator.validateCreate(
        dataWithUnknownFields
      );

      expect(result).not.toHaveProperty("unknownField");
      expect(result).not.toHaveProperty("anotherUnknown");
    });

    describe("profileId validation", () => {
      it("should require profileId field", async () => {
        const dataWithoutProfileId = { ...validProfileData };
        delete dataWithoutProfileId.profileId;

        await expect(
          ProfileValidator.validateCreate(dataWithoutProfileId)
        ).rejects.toMatchObject({
          name: "ValidationError",
          message: "Validation failed",
          details: {
            profileId: "Profile ID is required",
          },
        });
      });

      it("should reject non-integer profileId", async () => {
        const dataWithFloatProfileId = {
          ...validProfileData,
          profileId: 1.5,
        };

        await expect(
          ProfileValidator.validateCreate(dataWithFloatProfileId)
        ).rejects.toMatchObject({
          name: "ValidationError",
          details: {
            profileId: "Profile ID must be an integer",
          },
        });
      });

      it("should reject profileId less than 1", async () => {
        const dataWithZeroProfileId = {
          ...validProfileData,
          profileId: 0,
        };

        await expect(
          ProfileValidator.validateCreate(dataWithZeroProfileId)
        ).rejects.toMatchObject({
          name: "ValidationError",
          details: {
            profileId: "Profile ID must be greater than 0",
          },
        });
      });

      it("should reject profileId greater than 99999", async () => {
        const dataWithLargeProfileId = {
          ...validProfileData,
          profileId: 100000,
        };

        await expect(
          ProfileValidator.validateCreate(dataWithLargeProfileId)
        ).rejects.toMatchObject({
          name: "ValidationError",
          details: {
            profileId: "Profile ID must be less than 100000",
          },
        });
      });

      it("should accept profileId at boundaries", async () => {
        const dataWithMinProfileId = { ...validProfileData, profileId: 1 };
        const dataWithMaxProfileId = { ...validProfileData, profileId: 99999 };

        const minResult = await ProfileValidator.validateCreate(
          dataWithMinProfileId
        );
        const maxResult = await ProfileValidator.validateCreate(
          dataWithMaxProfileId
        );

        expect(minResult.profileId).toBe(1);
        expect(maxResult.profileId).toBe(99999);
      });
    });

    describe("name validation", () => {
      it("should require name field", async () => {
        const dataWithoutName = { ...validProfileData };
        delete dataWithoutName.name;

        await expect(
          ProfileValidator.validateCreate(dataWithoutName)
        ).rejects.toMatchObject({
          name: "ValidationError",
          details: {
            name: "Name is required",
          },
        });
      });

      it("should reject name shorter than 2 characters", async () => {
        const dataWithShortName = {
          ...validProfileData,
          name: "A",
        };

        await expect(
          ProfileValidator.validateCreate(dataWithShortName)
        ).rejects.toMatchObject({
          name: "ValidationError",
          details: {
            name: "Name must be at least 2 characters",
          },
        });
      });

      it("should reject name longer than 100 characters", async () => {
        const dataWithLongName = {
          ...validProfileData,
          name: "A".repeat(101),
        };

        await expect(
          ProfileValidator.validateCreate(dataWithLongName)
        ).rejects.toMatchObject({
          name: "ValidationError",
          details: {
            name: "Name must not exceed 100 characters",
          },
        });
      });

      it("should accept name at boundaries", async () => {
        const dataWithMinName = { ...validProfileData, name: "AB" };
        const dataWithMaxName = { ...validProfileData, name: "A".repeat(100) };

        const minResult = await ProfileValidator.validateCreate(
          dataWithMinName
        );
        const maxResult = await ProfileValidator.validateCreate(
          dataWithMaxName
        );

        expect(minResult.name).toBe("AB");
        expect(maxResult.name).toBe("A".repeat(100));
      });
    });

    describe("description validation", () => {
      it("should require description field", async () => {
        const dataWithoutDescription = { ...validProfileData };
        delete dataWithoutDescription.description;

        await expect(
          ProfileValidator.validateCreate(dataWithoutDescription)
        ).rejects.toMatchObject({
          name: "ValidationError",
          details: {
            description: "Description is required",
          },
        });
      });

      it("should reject description shorter than 10 characters", async () => {
        const dataWithShortDescription = {
          ...validProfileData,
          description: "Short",
        };

        await expect(
          ProfileValidator.validateCreate(dataWithShortDescription)
        ).rejects.toMatchObject({
          name: "ValidationError",
          details: {
            description: "Description must be at least 10 characters",
          },
        });
      });

      it("should reject description longer than 1000 characters", async () => {
        const dataWithLongDescription = {
          ...validProfileData,
          description: "A".repeat(1001),
        };

        await expect(
          ProfileValidator.validateCreate(dataWithLongDescription)
        ).rejects.toMatchObject({
          name: "ValidationError",
          details: {
            description: "Description must not exceed 1000 characters",
          },
        });
      });

      it("should accept description at boundaries", async () => {
        const minDescription = "A".repeat(10);
        const maxDescription = "A".repeat(1000);

        const dataWithMinDescription = {
          ...validProfileData,
          description: minDescription,
        };
        const dataWithMaxDescription = {
          ...validProfileData,
          description: maxDescription,
        };

        const minResult = await ProfileValidator.validateCreate(
          dataWithMinDescription
        );
        const maxResult = await ProfileValidator.validateCreate(
          dataWithMaxDescription
        );

        expect(minResult.description).toBe(minDescription);
        expect(maxResult.description).toBe(maxDescription);
      });
    });

    describe("mbti validation", () => {
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

      it("should require mbti field", async () => {
        const dataWithoutMbti = { ...validProfileData };
        delete dataWithoutMbti.mbti;

        await expect(
          ProfileValidator.validateCreate(dataWithoutMbti)
        ).rejects.toMatchObject({
          name: "ValidationError",
          details: {
            mbti: "MBTI is required",
          },
        });
      });

      it("should accept all valid MBTI types", async () => {
        for (const mbti of validMbtiTypes) {
          const dataWithMbti = { ...validProfileData, mbti };
          const result = await ProfileValidator.validateCreate(dataWithMbti);
          expect(result.mbti).toBe(mbti);
        }
      });

      it("should reject invalid MBTI format", async () => {
        const invalidMbtiTypes = ["ABCD", "INT", "INTJJ", "1234"];

        for (const mbti of invalidMbtiTypes) {
          const dataWithInvalidMbti = { ...validProfileData, mbti };

          await expect(
            ProfileValidator.validateCreate(dataWithInvalidMbti)
          ).rejects.toMatchObject({
            name: "ValidationError",
            details: {
              mbti: "MBTI must be a valid 4-letter type (e.g., ISFJ)",
            },
          });
        }

        // Test empty MBTI separately as it has different error message
        const dataWithEmptyMbti = { ...validProfileData, mbti: "" };
        await expect(
          ProfileValidator.validateCreate(dataWithEmptyMbti)
        ).rejects.toMatchObject({
          name: "ValidationError",
          details: {
            mbti: "MBTI is required",
          },
        });
      });

      it("should convert lowercase MBTI to uppercase", async () => {
        const dataWithLowercaseMbti = { ...validProfileData, mbti: "intj" };
        const result = await ProfileValidator.validateCreate(
          dataWithLowercaseMbti
        );
        expect(result.mbti).toBe("INTJ");
      });
    });

    describe("tritype validation", () => {
      it("should require tritype field", async () => {
        const dataWithoutTritype = { ...validProfileData };
        delete dataWithoutTritype.tritype;

        await expect(
          ProfileValidator.validateCreate(dataWithoutTritype)
        ).rejects.toMatchObject({
          name: "ValidationError",
          details: {
            tritype: "Tritype is required",
          },
        });
      });

      it("should reject tritype less than 100", async () => {
        const dataWithSmallTritype = { ...validProfileData, tritype: 99 };

        await expect(
          ProfileValidator.validateCreate(dataWithSmallTritype)
        ).rejects.toMatchObject({
          name: "ValidationError",
          details: {
            tritype: "Tritype must be a 3-digit number (100-999)",
          },
        });
      });

      it("should reject tritype greater than 999", async () => {
        const dataWithLargeTritype = { ...validProfileData, tritype: 1000 };

        await expect(
          ProfileValidator.validateCreate(dataWithLargeTritype)
        ).rejects.toMatchObject({
          name: "ValidationError",
          details: {
            tritype: "Tritype must be a 3-digit number (100-999)",
          },
        });
      });

      it("should reject non-integer tritype", async () => {
        const dataWithFloatTritype = { ...validProfileData, tritype: 123.5 };

        await expect(
          ProfileValidator.validateCreate(dataWithFloatTritype)
        ).rejects.toMatchObject({
          name: "ValidationError",
          details: {
            tritype: "Tritype must be an integer",
          },
        });
      });

      it("should accept tritype at boundaries", async () => {
        const dataWithMinTritype = { ...validProfileData, tritype: 100 };
        const dataWithMaxTritype = { ...validProfileData, tritype: 999 };

        const minResult = await ProfileValidator.validateCreate(
          dataWithMinTritype
        );
        const maxResult = await ProfileValidator.validateCreate(
          dataWithMaxTritype
        );

        expect(minResult.tritype).toBe(100);
        expect(maxResult.tritype).toBe(999);
      });
    });

    describe("sloan validation", () => {
      it("should require sloan field", async () => {
        const dataWithoutSloan = { ...validProfileData };
        delete dataWithoutSloan.sloan;

        await expect(
          ProfileValidator.validateCreate(dataWithoutSloan)
        ).rejects.toMatchObject({
          name: "ValidationError",
          details: {
            sloan: "SLOAN is required",
          },
        });
      });

      it("should reject sloan not exactly 5 characters", async () => {
        const dataWithShortSloan = { ...validProfileData, sloan: "RCUA" };
        const dataWithLongSloan = { ...validProfileData, sloan: "RCUAII" };

        await expect(
          ProfileValidator.validateCreate(dataWithShortSloan)
        ).rejects.toMatchObject({
          name: "ValidationError",
          details: {
            sloan: "SLOAN must contain only R, C, U, A, I characters",
          },
        });

        await expect(
          ProfileValidator.validateCreate(dataWithLongSloan)
        ).rejects.toMatchObject({
          name: "ValidationError",
          details: {
            sloan: "SLOAN must contain only R, C, U, A, I characters",
          },
        });
      });

      it("should reject sloan with invalid characters", async () => {
        const dataWithInvalidSloan = { ...validProfileData, sloan: "RCXYZ" };

        await expect(
          ProfileValidator.validateCreate(dataWithInvalidSloan)
        ).rejects.toMatchObject({
          name: "ValidationError",
          details: {
            sloan: "SLOAN must contain only R, C, U, A, I characters",
          },
        });
      });

      it("should accept valid sloan combinations", async () => {
        const validSloans = ["RCUAI", "UUUUU", "AAAAA", "IIIII", "CCCCC"];

        for (const sloan of validSloans) {
          const dataWithSloan = { ...validProfileData, sloan };
          const result = await ProfileValidator.validateCreate(dataWithSloan);
          expect(result.sloan).toBe(sloan);
        }
      });

      it("should convert lowercase sloan to uppercase", async () => {
        const dataWithLowercaseSloan = { ...validProfileData, sloan: "rcuai" };
        const result = await ProfileValidator.validateCreate(
          dataWithLowercaseSloan
        );
        expect(result.sloan).toBe("RCUAI");
      });
    });

    describe("psyche validation", () => {
      it("should require psyche field", async () => {
        const dataWithoutPsyche = { ...validProfileData };
        delete dataWithoutPsyche.psyche;

        await expect(
          ProfileValidator.validateCreate(dataWithoutPsyche)
        ).rejects.toMatchObject({
          name: "ValidationError",
          details: {
            psyche: "Psyche is required",
          },
        });
      });

      it("should reject psyche not exactly 4 characters", async () => {
        const dataWithShortPsyche = { ...validProfileData, psyche: "FLV" };
        const dataWithLongPsyche = { ...validProfileData, psyche: "FLVEE" };

        await expect(
          ProfileValidator.validateCreate(dataWithShortPsyche)
        ).rejects.toMatchObject({
          name: "ValidationError",
          details: {
            psyche: "Psyche must contain only F, L, V, E characters",
          },
        });

        await expect(
          ProfileValidator.validateCreate(dataWithLongPsyche)
        ).rejects.toMatchObject({
          name: "ValidationError",
          details: {
            psyche: "Psyche must contain only F, L, V, E characters",
          },
        });
      });

      it("should reject psyche with invalid characters", async () => {
        const dataWithInvalidPsyche = { ...validProfileData, psyche: "FLXY" };

        await expect(
          ProfileValidator.validateCreate(dataWithInvalidPsyche)
        ).rejects.toMatchObject({
          name: "ValidationError",
          details: {
            psyche: "Psyche must contain only F, L, V, E characters",
          },
        });
      });

      it("should accept valid psyche combinations", async () => {
        const validPsyches = ["FLVE", "FFFF", "LLLL", "VVVV", "EEEE"];

        for (const psyche of validPsyches) {
          const dataWithPsyche = { ...validProfileData, psyche };
          const result = await ProfileValidator.validateCreate(dataWithPsyche);
          expect(result.psyche).toBe(psyche);
        }
      });

      it("should convert lowercase psyche to uppercase", async () => {
        const dataWithLowercasePsyche = { ...validProfileData, psyche: "flve" };
        const result = await ProfileValidator.validateCreate(
          dataWithLowercasePsyche
        );
        expect(result.psyche).toBe("FLVE");
      });
    });

    describe("image validation", () => {
      it("should require image field", async () => {
        const dataWithoutImage = { ...validProfileData };
        delete dataWithoutImage.image;

        await expect(
          ProfileValidator.validateCreate(dataWithoutImage)
        ).rejects.toMatchObject({
          name: "ValidationError",
          details: {
            image: "Image URL is required",
          },
        });
      });

      it("should reject invalid URL format", async () => {
        const dataWithInvalidUrl = {
          ...validProfileData,
          image: "not-a-url",
        };

        await expect(
          ProfileValidator.validateCreate(dataWithInvalidUrl)
        ).rejects.toMatchObject({
          name: "ValidationError",
          details: {
            image:
              "Image must be a valid image file (jpg, jpeg, png, gif, webp)",
          },
        });
      });

      it("should reject URLs without image extensions", async () => {
        const dataWithNonImageUrl = {
          ...validProfileData,
          image: "https://example.com/document.pdf",
        };

        await expect(
          ProfileValidator.validateCreate(dataWithNonImageUrl)
        ).rejects.toMatchObject({
          name: "ValidationError",
          details: {
            image:
              "Image must be a valid image file (jpg, jpeg, png, gif, webp)",
          },
        });
      });

      it("should accept valid image extensions", async () => {
        const validExtensions = [
          "jpg",
          "jpeg",
          "png",
          "gif",
          "webp",
          "JPG",
          "PNG",
        ];

        for (const ext of validExtensions) {
          const dataWithImageExt = {
            ...validProfileData,
            image: `https://example.com/image.${ext}`,
          };
          const result = await ProfileValidator.validateCreate(
            dataWithImageExt
          );
          expect(result.image).toBe(`https://example.com/image.${ext}`);
        }
      });
    });

    it("should handle multiple validation errors", async () => {
      const invalidData = {
        profileId: 0, // invalid
        name: "A", // too short
        description: "Short", // too short
        mbti: "ABCD", // invalid format
        enneagram: "", // empty
        variant: "", // empty
        tritype: 99, // too small
        socionics: "", // empty
        sloan: "ABCD", // too short and invalid chars
        psyche: "ABC", // too short
        image: "not-a-url", // invalid URL
      };

      const error = await ProfileValidator.validateCreate(invalidData).catch(
        (e) => e
      );

      expect(error).toMatchObject({
        name: "ValidationError",
        details: expect.objectContaining({
          profileId: expect.stringContaining(
            "Profile ID must be greater than 0"
          ),
          name: expect.stringContaining("Name must be at least 2 characters"),
          description: expect.stringContaining(
            "Description must be at least 10 characters"
          ),
          mbti: expect.stringContaining("MBTI must be a valid 4-letter type"),
        }),
      });
    });
  });

  describe("validateUpdate", () => {
    it("should validate valid update data", async () => {
      const updateData = {
        name: "Updated Name",
        description:
          "Updated description that meets minimum length requirements",
        mbti: "ENFP",
      };

      const result = await ProfileValidator.validateUpdate(updateData);
      expect(result).toEqual(updateData);
    });

    it("should validate partial update data", async () => {
      const updateData = {
        name: "Only updating name",
      };

      const result = await ProfileValidator.validateUpdate(updateData);
      expect(result).toEqual(updateData);
    });

    it("should accept empty update object", async () => {
      const updateData = {};

      const result = await ProfileValidator.validateUpdate(updateData);
      expect(result).toEqual({});
    });

    it("should validate all fields with same rules as create", async () => {
      const updateData = {
        name: "A", // too short
        description: "Short", // too short
        mbti: "INVALID", // invalid format
      };

      await expect(
        ProfileValidator.validateUpdate(updateData)
      ).rejects.toMatchObject({
        name: "ValidationError",
        details: {
          name: "Name must be at least 2 characters",
          description: "Description must be at least 10 characters",
          mbti: "MBTI must be a valid 4-letter type (e.g., ISFJ)",
        },
      });
    });

    it("should strip unknown fields", async () => {
      const updateData = {
        name: "Valid Name",
        unknownField: "should be removed",
      };

      const result = await ProfileValidator.validateUpdate(updateData);
      expect(result).toEqual({
        name: "Valid Name",
      });
    });

    it("should handle all personality type fields", async () => {
      const updateData = {
        mbti: "isfp",
        enneagram: "9w1",
        variant: "so/sp",
        tritype: 125,
        socionics: "sei",
        sloan: "rcuai",
        psyche: "elvf",
      };

      const result = await ProfileValidator.validateUpdate(updateData);
      expect(result).toEqual({
        mbti: "ISFP",
        enneagram: "9w1",
        variant: "so/sp",
        tritype: 125,
        socionics: "SEI",
        sloan: "RCUAI",
        psyche: "ELVF",
      });
    });

    it("should validate image field in updates", async () => {
      const updateData = {
        image: "https://example.com/new-image.png",
      };

      const result = await ProfileValidator.validateUpdate(updateData);
      expect(result.image).toBe("https://example.com/new-image.png");
    });
  });

  describe("validateProfileId", () => {
    it("should validate valid profile ID as number", async () => {
      const validId = 123;
      const result = await ProfileValidator.validateProfileId(validId);
      expect(result).toBe(validId);
    });

    it("should validate valid profile ID as string", async () => {
      const validId = "123";
      const result = await ProfileValidator.validateProfileId(validId);
      expect(result).toBe(123);
    });

    it("should reject profile ID less than 1", async () => {
      await expect(ProfileValidator.validateProfileId(0)).rejects.toMatchObject(
        {
          name: "ValidationError",
          message: "Invalid profile ID",
          details: {
            id: "Profile ID must be greater than 0",
          },
        }
      );
    });

    it("should reject profile ID greater than 99999", async () => {
      await expect(
        ProfileValidator.validateProfileId(100000)
      ).rejects.toMatchObject({
        name: "ValidationError",
        details: {
          id: "Profile ID must be less than 100000",
        },
      });
    });

    it("should reject non-numeric profile ID", async () => {
      await expect(
        ProfileValidator.validateProfileId("abc")
      ).rejects.toMatchObject({
        name: "ValidationError",
        details: {
          id: "id must be a `number` type, but the final value was: `NaN` (cast from the value `NaN`).",
        },
      });
    });

    it("should accept float profile ID and convert to integer", async () => {
      const result = await ProfileValidator.validateProfileId(1.5);
      expect(result).toBe(1); // yup truncates floats to integers
    });
  });

  describe("validatePagination", () => {
    it("should validate pagination with default values", async () => {
      const emptyQuery = {};
      const result = await ProfileValidator.validatePagination(emptyQuery);

      expect(result).toEqual({
        page: 1,
        limit: 10,
      });
    });

    it("should validate pagination with custom values", async () => {
      const query = {
        page: "3",
        limit: "25",
      };

      const result = await ProfileValidator.validatePagination(query);
      expect(result).toEqual({
        page: 3,
        limit: 25,
      });
    });

    it("should reject invalid page parameter", async () => {
      const query = { page: "0" };

      await expect(
        ProfileValidator.validatePagination(query)
      ).rejects.toMatchObject({
        name: "ValidationError",
        message: "Invalid pagination parameters",
        details: {
          page: "Page must be greater than 0",
        },
      });
    });

    it("should reject invalid limit parameter", async () => {
      const query = { limit: "0" };

      await expect(
        ProfileValidator.validatePagination(query)
      ).rejects.toMatchObject({
        name: "ValidationError",
        details: {
          limit: "Limit must be at least 1",
        },
      });
    });

    it("should reject limit exceeding maximum", async () => {
      const query = { limit: "101" };

      await expect(
        ProfileValidator.validatePagination(query)
      ).rejects.toMatchObject({
        name: "ValidationError",
        details: {
          limit: "Limit must not exceed 100",
        },
      });
    });

    it("should accept limit at maximum boundary", async () => {
      const query = { limit: "100" };

      const result = await ProfileValidator.validatePagination(query);
      expect(result.limit).toBe(100);
    });

    it("should reject non-numeric values", async () => {
      const query = {
        page: "abc",
        limit: "def",
      };

      await expect(
        ProfileValidator.validatePagination(query)
      ).rejects.toMatchObject({
        name: "ValidationError",
        details: {
          limit:
            "limit must be a `number` type, but the final value was: `NaN` (cast from the value `NaN`).",
        },
      });
    });
  });

  describe("_formatYupErrors", () => {
    it("should format single error correctly", () => {
      const yupError = {
        path: "name",
        message: "Name is required",
        inner: [],
      };

      const result = ProfileValidator._formatYupErrors(yupError);
      expect(result).toEqual({
        name: "Name is required",
      });
    });

    it("should format multiple errors correctly", () => {
      const yupError = {
        inner: [
          { path: "name", message: "Name is required" },
          { path: "profileId", message: "Profile ID is required" },
        ],
      };

      const result = ProfileValidator._formatYupErrors(yupError);
      expect(result).toEqual({
        name: "Name is required",
        profileId: "Profile ID is required",
      });
    });

    it("should handle error without path", () => {
      const yupError = {
        message: "General validation error",
        inner: [],
      };

      const result = ProfileValidator._formatYupErrors(yupError);
      expect(result).toEqual({
        general: "General validation error",
      });
    });
  });

  describe("getSchemas", () => {
    it("should return all schemas", () => {
      const schemas = ProfileValidator.getSchemas();

      expect(schemas).toHaveProperty("createProfileSchema");
      expect(schemas).toHaveProperty("updateProfileSchema");
      expect(schemas).toHaveProperty("profileIdSchema");
      expect(schemas).toHaveProperty("paginationSchema");
      expect(schemas.createProfileSchema).toBe(createProfileSchema);
      expect(schemas.updateProfileSchema).toBe(updateProfileSchema);
      expect(schemas.profileIdSchema).toBe(profileIdSchema);
      expect(schemas.paginationSchema).toBe(paginationSchema);
    });
  });
});
