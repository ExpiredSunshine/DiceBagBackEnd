const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const mongoose = require("mongoose");
require("dotenv").config();

const { config, validateConfig } = require("./src/config/config");
const diceRoutes = require("./src/routes/diceRoutes");
const userRoutes = require("./src/routes/userRoutes");
const errorHandler = require("./src/middleware/errorHandler");
const { NotFoundError } = require("./src/utils/error-classes");

const app = express();
const PORT = config.port;

// Connect to MongoDB
mongoose
  .connect(config.mongoUri)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Validate configuration on startup
try {
  validateConfig();
  console.log("Configuration validation passed");
} catch (error) {
  console.error("Configuration validation failed:", error.message);
  process.exit(1);
}

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);

// CORS configuration
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Admin-Key"],
  })
);

// Body parsing with size limits
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ limit: "10kb", extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(
    `[${new Date().toISOString()}] ${req.method} ${req.url} from ${req.ip}`
  );
  next();
});

// Routes
app.use("/api/dice", diceRoutes);
app.use("/api", userRoutes); // Add user routes

// Basic route
app.get("/", (req, res) => {
  res.json({
    message: "DiceBag API is running!",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    apiKeyConfigured: !!config.randomOrgApiKey,
    environment: config.nodeEnv,
  });
});

// 404 handler
app.use((req, res, next) => {
  next(new NotFoundError(`Route ${req.originalUrl} not found`));
});

// Error handling middleware
app.use(errorHandler);

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  process.exit(0);
});

// Start the Server
app.listen(PORT, () => {
  console.log(`DiceBag API server running on port ${PORT}`);
  console.log(`Security features enabled`);
  console.log(`Environment: ${config.nodeEnv}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Dice API: http://localhost:${PORT}/api/dice`);
});
