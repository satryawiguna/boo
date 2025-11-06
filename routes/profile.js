"use strict";

const express = require("express");
const router = express.Router();
const ProfileController = require("../controllers/ProfileController");

/**
 * @swagger
 * components:
 *   schemas:
 *     Profile:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Unique profile identifier
 *         name:
 *           type: string
 *           description: Profile name
 *         description:
 *           type: string
 *           description: Profile description
 *         mbti:
 *           type: string
 *           description: MBTI personality type
 *         enneagram:
 *           type: string
 *           description: Enneagram type
 *         variant:
 *           type: string
 *           description: Enneagram variant
 *         tritype:
 *           type: integer
 *           description: Enneagram tritype
 *         socionics:
 *           type: string
 *           description: Socionics type
 *         sloan:
 *           type: string
 *           description: SLOAN type
 *         psyche:
 *           type: string
 *           description: Psyche type
 *         image:
 *           type: string
 *           description: Profile image URL
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       required:
 *         - name
 *         - description
 *         - mbti
 *         - enneagram
 *         - variant
 *         - tritype
 *         - socionics
 *         - sloan
 *         - psyche
 *         - image
 *
 *     ProfileCreate:
 *       type: object
 *       properties:
 *         profileId:
 *           type: integer
 *           minimum: 1
 *           maximum: 99999
 *           description: Unique profile identifier
 *         name:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           description: Profile name
 *         description:
 *           type: string
 *           minLength: 10
 *           maxLength: 1000
 *           description: Profile description
 *         mbti:
 *           type: string
 *           pattern: "^[IE][SN][TF][JP]$"
 *           description: MBTI personality type (e.g., ISFJ, ENFP)
 *         enneagram:
 *           type: string
 *           minLength: 2
 *           maxLength: 10
 *           description: Enneagram type
 *         variant:
 *           type: string
 *           minLength: 2
 *           maxLength: 20
 *           description: Enneagram variant
 *         tritype:
 *           type: integer
 *           minimum: 100
 *           maximum: 999
 *           description: Enneagram tritype (3-digit number)
 *         socionics:
 *           type: string
 *           minLength: 2
 *           maxLength: 10
 *           description: Socionics type
 *         sloan:
 *           type: string
 *           minLength: 5
 *           maxLength: 5
 *           pattern: "^[RCUAI]{5}$"
 *           description: SLOAN type (5 characters)
 *         psyche:
 *           type: string
 *           minLength: 4
 *           maxLength: 4
 *           pattern: "^[FLVE]{4}$"
 *           description: Psyche type (4 characters)
 *         image:
 *           type: string
 *           format: uri
 *           description: Profile image URL
 *       required:
 *         - profileId
 *         - name
 *         - description
 *         - mbti
 *         - enneagram
 *         - variant
 *         - tritype
 *         - socionics
 *         - sloan
 *         - psyche
 *         - image
 *
 *     ProfileUpdate:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *         description:
 *           type: string
 *           minLength: 10
 *           maxLength: 1000
 *         mbti:
 *           type: string
 *           pattern: "^[IE][SN][TF][JP]$"
 *         enneagram:
 *           type: string
 *           minLength: 2
 *           maxLength: 10
 *         variant:
 *           type: string
 *           minLength: 2
 *           maxLength: 20
 *         tritype:
 *           type: integer
 *           minimum: 100
 *           maximum: 999
 *         socionics:
 *           type: string
 *           minLength: 2
 *           maxLength: 10
 *         sloan:
 *           type: string
 *           minLength: 5
 *           maxLength: 5
 *           pattern: "^[RCUAI]{5}$"
 *         psyche:
 *           type: string
 *           minLength: 4
 *           maxLength: 4
 *           pattern: "^[FLVE]{4}$"
 *         image:
 *           type: string
 *           format: uri
 *
 *     ProfileStats:
 *       type: object
 *       properties:
 *         totalProfiles:
 *           type: integer
 *           description: Total number of profiles
 *         mbtiDistribution:
 *           type: object
 *           additionalProperties:
 *             type: integer
 *           description: Distribution of MBTI types
 *         lastUpdated:
 *           type: string
 *           format: date-time
 *           description: Last statistics update timestamp
 */

module.exports = function () {
  const profileController = new ProfileController();

  /**
   * @swagger
   * /api/profile:
   *   get:
   *     summary: Get all profiles
   *     tags: [Profiles]
   *     description: |
   *       Retrieve all profiles with optional pagination.
   *
   *       **Features:**
   *       - Pagination support with page and limit parameters
   *       - Returns metadata about pagination
   *       - Efficient querying with MongoDB
   *
   *       **Examples:**
   *       - `GET /api/profile` - Get all profiles
   *       - `GET /api/profile?page=2&limit=5` - Get page 2 with 5 profiles per page
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *         description: Page number
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *           default: 10
   *         description: Number of profiles per page
   *     responses:
   *       200:
   *         description: Profiles retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               oneOf:
   *                 - type: object
   *                   description: All profiles (no pagination)
   *                   properties:
   *                     profiles:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/Profile'
   *                 - type: object
   *                   description: Paginated profiles
   *                   properties:
   *                     profiles:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/Profile'
   *                     pagination:
   *                       type: object
   *                       properties:
   *                         page:
   *                           type: integer
   *                         limit:
   *                           type: integer
   *                         totalCount:
   *                           type: integer
   *                         totalPages:
   *                           type: integer
   *                         hasNextPage:
   *                           type: boolean
   *                         hasPrevPage:
   *                           type: boolean
   *             examples:
   *               all_profiles:
   *                 summary: All profiles
   *                 value:
   *                   profiles:
   *                     - id: 1
   *                       name: "A Martinez"
   *                       mbti: "ISFJ"
   *                       enneagram: "9w3"
   *               paginated:
   *                 summary: Paginated profiles
   *                 value:
   *                   profiles:
   *                     - id: 1
   *                       name: "A Martinez"
   *                       mbti: "ISFJ"
   *                   pagination:
   *                     page: 1
   *                     limit: 10
   *                     totalCount: 25
   *                     totalPages: 3
   *                     hasNextPage: true
   *                     hasPrevPage: false
   *       400:
   *         description: Validation error
   *       500:
   *         description: Internal server error
   */
  router.get("/", (req, res, next) => {
    profileController.getAllProfiles(req, res, next);
  });

  /**
   * @swagger
   * /api/profile/stats:
   *   get:
   *     summary: Get profile statistics
   *     tags: [Profile Statistics]
   *     description: |
   *       Retrieve comprehensive statistics about all profiles.
   *
   *       **Includes:**
   *       - Total profile count
   *       - MBTI type distribution
   *       - Last update timestamp
   *
   *       **Use Cases:**
   *       - Dashboard analytics
   *       - Data insights
   *       - Reporting
   *     responses:
   *       200:
   *         description: Statistics retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ProfileStats'
   *             example:
   *               totalProfiles: 15
   *               mbtiDistribution:
   *                 ISFJ: 3
   *                 ENFP: 4
   *                 INTJ: 2
   *                 ESFP: 3
   *                 INFP: 2
   *                 ESTJ: 1
   *               lastUpdated: "2025-11-05T10:30:00.000Z"
   *       500:
   *         description: Internal server error
   */
  router.get("/stats", (req, res, next) => {
    profileController.getProfileStats(req, res, next);
  });

  /**
   * @swagger
   * /api/profile/{id}:
   *   get:
   *     summary: Get profile by ID
   *     tags: [Profiles]
   *     description: |
   *       Retrieve a specific profile by its ID.
   *
   *       **Validation:**
   *       - ID must be a valid integer between 1-99999
   *       - Returns detailed error if profile not found
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 99999
   *         description: Profile ID
   *     responses:
   *       200:
   *         description: Profile retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Profile'
   *       400:
   *         description: Invalid profile ID
   *       404:
   *         description: Profile not found
   *       500:
   *         description: Internal server error
   */
  router.get("/:id", (req, res, next) => {
    profileController.getProfileById(req, res, next);
  });

  /**
   * @swagger
   * /api/profile:
   *   post:
   *     summary: Create a new profile
   *     tags: [Profiles]
   *     description: |
   *       Create a new personality profile with comprehensive validation.
   *
   *       **Validation Rules:**
   *       - All fields are required
   *       - profileId must be unique and between 1-99999
   *       - name must be 2-100 characters
   *       - description must be 10-1000 characters
   *       - mbti must match format: [IE][SN][TF][JP]
   *       - tritype must be 100-999
   *       - sloan must be 5 characters: [RCUAI]
   *       - psyche must be 4 characters: [FLVE]
   *       - image must be a valid image URL
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/ProfileCreate'
   *           example:
   *             profileId: 2
   *             name: "Jane Smith"
   *             description: "A creative and analytical personality with strong leadership skills."
   *             mbti: "INTJ"
   *             enneagram: "5w4"
   *             variant: "sx/sp"
   *             tritype: 548
   *             socionics: "ILI"
   *             sloan: "RCOEI"
   *             psyche: "LVEF"
   *             image: "https://soulverse.boo.world/images/2.png"
   *     responses:
   *       201:
   *         description: Profile created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 profile:
   *                   $ref: '#/components/schemas/Profile'
   *       400:
   *         description: Validation error
   *       409:
   *         description: Duplicate profile error
   *       500:
   *         description: Internal server error
   */
  router.post("/", (req, res, next) => {
    profileController.createProfile(req, res, next);
  });

  /**
   * @swagger
   * /api/profile/{id}:
   *   put:
   *     summary: Update profile by ID
   *     tags: [Profiles]
   *     description: |
   *       Update an existing profile with partial data.
   *
   *       **Features:**
   *       - All fields are optional for updates
   *       - Same validation rules as creation (when field is provided)
   *       - Data transformation is applied
   *       - Returns updated profile data
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 99999
   *         description: Profile ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/ProfileUpdate'
   *           examples:
   *             partial_update:
   *               summary: Partial profile update
   *               value:
   *                 name: "Updated Name"
   *                 description: "Updated description with new information."
   *                 mbti: "ENFP"
   *             single_field:
   *               summary: Single field update
   *               value:
   *                 enneagram: "7w8"
   *     responses:
   *       200:
   *         description: Profile updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 profile:
   *                   $ref: '#/components/schemas/Profile'
   *       400:
   *         description: Validation error
   *       404:
   *         description: Profile not found
   *       500:
   *         description: Internal server error
   */
  router.put("/:id", (req, res, next) => {
    profileController.updateProfile(req, res, next);
  });

  /**
   * @swagger
   * /api/profile/{id}:
   *   delete:
   *     summary: Delete profile by ID
   *     tags: [Profiles]
   *     description: |
   *       Permanently delete a profile by its ID.
   *
   *       **Warning:** This operation cannot be undone.
   *       **Returns:** The deleted profile data for confirmation.
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 99999
   *         description: Profile ID
   *     responses:
   *       200:
   *         description: Profile deleted successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 profile:
   *                   $ref: '#/components/schemas/Profile'
   *       400:
   *         description: Invalid profile ID
   *       404:
   *         description: Profile not found
   *       500:
   *         description: Internal server error
   */
  router.delete("/:id", (req, res, next) => {
    profileController.deleteProfile(req, res, next);
  });

  return router;
};
