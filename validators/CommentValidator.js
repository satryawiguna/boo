"use strict";

const yup = require("yup");

const createCommentSchema = yup.object().shape({
  content: yup
    .string()
    .trim()
    .min(1, "Comment content cannot be empty")
    .max(1000, "Comment content must not exceed 1000 characters")
    .required("Comment content is required"),

  title: yup
    .string()
    .trim()
    .max(200, "Comment title must not exceed 200 characters"),

  author: yup
    .string()
    .trim()
    .min(1, "Author name cannot be empty")
    .max(100, "Author name must not exceed 100 characters")
    .required("Author name is required"),

  profileId: yup
    .number()
    .integer("Profile ID must be an integer")
    .min(1, "Profile ID must be greater than 0")
    .max(99999, "Profile ID must be less than 100000")
    .required("Profile ID is required"),
});

const updateCommentSchema = yup.object().shape({
  content: yup
    .string()
    .trim()
    .min(1, "Comment content cannot be empty")
    .max(1000, "Comment content must not exceed 1000 characters"),

  title: yup
    .string()
    .trim()
    .max(200, "Comment title must not exceed 200 characters"),

  isVisible: yup.boolean(),
});

const commentIdSchema = yup.object().shape({
  id: yup
    .string()
    .matches(/^[0-9a-fA-F]{24}$/, "Comment ID must be a valid MongoDB ObjectId")
    .required("Comment ID is required"),
});

const profileIdSchema = yup.object().shape({
  id: yup
    .number()
    .integer("Profile ID must be an integer")
    .min(1, "Profile ID must be greater than 0")
    .max(99999, "Profile ID must be less than 100000")
    .required("Profile ID is required"),
});

const commentQuerySchema = yup.object().shape({
  page: yup
    .number()
    .integer("Page must be an integer")
    .min(1, "Page must be greater than 0")
    .default(1),

  limit: yup
    .number()
    .integer("Limit must be an integer")
    .min(1, "Limit must be at least 1")
    .max(50, "Limit must not exceed 50")
    .default(10),

  sort: yup
    .string()
    .oneOf(
      ["recent", "best", "oldest"],
      "Sort must be one of: recent, best, oldest"
    )
    .default("recent"),

  filter: yup
    .string()
    .oneOf(
      ["all", "mbti", "enneagram", "zodiac"],
      "Filter must be one of: all, mbti, enneagram, zodiac"
    )
    .default("all"),

  profileId: yup
    .number()
    .integer("Profile ID must be an integer")
    .min(1, "Profile ID must be greater than 0")
    .max(99999, "Profile ID must be less than 100000"),
});

class CommentValidator {
  static async validateCreate(data) {
    try {
      return await createCommentSchema.validate(data, {
        abortEarly: false,
        stripUnknown: true,
      });
    } catch (error) {
      const validationError = new Error("Comment validation failed");
      validationError.name = "ValidationError";
      validationError.details = this._formatYupErrors(error);
      throw validationError;
    }
  }

  static async validateUpdate(data) {
    try {
      const hasUpdatableFields =
        data.content || data.title || typeof data.isVisible !== "undefined";

      if (!hasUpdatableFields) {
        throw new Error(
          "At least one field (content, title, or isVisible) must be provided for update"
        );
      }

      return await updateCommentSchema.validate(data, {
        abortEarly: false,
        stripUnknown: true,
      });
    } catch (error) {
      const validationError = new Error("Comment update validation failed");
      validationError.name = "ValidationError";
      validationError.details =
        typeof error === "string"
          ? { general: error }
          : this._formatYupErrors(error);
      throw validationError;
    }
  }

  static async validateCommentId(id) {
    try {
      const result = await commentIdSchema.validate({ id });
      return result.id;
    } catch (error) {
      const validationError = new Error("Invalid comment ID");
      validationError.name = "ValidationError";
      validationError.details = this._formatYupErrors(error);
      throw validationError;
    }
  }

  static async validateProfileId(id) {
    try {
      const result = await profileIdSchema.validate({ id: parseInt(id) });
      return result.id;
    } catch (error) {
      const validationError = new Error("Invalid profile ID");
      validationError.name = "ValidationError";
      validationError.details = this._formatYupErrors(error);
      throw validationError;
    }
  }

  static async validateCommentQuery(query) {
    try {
      return await commentQuerySchema.validate(
        {
          page: query.page ? parseInt(query.page) : undefined,
          limit: query.limit ? parseInt(query.limit) : undefined,
          sort: query.sort,
          filter: query.filter,
          profileId: query.profileId ? parseInt(query.profileId) : undefined,
        },
        {
          abortEarly: false,
          stripUnknown: true,
        }
      );
    } catch (error) {
      const validationError = new Error("Invalid comment query parameters");
      validationError.name = "ValidationError";
      validationError.details = this._formatYupErrors(error);
      throw validationError;
    }
  }

  static _formatYupErrors(yupError) {
    const errors = {};

    if (yupError.inner && yupError.inner.length > 0) {
      yupError.inner.forEach((error) => {
        errors[error.path] = error.message;
      });
    } else if (yupError.path) {
      errors[yupError.path] = yupError.message;
    } else {
      errors.general = yupError.message;
    }

    return errors;
  }

  static getSchemas() {
    return {
      createCommentSchema,
      updateCommentSchema,
      commentIdSchema,
      profileIdSchema,
      commentQuerySchema,
    };
  }
}

module.exports = {
  CommentValidator,
  createCommentSchema,
  updateCommentSchema,
  commentIdSchema,
  commentQuerySchema,
};
