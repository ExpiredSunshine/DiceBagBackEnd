const rateLimit = require("express-rate-limit");
const { config } = require("../config/config");
const { ConflictError } = require("../utils/error-classes");

// Create rate limiters
const createRateLimiter = (name, options) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: {
      error: options.message,
      retryAfter: `${Math.round(options.windowMs / 60000)} minutes`,
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      console.log(`[RateLimit] ${name} limit exceeded for IP: ${req.ip}`);
      const error = new ConflictError(options.message);
      res.status(error.statusCode).json({
        error: error.message,
        retryAfter: `${Math.round(options.windowMs / 60000)} minutes`,
        timestamp: new Date().toISOString(),
      });
    },
    // Use the built-in IP key generator for proper IPv6 handling
    keyGenerator: rateLimit.ipKeyGenerator,
  });
};

// Dice roll rate limiter
const diceRollLimiter = createRateLimiter("diceRoll", {
  windowMs: config.rateLimits.diceRoll.windowMs,
  max: config.rateLimits.diceRoll.max,
  message: "Too many dice rolls, please try again later.",
});

// Pool status rate limiter
const poolStatusLimiter = createRateLimiter("poolStatus", {
  windowMs: config.rateLimits.poolStatus.windowMs,
  max: config.rateLimits.poolStatus.max,
  message: "Too many status checks, please try again later.",
});

module.exports = {
  diceRollLimiter,
  poolStatusLimiter,
  createRateLimiter,
};
