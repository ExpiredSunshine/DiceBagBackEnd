const PublicPool = require("../models/PublicPool");
const UserPool = require("../models/UserPool");
const PoolUsage = require("../models/PoolUsage");

class PoolPersistenceService {
  /**
   * Get or create a public pool for a specific die type
   * @param {string} dieType - The type of die (d4, d6, d8, etc.)
   * @returns {Promise<Object>} The public pool document
   */
  async getOrCreatePublicPool(dieType) {
    try {
      let pool = await PublicPool.findOne({ dieType });
      
      if (!pool) {
        pool = new PublicPool({ dieType });
        await pool.save();
        console.log(`[PoolPersistence] Created new public pool for ${dieType}`);
      }
      
      return pool;
    } catch (error) {
      console.error(`[PoolPersistence] Error getting/creating public pool for ${dieType}:`, error.message);
      throw error;
    }
  }

  /**
   * Get or create a user pool for a specific user and die type
   * @param {string} userId - The user ID
   * @param {string} dieType - The type of die (d4, d6, d8, etc.)
   * @returns {Promise<Object>} The user pool document
   */
  async getOrCreateUserPool(userId, dieType) {
    try {
      let pool = await UserPool.findOne({ userId, dieType });
      
      if (!pool) {
        pool = new UserPool({ userId, dieType });
        await pool.save();
        console.log(`[PoolPersistence] Created new user pool for user ${userId}, ${dieType}`);
      }
      
      return pool;
    } catch (error) {
      console.error(`[PoolPersistence] Error getting/creating user pool for user ${userId}, ${dieType}:`, error.message);
      throw error;
    }
  }

  /**
   * Update pool numbers and last refill time
   * @param {string} poolId - The pool ID
   * @param {Array<number>} numbers - New random numbers
   * @param {string} poolType - 'public' or 'user'
   */
  async updatePoolNumbers(poolId, numbers, poolType) {
    try {
      const Model = poolType === 'public' ? PublicPool : UserPool;
      await Model.findByIdAndUpdate(poolId, {
        numbers,
        lastRefill: new Date(),
      });
      
      console.log(`[PoolPersistence] Updated ${poolType} pool ${poolId} with ${numbers.length} numbers`);
    } catch (error) {
      console.error(`[PoolPersistence] Error updating ${poolType} pool ${poolId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get today's usage record for a specific IP or create a new one
   * @param {string} ipAddress - The IP address to track
   * @returns {Promise<Object>} The usage document for today and IP
   */
  async getOrCreateTodayUsage(ipAddress) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of day
      
      let usage = await PoolUsage.findOne({ date: today, ipAddress });
      
      if (!usage) {
        usage = new PoolUsage({ date: today, ipAddress });
        await usage.save();
        console.log(`[PoolPersistence] Created new usage record for IP ${ipAddress} on ${today.toDateString()}`);
      }
      
      return usage;
    } catch (error) {
      console.error(`[PoolPersistence] Error getting/creating today's usage for IP ${ipAddress}:`, error.message);
      throw error;
    }
  }

  /**
   * Increment today's roll count for a specific IP (optimized with upsert)
   * @param {number} increment - Number of rolls to add
   * @param {string} ipAddress - The IP address to track
   */
  async incrementTodayUsage(increment = 1, ipAddress) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of day
      
      // Use findOneAndUpdate with upsert for better performance
      const result = await PoolUsage.findOneAndUpdate(
        { date: today, ipAddress },
        { $inc: { totalRolls: increment } },
        { 
          upsert: true, 
          new: true,
          setDefaultsOnInsert: true 
        }
      );
      
      console.log(`[PoolPersistence] Incremented today's usage for IP ${ipAddress} by ${increment}, total: ${result.totalRolls}`);
      return result;
    } catch (error) {
      console.error(`[PoolPersistence] Error incrementing today's usage for IP ${ipAddress}:`, error.message);
      throw error;
    }
  }

  /**
   * Get today's total roll count for a specific IP
   * @param {string} ipAddress - The IP address to check
   * @returns {Promise<number>} Today's total rolls for this IP
   */
  async getTodayUsage(ipAddress) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of day
      
      const usage = await PoolUsage.findOne({ date: today, ipAddress });
      return usage ? usage.totalRolls : 0;
    } catch (error) {
      console.error(`[PoolPersistence] Error getting today's usage for IP ${ipAddress}:`, error.message);
      return 0;
    }
  }

  /**
   * Load all existing pools from database
   * @returns {Promise<Object>} Object with public and user pools
   */
  async loadAllPools() {
    try {
      const publicPools = await PublicPool.find({});
      const userPools = await UserPool.find({});
      
      console.log(`[PoolPersistence] Loaded ${publicPools.length} public pools and ${userPools.length} user pools`);
      
      return { publicPools, userPools };
    } catch (error) {
      console.error(`[PoolPersistence] Error loading all pools:`, error.message);
      throw error;
    }
  }

  /**
   * Clean up old usage records (called periodically)
   * @param {number} daysToKeep - Number of days to keep records
   */
  async cleanupOldUsageRecords(daysToKeep = 7) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      const result = await PoolUsage.deleteMany({ date: { $lt: cutoffDate } });
      
      console.log(`[PoolPersistence] Cleaned up ${result.deletedCount} old usage records older than ${daysToKeep} days`);
      
      return result.deletedCount;
    } catch (error) {
      console.error(`[PoolPersistence] Error cleaning up old usage records:`, error.message);
      throw error;
    }
  }

  /**
   * Get usage statistics for monitoring
   * @returns {Promise<Object>} Usage statistics
   */
  async getUsageStatistics() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const totalRecords = await PoolUsage.countDocuments();
      const todayRecords = await PoolUsage.countDocuments({ date: today });
      const totalRolls = await PoolUsage.aggregate([
        { $group: { _id: null, total: { $sum: "$totalRolls" } } }
      ]);
      
      return {
        totalRecords,
        todayRecords,
        totalRolls: totalRolls[0]?.total || 0,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`[PoolPersistence] Error getting usage statistics:`, error.message);
      return {
        totalRecords: 0,
        todayRecords: 0,
        totalRolls: 0,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

module.exports = new PoolPersistenceService(); 