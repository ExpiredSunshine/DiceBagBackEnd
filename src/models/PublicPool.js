const mongoose = require("mongoose");
const { DIE_TYPES } = require("../utils/constants");

const publicPoolSchema = new mongoose.Schema(
  {
    dieType: {
      type: String,
      required: true,
      enum: DIE_TYPES,
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
