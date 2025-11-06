"use strict";

const yup = require("yup");

const mbtiValidation = yup
  .string()
  .matches(
    /^[IE][SN][TF][JP]$/,
    "MBTI must be a valid 4-letter type (e.g., ISFJ)"
  )
  .uppercase()
  .required("MBTI is required");

const imageUrlValidation = yup
  .string()
  .url("Image must be a valid URL")
  .matches(
    /\.(jpg|jpeg|png|gif|webp)$/i,
    "Image must be a valid image file (jpg, jpeg, png, gif, webp)"
  )
  .required("Image URL is required");

const tritypeValidation = yup
  .number()
  .integer("Tritype must be an integer")
  .min(100, "Tritype must be a 3-digit number (100-999)")
  .max(999, "Tritype must be a 3-digit number (100-999)")
  .required("Tritype is required");

const createProfileSchema = yup.object().shape({
  profileId: yup
    .number()
    .integer("Profile ID must be an integer")
    .min(1, "Profile ID must be greater than 0")
    .max(99999, "Profile ID must be less than 100000")
    .required("Profile ID is required"),

  name: yup
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters")
    .required("Name is required"),

  description: yup
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters")
    .max(1000, "Description must not exceed 1000 characters")
    .required("Description is required"),

  mbti: mbtiValidation,

  enneagram: yup
    .string()
    .trim()
    .min(2, "Enneagram must be at least 2 characters")
    .max(10, "Enneagram must not exceed 10 characters")
    .required("Enneagram is required"),

  variant: yup
    .string()
    .trim()
    .min(2, "Variant must be at least 2 characters")
    .max(20, "Variant must not exceed 20 characters")
    .required("Variant is required"),

  tritype: tritypeValidation,

  socionics: yup
    .string()
    .trim()
    .uppercase()
    .min(2, "Socionics must be at least 2 characters")
    .max(10, "Socionics must not exceed 10 characters")
    .required("Socionics is required"),

  sloan: yup
    .string()
    .trim()
    .uppercase()
    .length(5, "SLOAN must be exactly 5 characters")
    .matches(/^[RCUAI]{5}$/, "SLOAN must contain only R, C, U, A, I characters")
    .required("SLOAN is required"),

  psyche: yup
    .string()
    .trim()
    .uppercase()
    .length(4, "Psyche must be exactly 4 characters")
    .matches(/^[FLVE]{4}$/, "Psyche must contain only F, L, V, E characters")
    .required("Psyche is required"),

  image: imageUrlValidation,
});

const updateProfileSchema = yup.object().shape({
  name: yup
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters"),

  description: yup
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters")
    .max(1000, "Description must not exceed 1000 characters"),

  mbti: yup
    .string()
    .matches(
      /^[IE][SN][TF][JP]$/,
      "MBTI must be a valid 4-letter type (e.g., ISFJ)"
    )
    .uppercase(),

  enneagram: yup
    .string()
    .trim()
    .min(2, "Enneagram must be at least 2 characters")
    .max(10, "Enneagram must not exceed 10 characters"),

  variant: yup
    .string()
    .trim()
    .min(2, "Variant must be at least 2 characters")
    .max(20, "Variant must not exceed 20 characters"),

  tritype: yup
    .number()
    .integer("Tritype must be an integer")
    .min(100, "Tritype must be a 3-digit number (100-999)")
    .max(999, "Tritype must be a 3-digit number (100-999)"),

  socionics: yup
    .string()
    .trim()
    .uppercase()
    .min(2, "Socionics must be at least 2 characters")
    .max(10, "Socionics must not exceed 10 characters"),

  sloan: yup
    .string()
    .trim()
    .uppercase()
    .length(5, "SLOAN must be exactly 5 characters")
    .matches(
      /^[RCUAI]{5}$/,
      "SLOAN must contain only R, C, U, A, I characters"
    ),

  psyche: yup
    .string()
    .trim()
    .uppercase()
    .length(4, "Psyche must be exactly 4 characters")
    .matches(/^[FLVE]{4}$/, "Psyche must contain only F, L, V, E characters"),

  image: yup
    .string()
    .url("Image must be a valid URL")
    .matches(
      /\.(jpg|jpeg|png|gif|webp)$/i,
      "Image must be a valid image file (jpg, jpeg, png, gif, webp)"
    ),
});

const profileIdSchema = yup.object().shape({
  id: yup
    .number()
    .integer("Profile ID must be an integer")
    .min(1, "Profile ID must be greater than 0")
    .max(99999, "Profile ID must be less than 100000")
    .required("Profile ID is required"),
});

const paginationSchema = yup.object().shape({
  page: yup
    .number()
    .integer("Page must be an integer")
    .min(1, "Page must be greater than 0")
    .default(1),

  limit: yup
    .number()
    .integer("Limit must be an integer")
    .min(1, "Limit must be at least 1")
    .max(100, "Limit must not exceed 100")
    .default(10),
});

class ProfileValidator {
  static async validateCreate(data) {
    try {
      return await createProfileSchema.validate(data, {
        abortEarly: false,
        stripUnknown: true,
      });
    } catch (error) {
      const validationError = new Error("Validation failed");
      validationError.name = "ValidationError";
      validationError.details = this._formatYupErrors(error);
      throw validationError;
    }
  }

  static async validateUpdate(data) {
    try {
      return await updateProfileSchema.validate(data, {
        abortEarly: false,
        stripUnknown: true,
      });
    } catch (error) {
      const validationError = new Error("Validation failed");
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

  static async validatePagination(query) {
    try {
      const { page, limit } = query;
      return await paginationSchema.validate({
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined,
      });
    } catch (error) {
      const validationError = new Error("Invalid pagination parameters");
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
      createProfileSchema,
      updateProfileSchema,
      profileIdSchema,
      paginationSchema,
    };
  }
}

module.exports = {
  ProfileValidator,
  createProfileSchema,
  updateProfileSchema,
  profileIdSchema,
  paginationSchema,
};
