"use strict";

const ProfileRepository = require("../repositories/ProfileRepository");
const { ProfileValidator } = require("../validators/ProfileValidator");

class ProfileService {
  constructor() {
    this.profileRepository = new ProfileRepository();
  }

  async getProfileById(profileId, allowFallback = false) {
    try {
      let validatedProfileId = profileId;
      if (profileId && !allowFallback) {
        validatedProfileId = await ProfileValidator.validateProfileId(
          profileId
        );
      }

      let profile = await this.profileRepository.findByProfileId(
        validatedProfileId
      );

      if (!profile && allowFallback) {
        profile = await this.profileRepository.findFirst();
      }

      return profile ? profile.toPublicJSON() : null;
    } catch (error) {
      if (error.name === "ValidationError") {
        throw error;
      }
      throw new Error(`Service error getting profile by ID: ${error.message}`);
    }
  }

  async getAllProfiles(options = {}) {
    try {
      const validatedPagination = await ProfileValidator.validatePagination(
        options
      );
      const { page, limit } = validatedPagination;

      if (page && limit) {
        const result = await this.profileRepository.findWithPagination(
          page,
          limit
        );
        return {
          profiles: result.profiles.map((profile) => profile.toPublicJSON()),
          pagination: result.pagination,
        };
      }

      const profiles = await this.profileRepository.findAll();
      return {
        profiles: profiles.map((profile) => profile.toPublicJSON()),
      };
    } catch (error) {
      if (error.name === "ValidationError") {
        throw error;
      }
      throw new Error(`Service error getting all profiles: ${error.message}`);
    }
  }

  async createProfile(profileData) {
    try {
      const validatedData = await ProfileValidator.validateCreate(profileData);

      const exists = await this.profileRepository.existsByProfileId(
        validatedData.profileId
      );

      if (exists) {
        const error = new Error(
          `Profile with ID ${validatedData.profileId} already exists`
        );
        error.name = "DuplicateError";
        error.field = "profileId";
        throw error;
      }

      const profile = await this.profileRepository.create(validatedData);

      return {
        success: true,
        message: "Profile created successfully",
        profile: profile.toPublicJSON(),
      };
    } catch (error) {
      if (error.name === "ValidationError" || error.name === "DuplicateError") {
        throw error;
      }
      throw new Error(`Service error creating profile: ${error.message}`);
    }
  }

  async updateProfile(profileId, updateData) {
    try {
      const validatedProfileId = await ProfileValidator.validateProfileId(
        profileId
      );

      const exists = await this.profileRepository.existsByProfileId(
        validatedProfileId
      );

      if (!exists) {
        return null;
      }

      const validatedData = await ProfileValidator.validateUpdate(updateData);

      const profile = await this.profileRepository.updateByProfileId(
        validatedProfileId,
        validatedData
      );

      return profile ? profile.toPublicJSON() : null;
    } catch (error) {
      if (error.name === "ValidationError") {
        throw error;
      }
      throw new Error(`Service error updating profile: ${error.message}`);
    }
  }

  async deleteProfile(profileId) {
    try {
      const validatedProfileId = await ProfileValidator.validateProfileId(
        profileId
      );

      const profile = await this.profileRepository.deleteByProfileId(
        validatedProfileId
      );

      return profile ? profile.toPublicJSON() : null;
    } catch (error) {
      if (error.name === "ValidationError") {
        throw error;
      }
      throw new Error(`Service error deleting profile: ${error.message}`);
    }
  }

  async getProfileStats() {
    try {
      const totalProfiles = await this.profileRepository.getCount();
      const profiles = await this.profileRepository.findAll();
      const mbtiStats = {};

      profiles.forEach((profile) => {
        const mbti = profile.mbti;
        mbtiStats[mbti] = (mbtiStats[mbti] || 0) + 1;
      });

      return {
        totalProfiles,
        mbtiDistribution: mbtiStats,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(`Service error getting profile stats: ${error.message}`);
    }
  }
}

module.exports = ProfileService;
