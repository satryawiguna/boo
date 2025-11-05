"use strict";

function basicAuth(options = {}) {
  const {
    username = process.env.SWAGGER_USERNAME || "admin",
    password = process.env.SWAGGER_PASSWORD || "password",
    realm = process.env.SWAGGER_REALM || "Swagger Documentation",
    challenge = "Please authenticate to access the API documentation",
  } = options;

  return function (req, res, next) {
    const authorization = req.get("Authorization");

    if (!authorization || !authorization.startsWith("Basic ")) {
      return sendAuthChallenge(res, realm, challenge);
    }

    const credentials = authorization.slice(6);
    let decoded;

    try {
      decoded = Buffer.from(credentials, "base64").toString("utf8");
    } catch (error) {
      console.error("Basic auth decode error:", error);
      return sendAuthChallenge(res, realm, "Invalid credentials format");
    }

    const [providedUsername, providedPassword] = decoded.split(":", 2);

    if (providedUsername === username && providedPassword === password) {
      req.user = { username: providedUsername };
      return next();
    } else {
      console.warn(
        `Failed authentication attempt for user: ${providedUsername}`
      );
      return sendAuthChallenge(res, realm, "Invalid username or password");
    }
  };
}

function sendAuthChallenge(res, realm, message) {
  res.set("WWW-Authenticate", `Basic realm="${realm}"`);
  res.status(401).json({
    error: "Unauthorized",
    message: message,
    statusCode: 401,
    documentation:
      "Please provide valid credentials to access the API documentation",
  });
}

function createSwaggerAuth() {
  const config = {
    username: process.env.SWAGGER_USERNAME || "admin",
    password: process.env.SWAGGER_PASSWORD || "admin123",
    realm: process.env.SWAGGER_REALM || "Boo API Documentation",
    challenge: "Authentication required to access Swagger documentation",
  };

  // Log configuration (without password) in development
  if (process.env.NODE_ENV === "development") {
    console.log("Swagger Auth Configuration:");
    console.log(`  Username: ${config.username}`);
    console.log("  Password: [PROTECTED]");
    console.log(`  Realm: ${config.realm}`);
  }

  return basicAuth(config);
}

function advancedBasicAuth(options = {}) {
  const {
    maxAttempts = 5,
    lockoutTime = 15 * 60 * 1000, // 15 minutes
    enableLogging = true,
    ...basicOptions
  } = options;

  const failedAttempts = new Map();

  const basicAuthMiddleware = basicAuth(basicOptions);

  return function (req, res, next) {
    const clientIP = req.ip || req.connection.remoteAddress;
    const now = Date.now();

    const attempts = failedAttempts.get(clientIP);
    if (
      attempts &&
      attempts.count >= maxAttempts &&
      now - attempts.lastAttempt < lockoutTime
    ) {
      if (enableLogging) {
        console.warn(
          `Blocked authentication attempt from locked IP: ${clientIP}`
        );
      }
      return res.status(429).json({
        error: "Too Many Requests",
        message:
          "Too many failed authentication attempts. Please try again later.",
        statusCode: 429,
        retryAfter: Math.ceil(
          (lockoutTime - (now - attempts.lastAttempt)) / 1000
        ),
      });
    }

    const originalSend = res.send;
    res.send = function (data) {
      if (res.statusCode === 401) {
        const current = failedAttempts.get(clientIP) || {
          count: 0,
          lastAttempt: 0,
        };
        current.count++;
        current.lastAttempt = now;
        failedAttempts.set(clientIP, current);

        if (enableLogging) {
          console.warn(
            `Failed auth attempt ${current.count}/${maxAttempts} from IP: ${clientIP}`
          );
        }
      } else if (res.statusCode === 200) {
        failedAttempts.delete(clientIP);
      }

      return originalSend.call(this, data);
    };

    return basicAuthMiddleware(req, res, next);
  };
}

module.exports = {
  basicAuth,
  createSwaggerAuth,
  advancedBasicAuth,
};
