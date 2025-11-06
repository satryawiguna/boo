"use strict";

const {
  VoteValidator,
  createVoteSchema,
  updateVoteSchema,
  voteIdSchema,
  voteQuerySchema,
  voteSubmissionSchema,
  PERSONALITY_VALUES,
} = require("../../../validators/VoteValidator");

describe("VoteValidator", () => {
  describe("validateCreate", () => {
    const validVoteData = {
      commentId: "507f1f77bcf86cd799439011",
      profileId: 123,
      voterIdentifier: "user123@example.com",
      personalitySystem: "mbti",
      personalityValue: "INTJ",
    };

    it("should validate valid vote data successfully", async () => {
      const result = await VoteValidator.validateCreate(validVoteData);

      expect(result).toEqual({
        commentId: "507f1f77bcf86cd799439011",
        profileId: 123,
        voterIdentifier: "user123@example.com",
        personalitySystem: "mbti",
        personalityValue: "INTJ",
      });
    });

    it("should normalize personality value to correct case", async () => {
      const dataWithLowercaseValue = {
        ...validVoteData,
        personalityValue: "intj",
      };

      const result = await VoteValidator.validateCreate(dataWithLowercaseValue);
      expect(result.personalityValue).toBe("INTJ");
    });

    it("should normalize personality system to lowercase", async () => {
      const dataWithUppercaseSystem = {
        ...validVoteData,
        personalitySystem: "MBTI",
      };

      const result = await VoteValidator.validateCreate(
        dataWithUppercaseSystem
      );
      expect(result.personalitySystem).toBe("mbti");
    });

    it("should strip unknown fields", async () => {
      const dataWithUnknownFields = {
        ...validVoteData,
        unknownField: "should be removed",
        anotherUnknown: 123,
      };

      const result = await VoteValidator.validateCreate(dataWithUnknownFields);

      expect(result).not.toHaveProperty("unknownField");
      expect(result).not.toHaveProperty("anotherUnknown");
    });

    describe("commentId validation", () => {
      it("should require commentId field", async () => {
        const dataWithoutCommentId = { ...validVoteData };
        delete dataWithoutCommentId.commentId;

        await expect(
          VoteValidator.validateCreate(dataWithoutCommentId)
        ).rejects.toMatchObject({
          name: "ValidationError",
          message: "Vote validation failed",
          details: {
            commentId: "Comment ID is required",
          },
        });
      });

      it("should reject invalid MongoDB ObjectId format", async () => {
        const dataWithInvalidId = {
          ...validVoteData,
          commentId: "invalid-id",
        };

        await expect(
          VoteValidator.validateCreate(dataWithInvalidId)
        ).rejects.toMatchObject({
          name: "ValidationError",
          details: {
            commentId: "Comment ID must be a valid MongoDB ObjectId",
          },
        });
      });

      it("should accept valid ObjectId format", async () => {
        const validObjectIds = [
          "507f1f77bcf86cd799439011",
          "507F1F77BCF86CD799439011",
          "123456789abcdef123456789",
        ];

        for (const commentId of validObjectIds) {
          const dataWithValidId = { ...validVoteData, commentId };
          const result = await VoteValidator.validateCreate(dataWithValidId);
          expect(result.commentId).toBe(commentId);
        }
      });
    });

    describe("profileId validation", () => {
      it("should require profileId field", async () => {
        const dataWithoutProfileId = { ...validVoteData };
        delete dataWithoutProfileId.profileId;

        await expect(
          VoteValidator.validateCreate(dataWithoutProfileId)
        ).rejects.toMatchObject({
          name: "ValidationError",
          details: {
            profileId: "Profile ID is required",
          },
        });
      });

      it("should reject non-integer profileId", async () => {
        const dataWithFloatProfileId = {
          ...validVoteData,
          profileId: 1.5,
        };

        await expect(
          VoteValidator.validateCreate(dataWithFloatProfileId)
        ).rejects.toMatchObject({
          name: "ValidationError",
          details: {
            profileId: "Profile ID must be an integer",
          },
        });
      });

      it("should reject profileId out of range", async () => {
        const dataWithZeroProfileId = { ...validVoteData, profileId: 0 };
        const dataWithLargeProfileId = { ...validVoteData, profileId: 100000 };

        await expect(
          VoteValidator.validateCreate(dataWithZeroProfileId)
        ).rejects.toMatchObject({
          name: "ValidationError",
          details: {
            profileId: "Profile ID must be greater than 0",
          },
        });

        await expect(
          VoteValidator.validateCreate(dataWithLargeProfileId)
        ).rejects.toMatchObject({
          name: "ValidationError",
          details: {
            profileId: "Profile ID must be less than 100000",
          },
        });
      });

      it("should accept profileId at boundaries", async () => {
        const dataWithMinProfileId = { ...validVoteData, profileId: 1 };
        const dataWithMaxProfileId = { ...validVoteData, profileId: 99999 };

        const minResult = await VoteValidator.validateCreate(
          dataWithMinProfileId
        );
        const maxResult = await VoteValidator.validateCreate(
          dataWithMaxProfileId
        );

        expect(minResult.profileId).toBe(1);
        expect(maxResult.profileId).toBe(99999);
      });
    });

    describe("voterIdentifier validation", () => {
      it("should require voterIdentifier field", async () => {
        const dataWithoutVoterIdentifier = { ...validVoteData };
        delete dataWithoutVoterIdentifier.voterIdentifier;

        await expect(
          VoteValidator.validateCreate(dataWithoutVoterIdentifier)
        ).rejects.toMatchObject({
          name: "ValidationError",
          details: {
            voterIdentifier: "Voter identifier is required",
          },
        });
      });

      it("should reject empty voterIdentifier", async () => {
        const dataWithEmptyVoterIdentifier = {
          ...validVoteData,
          voterIdentifier: "",
        };

        await expect(
          VoteValidator.validateCreate(dataWithEmptyVoterIdentifier)
        ).rejects.toMatchObject({
          name: "ValidationError",
          details: {
            voterIdentifier: "Voter identifier is required",
          },
        });
      });

      it("should reject voterIdentifier exceeding 100 characters", async () => {
        const longVoterIdentifier = "a".repeat(101);
        const dataWithLongVoterIdentifier = {
          ...validVoteData,
          voterIdentifier: longVoterIdentifier,
        };

        await expect(
          VoteValidator.validateCreate(dataWithLongVoterIdentifier)
        ).rejects.toMatchObject({
          name: "ValidationError",
          details: {
            voterIdentifier: "Voter identifier must not exceed 100 characters",
          },
        });
      });

      it("should trim whitespace from voterIdentifier", async () => {
        const dataWithWhitespace = {
          ...validVoteData,
          voterIdentifier: "  user123@example.com  ",
        };

        const result = await VoteValidator.validateCreate(dataWithWhitespace);
        expect(result.voterIdentifier).toBe("user123@example.com");
      });

      it("should accept voterIdentifier at maximum length", async () => {
        const maxLengthVoterIdentifier = "a".repeat(100);
        const dataWithMaxVoterIdentifier = {
          ...validVoteData,
          voterIdentifier: maxLengthVoterIdentifier,
        };

        const result = await VoteValidator.validateCreate(
          dataWithMaxVoterIdentifier
        );
        expect(result.voterIdentifier).toBe(maxLengthVoterIdentifier);
      });
    });

    describe("personalitySystem validation", () => {
      it("should require personalitySystem field", async () => {
        const dataWithoutPersonalitySystem = { ...validVoteData };
        delete dataWithoutPersonalitySystem.personalitySystem;

        await expect(
          VoteValidator.validateCreate(dataWithoutPersonalitySystem)
        ).rejects.toMatchObject({
          name: "ValidationError",
          details: {
            personalitySystem: "Personality system is required",
          },
        });
      });

      it("should accept valid personality systems", async () => {
        const validSystemData = [
          { personalitySystem: "mbti", personalityValue: "INTJ" },
          { personalitySystem: "enneagram", personalityValue: "5w4" },
          { personalitySystem: "zodiac", personalityValue: "Aries" },
        ];

        for (const { personalitySystem, personalityValue } of validSystemData) {
          const dataWithSystem = {
            commentId: "507f1f77bcf86cd799439011",
            profileId: 123,
            voterIdentifier: "user123@example.com",
            personalitySystem,
            personalityValue,
          };
          const result = await VoteValidator.validateCreate(dataWithSystem);
          expect(result.personalitySystem).toBe(personalitySystem);
          expect(result.personalityValue).toBe(personalityValue);
        }
      });

      it("should reject invalid personality system", async () => {
        const dataWithInvalidSystem = {
          ...validVoteData,
          personalitySystem: "invalid",
        };

        await expect(
          VoteValidator.validateCreate(dataWithInvalidSystem)
        ).rejects.toMatchObject({
          name: "ValidationError",
          details: {
            personalitySystem:
              "Personality system must be one of: mbti, enneagram, zodiac",
          },
        });
      });

      it("should convert personality system to lowercase", async () => {
        const dataWithUppercaseSystem = {
          ...validVoteData,
          personalitySystem: "MBTI",
        };

        const result = await VoteValidator.validateCreate(
          dataWithUppercaseSystem
        );
        expect(result.personalitySystem).toBe("mbti");
      });
    });

    describe("personalityValue validation", () => {
      it("should require personalityValue field", async () => {
        const dataWithoutPersonalityValue = { ...validVoteData };
        delete dataWithoutPersonalityValue.personalityValue;

        await expect(
          VoteValidator.validateCreate(dataWithoutPersonalityValue)
        ).rejects.toMatchObject({
          name: "ValidationError",
          details: {
            personalityValue: "Personality value is required",
          },
        });
      });

      describe("MBTI validation", () => {
        const validMbtiTypes = PERSONALITY_VALUES.mbti;

        it("should accept all valid MBTI types", async () => {
          for (const personalityValue of validMbtiTypes) {
            const dataWithMbti = {
              ...validVoteData,
              personalitySystem: "mbti",
              personalityValue,
            };
            const result = await VoteValidator.validateCreate(dataWithMbti);
            expect(result.personalityValue).toBe(personalityValue);
          }
        });

        it("should reject invalid MBTI types", async () => {
          const dataWithInvalidMbti = {
            ...validVoteData,
            personalitySystem: "mbti",
            personalityValue: "INVALID",
          };

          await expect(
            VoteValidator.validateCreate(dataWithInvalidMbti)
          ).rejects.toMatchObject({
            name: "ValidationError",
            details: {
              personalityValue:
                "Invalid personality value for the selected system",
            },
          });
        });

        it("should normalize MBTI case", async () => {
          const dataWithLowercaseMbti = {
            ...validVoteData,
            personalitySystem: "mbti",
            personalityValue: "intj",
          };

          const result = await VoteValidator.validateCreate(
            dataWithLowercaseMbti
          );
          expect(result.personalityValue).toBe("INTJ");
        });
      });

      describe("Enneagram validation", () => {
        const validEnneagramTypes = PERSONALITY_VALUES.enneagram;

        it("should accept all valid Enneagram types", async () => {
          for (const personalityValue of validEnneagramTypes) {
            const dataWithEnneagram = {
              ...validVoteData,
              personalitySystem: "enneagram",
              personalityValue,
            };
            const result = await VoteValidator.validateCreate(
              dataWithEnneagram
            );
            expect(result.personalityValue).toBe(personalityValue);
          }
        });

        it("should reject invalid Enneagram types", async () => {
          const dataWithInvalidEnneagram = {
            ...validVoteData,
            personalitySystem: "enneagram",
            personalityValue: "10w11",
          };

          await expect(
            VoteValidator.validateCreate(dataWithInvalidEnneagram)
          ).rejects.toMatchObject({
            name: "ValidationError",
            details: {
              personalityValue:
                "Invalid personality value for the selected system",
            },
          });
        });
      });

      describe("Zodiac validation", () => {
        const validZodiacSigns = PERSONALITY_VALUES.zodiac;

        it("should accept all valid Zodiac signs", async () => {
          for (const personalityValue of validZodiacSigns) {
            const dataWithZodiac = {
              ...validVoteData,
              personalitySystem: "zodiac",
              personalityValue,
            };
            const result = await VoteValidator.validateCreate(dataWithZodiac);
            expect(result.personalityValue).toBe(personalityValue);
          }
        });

        it("should reject invalid Zodiac signs", async () => {
          const dataWithInvalidZodiac = {
            ...validVoteData,
            personalitySystem: "zodiac",
            personalityValue: "InvalidSign",
          };

          await expect(
            VoteValidator.validateCreate(dataWithInvalidZodiac)
          ).rejects.toMatchObject({
            name: "ValidationError",
            details: {
              personalityValue:
                "Invalid personality value for the selected system",
            },
          });
        });

        it("should normalize Zodiac case", async () => {
          const dataWithLowercaseZodiac = {
            ...validVoteData,
            personalitySystem: "zodiac",
            personalityValue: "aries",
          };

          const result = await VoteValidator.validateCreate(
            dataWithLowercaseZodiac
          );
          expect(result.personalityValue).toBe("Aries");
        });
      });

      it("should trim whitespace from personalityValue", async () => {
        const dataWithWhitespace = {
          ...validVoteData,
          personalityValue: "  INTJ  ",
        };

        const result = await VoteValidator.validateCreate(dataWithWhitespace);
        expect(result.personalityValue).toBe("INTJ");
      });
    });

    it("should handle multiple validation errors", async () => {
      const invalidData = {
        commentId: "invalid-id",
        profileId: 0,
        voterIdentifier: "",
        personalitySystem: "invalid",
        personalityValue: "",
      };

      await expect(
        VoteValidator.validateCreate(invalidData)
      ).rejects.toMatchObject({
        name: "ValidationError",
        details: {
          commentId: "Comment ID must be a valid MongoDB ObjectId",
          profileId: "Profile ID must be greater than 0",
          voterIdentifier: "Voter identifier is required",
          personalitySystem:
            "Personality system must be one of: mbti, enneagram, zodiac",
          personalityValue: "Personality value is required",
        },
      });
    });
  });

  describe("validateUpdate", () => {
    it("should validate valid update data for MBTI", async () => {
      const updateData = {
        personalityValue: "ENFP",
      };

      const result = await VoteValidator.validateUpdate(updateData, "mbti");
      expect(result).toEqual({
        personalityValue: "ENFP",
      });
    });

    it("should normalize personality value case", async () => {
      const updateData = {
        personalityValue: "enfp",
      };

      const result = await VoteValidator.validateUpdate(updateData, "mbti");
      expect(result.personalityValue).toBe("ENFP");
    });

    it("should validate for different personality systems", async () => {
      const mbtiUpdate = { personalityValue: "ISFJ" };
      const enneagramUpdate = { personalityValue: "4w5" };
      const zodiacUpdate = { personalityValue: "Leo" };

      const mbtiResult = await VoteValidator.validateUpdate(mbtiUpdate, "mbti");
      const enneagramResult = await VoteValidator.validateUpdate(
        enneagramUpdate,
        "enneagram"
      );
      const zodiacResult = await VoteValidator.validateUpdate(
        zodiacUpdate,
        "zodiac"
      );

      expect(mbtiResult.personalityValue).toBe("ISFJ");
      expect(enneagramResult.personalityValue).toBe("4w5");
      expect(zodiacResult.personalityValue).toBe("Leo");
    });

    it("should reject invalid personality value for the system", async () => {
      const updateData = {
        personalityValue: "INVALID",
      };

      await expect(
        VoteValidator.validateUpdate(updateData, "mbti")
      ).rejects.toMatchObject({
        name: "ValidationError",
        message: "Vote update validation failed",
        details: {
          general: "Invalid personality value for mbti system",
        },
      });
    });

    it("should require personalityValue field", async () => {
      const updateData = {};

      await expect(
        VoteValidator.validateUpdate(updateData, "mbti")
      ).rejects.toMatchObject({
        name: "ValidationError",
        details: {
          personalityValue: "Personality value is required",
        },
      });
    });

    it("should strip unknown fields", async () => {
      const updateData = {
        personalityValue: "INTJ",
        unknownField: "should be removed",
      };

      const result = await VoteValidator.validateUpdate(updateData, "mbti");
      expect(result).toEqual({
        personalityValue: "INTJ",
      });
    });

    it("should handle case insensitive validation", async () => {
      const updateData = {
        personalityValue: "scorpio",
      };

      const result = await VoteValidator.validateUpdate(updateData, "zodiac");
      expect(result.personalityValue).toBe("Scorpio");
    });
  });

  describe("validateVoteId", () => {
    it("should validate valid MongoDB ObjectId", async () => {
      const validId = "507f1f77bcf86cd799439011";
      const result = await VoteValidator.validateVoteId(validId);
      expect(result).toBe(validId);
    });

    it("should reject invalid ObjectId format", async () => {
      const invalidId = "invalid-id";

      await expect(
        VoteValidator.validateVoteId(invalidId)
      ).rejects.toMatchObject({
        name: "ValidationError",
        message: "Invalid vote ID",
        details: {
          id: "Vote ID must be a valid MongoDB ObjectId",
        },
      });
    });

    it("should accept mixed case ObjectId", async () => {
      const mixedCaseId = "507F1f77BCf86cd799439011";
      const result = await VoteValidator.validateVoteId(mixedCaseId);
      expect(result).toBe(mixedCaseId);
    });
  });

  describe("validateCommentId", () => {
    it("should validate valid MongoDB ObjectId", async () => {
      const validId = "507f1f77bcf86cd799439011";
      const result = await VoteValidator.validateCommentId(validId);
      expect(result).toBe(validId);
    });

    it("should reject invalid ObjectId format", async () => {
      const invalidId = "invalid-id";

      await expect(
        VoteValidator.validateCommentId(invalidId)
      ).rejects.toMatchObject({
        name: "ValidationError",
        message: "Invalid comment ID",
        details: {
          id: "Comment ID must be a valid MongoDB ObjectId",
        },
      });
    });
  });

  describe("validateVoteQuery", () => {
    it("should validate query with default values", async () => {
      const emptyQuery = {};
      const result = await VoteValidator.validateVoteQuery(emptyQuery);

      expect(result).toEqual({
        page: 1,
        limit: 20,
      });
    });

    it("should validate query with all parameters", async () => {
      const query = {
        page: "3",
        limit: "50",
        personalitySystem: "mbti",
        voterIdentifier: "user123",
      };

      const result = await VoteValidator.validateVoteQuery(query);
      expect(result).toEqual({
        page: 3,
        limit: 50,
        personalitySystem: "mbti",
        voterIdentifier: "user123",
      });
    });

    it("should reject invalid page parameter", async () => {
      const query = { page: "0" };

      await expect(
        VoteValidator.validateVoteQuery(query)
      ).rejects.toMatchObject({
        name: "ValidationError",
        message: "Invalid vote query parameters",
        details: {
          page: "Page must be greater than 0",
        },
      });
    });

    it("should reject invalid limit parameter", async () => {
      const query = { limit: "101" };

      await expect(
        VoteValidator.validateVoteQuery(query)
      ).rejects.toMatchObject({
        name: "ValidationError",
        details: {
          limit: "Limit must not exceed 100",
        },
      });
    });

    it("should reject invalid personality system", async () => {
      const query = { personalitySystem: "invalid" };

      await expect(
        VoteValidator.validateVoteQuery(query)
      ).rejects.toMatchObject({
        name: "ValidationError",
        details: {
          personalitySystem:
            "Personality system must be one of: mbti, enneagram, zodiac",
        },
      });
    });

    it("should accept valid personality systems", async () => {
      const validSystems = ["mbti", "enneagram", "zodiac"];

      for (const personalitySystem of validSystems) {
        const query = { personalitySystem };
        const result = await VoteValidator.validateVoteQuery(query);
        expect(result.personalitySystem).toBe(personalitySystem);
      }
    });

    it("should convert personality system to lowercase", async () => {
      const query = { personalitySystem: "MBTI" };

      const result = await VoteValidator.validateVoteQuery(query);
      expect(result.personalitySystem).toBe("mbti");
    });

    it("should validate voterIdentifier length", async () => {
      const longVoterIdentifier = "a".repeat(101);
      const query = { voterIdentifier: longVoterIdentifier };

      await expect(
        VoteValidator.validateVoteQuery(query)
      ).rejects.toMatchObject({
        name: "ValidationError",
        details: {
          voterIdentifier: "Voter identifier must not exceed 100 characters",
        },
      });
    });

    it("should strip unknown parameters", async () => {
      const query = {
        page: "1",
        unknownParam: "value",
      };

      const result = await VoteValidator.validateVoteQuery(query);
      expect(result).not.toHaveProperty("unknownParam");
    });
  });

  describe("validateVoteSubmission", () => {
    const validSubmissionData = {
      personalitySystem: "mbti",
      personalityValue: "INTJ",
      voterIdentifier: "user123@example.com",
    };

    it("should validate valid vote submission data", async () => {
      const result = await VoteValidator.validateVoteSubmission(
        validSubmissionData
      );

      expect(result).toEqual({
        personalitySystem: "mbti",
        personalityValue: "INTJ",
        voterIdentifier: "user123@example.com",
      });
    });

    it("should normalize values", async () => {
      const dataWithCaseIssues = {
        personalitySystem: "ZODIAC",
        personalityValue: "scorpio",
        voterIdentifier: "  user123@example.com  ",
      };

      const result = await VoteValidator.validateVoteSubmission(
        dataWithCaseIssues
      );
      expect(result).toEqual({
        personalitySystem: "zodiac",
        personalityValue: "Scorpio",
        voterIdentifier: "user123@example.com",
      });
    });

    it("should validate personality value against system", async () => {
      const invalidData = {
        personalitySystem: "mbti",
        personalityValue: "InvalidType",
        voterIdentifier: "user123",
      };

      await expect(
        VoteValidator.validateVoteSubmission(invalidData)
      ).rejects.toMatchObject({
        name: "ValidationError",
        message: "Vote submission validation failed",
        details: {
          personalityValue: "Invalid personality value for the selected system",
        },
      });
    });

    it("should require all fields", async () => {
      const incompleteData = {
        personalitySystem: "mbti",
        // missing personalityValue and voterIdentifier
      };

      await expect(
        VoteValidator.validateVoteSubmission(incompleteData)
      ).rejects.toMatchObject({
        name: "ValidationError",
        details: {
          personalityValue: "Personality value is required",
          voterIdentifier: "Voter identifier is required",
        },
      });
    });

    it("should strip unknown fields", async () => {
      const dataWithUnknownFields = {
        ...validSubmissionData,
        unknownField: "should be removed",
      };

      const result = await VoteValidator.validateVoteSubmission(
        dataWithUnknownFields
      );
      expect(result).not.toHaveProperty("unknownField");
    });
  });

  describe("_normalizePersonalityValue", () => {
    it("should normalize MBTI values correctly", () => {
      const result = VoteValidator._normalizePersonalityValue("mbti", "intj");
      expect(result).toBe("INTJ");
    });

    it("should normalize Zodiac values correctly", () => {
      const result = VoteValidator._normalizePersonalityValue(
        "zodiac",
        "aries"
      );
      expect(result).toBe("Aries");
    });

    it("should normalize Enneagram values correctly", () => {
      const result = VoteValidator._normalizePersonalityValue(
        "enneagram",
        "5w4"
      );
      expect(result).toBe("5w4");
    });

    it("should return original value for unknown system", () => {
      const result = VoteValidator._normalizePersonalityValue(
        "unknown",
        "value"
      );
      expect(result).toBe("value");
    });

    it("should return original value when no match found", () => {
      const result = VoteValidator._normalizePersonalityValue(
        "mbti",
        "INVALID"
      );
      expect(result).toBe("INVALID");
    });
  });

  describe("_formatYupErrors", () => {
    it("should format single error correctly", () => {
      const yupError = {
        path: "personalityValue",
        message: "Personality value is required",
        inner: [],
      };

      const result = VoteValidator._formatYupErrors(yupError);
      expect(result).toEqual({
        personalityValue: "Personality value is required",
      });
    });

    it("should format multiple errors correctly", () => {
      const yupError = {
        inner: [
          { path: "commentId", message: "Comment ID is required" },
          { path: "profileId", message: "Profile ID is required" },
        ],
      };

      const result = VoteValidator._formatYupErrors(yupError);
      expect(result).toEqual({
        commentId: "Comment ID is required",
        profileId: "Profile ID is required",
      });
    });

    it("should handle error without path", () => {
      const yupError = {
        message: "General validation error",
        inner: [],
      };

      const result = VoteValidator._formatYupErrors(yupError);
      expect(result).toEqual({
        general: "General validation error",
      });
    });
  });

  describe("getValidPersonalityValues", () => {
    it("should return all valid personality values", () => {
      const values = VoteValidator.getValidPersonalityValues();

      expect(values).toHaveProperty("mbti");
      expect(values).toHaveProperty("enneagram");
      expect(values).toHaveProperty("zodiac");
      expect(values.mbti).toContain("INTJ");
      expect(values.enneagram).toContain("5w4");
      expect(values.zodiac).toContain("Aries");
    });
  });

  describe("getSchemas", () => {
    it("should return all schemas", () => {
      const schemas = VoteValidator.getSchemas();

      expect(schemas).toHaveProperty("createVoteSchema");
      expect(schemas).toHaveProperty("updateVoteSchema");
      expect(schemas).toHaveProperty("voteIdSchema");
      expect(schemas).toHaveProperty("commentIdSchema");
      expect(schemas).toHaveProperty("voteQuerySchema");
      expect(schemas).toHaveProperty("voteSubmissionSchema");
      expect(schemas.createVoteSchema).toBe(createVoteSchema);
      expect(schemas.updateVoteSchema).toBe(updateVoteSchema);
      expect(schemas.voteIdSchema).toBe(voteIdSchema);
      expect(schemas.voteQuerySchema).toBe(voteQuerySchema);
      expect(schemas.voteSubmissionSchema).toBe(voteSubmissionSchema);
    });
  });
});
