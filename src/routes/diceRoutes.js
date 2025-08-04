const express = require("express");
const dicePoolService = require("../services/dicePoolService");
const { diceRollLimiter } = require("../middleware/rateLimiter");
const { config } = require("../config/config");
const { BadRequestError } = require("../utils/error-classes");

const router = express.Router();

// Input validation middleware
const validateDiceQuantities = (req, res, next) => {
  const { diceQuantities } = req.body;

  if (!diceQuantities || typeof diceQuantities !== "object") {
    throw new BadRequestError("Invalid dice quantities format");
  }

  // Validate each die type and quantity
  const validDieTypes = ["d4", "d6", "d8", "d10", "d12", "d20", "d100"];
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
    if (!validDieTypes.includes(dieType)) {
      throw new BadRequestError(`Invalid die type: ${dieType}`);
    }

    if (typeof quantity !== "number" || quantity < 0 || quantity > 50) {
      throw new BadRequestError(
        `Invalid quantity for ${dieType}: must be 0-50`
      );
    }
  }

  next();
};

router.get("/health", (req, res) => {
  console.log(`[API] Health check requested from ${req.ip}`);
  res.json({
    status: "OK",
    poolStatus: dicePoolService.getPoolStatus(),
    timestamp: new Date().toISOString(),
  });
});

router.post(
  "/roll",
  diceRollLimiter,
  validateDiceQuantities,
  async (req, res, next) => {
    const startTime = Date.now();

    try {
      const { diceQuantities } = req.body;

      console.log(`[API] Dice roll requested from ${req.ip}:`, diceQuantities);

      const results = [];

      for (const [dieType, quantity] of Object.entries(diceQuantities)) {
        if (quantity > 0) {
          const numbers = await dicePoolService.getNumbers(dieType, quantity);
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

// Get pool status
router.get("/pools", (req, res) => {
  console.log(`[API] Pool status requested from ${req.ip}`);

  res.json({
    poolStatus: dicePoolService.getPoolStatus(),
    timestamp: new Date().toISOString(),
  });
});

// Get service stats
router.get("/stats", (req, res) => {
  console.log(`[API] Stats requested from ${req.ip}`);

  res.json({
    stats: dicePoolService.getStats(),
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
