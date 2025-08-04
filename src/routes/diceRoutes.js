const express = require("express");
const poolManager = require("../services/poolManager");
const poolPersistence = require("../services/poolPersistence");
const cleanupService = require("../services/cleanupService");
const { diceRollLimiter } = require("../middleware/rateLimiter");
const { config } = require("../config/config");
const { BadRequestError } = require("../utils/error-classes");
const auth = require("../middleware/auth");

const router = express.Router();

// Constants
const { DIE_TYPES, MAX_DICE_PER_TYPE } = require("../utils/constants");

// Input validation middleware
const validateDiceQuantities = (req, res, next) => {
  const { diceQuantities } = req.body;

  if (!diceQuantities || typeof diceQuantities !== "object") {
    throw new BadRequestError("Invalid dice quantities format");
  }

  // Validate each die type and quantity
  const totalDice = Object.values(diceQuantities).reduce(
    (sum, qty) => sum + (qty || 0),
    0
  );

  if (totalDice > config.maxDicePerRoll) {
    throw new BadRequestError(
      `Maximum ${config.maxDicePerRoll} dice per roll allowed`
    );
  }

  for (const [dieType, quantity] of Object.entries(diceQuantities)) {
    if (!DIE_TYPES.includes(dieType)) {
      throw new BadRequestError(`Invalid die type: ${dieType}`);
    }

    if (
      typeof quantity !== "number" ||
      quantity < 0 ||
      quantity > MAX_DICE_PER_TYPE
    ) {
      throw new BadRequestError(
        `Invalid quantity for ${dieType}: must be 0-${MAX_DICE_PER_TYPE}`
      );
    }
  }

  next();
};

router.get("/health", (req, res) => {
  console.log(`[API] Health check requested from ${req.ip}`);
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
  });
});

// Optional authentication middleware
const optionalAuth = async (req, res, next) => {
  try {
    await auth(req, res, next);
  } catch (error) {
    // If authentication fails, continue without user (anonymous access)
    req.user = null;
    next();
  }
};

router.post(
  "/roll",
  diceRollLimiter,
  optionalAuth,
  validateDiceQuantities,
  async (req, res, next) => {
    const startTime = Date.now();

    try {
      const { diceQuantities } = req.body;
      const userId = req.user ? req.user._id : null;

      console.log(
        `[API] Dice roll requested from ${req.ip}${
          userId ? ` (user: ${userId})` : " (anonymous)"
        }:`,
        diceQuantities
      );

      const results = [];

      for (const [dieType, quantity] of Object.entries(diceQuantities)) {
        if (quantity > 0) {
          const numbers = await poolManager.getNumbers(
            dieType,
            quantity,
            userId,
            req.ip
          );
          results.push({
            diceType: dieType,
            quantity,
            results: numbers,
            total: numbers.reduce((sum, num) => sum + num, 0),
          });
        }
      }

      const grandTotal = results.reduce((sum, result) => sum + result.total, 0);
      const duration = Date.now() - startTime;

      console.log(
        `[API] Dice roll completed in ${duration}ms: ${results.length} die types, total: ${grandTotal}`
      );

      res.json({
        rolls: results,
        grandTotal,
        timestamp: new Date().toISOString(),
        duration,
      });
    } catch (error) {
      next(error); // Pass to error handler
    }
  }
);

// Get public pool status (no authentication required)
router.get("/pools/public", async (req, res, next) => {
  try {
    console.log(`[API] Public pool status requested from ${req.ip}`);

    const poolStatus = await poolManager.getPoolStatus();
    const stats = await poolManager.getStats(req.ip);

    res.json({
      poolStatus,
      usageStats: stats.usageStats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// Get user pool status (authentication required)
router.get("/pools/user", auth, async (req, res, next) => {
  try {
    console.log(
      `[API] User pool status requested from ${req.ip} (user: ${req.user._id})`
    );

    const poolStatus = await poolManager.getPoolStatus(req.user._id);
    const stats = await poolManager.getStats(req.ip);

    res.json({
      poolStatus,
      usageStats: stats.usageStats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// Get service stats
router.get("/stats", async (req, res, next) => {
  try {
    console.log(`[API] Stats requested from ${req.ip}`);

    const stats = await poolManager.getStats();
    const usageStats = await poolPersistence.getUsageStatistics();

    res.json({
      stats,
      usageStats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// Get performance monitoring data
router.get("/monitor", async (req, res, next) => {
  try {
    console.log(`[API] Monitor data requested from ${req.ip}`);

    const usageStats = await poolPersistence.getUsageStatistics();
    const cleanupStatus = cleanupService.getStatus();

    res.json({
      usageStats,
      cleanupStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
