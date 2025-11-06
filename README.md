# Boo - Personality Comment & Voting System

A Node.js REST API application for managing personality-based comments and voting system with support for MBTI, Enneagram, and Zodiac personality types.

## 🚀 Features

- **Profile Management**: Create and manage user profiles
- **Comment System**: CRUD operations for personality-based comments
- **Voting System**: Multi-personality system voting (MBTI, Enneagram, Zodiac)
- **Statistics & Analytics**: Vote statistics and top comments
- **RESTful API**: Well-structured REST endpoints
- **Comprehensive Testing**: Unit and integration test coverage
- **API Documentation**: Interactive Swagger/OpenAPI documentation

## 📋 Table of Contents

- [Installation](#installation)
- [Getting Started](#getting-started)
- [API Documentation (Swagger)](#api-documentation-swagger)
- [Testing](#testing)
  - [Unit Tests](#unit-tests)
  - [Integration Tests](#integration-tests)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Environment Configuration](#environment-configuration)
- [Contributing](#contributing)

## 🛠 Installation

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd boo
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Setup Database**

   Choose one of the following options:

   **Option A: Local MongoDB with Docker**

   ```bash
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

   **Option B: Local MongoDB Installation**

   ```bash
   # Start your local MongoDB instance
   mongod
   ```

   **Option C: MongoDB Atlas (Cloud)**

   1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
   2. Create a new cluster
   3. Get your connection string from the cluster dashboard
   4. Update your `.env` file with the Atlas connection string:
      ```
      MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/boo?retryWrites=true&w=majority
      ```

5. **Start the application**

   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

## 🚀 Getting Started

Once the application is running, you can:

1. **Access the API**: `http://localhost:3000`
2. **View API Documentation**: `http://localhost:3000/api-docs`
3. **Health Check**: `http://localhost:3000/health`

## 📚 API Documentation (Swagger)

### Accessing Swagger UI

The project includes comprehensive Swagger/OpenAPI documentation accessible at:

```
http://localhost:3000/api-docs
```

### Swagger Features

- **Interactive API Explorer**: Test endpoints directly from the browser
- **Request/Response Schemas**: Detailed data models and examples
- **Authentication**: Bearer token authentication documentation
- **Error Responses**: Comprehensive error handling documentation

### Using Swagger UI

1. **Open Swagger UI** in your browser at `http://localhost:3000/api-docs`

2. **Explore Endpoints**: Browse through different API sections:

   - **Profiles**: User profile management
   - **Comments**: Comment CRUD operations
   - **Votes**: Voting system endpoints
   - **Statistics**: Analytics and reporting

3. **Test Endpoints**:

   - Click on any endpoint to expand details
   - Click "Try it out" button
   - Fill in required parameters
   - Click "Execute" to make the request

4. **Authentication** (if required):
   - Click the "Authorize" button at the top
   - Enter your Bearer token
   - All subsequent requests will include authentication

### API Documentation Structure

```
/api-docs
├── Profiles
│   ├── POST /api/profile - Create profile
│   ├── GET /api/profile/:id - Get profile
│   └── GET /api/profiles/:profileId/comments - Get profile comments
├── Comments
│   ├── POST /api/comments - Create comment
│   ├── GET /api/comments - List comments
│   ├── GET /api/comments/:id - Get comment
│   ├── PUT /api/comments/:id - Update comment
│   └── DELETE /api/comments/:id - Delete comment
├── Votes
│   ├── POST /api/comments/:commentId/vote - Submit vote
│   ├── GET /api/comments/:commentId/votes - Get comment votes
│   ├── GET /api/votes/top-comments - Get top voted comments
│   └── GET /api/votes/stats - Get vote statistics
└── Health
    └── GET /health - Health check
```

## 🧪 Testing

The project includes comprehensive testing with Jest, covering both unit and integration tests.

### Running All Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Unit Tests

Unit tests focus on testing individual components in isolation using mocks and stubs.

#### Running Unit Tests

```bash
# Run only unit tests
npm run test:unit

# Run specific unit test file
npm test -- tests/unit/models/Comment.test.js

# Run unit tests with coverage
npm run test:unit -- --coverage
```

#### Unit Test Structure

```
tests/unit/
├── controllers/           # Controller logic tests
│   ├── CommentController.test.js
│   ├── ProfileController.test.js
│   ├── VoteController.test.js
│   └── WebController.test.js
├── models/               # Data model tests
│   ├── Comment.test.js
│   ├── Profile.test.js
│   └── Vote.test.js
├── repositories/         # Data access layer tests
│   ├── CommentRepository.test.js
│   ├── ProfileRepository.test.js
│   └── VoteRepository.test.js
├── services/            # Business logic tests
│   ├── CommentService.test.js
│   ├── ProfileService.test.js
│   └── VoteService.test.js
└── validators/          # Input validation tests
    ├── CommentValidator.test.js
    ├── ProfileValidator.test.js
    └── VoteValidator.test.js
```

#### Unit Test Examples

**Testing a Model:**

```javascript
describe("Comment Model", () => {
  test("should create a valid comment", () => {
    const commentData = {
      content: "Test comment",
      author: "Test Author",
      profileId: 1,
    };

    const comment = new Comment(commentData);
    expect(comment.content).toBe("Test comment");
    expect(comment.isVisible).toBe(true);
  });
});
```

**Testing a Service:**

```javascript
describe("CommentService", () => {
  test("should create comment successfully", async () => {
    const mockRepository = {
      create: jest.fn().mockResolvedValue(mockComment),
    };

    const service = new CommentService(mockRepository);
    const result = await service.createComment(commentData);

    expect(result).toEqual(mockComment);
    expect(mockRepository.create).toHaveBeenCalledWith(commentData);
  });
});
```

### Integration Tests

Integration tests verify the complete functionality of API endpoints with real database interactions.

#### Running Integration Tests

```bash
# Run only integration tests
npm run test:integration

# Run specific integration test file
npm test -- tests/integration/CommentAPI.integration.test.js

# Run integration tests with coverage
npm run test:integration -- --coverage
```

#### Integration Test Structure

```
tests/integration/
├── CommentAPI.integration.test.js      # Comment endpoints testing
├── CommentVotesAPI.integration.test.js # Comment voting endpoints
├── ProfileCommentsAPI.integration.test.js # Profile-comment relationships
├── VotesAPI.integration.test.js        # General voting endpoints
└── helpers/
    └── testIntegrationHelpers.js       # Test utilities and factories
```

#### Integration Test Features

- **Real Database**: Tests against actual MongoDB instance
- **Complete API Flow**: Tests full request-response cycles
- **Data Factories**: Generates realistic test data
- **Database Cleanup**: Automatic cleanup between tests
- **Error Scenarios**: Tests validation and error handling

#### Integration Test Examples

**Testing API Endpoint:**

```javascript
describe("Comment API", () => {
  test("should create comment successfully", async () => {
    const commentData = testDataFactories.validComment({
      profileId: testProfileId,
    });

    const response = await request(app)
      .post("/api/comments")
      .send(commentData)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.comment.content).toBe(commentData.content);
  });
});
```

**Testing Voting System:**

```javascript
describe("Voting API", () => {
  test("should submit vote successfully", async () => {
    const voteData = {
      personalitySystem: "mbti",
      personalityValue: "INTJ",
      profileId: testProfileId,
    };

    const response = await request(app)
      .post(`/api/comments/${commentId}/vote`)
      .send(voteData)
      .expect(201);

    expect(response.body.vote.personalitySystem).toBe("mbti");
    expect(response.body.vote.personalityValue).toBe("INTJ");
  });
});
```

### Test Coverage

View test coverage reports:

```bash
# Generate coverage report
npm run test:coverage

# Open coverage report in browser
open coverage/lcov-report/index.html
```

### Test Configuration

#### Jest Configuration (`jest.config.js`)

```javascript
module.exports = {
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/tests/setup/jest.setup.js"],
  testMatch: ["<rootDir>/tests/**/*.test.js"],
  collectCoverageFrom: [
    "controllers/**/*.js",
    "models/**/*.js",
    "services/**/*.js",
    "repositories/**/*.js",
    "validators/**/*.js",
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

### Test Helpers and Utilities

The project includes comprehensive test utilities:

#### Data Factories

```javascript
// Generate test data
const comment = testDataFactories.validComment({ profileId: 1 });
const votes = testDataFactories.validVotes(commentId, 5);
const profile = testDataFactories.validProfile();
```

#### Database Helpers

```javascript
// Clean database between tests
await databaseHelpers.cleanDatabase();

// Seed test data
await databaseHelpers.seedDatabase(profiles);
```

#### API Helpers

```javascript
// Validate API responses
apiHelpers.expectValidCommentsListResponse(response, expectedCount);
apiHelpers.expectValidVoteStatsResponse(response);
```

## 🏗 Project Structure

```
boo/
├── app.js                     # Application entry point
├── package.json              # Dependencies and scripts
├── jest.config.js           # Jest testing configuration
├── config/
│   └── database.js          # Database configuration
├── controllers/             # Request handlers
│   ├── CommentController.js
│   ├── ProfileController.js
│   ├── VoteController.js
│   └── WebController.js
├── models/                  # Data models
│   ├── Comment.js
│   ├── Profile.js
│   └── Vote.js
├── repositories/           # Data access layer
│   ├── CommentRepository.js
│   ├── ProfileRepository.js
│   └── VoteRepository.js
├── services/              # Business logic
│   ├── CommentService.js
│   ├── ProfileService.js
│   └── VoteService.js
├── validators/           # Input validation
│   ├── CommentValidator.js
│   ├── ProfileValidator.js
│   └── VoteValidator.js
├── routes/              # API route definitions
│   ├── comments.js
│   ├── profile.js
│   ├── votes.js
│   └── web.js
├── middleware/         # Custom middleware
│   └── basicAuth.js
├── docs/              # API documentation
│   └── swagger-config.js
├── tests/            # Test files
│   ├── unit/         # Unit tests
│   ├── integration/  # Integration tests
│   ├── helpers/      # Test utilities
│   └── setup/        # Test configuration
├── views/           # EJS templates
└── public/         # Static assets
```

## 🌐 API Endpoints

### Core Endpoints

| Method | Endpoint    | Description               |
| ------ | ----------- | ------------------------- |
| `GET`  | `/health`   | Application health check  |
| `GET`  | `/api-docs` | Swagger API documentation |

### Profile Endpoints

| Method | Endpoint                            | Description             |
| ------ | ----------------------------------- | ----------------------- |
| `POST` | `/api/profile`                      | Create new profile      |
| `GET`  | `/api/profile/:id`                  | Get profile by ID       |
| `GET`  | `/api/profiles/:profileId/comments` | Get comments by profile |

### Comment Endpoints

| Method   | Endpoint            | Description                     |
| -------- | ------------------- | ------------------------------- |
| `POST`   | `/api/comments`     | Create new comment              |
| `GET`    | `/api/comments`     | List comments (with pagination) |
| `GET`    | `/api/comments/:id` | Get comment by ID               |
| `PUT`    | `/api/comments/:id` | Update comment                  |
| `DELETE` | `/api/comments/:id` | Delete comment                  |

### Voting Endpoints

| Method | Endpoint                               | Description             |
| ------ | -------------------------------------- | ----------------------- |
| `POST` | `/api/comments/:commentId/vote`        | Submit vote for comment |
| `GET`  | `/api/comments/:commentId/votes`       | Get votes for comment   |
| `GET`  | `/api/comments/:commentId/votes/stats` | Get vote statistics     |
| `GET`  | `/api/votes/top-comments`              | Get top voted comments  |
| `GET`  | `/api/votes/count`                     | Get vote count          |

## ⚙️ Environment Configuration

### Environment Variables

The application uses environment variables for configuration. Copy `.env.example` to `.env` and modify as needed:

```bash
cp .env.example .env
```

### Key Environment Variables

```env
NODE_ENV=development
PORT=3000
APP_NAME=Boo App

# Database Configuration
# MONGODB_URI=mongodb://localhost:27017/boo_profiles
MONGODB_URI=mongodb+srv://root:<your_mongodb_password>@boo.o80rphe.mongodb.net/?appName=boo

# Swagger Documentation Authentication
SWAGGER_USERNAME=admin
SWAGGER_PASSWORD=<your_api_doc_password>
SWAGGER_REALM=Boo API Documentation
```

### Database Connection Options

**Local MongoDB:**

```env
MONGODB_URI=mongodb://localhost:27017/boo
```

**MongoDB Atlas (Cloud):**

```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/boo?retryWrites=true&w=majority
```

**Docker MongoDB:**

```env
MONGODB_URI=mongodb://localhost:27017/boo
```

> **Note**: For a complete list of all available environment variables, see the `.env.example` file which includes detailed documentation for each setting.

### Configuration Files

- **Database**: `config/database.js`
- **Swagger**: `docs/swagger-config.js`
- **Jest**: `jest.config.js`

## 🤝 Contributing

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Write tests** for your changes
4. **Run tests**: `npm test`
5. **Commit changes**: `git commit -m 'Add amazing feature'`
6. **Push to branch**: `git push origin feature/amazing-feature`
7. **Open Pull Request**

### Development Guidelines

- Write tests for all new features
- Maintain test coverage above 80%
- Follow existing code style
- Update API documentation
- Add integration tests for new endpoints

## 📊 Testing Best Practices

### Unit Testing

- Test individual functions in isolation
- Use mocks for external dependencies
- Focus on business logic validation
- Achieve high code coverage

### Integration Testing

- Test complete API workflows
- Use real database connections
- Test error scenarios and edge cases
- Validate API response formats

### Test Data Management

- Use data factories for consistent test data
- Clean database state between tests
- Use realistic but not sensitive data
- Test with various data scenarios

## 🔧 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**

   ```bash
   # Ensure MongoDB is running
   sudo systemctl start mongod

   # Or using Docker
   docker start mongodb
   ```

2. **Test Database Issues**

   ```bash
   # Clean test database
   npm run test:clean

   # Reset test environment
   npm run test:reset
   ```

3. **Port Already in Use**
   ```bash
   # Find and kill process using port 3000
   lsof -ti:3000 | xargs kill -9
   ```

## 📝 License

This project is licensed under the MIT License. See LICENSE file for details.

---

## 📞 Support

For questions and support:

- Create an issue in the repository
- Check the API documentation at `/api-docs`
- Review existing tests for usage examples

Happy coding! 🎉
