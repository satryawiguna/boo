/**
 * @swagger
 * paths:
 *   /api/profiles:
 *     get:
 *       tags:
 *         - Profiles
 *       summary: Get all profiles
 *       description: |
 *         Retrieve all profiles with optional pagination.
 *
 *         **Features:**
 *         - Pagination support with page and limit parameters
 *         - Returns metadata about pagination
 *         - Efficient querying with MongoDB
 *
 *         **Examples:**
 *         - `GET /api/profiles` - Get all profiles
 *         - `GET /api/profiles?page=2&limit=5` - Get page 2 with 5 profiles per page
 *       parameters:
 *         - $ref: '#/components/parameters/Page'
 *         - $ref: '#/components/parameters/Limit'
 *       responses:
 *         200:
 *           description: Profiles retrieved successfully
 *           content:
 *             application/json:
 *               schema:
 *                 oneOf:
 *                   - type: object
 *                     description: All profiles (no pagination)
 *                     properties:
 *                       profiles:
 *                         type: array
 *                         items:
 *                           $ref: '#/components/schemas/Profile'
 *                   - $ref: '#/components/schemas/PaginatedProfiles'
 *               examples:
 *                 all_profiles:
 *                   summary: All profiles
 *                   value:
 *                     profiles:
 *                       - id: 1
 *                         name: "A Martinez"
 *                         mbti: "ISFJ"
 *                         enneagram: "9w3"
 *                 paginated:
 *                   summary: Paginated profiles
 *                   value:
 *                     profiles:
 *                       - id: 1
 *                         name: "A Martinez"
 *                         mbti: "ISFJ"
 *                     pagination:
 *                       currentPage: 1
 *                       totalPages: 3
 *                       totalItems: 25
 *                       itemsPerPage: 10
 *                       hasNext: true
 *                       hasPrev: false
 *         400:
 *           $ref: '#/components/responses/ValidationError'
 *         500:
 *           $ref: '#/components/responses/InternalServerError'
 *
 *     post:
 *       tags:
 *         - Profiles
 *       summary: Create a new profile
 *       description: |
 *         Create a new personality profile with comprehensive validation.
 *
 *         **Validation Rules:**
 *         - All fields are required
 *         - profileId must be unique and between 1-99999
 *         - name must be 2-100 characters
 *         - description must be 10-1000 characters
 *         - mbti must match format: [IE][SN][TF][JP]
 *         - tritype must be 100-999
 *         - sloan must be 5 characters: [RCUAI]
 *         - psyche must be 4 characters: [FLVE]
 *         - image must be a valid image URL
 *
 *         **Data Transformation:**
 *         - Text fields are automatically trimmed
 *         - MBTI, Socionics, SLOAN, Psyche are converted to uppercase
 *         - Numbers are parsed and validated
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProfileInput'
 *             examples:
 *               complete_profile:
 *                 summary: Complete valid profile
 *                 value:
 *                   profileId: 2
 *                   name: "Jane Smith"
 *                   description: "A creative and analytical personality with strong leadership skills."
 *                   mbti: "intj"
 *                   enneagram: "5w4"
 *                   variant: "sx/sp"
 *                   tritype: 548
 *                   socionics: "ili"
 *                   sloan: "rcoei"
 *                   psyche: "lvef"
 *                   image: "https://soulverse.boo.world/images/2.png"
 *       responses:
 *         201:
 *           description: Profile created successfully
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/Success'
 *               example:
 *                 success: true
 *                 message: "Profile created successfully"
 *                 profile:
 *                   id: 2
 *                   name: "Jane Smith"
 *                   description: "A creative and analytical personality with strong leadership skills."
 *                   mbti: "INTJ"
 *                   enneagram: "5w4"
 *                   variant: "sx/sp"
 *                   tritype: 548
 *                   socionics: "ILI"
 *                   sloan: "RCOEI"
 *                   psyche: "LVEF"
 *                   image: "https://soulverse.boo.world/images/2.png"
 *         400:
 *           $ref: '#/components/responses/ValidationError'
 *         409:
 *           $ref: '#/components/responses/DuplicateError'
 *         500:
 *           $ref: '#/components/responses/InternalServerError'
 *
 *   /api/profiles/{id}:
 *     get:
 *       tags:
 *         - Profiles
 *       summary: Get profile by ID
 *       description: |
 *         Retrieve a specific profile by its ID.
 *
 *         **Validation:**
 *         - ID must be a valid integer between 1-99999
 *         - Returns detailed error if profile not found
 *       parameters:
 *         - $ref: '#/components/parameters/ProfileId'
 *       responses:
 *         200:
 *           description: Profile retrieved successfully
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/Profile'
 *         400:
 *           description: Invalid profile ID
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/Error'
 *               example:
 *                 error: "Validation Error"
 *                 message: "Invalid profile ID"
 *                 details:
 *                   id: "Profile ID must be greater than 0"
 *         404:
 *           $ref: '#/components/responses/NotFound'
 *         500:
 *           $ref: '#/components/responses/InternalServerError'
 *
 *     put:
 *       tags:
 *         - Profiles
 *       summary: Update profile by ID
 *       description: |
 *         Update an existing profile with partial data.
 *
 *         **Features:**
 *         - All fields are optional for updates
 *         - Same validation rules as creation (when field is provided)
 *         - Data transformation is applied
 *         - Returns updated profile data
 *       parameters:
 *         - $ref: '#/components/parameters/ProfileId'
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProfileUpdate'
 *             examples:
 *               partial_update:
 *                 summary: Partial profile update
 *                 value:
 *                   name: "Updated Name"
 *                   description: "Updated description with new information."
 *                   mbti: "enfp"
 *               single_field:
 *                 summary: Single field update
 *                 value:
 *                   enneagram: "7w8"
 *       responses:
 *         200:
 *           description: Profile updated successfully
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/Success'
 *         400:
 *           $ref: '#/components/responses/ValidationError'
 *         404:
 *           $ref: '#/components/responses/NotFound'
 *         500:
 *           $ref: '#/components/responses/InternalServerError'
 *
 *     delete:
 *       tags:
 *         - Profiles
 *       summary: Delete profile by ID
 *       description: |
 *         Permanently delete a profile by its ID.
 *
 *         **Warning:** This operation cannot be undone.
 *         **Returns:** The deleted profile data for confirmation.
 *       parameters:
 *         - $ref: '#/components/parameters/ProfileId'
 *       responses:
 *         200:
 *           description: Profile deleted successfully
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/Success'
 *               example:
 *                 success: true
 *                 message: "Profile deleted successfully"
 *                 profile:
 *                   id: 2
 *                   name: "Jane Smith"
 *                   mbti: "INTJ"
 *         400:
 *           description: Invalid profile ID
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/Error'
 *         404:
 *           $ref: '#/components/responses/NotFound'
 *         500:
 *           $ref: '#/components/responses/InternalServerError'
 *
 *   /api/stats:
 *     get:
 *       tags:
 *         - Statistics
 *       summary: Get profile statistics
 *       description: |
 *         Retrieve comprehensive statistics about all profiles.
 *
 *         **Includes:**
 *         - Total profile count
 *         - MBTI type distribution
 *         - Last update timestamp
 *
 *         **Use Cases:**
 *         - Dashboard analytics
 *         - Data insights
 *         - Reporting
 *       responses:
 *         200:
 *           description: Statistics retrieved successfully
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ProfileStats'
 *               example:
 *                 totalProfiles: 15
 *                 mbtiDistribution:
 *                   ISFJ: 3
 *                   ENFP: 4
 *                   INTJ: 2
 *                   ESFP: 3
 *                   INFP: 2
 *                   ESTJ: 1
 *                 lastUpdated: "2025-11-05T10:30:00.000Z"
 *         500:
 *           $ref: '#/components/responses/InternalServerError'
 */
