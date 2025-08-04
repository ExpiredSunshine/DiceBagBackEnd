const mongoose = require("mongoose");

const poolUsageSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    ipAddress: {
      type: String,
      required: true,
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

// Compound index for efficient date + IP queries
poolUsageSchema.index({ date: 1, ipAddress: 1 }, { unique: true });

// TTL index to automatically delete old records (30 days)
poolUsageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

// Index for cleanup queries
poolUsageSchema.index({ date: 1 });

module.exports = mongoose.model("PoolUsage", poolUsageSchema); 