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
   * @param {string} ipAddress - The IP address to check
   * @returns {Promise<boolean>} True if allowed, false if limit exceeded
   */
  async canMakePublicRoll(requestedRolls = 1, ipAddress) {
    try {
      const todayUsage = await poolPersistence.getTodayUsage(ipAddress);
      const wouldExceed = todayUsage + requestedRolls > this.publicDailyLimit;
      
      if (wouldExceed) {
        console.log(`[UsageTracker] Public roll limit would be exceeded for IP ${ipAddress}: ${todayUsage} + ${requestedRolls} > ${this.publicDailyLimit}`);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error(`[UsageTracker] Error checking public roll limit for IP ${ipAddress}:`, error.message);
      // If we can't check the limit, allow the roll to prevent service disruption
      return true;
    }
  }

  /**
   * Record a roll in the usage tracker
   * @param {number} rollCount - Number of rolls to record
   * @param {boolean} isPublic - Whether this is a public pool roll
   * @param {string} ipAddress - The IP address to track (only for public rolls)
   */
  async recordRoll(rollCount = 1, isPublic = true, ipAddress = null) {
    try {
      if (isPublic && ipAddress) {
        await poolPersistence.incrementTodayUsage(rollCount, ipAddress);
        console.log(`[UsageTracker] Recorded ${rollCount} public rolls for IP ${ipAddress}`);
      } else if (!isPublic) {
        console.log(`[UsageTracker] User roll recorded (no daily limit): ${rollCount} rolls`);
      }
    } catch (error) {
      console.error(`[UsageTracker] Error recording roll:`, error.message);
      // Don't throw error to prevent roll failure due to tracking issues
    }
  }

  /**
   * Get current usage statistics for a specific IP
   * @param {string} ipAddress - The IP address to check
   * @returns {Promise<Object>} Usage statistics
   */
  async getUsageStats(ipAddress = null) {
    try {
      const todayUsage = ipAddress ? await poolPersistence.getTodayUsage(ipAddress) : 0;
      const remainingRolls = Math.max(0, this.publicDailyLimit - todayUsage);
      
      return {
        todayUsage,
        dailyLimit: this.publicDailyLimit,
        remainingRolls,
        limitExceeded: todayUsage >= this.publicDailyLimit,
        ipAddress,
      };
    } catch (error) {
      console.error(`[UsageTracker] Error getting usage stats for IP ${ipAddress}:`, error.message);
      return {
        todayUsage: 0,
        dailyLimit: this.publicDailyLimit,
        remainingRolls: this.publicDailyLimit,
        limitExceeded: false,
        ipAddress,
      };
    }
  }

  /**
   * Validate roll request and throw error if limit exceeded
   * @param {number} requestedRolls - Number of rolls being requested
   * @param {boolean} isPublic - Whether this is a public pool roll
   * @param {string} ipAddress - The IP address to check (only for public rolls)
   */
  async validateRollRequest(requestedRolls, isPublic = true, ipAddress = null) {
    if (isPublic && ipAddress) {
      const canRoll = await this.canMakePublicRoll(requestedRolls, ipAddress);
      if (!canRoll) {
        const stats = await this.getUsageStats(ipAddress);
        throw new ConflictError(
          `Daily roll limit exceeded. You have used ${stats.todayUsage}/${stats.dailyLimit} rolls today. Please try again tomorrow or create an account for unlimited rolls.`
        );
      }
    }
  }
}

module.exports = new UsageTrackerService(); 