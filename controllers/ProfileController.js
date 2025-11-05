"use strict";

const ProfileService = require("../services/ProfileService");

/**
 * @swagger
 * tags:
 *   - name: Profiles
 *     description: Profile management operations
 *   - name: Profile Statistics
 *     description: Profile analytics and statistics
 */

/**
 * Profile Controller
 * Handles HTTP requests and coordinates with ProfileService
 * Implements comprehensive error handling and validation
 *
 * @class ProfileController
 */
class ProfileController {
  constructor() {
    this.profileService = new ProfileService();
  }

  async getAllProfiles(req, res, next) {
    try {
      const result = await this.profileService.getAllProfiles(req.query);
      res.json(result);
    } catch (error) {
      console.error("Controller error getting all profiles:", error);

      if (error.name === "ValidationError") {
        return res.status(400).json({
          error: "Validation Error",
          message: error.message,
          details: error.details,
        });
      }

      next(error);
    }
  }

  async getProfileById(req, res, next) {
    try {
      const profile = await this.profileService.getProfileById(req.params.id);

      if (!profile) {
        return res.status(404).json({
          error: "Profile not found",
          message: `Profile with ID ${req.params.id} does not exist`,
        });
      }

      res.json(profile);
    } catch (error) {
      console.error("Controller error getting profile by ID:", error);

      if (error.name === "ValidationError") {
        return res.status(400).json({
          error: "Validation Error",
          message: error.message,
          details: error.details,
        });
      }

      next(error);
    }
  }

  async createProfile(req, res, next) {
    try {
      const result = await this.profileService.createProfile(req.body);
      res.status(201).json(result);
    } catch (error) {
      console.error("Controller error creating profile:", error);

      if (error.name === "ValidationError") {
        return res.status(400).json({
          error: "Validation Error",
          message: error.message,
          details: error.details,
        });
      }

      if (error.name === "DuplicateError") {
        return res.status(409).json({
          error: "Duplicate Profile",
          message: error.message,
          field: error.field,
        });
      }

      next(error);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const profile = await this.profileService.updateProfile(
        req.params.id,
        req.body
      );

      if (!profile) {
        return res.status(404).json({
          error: "Profile not found",
          message: `Profile with ID ${req.params.id} does not exist`,
        });
      }

      res.json({
        success: true,
        message: "Profile updated successfully",
        profile,
      });
    } catch (error) {
      console.error("Controller error updating profile:", error);

      if (error.name === "ValidationError") {
        return res.status(400).json({
          error: "Validation Error",
          message: error.message,
          details: error.details,
        });
      }

      next(error);
    }
  }

  async deleteProfile(req, res, next) {
    try {
      const profile = await this.profileService.deleteProfile(req.params.id);

      if (!profile) {
        return res.status(404).json({
          error: "Profile not found",
          message: `Profile with ID ${req.params.id} does not exist`,
        });
      }

      res.json({
        success: true,
        message: "Profile deleted successfully",
        profile,
      });
    } catch (error) {
      console.error("Controller error deleting profile:", error);

      if (error.name === "ValidationError") {
        return res.status(400).json({
          error: "Validation Error",
          message: error.message,
          details: error.details,
        });
      }

      next(error);
    }
  }

  async getProfileStats(req, res, next) {
    try {
      const stats = await this.profileService.getProfileStats();
      res.json(stats);
    } catch (error) {
      console.error("Controller error getting profile stats:", error);
      next(error);
    }
  }
}

module.exports = ProfileController;
