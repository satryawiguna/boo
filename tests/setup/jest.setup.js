/**
 * Jest Setup File
 * Global configuration and utilities for all tests
 */

// Global test configuration
global.console = {
  ...console,
  // Suppress console.error and console.warn in tests unless needed
  error: process.env.NODE_ENV === "test" ? jest.fn() : console.error,
  warn: process.env.NODE_ENV === "test" ? jest.fn() : console.warn,
  log: console.log,
  info: console.info,
  debug: console.debug,
};

// Set test environment
process.env.NODE_ENV = "test";

// Mock external dependencies that shouldn't be called in unit tests
jest.mock("mongoose", () => {
  const mockSchema = jest.fn().mockImplementation(() => ({
    index: jest.fn(),
    pre: jest.fn(),
    post: jest.fn(),
    methods: {},
    statics: {},
    virtual: jest.fn().mockReturnThis(),
    plugin: jest.fn(),
    set: jest.fn(),
  }));

  // Add Schema.Types mock
  mockSchema.Types = {
    ObjectId: "ObjectId",
    String: String,
    Number: Number,
    Date: Date,
    Boolean: Boolean,
    Mixed: "Mixed",
    Array: Array,
  };

  return {
    connect: jest.fn().mockResolvedValue({}),
    connection: {
      close: jest.fn().mockResolvedValue({}),
      on: jest.fn(),
      once: jest.fn(),
      readyState: 1,
    },
    model: jest.fn().mockReturnValue({
      find: jest.fn(),
      findOne: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      updateOne: jest.fn(),
      deleteOne: jest.fn(),
      countDocuments: jest.fn(),
      aggregate: jest.fn(),
    }),
    Schema: mockSchema,
  };
});

// Global test utilities
global.createMockRequest = (overrides = {}) => ({
  params: {},
  query: {},
  body: {},
  headers: {},
  connection: { remoteAddress: "127.0.0.1" },
  ...overrides,
});

global.createMockResponse = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    render: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  };
  return res;
};

global.createMockNext = () => jest.fn();

// Timeout for async operations
jest.setTimeout(10000);
