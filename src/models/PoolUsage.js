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

module.exports = mongoose.model("PoolUsage", poolUsageSchema); 