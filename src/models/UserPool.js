const mongoose = require("mongoose");

const userPoolSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    dieType: {
      type: String,
      required: true,
      enum: ["d4", "d6", "d8", "d10", "d12", "d20", "d100"],
    },
    numbers: {
      type: [Number],
      default: [],
    },
    lastRefill: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
userPoolSchema.index({ userId: 1, dieType: 1 }, { unique: true });

module.exports = mongoose.model("UserPool", userPoolSchema); 