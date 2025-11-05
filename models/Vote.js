"use strict";

const mongoose = require("mongoose");

const voteSchema = new mongoose.Schema(
  {
    commentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Comment",
    },
    profileId: {
      type: Number,
      required: true,
      ref: "Profile",
    },
    voterIdentifier: {
      type: String,
      required: true,
      trim: true,
    },
    personalitySystem: {
      type: String,
      required: true,
      enum: ["mbti", "enneagram", "zodiac"],
      lowercase: true,
    },
    personalityValue: {
      type: String,
      required: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

voteSchema.index(
  {
    commentId: 1,
    voterIdentifier: 1,
    personalitySystem: 1,
  },
  { unique: true }
);

voteSchema.index({ commentId: 1, personalitySystem: 1 });
voteSchema.index({ profileId: 1 });
voteSchema.index({ createdAt: -1 });

voteSchema.statics.findByCommentId = function (commentId, options = {}) {
  const query = { commentId: commentId, isActive: true };

  let queryBuilder = this.find(query);

  if (options.personalitySystem) {
    query.personalitySystem = options.personalitySystem;
    queryBuilder = this.find(query);
  }

  if (options.sort) {
    queryBuilder = queryBuilder.sort(options.sort);
  } else {
    queryBuilder = queryBuilder.sort({ createdAt: -1 });
  }

  return queryBuilder;
};

voteSchema.statics.findUserVote = function (
  commentId,
  voterIdentifier,
  personalitySystem
) {
  return this.findOne({
    commentId: commentId,
    voterIdentifier: voterIdentifier,
    personalitySystem: personalitySystem,
    isActive: true,
  });
};

voteSchema.statics.getVoteStatsByComment = function (commentId) {
  return this.aggregate([
    {
      $match: {
        commentId: new mongoose.Types.ObjectId(commentId),
        isActive: true,
      },
    },
    {
      $group: {
        _id: {
          personalitySystem: "$personalitySystem",
          personalityValue: "$personalityValue",
        },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: "$_id.personalitySystem",
        votes: {
          $push: {
            value: "$_id.personalityValue",
            count: "$count",
          },
        },
        totalVotes: { $sum: "$count" },
      },
    },
    {
      $project: {
        personalitySystem: "$_id",
        votes: 1,
        totalVotes: 1,
        _id: 0,
      },
    },
  ]);
};

// Validation for personality values based on system
voteSchema.pre("validate", function (next) {
  const validValues = {
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

  const validValuesForSystem = validValues[this.personalitySystem];
  if (
    validValuesForSystem &&
    !validValuesForSystem.includes(this.personalityValue)
  ) {
    const error = new Error(
      `Invalid ${this.personalitySystem} value: ${this.personalityValue}. ` +
        `Valid values are: ${validValuesForSystem.join(", ")}`
    );
    error.name = "ValidationError";
    return next(error);
  }

  next();
});

// Instance methods
voteSchema.methods.toPublicJSON = function () {
  return {
    id: this._id,
    commentId: this.commentId,
    profileId: this.profileId,
    personalitySystem: this.personalitySystem,
    personalityValue: this.personalityValue,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model("Vote", voteSchema);
