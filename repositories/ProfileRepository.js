"use strict";

const Profile = require("../models/Profile");

class ProfileRepository {
  async findByProfileId(profileId) {
    try {
      return await Profile.findByProfileId(profileId);
    } catch (error) {
      throw new Error(
        `Error finding profile by ID ${profileId}: ${error.message}`
      );
    }
  }

  async findAll(options = {}) {
    try {
      const { sort = { profileId: 1 }, limit, skip } = options;
      let query = Profile.find().sort(sort);

      if (skip) query = query.skip(skip);
      if (limit) query = query.limit(limit);

      return await query.exec();
    } catch (error) {
      throw new Error(`Error finding profiles: ${error.message}`);
    }
  }

  async findFirst() {
    try {
      return await Profile.findOne().sort({ profileId: 1 });
    } catch (error) {
      throw new Error(`Error finding first profile: ${error.message}`);
    }
  }

  async create(profileData) {
    try {
      const profile = new Profile(profileData);
      return await profile.save();
    } catch (error) {
      if (error.name === "ValidationError") {
        const validationErrors = {};
        for (let field in error.errors) {
          validationErrors[field] = error.errors[field].message;
        }
        const validationError = new Error("Validation failed");
        validationError.name = "ValidationError";
        validationError.details = validationErrors;
        throw validationError;
      }

      if (error.code === 11000) {
        const duplicateError = new Error("Profile with this ID already exists");
        duplicateError.name = "DuplicateError";
        duplicateError.field = "profileId";
        throw duplicateError;
      }

      throw new Error(`Error creating profile: ${error.message}`);
    }
  }

  async updateByProfileId(profileId, updateData) {
    try {
      return await Profile.findOneAndUpdate({ profileId }, updateData, {
        new: true,
        runValidators: true,
      });
    } catch (error) {
      throw new Error(`Error updating profile ${profileId}: ${error.message}`);
    }
  }

  async deleteByProfileId(profileId) {
    try {
      return await Profile.findOneAndDelete({ profileId });
    } catch (error) {
      throw new Error(`Error deleting profile ${profileId}: ${error.message}`);
    }
  }

  async existsByProfileId(profileId) {
    try {
      const count = await Profile.countDocuments({ profileId });
      return count > 0;
    } catch (error) {
      throw new Error(
        `Error checking profile existence ${profileId}: ${error.message}`
      );
    }
  }

  async getCount() {
    try {
      return await Profile.countDocuments();
    } catch (error) {
      throw new Error(`Error getting profiles count: ${error.message}`);
    }
  }

  async findWithPagination(page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;
      const profiles = await this.findAll({ limit, skip });
      const total = await this.getCount();
      const totalPages = Math.ceil(total / limit);

      return {
        profiles,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: total,
          itemsPerPage: limit,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      throw new Error(
        `Error finding profiles with pagination: ${error.message}`
      );
    }
  }
}

module.exports = ProfileRepository;
