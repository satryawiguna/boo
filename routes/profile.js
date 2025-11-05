"use strict";

const express = require("express");
const router = express.Router();
const ProfileController = require("../controllers/ProfileController");

module.exports = function () {
  const profileController = new ProfileController();

  // Web routes - Render profile pages
  router.get("/:id?", (req, res, next) => {
    profileController.renderProfile(req, res, next);
  });

  // API routes - JSON responses
  router.get("/api/profiles", (req, res, next) => {
    profileController.getAllProfiles(req, res, next);
  });

  router.get("/api/profiles/:id", (req, res, next) => {
    profileController.getProfileById(req, res, next);
  });

  router.post("/api/profiles", (req, res, next) => {
    profileController.createProfile(req, res, next);
  });

  router.put("/api/profiles/:id", (req, res, next) => {
    profileController.updateProfile(req, res, next);
  });

  router.delete("/api/profiles/:id", (req, res, next) => {
    profileController.deleteProfile(req, res, next);
  });

  router.get("/api/stats", (req, res, next) => {
    profileController.getProfileStats(req, res, next);
  });

  router.get("/*", (req, res, next) => {
    profileController.renderDefaultProfile(req, res, next);
  });

  return router;
};
