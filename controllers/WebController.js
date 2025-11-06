"use strict";

const ProfileService = require("../services/ProfileService");

class WebController {
  constructor() {
    this.profileService = new ProfileService();
  }

  async profile(req, res, next) {
    try {
      const profileId = req.params.id ? parseInt(req.params.id) : 1;
      const profile = await this.profileService.getProfileById(
        profileId,
        !req.params.id
      );

      if (!profile) {
        return res.status(404).render("error", {
          message: "Profile not found",
          error: { status: 404 },
        });
      }

      res.render("profile_template", { profile });
    } catch (error) {
      console.error("Controller error rendering profile:", error);
      next(error);
    }
  }

  async defaultProfile(req, res, next) {
    try {
      const profile = await this.profileService.getProfileById(1, true);

      if (!profile) {
        return res.status(404).render("error", {
          message: "No profiles found",
          error: { status: 404 },
        });
      }

      res.render("profile_template", { profile });
    } catch (error) {
      console.error("Controller error rendering default profile:", error);
      next(error);
    }
  }
}

module.exports = WebController;
