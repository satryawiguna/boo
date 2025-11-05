"use strict";

const swaggerJSDoc = require("swagger-jsdoc");

/**
 * Swagger/OpenAPI Configuration
 * Provides comprehensive API documentation with best practices
 */

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Boo Profile API",
    version: "1.0.0",
    description: `
# Boo Profile Management API

A comprehensive RESTful API for managing personality profiles with MongoDB integration.

## Features

- **CRUD Operations**: Complete profile management
- **Data Validation**: Robust validation using Yup schemas
- **Error Handling**: Comprehensive error responses
- **Pagination**: Efficient data pagination
- **Statistics**: Profile analytics and insights

## Architecture

- **Service & Repository Pattern**: Clean architecture implementation
- **MongoDB Integration**: Persistent data storage with Mongoose
- **Yup Validation**: Schema-based data validation
- **Express.js**: RESTful API framework

## Authentication

Currently, this API does not require authentication. In production, consider implementing:
- JWT tokens
- API keys
- OAuth 2.0

## Rate Limiting

No rate limiting is currently implemented. Consider adding rate limiting for production use.
    `,
    contact: {
      name: "API Support",
      email: "support@example.com",
      url: "https://example.com/support",
    },
    license: {
      name: "ISC",
      url: "https://opensource.org/licenses/ISC",
    },
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Development server",
    },
    {
      url: "https://api.example.com",
      description: "Production server",
    },
  ],
  tags: [
    {
      name: "Profiles",
      description: "Profile management endpoints",
    },
    {
      name: "Statistics",
      description: "Analytics and statistics endpoints",
    },
  ],
  components: {
    schemas: {
      Profile: {
        type: "object",
        required: [
          "profileId",
          "name",
          "description",
          "mbti",
          "enneagram",
          "variant",
          "tritype",
          "socionics",
          "sloan",
          "psyche",
          "image",
        ],
        properties: {
          id: {
            type: "integer",
            description: "Unique profile identifier",
            example: 1,
            readOnly: true,
          },
          profileId: {
            type: "integer",
            description: "Profile ID (used for creation)",
            minimum: 1,
            maximum: 99999,
            example: 1,
          },
          name: {
            type: "string",
            description: "Profile name",
            minLength: 2,
            maxLength: 100,
            example: "A Martinez",
          },
          description: {
            type: "string",
            description: "Profile description",
            minLength: 10,
            maxLength: 1000,
            example: "Adolph Larrue Martinez III.",
          },
          mbti: {
            type: "string",
            description: "Myers-Briggs Type Indicator",
            pattern: "^[IE][SN][TF][JP]$",
            example: "ISFJ",
          },
          enneagram: {
            type: "string",
            description: "Enneagram type",
            minLength: 2,
            maxLength: 10,
            example: "9w3",
          },
          variant: {
            type: "string",
            description: "Instinctual variant",
            minLength: 2,
            maxLength: 20,
            example: "sp/so",
          },
          tritype: {
            type: "integer",
            description: "Tritype number",
            minimum: 100,
            maximum: 999,
            example: 725,
          },
          socionics: {
            type: "string",
            description: "Socionics type",
            minLength: 2,
            maxLength: 10,
            example: "SEE",
          },
          sloan: {
            type: "string",
            description: "SLOAN type (5 characters: R/C, C/U, O/A, E/I, N/A)",
            pattern: "^[RCUAI]{5}$",
            example: "RCOEN",
          },
          psyche: {
            type: "string",
            description: "Psyche type (4 characters: F/L, V/E combinations)",
            pattern: "^[FLVE]{4}$",
            example: "FEVL",
          },
          image: {
            type: "string",
            format: "uri",
            description: "Profile image URL",
            example: "https://soulverse.boo.world/images/1.png",
          },
          createdAt: {
            type: "string",
            format: "date-time",
            description: "Profile creation timestamp",
            readOnly: true,
          },
          updatedAt: {
            type: "string",
            format: "date-time",
            description: "Profile last update timestamp",
            readOnly: true,
          },
        },
        example: {
          id: 1,
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
        },
      },
      ProfileInput: {
        type: "object",
        required: [
          "profileId",
          "name",
          "description",
          "mbti",
          "enneagram",
          "variant",
          "tritype",
          "socionics",
          "sloan",
          "psyche",
          "image",
        ],
        properties: {
          profileId: {
            type: "integer",
            description: "Unique profile identifier",
            minimum: 1,
            maximum: 99999,
            example: 2,
          },
          name: {
            type: "string",
            description: "Profile name",
            minLength: 2,
            maxLength: 100,
            example: "Jane Smith",
          },
          description: {
            type: "string",
            description: "Profile description",
            minLength: 10,
            maxLength: 1000,
            example: "A creative and analytical personality.",
          },
          mbti: {
            type: "string",
            description:
              "Myers-Briggs Type Indicator (case insensitive, will be converted to uppercase)",
            pattern: "^[IE][SN][TF][JP]$",
            example: "intj",
          },
          enneagram: {
            type: "string",
            description: "Enneagram type",
            minLength: 2,
            maxLength: 10,
            example: "5w4",
          },
          variant: {
            type: "string",
            description: "Instinctual variant",
            minLength: 2,
            maxLength: 20,
            example: "sx/sp",
          },
          tritype: {
            type: "integer",
            description: "Tritype number",
            minimum: 100,
            maximum: 999,
            example: 548,
          },
          socionics: {
            type: "string",
            description:
              "Socionics type (case insensitive, will be converted to uppercase)",
            minLength: 2,
            maxLength: 10,
            example: "ili",
          },
          sloan: {
            type: "string",
            description:
              "SLOAN type (case insensitive, will be converted to uppercase)",
            pattern: "^[RCUAI]{5}$",
            example: "rcoei",
          },
          psyche: {
            type: "string",
            description:
              "Psyche type (case insensitive, will be converted to uppercase)",
            pattern: "^[FLVE]{4}$",
            example: "lvef",
          },
          image: {
            type: "string",
            format: "uri",
            description: "Profile image URL (must be a valid image URL)",
            example: "https://soulverse.boo.world/images/2.png",
          },
        },
      },
      ProfileUpdate: {
        type: "object",
        description: "Profile update data (all fields optional)",
        properties: {
          name: {
            type: "string",
            description: "Profile name",
            minLength: 2,
            maxLength: 100,
            example: "Updated Name",
          },
          description: {
            type: "string",
            description: "Profile description",
            minLength: 10,
            maxLength: 1000,
            example: "An updated creative and analytical personality.",
          },
          mbti: {
            type: "string",
            description: "Myers-Briggs Type Indicator",
            pattern: "^[IE][SN][TF][JP]$",
            example: "ENFP",
          },
          enneagram: {
            type: "string",
            description: "Enneagram type",
            minLength: 2,
            maxLength: 10,
            example: "5w6",
          },
          variant: {
            type: "string",
            description: "Instinctual variant",
            minLength: 2,
            maxLength: 20,
            example: "so/sp",
          },
          tritype: {
            type: "integer",
            description: "Tritype number",
            minimum: 100,
            maximum: 999,
            example: 549,
          },
          socionics: {
            type: "string",
            description: "Socionics type",
            minLength: 2,
            maxLength: 10,
            example: "ILI",
          },
          sloan: {
            type: "string",
            description: "SLOAN type",
            pattern: "^[RCUAI]{5}$",
            example: "RCOAI",
          },
          psyche: {
            type: "string",
            description: "Psyche type",
            pattern: "^[FLVE]{4}$",
            example: "LVFE",
          },
          image: {
            type: "string",
            format: "uri",
            description: "Profile image URL",
            example: "https://soulverse.boo.world/images/updated.png",
          },
        },
      },
      ProfileStats: {
        type: "object",
        properties: {
          totalProfiles: {
            type: "integer",
            description: "Total number of profiles",
            example: 10,
          },
          mbtiDistribution: {
            type: "object",
            description: "MBTI type distribution",
            additionalProperties: {
              type: "integer",
            },
            example: {
              ISFJ: 3,
              ENFP: 2,
              INTJ: 1,
              ESFP: 4,
            },
          },
          lastUpdated: {
            type: "string",
            format: "date-time",
            description: "Last statistics update timestamp",
            example: "2025-11-05T10:30:00.000Z",
          },
        },
      },
      PaginatedProfiles: {
        type: "object",
        properties: {
          profiles: {
            type: "array",
            items: {
              $ref: "#/components/schemas/Profile",
            },
          },
          pagination: {
            type: "object",
            properties: {
              currentPage: {
                type: "integer",
                example: 1,
              },
              totalPages: {
                type: "integer",
                example: 5,
              },
              totalItems: {
                type: "integer",
                example: 50,
              },
              itemsPerPage: {
                type: "integer",
                example: 10,
              },
              hasNext: {
                type: "boolean",
                example: true,
              },
              hasPrev: {
                type: "boolean",
                example: false,
              },
            },
          },
        },
      },
      Error: {
        type: "object",
        properties: {
          error: {
            type: "string",
            description: "Error type",
            example: "Validation Error",
          },
          message: {
            type: "string",
            description: "Error message",
            example: "Validation failed",
          },
          details: {
            type: "object",
            description: "Detailed error information",
            additionalProperties: {
              type: "string",
            },
            example: {
              name: "Name must be at least 2 characters",
              mbti: "MBTI must be a valid 4-letter type",
            },
          },
        },
      },
      Success: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: true,
          },
          message: {
            type: "string",
            example: "Operation completed successfully",
          },
          profile: {
            $ref: "#/components/schemas/Profile",
          },
        },
      },
    },
    parameters: {
      ProfileId: {
        name: "id",
        in: "path",
        required: true,
        description: "Profile ID",
        schema: {
          type: "integer",
          minimum: 1,
          maximum: 99999,
        },
        example: 1,
      },
      Page: {
        name: "page",
        in: "query",
        required: false,
        description: "Page number for pagination",
        schema: {
          type: "integer",
          minimum: 1,
          default: 1,
        },
        example: 1,
      },
      Limit: {
        name: "limit",
        in: "query",
        required: false,
        description: "Number of items per page",
        schema: {
          type: "integer",
          minimum: 1,
          maximum: 100,
          default: 10,
        },
        example: 10,
      },
    },
    responses: {
      ValidationError: {
        description: "Validation error",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/Error",
            },
            example: {
              error: "Validation Error",
              message: "Validation failed",
              details: {
                name: "Name must be at least 2 characters",
                mbti: "MBTI must be a valid 4-letter type (e.g., ISFJ)",
                tritype: "Tritype must be a 3-digit number (100-999)",
              },
            },
          },
        },
      },
      NotFound: {
        description: "Resource not found",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                error: {
                  type: "string",
                  example: "Profile not found",
                },
                message: {
                  type: "string",
                  example: "Profile with ID 999 does not exist",
                },
              },
            },
          },
        },
      },
      DuplicateError: {
        description: "Duplicate resource",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                error: {
                  type: "string",
                  example: "Duplicate Profile",
                },
                message: {
                  type: "string",
                  example: "Profile with ID 123 already exists",
                },
                field: {
                  type: "string",
                  example: "profileId",
                },
              },
            },
          },
        },
      },
      InternalServerError: {
        description: "Internal server error",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                error: {
                  type: "string",
                  example: "Internal Server Error",
                },
                message: {
                  type: "string",
                  example: "Something went wrong",
                },
              },
            },
          },
        },
      },
    },
  },
};

const options = {
  definition: swaggerDefinition,
  apis: [
    "./routes/*.js",
    "./controllers/*.js",
    "./models/*.js",
    "./docs/swagger-paths.js",
  ],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
