const poolPersistence = require("./poolPersistence");
const { config } = require("../config/config");
const { ConflictError } = require("../utils/error-classes");

class UsageTrackerService {
  constructor() {
    this.publicDailyLimit = config.pools.public.dailyLimit;
  }

  /**
   * Check if a user can make a roll (for public pool)
   * @param {number} requestedRolls - Number of rolls being requested
   * @returns {Promise<boolean>} True if allowed, false if limit exceeded
   */
  async canMakePublicRoll(requestedRolls = 1) {
    try {
      const todayUsage = await poolPersistence.getTodayUsage();
      const wouldExceed = todayUsage + requestedRolls > this.publicDailyLimit;
      
      if (wouldExceed) {
        console.log(`[UsageTracker] Public roll limit would be exceeded: ${todayUsage} + ${requestedRolls} > ${this.publicDailyLimit}`);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error(`[UsageTracker] Error checking public roll limit:`, error.message);
      // If we can't check the limit, allow the roll to prevent service disruption
      return true;
    }
  }

  /**
   * Record a roll in the usage tracker
   * @param {number} rollCount - Number of rolls to record
   * @param {boolean} isPublic - Whether this is a public pool roll
   */
  async recordRoll(rollCount = 1, isPublic = true) {
    try {
      if (isPublic) {
        await poolPersistence.incrementTodayUsage(rollCount);
        console.log(`[UsageTracker] Recorded ${rollCount} public rolls`);
      } else {
        console.log(`[UsageTracker] User roll recorded (no daily limit): ${rollCount} rolls`);
      }
    } catch (error) {
      console.error(`[UsageTracker] Error recording roll:`, error.message);
      // Don't throw error to prevent roll failure due to tracking issues
    }
  }

  /**
   * Get current usage statistics
   * @returns {Promise<Object>} Usage statistics
   */
  async getUsageStats() {
    try {
      const todayUsage = await poolPersistence.getTodayUsage();
      const remainingRolls = Math.max(0, this.publicDailyLimit - todayUsage);
      
      return {
        todayUsage,
        dailyLimit: this.publicDailyLimit,
        remainingRolls,
        limitExceeded: todayUsage >= this.publicDailyLimit,
      };
    } catch (error) {
      console.error(`[UsageTracker] Error getting usage stats:`, error.message);
      return {
        todayUsage: 0,
        dailyLimit: this.publicDailyLimit,
        remainingRolls: this.publicDailyLimit,
        limitExceeded: false,
      };
    }
  }

  /**
   * Validate roll request and throw error if limit exceeded
   * @param {number} requestedRolls - Number of rolls being requested
   * @param {boolean} isPublic - Whether this is a public pool roll
   */
  async validateRollRequest(requestedRolls, isPublic = true) {
    if (isPublic) {
      const canRoll = await this.canMakePublicRoll(requestedRolls);
      if (!canRoll) {
        const stats = await this.getUsageStats();
        throw new ConflictError(
          `Daily roll limit exceeded. You have used ${stats.todayUsage}/${stats.dailyLimit} rolls today. Please try again tomorrow or create an account for unlimited rolls.`
        );
      }
    }
  }
}

module.exports = new UsageTrackerService(); 