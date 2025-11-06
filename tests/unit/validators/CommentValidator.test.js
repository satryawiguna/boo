"use strict";

const {
  CommentValidator,
  createCommentSchema,
  updateCommentSchema,
  commentIdSchema,
  commentQuerySchema,
} = require("../../../validators/CommentValidator");

describe("CommentValidator", () => {
  describe("validateCreate", () => {
    const validCommentData = {
      content: "This is a test comment",
      title: "Test Title",
      author: "Test Author",
      profileId: 1,
    };

    it("should validate valid comment data successfully", async () => {
      const result = await CommentValidator.validateCreate(validCommentData);

      expect(result).toEqual({
        content: "This is a test comment",
        title: "Test Title",
        author: "Test Author",
        profileId: 1,
      });
    });

    it("should trim whitespace from string fields", async () => {
      const dataWithWhitespace = {
        content: "  This is a test comment  ",
        title: "  Test Title  ",
        author: "  Test Author  ",
        profileId: 1,
      };

      const result = await CommentValidator.validateCreate(dataWithWhitespace);

      expect(result.content).toBe("This is a test comment");
      expect(result.title).toBe("Test Title");
      expect(result.author).toBe("Test Author");
    });

    it("should strip unknown fields", async () => {
      const dataWithUnknownFields = {
        ...validCommentData,
        unknownField: "should be removed",
        anotherUnknown: 123,
      };

      const result = await CommentValidator.validateCreate(
        dataWithUnknownFields
      );

      expect(result).not.toHaveProperty("unknownField");
      expect(result).not.toHaveProperty("anotherUnknown");
    });

    describe("content validation", () => {
      it("should require content field", async () => {
        const dataWithoutContent = { ...validCommentData };
        delete dataWithoutContent.content;

        await expect(
          CommentValidator.validateCreate(dataWithoutContent)
        ).rejects.toMatchObject({
          name: "ValidationError",
          message: "Comment validation failed",
          details: {
            content: "Comment content is required",
          },
        });
      });

      it("should reject empty content", async () => {
        const dataWithEmptyContent = {
          ...validCommentData,
          content: "",
        };

        await expect(
          CommentValidator.validateCreate(dataWithEmptyContent)
        ).rejects.toMatchObject({
          name: "ValidationError",
          details: {
            content: "Comment content is required",
          },
        });
      });

      it("should reject content with only whitespace", async () => {
        const dataWithWhitespaceContent = {
          ...validCommentData,
          content: "   ",
        };

        await expect(
          CommentValidator.validateCreate(dataWithWhitespaceContent)
        ).rejects.toMatchObject({
          name: "ValidationError",
          details: {
            content: "Comment content is required",
          },
        });
      });

      it("should reject content exceeding 1000 characters", async () => {
        const longContent = "a".repeat(1001);
        const dataWithLongContent = {
          ...validCommentData,
          content: longContent,
        };

        await expect(
          CommentValidator.validateCreate(dataWithLongContent)
        ).rejects.toMatchObject({
          name: "ValidationError",
          details: {
            content: "Comment content must not exceed 1000 characters",
          },
        });
      });

      it("should accept content at maximum length (1000 characters)", async () => {
        const maxLengthContent = "a".repeat(1000);
        const dataWithMaxContent = {
          ...validCommentData,
          content: maxLengthContent,
        };

        const result = await CommentValidator.validateCreate(
          dataWithMaxContent
        );
        expect(result.content).toBe(maxLengthContent);
      });
    });

    describe("title validation", () => {
      it("should accept optional title", async () => {
        const dataWithoutTitle = { ...validCommentData };
        delete dataWithoutTitle.title;

        const result = await CommentValidator.validateCreate(dataWithoutTitle);
        expect(result).not.toHaveProperty("title");
      });

      it("should reject title exceeding 200 characters", async () => {
        const longTitle = "a".repeat(201);
        const dataWithLongTitle = {
          ...validCommentData,
          title: longTitle,
        };

        await expect(
          CommentValidator.validateCreate(dataWithLongTitle)
        ).rejects.toMatchObject({
          name: "ValidationError",
          details: {
            title: "Comment title must not exceed 200 characters",
          },
        });
      });

      it("should accept title at maximum length (200 characters)", async () => {
        const maxLengthTitle = "a".repeat(200);
        const dataWithMaxTitle = {
          ...validCommentData,
          title: maxLengthTitle,
        };

        const result = await CommentValidator.validateCreate(dataWithMaxTitle);
        expect(result.title).toBe(maxLengthTitle);
      });

      it("should accept empty title", async () => {
        const dataWithEmptyTitle = {
          ...validCommentData,
          title: "",
        };

        const result = await CommentValidator.validateCreate(
          dataWithEmptyTitle
        );
        expect(result.title).toBe("");
      });
    });

    describe("author validation", () => {
      it("should require author field", async () => {
        const dataWithoutAuthor = { ...validCommentData };
        delete dataWithoutAuthor.author;

        await expect(
          CommentValidator.validateCreate(dataWithoutAuthor)
        ).rejects.toMatchObject({
          name: "ValidationError",
          details: {
            author: "Author name is required",
          },
        });
      });

      it("should reject empty author", async () => {
        const dataWithEmptyAuthor = {
          ...validCommentData,
          author: "",
        };

        await expect(
          CommentValidator.validateCreate(dataWithEmptyAuthor)
        ).rejects.toMatchObject({
          name: "ValidationError",
          details: {
            author: "Author name is required",
          },
        });
      });

      it("should reject author exceeding 100 characters", async () => {
        const longAuthor = "a".repeat(101);
        const dataWithLongAuthor = {
          ...validCommentData,
          author: longAuthor,
        };

        await expect(
          CommentValidator.validateCreate(dataWithLongAuthor)
        ).rejects.toMatchObject({
          name: "ValidationError",
          details: {
            author: "Author name must not exceed 100 characters",
          },
        });
      });
    });

    describe("profileId validation", () => {
      it("should require profileId field", async () => {
        const dataWithoutProfileId = { ...validCommentData };
        delete dataWithoutProfileId.profileId;

        await expect(
          CommentValidator.validateCreate(dataWithoutProfileId)
        ).rejects.toMatchObject({
          name: "ValidationError",
          details: {
            profileId: "Profile ID is required",
          },
        });
      });

      it("should reject non-integer profileId", async () => {
        const dataWithFloatProfileId = {
          ...validCommentData,
          profileId: 1.5,
        };

        await expect(
          CommentValidator.validateCreate(dataWithFloatProfileId)
        ).rejects.toMatchObject({
          name: "ValidationError",
          details: {
            profileId: "Profile ID must be an integer",
          },
        });
      });

      it("should reject profileId less than 1", async () => {
        const dataWithZeroProfileId = {
          ...validCommentData,
          profileId: 0,
        };

        await expect(
          CommentValidator.validateCreate(dataWithZeroProfileId)
        ).rejects.toMatchObject({
          name: "ValidationError",
          details: {
            profileId: "Profile ID must be greater than 0",
          },
        });
      });

      it("should reject profileId greater than 99999", async () => {
        const dataWithLargeProfileId = {
          ...validCommentData,
          profileId: 100000,
        };

        await expect(
          CommentValidator.validateCreate(dataWithLargeProfileId)
        ).rejects.toMatchObject({
          name: "ValidationError",
          details: {
            profileId: "Profile ID must be less than 100000",
          },
        });
      });

      it("should accept profileId at boundaries", async () => {
        const dataWithMinProfileId = {
          ...validCommentData,
          profileId: 1,
        };
        const dataWithMaxProfileId = {
          ...validCommentData,
          profileId: 99999,
        };

        const minResult = await CommentValidator.validateCreate(
          dataWithMinProfileId
        );
        const maxResult = await CommentValidator.validateCreate(
          dataWithMaxProfileId
        );

        expect(minResult.profileId).toBe(1);
        expect(maxResult.profileId).toBe(99999);
      });
    });

    it("should handle multiple validation errors", async () => {
      const invalidData = {
        content: "", // empty
        title: "a".repeat(201), // too long
        author: "", // empty
        profileId: 0, // invalid
      };

      await expect(
        CommentValidator.validateCreate(invalidData)
      ).rejects.toMatchObject({
        name: "ValidationError",
        details: {
          content: "Comment content is required",
          title: "Comment title must not exceed 200 characters",
          author: "Author name is required",
          profileId: "Profile ID must be greater than 0",
        },
      });
    });
  });

  describe("validateUpdate", () => {
    it("should validate valid update data", async () => {
      const updateData = {
        content: "Updated content",
        title: "Updated title",
        isVisible: false,
      };

      const result = await CommentValidator.validateUpdate(updateData);
      expect(result).toEqual(updateData);
    });

    it("should validate partial update data", async () => {
      const updateData = {
        content: "Only updating content",
      };

      const result = await CommentValidator.validateUpdate(updateData);
      expect(result).toEqual(updateData);
    });

    it("should handle isVisible boolean field", async () => {
      const updateDataTrue = {
        isVisible: true,
      };
      const updateDataFalse = {
        isVisible: false,
      };

      const resultTrue = await CommentValidator.validateUpdate(updateDataTrue);
      const resultFalse = await CommentValidator.validateUpdate(
        updateDataFalse
      );

      expect(resultTrue.isVisible).toBe(true);
      expect(resultFalse.isVisible).toBe(false);
    });

    it("should reject when no updatable fields are provided", async () => {
      const emptyData = {};

      await expect(
        CommentValidator.validateUpdate(emptyData)
      ).rejects.toMatchObject({
        name: "ValidationError",
        message: "Comment update validation failed",
        details: {
          general:
            "At least one field (content, title, or isVisible) must be provided for update",
        },
      });
    });

    it("should reject when only unknown fields are provided", async () => {
      const unknownFieldsData = {
        unknownField: "value",
        anotherUnknown: 123,
      };

      await expect(
        CommentValidator.validateUpdate(unknownFieldsData)
      ).rejects.toMatchObject({
        name: "ValidationError",
        details: {
          general:
            "At least one field (content, title, or isVisible) must be provided for update",
        },
      });
    });

    it("should validate content field same as create validation", async () => {
      const invalidContentData = {
        content: "a".repeat(1001), // too long
      };

      await expect(
        CommentValidator.validateUpdate(invalidContentData)
      ).rejects.toMatchObject({
        name: "ValidationError",
        details: {
          content: "Comment content must not exceed 1000 characters",
        },
      });
    });

    it("should validate title field same as create validation", async () => {
      const invalidTitleData = {
        title: "a".repeat(201), // too long
      };

      await expect(
        CommentValidator.validateUpdate(invalidTitleData)
      ).rejects.toMatchObject({
        name: "ValidationError",
        details: {
          title: "Comment title must not exceed 200 characters",
        },
      });
    });

    it("should strip unknown fields", async () => {
      const dataWithUnknownFields = {
        content: "Valid content",
        unknownField: "should be removed",
      };

      const result = await CommentValidator.validateUpdate(
        dataWithUnknownFields
      );
      expect(result).toEqual({
        content: "Valid content",
      });
    });
  });

  describe("validateCommentId", () => {
    it("should validate valid MongoDB ObjectId", async () => {
      const validId = "507f1f77bcf86cd799439011";
      const result = await CommentValidator.validateCommentId(validId);
      expect(result).toBe(validId);
    });

    it("should reject invalid ObjectId format", async () => {
      const invalidId = "invalid-id";

      await expect(
        CommentValidator.validateCommentId(invalidId)
      ).rejects.toMatchObject({
        name: "ValidationError",
        message: "Invalid comment ID",
        details: {
          id: "Comment ID must be a valid MongoDB ObjectId",
        },
      });
    });

    it("should reject ObjectId that is too short", async () => {
      const shortId = "507f1f77bcf86cd79943901";

      await expect(
        CommentValidator.validateCommentId(shortId)
      ).rejects.toMatchObject({
        name: "ValidationError",
        details: {
          id: "Comment ID must be a valid MongoDB ObjectId",
        },
      });
    });

    it("should reject ObjectId that is too long", async () => {
      const longId = "507f1f77bcf86cd7994390111";

      await expect(
        CommentValidator.validateCommentId(longId)
      ).rejects.toMatchObject({
        name: "ValidationError",
        details: {
          id: "Comment ID must be a valid MongoDB ObjectId",
        },
      });
    });

    it("should reject ObjectId with invalid characters", async () => {
      const invalidCharsId = "507f1f77bcf86cd799439g11";

      await expect(
        CommentValidator.validateCommentId(invalidCharsId)
      ).rejects.toMatchObject({
        name: "ValidationError",
        details: {
          id: "Comment ID must be a valid MongoDB ObjectId",
        },
      });
    });

    it("should accept ObjectId with mixed case", async () => {
      const mixedCaseId = "507F1f77BCf86cd799439011";
      const result = await CommentValidator.validateCommentId(mixedCaseId);
      expect(result).toBe(mixedCaseId);
    });
  });

  describe("validateProfileId", () => {
    it("should validate valid profile ID as number", async () => {
      const validId = 123;
      const result = await CommentValidator.validateProfileId(validId);
      expect(result).toBe(validId);
    });

    it("should validate valid profile ID as string", async () => {
      const validId = "123";
      const result = await CommentValidator.validateProfileId(validId);
      expect(result).toBe(123);
    });

    it("should reject profile ID less than 1", async () => {
      await expect(CommentValidator.validateProfileId(0)).rejects.toMatchObject(
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
        CommentValidator.validateProfileId(100000)
      ).rejects.toMatchObject({
        name: "ValidationError",
        details: {
          id: "Profile ID must be less than 100000",
        },
      });
    });

    it("should reject non-numeric profile ID", async () => {
      await expect(
        CommentValidator.validateProfileId("abc")
      ).rejects.toMatchObject({
        name: "ValidationError",
        details: {
          id: "id must be a `number` type, but the final value was: `NaN` (cast from the value `NaN`).",
        },
      });
    });

    it("should accept float profile ID and convert to integer", async () => {
      const result = await CommentValidator.validateProfileId(1.5);
      expect(result).toBe(1); // yup truncates floats to integers
    });
  });

  describe("validateCommentQuery", () => {
    it("should validate query with default values", async () => {
      const emptyQuery = {};
      const result = await CommentValidator.validateCommentQuery(emptyQuery);

      expect(result).toEqual({
        page: 1,
        limit: 10,
        sort: "recent",
        filter: "all",
      });
    });

    it("should validate query with all parameters", async () => {
      const query = {
        page: "2",
        limit: "20",
        sort: "best",
        filter: "mbti",
        profileId: "123",
      };

      const result = await CommentValidator.validateCommentQuery(query);
      expect(result).toEqual({
        page: 2,
        limit: 20,
        sort: "best",
        filter: "mbti",
        profileId: 123,
      });
    });

    it("should reject invalid page parameter", async () => {
      const query = { page: "0" };

      await expect(
        CommentValidator.validateCommentQuery(query)
      ).rejects.toMatchObject({
        name: "ValidationError",
        message: "Invalid comment query parameters",
        details: {
          page: "Page must be greater than 0",
        },
      });
    });

    it("should reject invalid limit parameter", async () => {
      const query = { limit: "51" };

      await expect(
        CommentValidator.validateCommentQuery(query)
      ).rejects.toMatchObject({
        name: "ValidationError",
        details: {
          limit: "Limit must not exceed 50",
        },
      });
    });

    it("should reject invalid sort parameter", async () => {
      const query = { sort: "invalid" };

      await expect(
        CommentValidator.validateCommentQuery(query)
      ).rejects.toMatchObject({
        name: "ValidationError",
        details: {
          sort: "Sort must be one of: recent, best, oldest",
        },
      });
    });

    it("should reject invalid filter parameter", async () => {
      const query = { filter: "invalid" };

      await expect(
        CommentValidator.validateCommentQuery(query)
      ).rejects.toMatchObject({
        name: "ValidationError",
        details: {
          filter: "Filter must be one of: all, mbti, enneagram, zodiac",
        },
      });
    });

    it("should accept valid sort options", async () => {
      const sortOptions = ["recent", "best", "oldest"];

      for (const sort of sortOptions) {
        const query = { sort };
        const result = await CommentValidator.validateCommentQuery(query);
        expect(result.sort).toBe(sort);
      }
    });

    it("should accept valid filter options", async () => {
      const filterOptions = ["all", "mbti", "enneagram", "zodiac"];

      for (const filter of filterOptions) {
        const query = { filter };
        const result = await CommentValidator.validateCommentQuery(query);
        expect(result.filter).toBe(filter);
      }
    });

    it("should strip unknown parameters", async () => {
      const query = {
        page: "1",
        unknownParam: "value",
      };

      const result = await CommentValidator.validateCommentQuery(query);
      expect(result).not.toHaveProperty("unknownParam");
    });

    it("should handle multiple validation errors", async () => {
      const query = {
        page: "0",
        limit: "51",
        sort: "invalid",
        filter: "invalid",
      };

      await expect(
        CommentValidator.validateCommentQuery(query)
      ).rejects.toMatchObject({
        name: "ValidationError",
        details: {
          page: "Page must be greater than 0",
          limit: "Limit must not exceed 50",
          sort: "Sort must be one of: recent, best, oldest",
          filter: "Filter must be one of: all, mbti, enneagram, zodiac",
        },
      });
    });
  });

  describe("_formatYupErrors", () => {
    it("should format single error correctly", () => {
      const yupError = {
        path: "content",
        message: "Content is required",
        inner: [],
      };

      const result = CommentValidator._formatYupErrors(yupError);
      expect(result).toEqual({
        content: "Content is required",
      });
    });

    it("should format multiple errors correctly", () => {
      const yupError = {
        inner: [
          { path: "content", message: "Content is required" },
          { path: "author", message: "Author is required" },
        ],
      };

      const result = CommentValidator._formatYupErrors(yupError);
      expect(result).toEqual({
        content: "Content is required",
        author: "Author is required",
      });
    });

    it("should handle error without path", () => {
      const yupError = {
        message: "General validation error",
        inner: [],
      };

      const result = CommentValidator._formatYupErrors(yupError);
      expect(result).toEqual({
        general: "General validation error",
      });
    });
  });

  describe("getSchemas", () => {
    it("should return all schemas", () => {
      const schemas = CommentValidator.getSchemas();

      expect(schemas).toHaveProperty("createCommentSchema");
      expect(schemas).toHaveProperty("updateCommentSchema");
      expect(schemas).toHaveProperty("commentIdSchema");
      expect(schemas).toHaveProperty("profileIdSchema");
      expect(schemas).toHaveProperty("commentQuerySchema");
      expect(schemas.createCommentSchema).toBe(createCommentSchema);
      expect(schemas.updateCommentSchema).toBe(updateCommentSchema);
      expect(schemas.commentIdSchema).toBe(commentIdSchema);
      expect(schemas.commentQuerySchema).toBe(commentQuerySchema);
    });
  });
});
