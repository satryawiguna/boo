const mockFactories = {
  comment: (overrides = {}) => ({
    _id: "507f1f77bcf86cd799439011",
    profileId: 1,
    text: "This is a test comment",
    categories: ["personality", "psychology"],
    personalityInsights: {
      mbti: ["INTJ", "ENTJ"],
      bigFive: ["openness"],
      enneagram: ["Type 5"],
    },
    metadata: {
      wordCount: 5,
      sentiment: "neutral",
      topics: ["personality"],
    },
    createdAt: new Date("2023-01-01T00:00:00.000Z"),
    updatedAt: new Date("2023-01-01T00:00:00.000Z"),
    ...overrides,
  }),

  // Profile mock data
  profile: (overrides = {}) => ({
    _id: "507f1f77bcf86cd799439012",
    id: 1,
    name: "Test Profile",
    bio: "This is a test profile bio",
    personalityTraits: {
      mbti: "INTJ",
      bigFive: {
        openness: 0.8,
        conscientiousness: 0.7,
        extraversion: 0.3,
        agreeableness: 0.6,
        neuroticism: 0.4,
      },
      enneagram: "Type 5",
    },
    socialLinks: {
      twitter: "@testuser",
      linkedin: "testuser",
    },
    isActive: true,
    createdAt: new Date("2023-01-01T00:00:00.000Z"),
    updatedAt: new Date("2023-01-01T00:00:00.000Z"),
    ...overrides,
  }),

  // Vote mock data
  vote: (overrides = {}) => ({
    _id: "507f1f77bcf86cd799439013",
    commentId: "507f1f77bcf86cd799439011",
    profileId: 1,
    personalitySystem: "mbti",
    personalityValue: "INTJ",
    voterIdentifier: "test_voter_123",
    createdAt: new Date("2023-01-01T00:00:00.000Z"),
    updatedAt: new Date("2023-01-01T00:00:00.000Z"),
    ...overrides,
  }),

  validationError: (message = "Validation failed", details = {}) => {
    const error = new Error(message);
    error.name = "ValidationError";
    error.details = details;
    return error;
  },

  notFoundError: (message = "Resource not found") => {
    const error = new Error(message);
    error.name = "NotFoundError";
    return error;
  },

  duplicateError: (message = "Duplicate resource", field = "id") => {
    const error = new Error(message);
    error.name = "DuplicateError";
    error.field = field;
    return error;
  },

  duplicateVoteError: (message = "Vote already exists") => {
    const error = new Error(message);
    error.name = "DuplicateVoteError";
    return error;
  },
};

const createMockService = (serviceName, methods = []) => {
  const mockService = {};

  const defaultMethods = {
    CommentService: [
      "createComment",
      "getCommentById",
      "getCommentsByProfileId",
      "getAllComments",
      "updateComment",
      "deleteComment",
      "getCommentStats",
      "getCommentCount",
      "updateCommentVoteStats",
      "commentExists",
    ],
    ProfileService: [
      "getAllProfiles",
      "getProfileById",
      "createProfile",
      "updateProfile",
      "deleteProfile",
      "getProfileStats",
    ],
    VoteService: [
      "submitVote",
      "removeVote",
      "getUserVote",
      "getCommentVotes",
      "getCommentVoteStats",
      "getVoteHistory",
      "getTopVotedComments",
      "getPersonalitySystemStats",
      "getVoteCount",
      "getValidPersonalityValues",
    ],
  };

  const methodsToMock =
    methods.length > 0 ? methods : defaultMethods[serviceName] || [];

  methodsToMock.forEach((method) => {
    mockService[method] = jest.fn();
  });

  return mockService;
};

const createMockRepository = (repositoryName, methods = []) => {
  const mockRepository = {};

  const defaultMethods = {
    CommentRepository: [
      "create",
      "findById",
      "findByProfileId",
      "findAll",
      "updateById",
      "deleteById",
      "exists",
      "updateVoteStats",
      "getCommentStats",
      "getCount",
    ],
    ProfileRepository: [
      "findByProfileId",
      "findFirst",
      "findWithPagination",
      "findAll",
      "create",
      "updateByProfileId",
      "deleteByProfileId",
      "existsByProfileId",
      "getCount",
    ],
    VoteRepository: [
      "create",
      "findUserVote",
      "updateUserVote",
      "deleteUserVote",
      "findByCommentId",
      "getVoteStatsByComment",
      "getVoteHistory",
      "getTopVotedComments",
      "getPersonalitySystemStats",
      "getCount",
    ],
  };

  const methodsToMock =
    methods.length > 0 ? methods : defaultMethods[repositoryName] || [];

  methodsToMock.forEach((method) => {
    mockRepository[method] = jest.fn();
  });

  return mockRepository;
};

const createMockModel = (overrides = {}) => ({
  toPublicJSON: jest.fn().mockReturnValue({
    _id: "507f1f77bcf86cd799439011",
    ...overrides,
  }),
  save: jest.fn().mockResolvedValue(this),
  ...overrides,
});

const createMockMongooseModel = (modelName, staticMethods = []) => {
  const mockModel = jest.fn().mockImplementation(function (data = {}) {
    const instance = {
      ...data,
      _id: data._id || "507f1f77bcf86cd799439011",
      save: jest.fn().mockResolvedValue({
        ...data,
        _id: data._id || "507f1f77bcf86cd799439011",
      }),
      toObject: jest.fn().mockReturnValue({
        ...data,
        _id: data._id || "507f1f77bcf86cd799439011",
      }),
      toJSON: jest.fn().mockReturnValue({
        ...data,
        _id: data._id || "507f1f77bcf86cd799439011",
      }),
      incrementVoteCount: jest.fn(),
      decrementVoteCount: jest.fn(),
    };

    return instance;
  });

  const defaultMethods = {
    Comment: [
      "findById",
      "find",
      "findOne",
      "findByIdAndUpdate",
      "findByIdAndDelete",
      "findOneAndUpdate",
      "findOneAndDelete",
      "countDocuments",
      "aggregate",
      "populate",
      "sort",
      "skip",
      "limit",
      "lean",
      "select",
      "exec",
    ],
    Profile: [
      "findByProfileId",
      "findById",
      "find",
      "findOne",
      "findByIdAndUpdate",
      "findOneAndUpdate",
      "findOneAndDelete",
      "countDocuments",
      "sort",
      "skip",
      "limit",
      "exec",
    ],
    Vote: [
      "findById",
      "find",
      "findOne",
      "findByIdAndUpdate",
      "findOneAndUpdate",
      "findOneAndDelete",
      "countDocuments",
      "aggregate",
      "findUserVote",
      "findByCommentId",
      "getVoteStatsByComment",
      "populate",
      "sort",
      "skip",
      "limit",
      "lean",
      "exec",
    ],
  };

  const methodsToMock =
    staticMethods.length > 0 ? staticMethods : defaultMethods[modelName] || [];

  methodsToMock.forEach((method) => {
    if (method === "find" || method === "findOne") {
      mockModel[method] = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
        then: jest.fn().mockResolvedValue([]),
      });
    } else {
      mockModel[method] = jest.fn();
    }
  });

  return mockModel;
};

const testHelpers = {
  createMockReq: (overrides = {}) => ({
    params: {},
    query: {},
    body: {},
    headers: {
      "user-agent": "test-agent",
      "x-forwarded-for": "192.168.1.1",
    },
    connection: {
      remoteAddress: "127.0.0.1",
    },
    ...overrides,
  }),

  createMockRes: () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.render = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res;
  },

  createMockNext: () => jest.fn(),

  expectValidationError: (res, expectedMessage = null) => {
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Validation Error",
        message: expectedMessage || expect.any(String),
      })
    );
  },

  expectNotFoundError: (res, expectedMessage = null) => {
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.stringContaining("not found"),
        message: expectedMessage || expect.any(String),
      })
    );
  },

  expectSuccessResponse: (res, statusCode = 200) => {
    if (statusCode === 200) {
      expect(res.json).toHaveBeenCalled();
      if (res.status.mock.calls.length > 0) {
        expect(res.status).not.toHaveBeenCalledWith(
          expect.not.objectContaining([200])
        );
      }
    } else {
      expect(res.status).toHaveBeenCalledWith(statusCode);
      expect(res.json).toHaveBeenCalled();
    }
  },

  expectCreatedResponse: (res) => {
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalled();
  },
};

module.exports = {
  mockFactories,
  createMockService,
  createMockRepository,
  createMockModel,
  createMockMongooseModel,
  testHelpers,
};
