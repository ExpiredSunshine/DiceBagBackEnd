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
   * Get today's usage record or create a new one
   * @returns {Promise<Object>} The usage document for today
   */
  async getOrCreateTodayUsage() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of day
      
      let usage = await PoolUsage.findOne({ date: today });
      
      if (!usage) {
        usage = new PoolUsage({ date: today });
        await usage.save();
        console.log(`[PoolPersistence] Created new usage record for ${today.toDateString()}`);
      }
      
      return usage;
    } catch (error) {
      console.error(`[PoolPersistence] Error getting/creating today's usage:`, error.message);
      throw error;
    }
  }

  /**
   * Increment today's roll count
   * @param {number} increment - Number of rolls to add
   */
  async incrementTodayUsage(increment = 1) {
    try {
      const usage = await this.getOrCreateTodayUsage();
      usage.totalRolls += increment;
      await usage.save();
      
      console.log(`[PoolPersistence] Incremented today's usage by ${increment}, total: ${usage.totalRolls}`);
    } catch (error) {
      console.error(`[PoolPersistence] Error incrementing today's usage:`, error.message);
      throw error;
    }
  }

  /**
   * Get today's total roll count
   * @returns {Promise<number>} Today's total rolls
   */
  async getTodayUsage() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of day
      
      const usage = await PoolUsage.findOne({ date: today });
      return usage ? usage.totalRolls : 0;
    } catch (error) {
      console.error(`[PoolPersistence] Error getting today's usage:`, error.message);
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
}

module.exports = new PoolPersistenceService(); 