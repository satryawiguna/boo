"use strict";

const express = require("express");
const router = express.Router();
const WebController = require("../controllers/WebController");

module.exports = function () {
  const webController = new WebController();

  router.get("/:id?", (req, res, next) => {
    webController.profile(req, res, next);
  });

  router.get("/*", (req, res, next) => {
    webController.defaultProfile(req, res, next);
  });

  return router;
};
