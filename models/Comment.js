"use strict";

const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 1000,
    },
    title: {
      type: String,
      required: false,
      trim: true,
      maxlength: 200,
    },
    author: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 100,
    },
    profileId: {
      type: Number,
      required: true,
      ref: "Profile",
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
    voteStats: {
      mbti: {
        type: Map,
        of: Number,
        default: {},
      },
      enneagram: {
        type: Map,
        of: Number,
        default: {},
      },
      zodiac: {
        type: Map,
        of: Number,
        default: {},
      },
    },
    totalVotes: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        if (ret.voteStats) {
          ret.voteStats.mbti = ret.voteStats.mbti
            ? Object.fromEntries(ret.voteStats.mbti)
            : {};
          ret.voteStats.enneagram = ret.voteStats.enneagram
            ? Object.fromEntries(ret.voteStats.enneagram)
            : {};
          ret.voteStats.zodiac = ret.voteStats.zodiac
            ? Object.fromEntries(ret.voteStats.zodiac)
            : {};
        }

        delete ret._id;
        delete ret.__v;

        return ret;
      },
    },
  }
);

commentSchema.index({ profileId: 1, createdAt: -1 });
commentSchema.index({ createdAt: -1 });
commentSchema.index({ author: 1 });
commentSchema.index({ isVisible: 1 });

commentSchema.statics.findByProfileId = function (profileId, options = {}) {
  const query = { profileId: profileId, isVisible: true };

  let queryBuilder = this.find(query);

  if (options.sort) {
    queryBuilder = queryBuilder.sort(options.sort);
  } else {
    queryBuilder = queryBuilder.sort({ createdAt: -1 });
  }

  if (options.limit) {
    queryBuilder = queryBuilder.limit(options.limit);
  }

  if (options.skip) {
    queryBuilder = queryBuilder.skip(options.skip);
  }

  return queryBuilder;
};

commentSchema.statics.countByProfileId = function (profileId) {
  return this.countDocuments({ profileId: profileId, isVisible: true });
};

commentSchema.methods.toPublicJSON = function () {
  return {
    id: this._id,
    content: this.content,
    title: this.title,
    author: this.author,
    profileId: this.profileId,
    voteStats: {
      mbti: this.voteStats.mbti ? Object.fromEntries(this.voteStats.mbti) : {},
      enneagram: this.voteStats.enneagram
        ? Object.fromEntries(this.voteStats.enneagram)
        : {},
      zodiac: this.voteStats.zodiac
        ? Object.fromEntries(this.voteStats.zodiac)
        : {},
    },
    totalVotes: this.totalVotes,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

commentSchema.methods.incrementVoteCount = function (
  personalitySystem,
  personalityValue
) {
  if (!this.voteStats[personalitySystem]) {
    this.voteStats[personalitySystem] = new Map();
  }

  const currentCount =
    this.voteStats[personalitySystem].get(personalityValue) || 0;
  this.voteStats[personalitySystem].set(personalityValue, currentCount + 1);
  this.totalVotes = (this.totalVotes || 0) + 1;
};

commentSchema.methods.decrementVoteCount = function (
  personalitySystem,
  personalityValue
) {
  if (!this.voteStats[personalitySystem]) {
    return;
  }

  const currentCount =
    this.voteStats[personalitySystem].get(personalityValue) || 0;
  if (currentCount > 0) {
    this.voteStats[personalitySystem].set(personalityValue, currentCount - 1);
    this.totalVotes = Math.max((this.totalVotes || 0) - 1, 0);
  }
};

module.exports = mongoose.model("Comment", commentSchema);
