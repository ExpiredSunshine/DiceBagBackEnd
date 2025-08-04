const mongoose = require("mongoose");

const poolUsageSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
      unique: true,
    },
    totalRolls: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient date-based queries
poolUsageSchema.index({ date: 1 });

module.exports = mongoose.model("PoolUsage", poolUsageSchema); 