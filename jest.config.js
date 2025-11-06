module.exports = {
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.js", "**/tests/**/*.spec.js"],
  projects: [
    {
      displayName: "unit",
      testMatch: ["**/tests/unit/**/*.test.js", "**/tests/unit/**/*.spec.js"],
      setupFilesAfterEnv: ["<rootDir>/tests/setup/jest.unit.setup.js"],
      coveragePathIgnorePatterns: ["/node_modules/", "/tests/"],
      collectCoverageFrom: [
        "controllers/**/*.js",
        "services/**/*.js",
        "repositories/**/*.js",
        "models/**/*.js",
        "validators/**/*.js",
        "!**/node_modules/**",
        "!**/tests/**",
      ],
      coverageDirectory: "coverage",
      coverageReporters: ["text", "lcov", "html", "json-summary"],
      coverageThreshold: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
      testTimeout: 30000,
    },
    {
      displayName: "integration",
      testMatch: [
        "**/tests/integration/**/*.test.js",
        "**/tests/integration/**/*.spec.js",
      ],
      setupFilesAfterEnv: ["<rootDir>/tests/setup/jest.integration.setup.js"],
      testTimeout: 45000,
      detectOpenHandles: true,
    },
  ],
  moduleDirectories: ["node_modules", "<rootDir>"],
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  verbose: true,
  transformIgnorePatterns: ["node_modules/(?!(supertest)/)"],
};
