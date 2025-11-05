"use strict";

const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema(
  {
    profileId: {
      type: Number,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    mbti: {
      type: String,
      required: true,
      uppercase: true,
      validate: {
        validator: function (v) {
          return /^[IE][SN][TF][JP]$/.test(v);
        },
        message: "MBTI must be a valid 4-letter type (e.g., ISFJ)",
      },
    },
    enneagram: {
      type: String,
      required: true,
    },
    variant: {
      type: String,
      required: true,
    },
    tritype: {
      type: Number,
      required: true,
      min: 100,
      max: 999,
    },
    socionics: {
      type: String,
      required: true,
      uppercase: true,
    },
    sloan: {
      type: String,
      required: true,
      uppercase: true,
    },
    psyche: {
      type: String,
      required: true,
      uppercase: true,
    },
    image: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
        },
        message: "Image must be a valid URL pointing to an image file",
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.id = ret.profileId;

        delete ret._id;
        delete ret.__v;
        delete ret.profileId;

        return ret;
      },
    },
  }
);

profileSchema.index({ profileId: 1 });
profileSchema.index({ name: 1 });

profileSchema.statics.findByProfileId = function (profileId) {
  return this.findOne({ profileId: profileId });
};

profileSchema.methods.toPublicJSON = function () {
  return {
    id: this.profileId,
    name: this.name,
    description: this.description,
    mbti: this.mbti,
    enneagram: this.enneagram,
    variant: this.variant,
    tritype: this.tritype,
    socionics: this.socionics,
    sloan: this.sloan,
    psyche: this.psyche,
    image: this.image,
  };
};

module.exports = mongoose.model("Profile", profileSchema);
