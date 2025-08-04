const mongoose = require("mongoose");

const publicPoolSchema = new mongoose.Schema(
  {
    dieType: {
      type: String,
      required: true,
      enum: ["d4", "d6", "d8", "d10", "d12", "d20", "d100"],
      unique: true,
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

// Index for efficient queries
publicPoolSchema.index({ dieType: 1 });

module.exports = mongoose.model("PublicPool", publicPoolSchema);
