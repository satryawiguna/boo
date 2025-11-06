"use strict";

const ProfileService = require("../services/ProfileService");

async function initializeData() {
  try {
    const profileService = new ProfileService();

    // Check if we already have data
    const existingProfile = await profileService.getProfileById(1);

    if (!existingProfile) {
      console.log("Initializing sample profile data...");

      const sampleProfileData = {
        profileId: 1,
        name: "A Martinez",
        description: "Adolph Larrue Martinez III.",
        mbti: "ISFJ",
        enneagram: "9w3",
        variant: "sp/so",
        tritype: 725,
        socionics: "SEE",
        sloan: "RCOEN",
        psyche: "FEVL",
        image: "https://soulverse.boo.world/images/1.png",
      };

      await profileService.createProfile(sampleProfileData);
      console.log("Sample profile data initialized successfully");
    } else {
      console.log("Profile data already exists, skipping initialization");
    }
  } catch (error) {
    console.error("Error initializing data:", error);
  }
}

module.exports = initializeData;
