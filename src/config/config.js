require("dotenv").config();
const { BadRequestError } = require("../utils/error-classes");

const config = {
  // API Configuration
  randomOrgApiKey: process.env.RANDOM_ORG_API_KEY,
  randomOrgUrl: "https://api.random.org/json-rpc/2/invoke",

  // Server Configuration
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || "development",

  // Security Configuration
  corsOrigin: process.env.FRONTEND_URL || "http://localhost:5173",

  // JWT Configuration
  jwtSecret:
    process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production",
  jwtExpiresIn: "7d",

  // Database Configuration
  mongoUri: process.env.MONGO_URI || "mongodb://localhost:27017/dicebag",

  // Rate Limiting
  rateLimits: {
    diceRoll: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // 100 requests per window
    },
    poolStatus: {
      windowMs: 5 * 60 * 1000, // 5 minutes
      max: 50, // 50 requests per window
    },
  },

  // Dice Pool Configuration
  poolSize: 100, // Number of random numbers to fetch per API call
  maxDicePerRoll: 100, // Maximum dice that can be rolled in one request
};

// Validate required configuration
const validateConfig = () => {
  if (!config.randomOrgApiKey) {
    throw new BadRequestError(
      "RANDOM_ORG_API_KEY environment variable is required"
    );
  }

  // Basic UUID format validation for API key
  if (
    !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(
      config.randomOrgApiKey
    )
  ) {
    throw new BadRequestError("Invalid RANDOM_ORG_API_KEY format");
  }
};

module.exports = { config, validateConfig };
