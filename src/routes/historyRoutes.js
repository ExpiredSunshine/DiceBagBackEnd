const express = require("express");
const User = require("../models/User");
const auth = require("../middleware/auth");
const { BadRequestError } = require("../utils/error-classes");

const router = express.Router();

// Get user's roll history
router.get("/", auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("rollHistory");

    if (!user) {
      throw new BadRequestError("User not found");
    }

    res.json({
      rollHistory: user.rollHistory || [],
      count: user.rollHistory ? user.rollHistory.length : 0,
    });
  } catch (error) {
    next(error);
  }
});

// Add roll to user's history
router.post("/", auth, async (req, res, next) => {
  try {
    const { rollData } = req.body;

    if (
      !rollData ||
      !rollData.id ||
      !rollData.timestamp ||
      !rollData.diceRolled ||
      rollData.total === undefined
    ) {
      throw new BadRequestError("Invalid roll data");
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      throw new BadRequestError("User not found");
    }

    // Initialize rollHistory if it doesn't exist
    if (!user.rollHistory) {
      user.rollHistory = [];
    }

    // Add new roll to the beginning of the array
    user.rollHistory.unshift({
      id: rollData.id,
      timestamp: new Date(rollData.timestamp),
      diceRolled: rollData.diceRolled,
      total: rollData.total,
      details: rollData.details || [],
    });

    // Keep only the latest 200 entries
    if (user.rollHistory.length > 200) {
      user.rollHistory = user.rollHistory.slice(0, 200);
    }

    await user.save();

    res.json({
      success: true,
      rollHistory: user.rollHistory,
      count: user.rollHistory.length,
    });
  } catch (error) {
    next(error);
  }
});

// Clear user's roll history
router.delete("/", auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      throw new BadRequestError("User not found");
    }

    user.rollHistory = [];
    await user.save();

    res.json({
      success: true,
      message: "Roll history cleared successfully",
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
