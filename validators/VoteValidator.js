"use strict";

const yup = require("yup");

const PERSONALITY_VALUES = {
  mbti: [
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
  ],
  enneagram: [
    "1w9",
    "1w2",
    "2w1",
    "2w3",
    "3w2",
    "3w4",
    "4w3",
    "4w5",
    "5w4",
    "5w6",
    "6w5",
    "6w7",
    "7w6",
    "7w8",
    "8w7",
    "8w9",
    "9w8",
    "9w1",
  ],
  zodiac: [
    "Aries",
    "Taurus",
    "Gemini",
    "Cancer",
    "Leo",
    "Virgo",
    "Libra",
    "Scorpio",
    "Sagittarius",
    "Capricorn",
    "Aquarius",
    "Pisces",
  ],
};

const createVoteSchema = yup.object().shape({
  commentId: yup
    .string()
    .matches(/^[0-9a-fA-F]{24}$/, "Comment ID must be a valid MongoDB ObjectId")
    .required("Comment ID is required"),

  profileId: yup
    .number()
    .integer("Profile ID must be an integer")
    .min(1, "Profile ID must be greater than 0")
    .max(99999, "Profile ID must be less than 100000")
    .required("Profile ID is required"),

  voterIdentifier: yup
    .string()
    .trim()
    .min(1, "Voter identifier cannot be empty")
    .max(100, "Voter identifier must not exceed 100 characters")
    .required("Voter identifier is required"),

  personalitySystem: yup
    .string()
    .lowercase()
    .oneOf(
      ["mbti", "enneagram", "zodiac"],
      "Personality system must be one of: mbti, enneagram, zodiac"
    )
    .required("Personality system is required"),

  personalityValue: yup
    .string()
    .trim()
    .required("Personality value is required")
    .test(
      "valid-personality-value",
      "Invalid personality value for the selected system",
      function (value) {
        const { personalitySystem } = this.parent;

        if (!personalitySystem || !value) {
          return true;
        }

        const validValues = PERSONALITY_VALUES[personalitySystem];
        if (!validValues) {
          return false;
        }

        return validValues.some(
          (validValue) => validValue.toLowerCase() === value.toLowerCase()
        );
      }
    ),
});

const updateVoteSchema = yup.object().shape({
  personalityValue: yup
    .string()
    .trim()
    .required("Personality value is required")
    .test(
      "valid-personality-value",
      "Invalid personality value for the selected system",
      function (value) {
        return true;
      }
    ),
});

const voteIdSchema = yup.object().shape({
  id: yup
    .string()
    .matches(/^[0-9a-fA-F]{24}$/, "Vote ID must be a valid MongoDB ObjectId")
    .required("Vote ID is required"),
});

const commentIdSchema = yup.object().shape({
  id: yup
    .string()
    .matches(/^[0-9a-fA-F]{24}$/, "Comment ID must be a valid MongoDB ObjectId")
    .required("Comment ID is required"),
});

const voteQuerySchema = yup.object().shape({
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
    .default(20),

  personalitySystem: yup
    .string()
    .lowercase()
    .oneOf(
      ["mbti", "enneagram", "zodiac"],
      "Personality system must be one of: mbti, enneagram, zodiac"
    ),

  voterIdentifier: yup
    .string()
    .trim()
    .max(100, "Voter identifier must not exceed 100 characters"),
});

const voteSubmissionSchema = yup.object().shape({
  personalitySystem: yup
    .string()
    .lowercase()
    .oneOf(
      ["mbti", "enneagram", "zodiac"],
      "Personality system must be one of: mbti, enneagram, zodiac"
    )
    .required("Personality system is required"),

  personalityValue: yup
    .string()
    .trim()
    .required("Personality value is required")
    .test(
      "valid-personality-value",
      "Invalid personality value for the selected system",
      function (value) {
        const { personalitySystem } = this.parent;

        if (!personalitySystem || !value) {
          return true;
        }

        const validValues = PERSONALITY_VALUES[personalitySystem];
        if (!validValues) {
          return false;
        }

        return validValues.some(
          (validValue) => validValue.toLowerCase() === value.toLowerCase()
        );
      }
    ),

  voterIdentifier: yup
    .string()
    .trim()
    .min(1, "Voter identifier cannot be empty")
    .max(100, "Voter identifier must not exceed 100 characters")
    .required("Voter identifier is required"),
});

class VoteValidator {
  static async validateCreate(data) {
    try {
      const validated = await createVoteSchema.validate(data, {
        abortEarly: false,
        stripUnknown: true,
      });

      validated.personalityValue = this._normalizePersonalityValue(
        validated.personalitySystem,
        validated.personalityValue
      );

      return validated;
    } catch (error) {
      const validationError = new Error("Vote validation failed");
      validationError.name = "ValidationError";
      validationError.details = this._formatYupErrors(error);
      throw validationError;
    }
  }

  static async validateUpdate(data, existingPersonalitySystem) {
    try {
      const validated = await updateVoteSchema.validate(data, {
        abortEarly: false,
        stripUnknown: true,
      });

      const validValues = PERSONALITY_VALUES[existingPersonalitySystem];
      if (
        !validValues ||
        !validValues.some(
          (validValue) =>
            validValue.toLowerCase() ===
            validated.personalityValue.toLowerCase()
        )
      ) {
        throw new Error(
          `Invalid personality value for ${existingPersonalitySystem} system`
        );
      }

      validated.personalityValue = this._normalizePersonalityValue(
        existingPersonalitySystem,
        validated.personalityValue
      );

      return validated;
    } catch (error) {
      const validationError = new Error("Vote update validation failed");
      validationError.name = "ValidationError";
      validationError.details =
        typeof error === "string"
          ? { general: error }
          : this._formatYupErrors(error);
      throw validationError;
    }
  }

  static async validateVoteId(id) {
    try {
      const result = await voteIdSchema.validate({ id });
      return result.id;
    } catch (error) {
      const validationError = new Error("Invalid vote ID");
      validationError.name = "ValidationError";
      validationError.details = this._formatYupErrors(error);
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

  static async validateVoteQuery(query) {
    try {
      return await voteQuerySchema.validate(
        {
          page: query.page ? parseInt(query.page) : undefined,
          limit: query.limit ? parseInt(query.limit) : undefined,
          personalitySystem: query.personalitySystem,
          voterIdentifier: query.voterIdentifier,
        },
        {
          abortEarly: false,
          stripUnknown: true,
        }
      );
    } catch (error) {
      const validationError = new Error("Invalid vote query parameters");
      validationError.name = "ValidationError";
      validationError.details = this._formatYupErrors(error);
      throw validationError;
    }
  }

  static async validateVoteSubmission(data) {
    try {
      const validated = await voteSubmissionSchema.validate(data, {
        abortEarly: false,
        stripUnknown: true,
      });

      validated.personalityValue = this._normalizePersonalityValue(
        validated.personalitySystem,
        validated.personalityValue
      );

      return validated;
    } catch (error) {
      const validationError = new Error("Vote submission validation failed");
      validationError.name = "ValidationError";
      validationError.details = this._formatYupErrors(error);
      throw validationError;
    }
  }

  static _normalizePersonalityValue(personalitySystem, personalityValue) {
    const validValues = PERSONALITY_VALUES[personalitySystem];
    if (!validValues) {
      return personalityValue;
    }

    const correctValue = validValues.find(
      (validValue) =>
        validValue.toLowerCase() === personalityValue.toLowerCase()
    );

    return correctValue || personalityValue;
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

  static getValidPersonalityValues() {
    return PERSONALITY_VALUES;
  }

  static getSchemas() {
    return {
      createVoteSchema,
      updateVoteSchema,
      voteIdSchema,
      commentIdSchema,
      voteQuerySchema,
      voteSubmissionSchema,
    };
  }
}

module.exports = {
  VoteValidator,
  createVoteSchema,
  updateVoteSchema,
  voteIdSchema,
  voteQuerySchema,
  voteSubmissionSchema,
  PERSONALITY_VALUES,
};
