const poolPersistence = require("./poolPersistence");
const usageTracker = require("./usageTracker");
const randomOrgService = require("./randomOrgService");
const { config } = require("../config/config");
const { BadRequestError } = require("../utils/error-classes");
const { DIE_TYPES, MAX_DICE_PER_TYPE } = require("../utils/constants");

class PoolManagerService {
  constructor() {
    // Track which pools are currently being refilled to prevent multiple refills at once
    this.refillInProgress = new Set();

    // Statistics to monitor how the service is performing
    this.stats = {
      totalRolls: 0,
      totalApiCalls: 0,
      lastRefill: {},
    };

    // Constants
    this.MAX_DICE_PER_TYPE = MAX_DICE_PER_TYPE;
    this.DIE_TYPES = DIE_TYPES;
  }

  /**
   * Get or create a pool for the given die type and user
   * @param {string} dieType - Which die type to get a pool for
   * @param {string} userId - User ID (null for public pool)
   * @returns {Promise<Object>} The pool document
   */
  async _getPool(dieType, userId = null) {
    return userId
      ? await poolPersistence.getOrCreateUserPool(userId, dieType)
      : await poolPersistence.getOrCreatePublicPool(dieType);
  }

  /**
   * Get the next random number from a pool (public or user)
   * @param {string} dieType - Which die type to get a number for
   * @param {string} userId - User ID (null for public pool)
   * @returns {Promise<number>} A random number for that die type
   */
  async getNextNumber(dieType, userId = null) {
    const poolType = userId ? "user" : "public";
    const _poolKey = userId ? `${userId}-${dieType}` : dieType;

    // Get the pool and ensure it has numbers
    let pool = await this._getPool(dieType, userId);

    if (pool.numbers.length === 0) {
      await this.refillPool(dieType, userId);
      pool = await this._getPool(dieType, userId);

      if (pool.numbers.length === 0) {
        throw new BadRequestError(
          `Failed to refill ${poolType} pool for ${dieType}`
        );
      }
    }

    // Take the first number from the pool
    const number = pool.numbers.shift();
    await poolPersistence.updatePoolNumbers(pool._id, pool.numbers, poolType);

    // Increment roll counter
    this.stats.totalRolls++;

    console.log(
      `[PoolManager] Retrieved ${number} for ${poolType} ${dieType} (${pool.numbers.length} remaining)`
    );
    return number;
  }

  /**
   * Refill a pool with fresh random numbers from Random.org
   * @param {string} dieType - Which die type to refill
   * @param {string} userId - User ID (null for public pool)
   */
  async refillPool(dieType, userId = null) {
    const poolType = userId ? "user" : "public";
    const poolKey = userId ? `${userId}-${dieType}` : dieType;
    const refillSize = userId
      ? config.pools.user.size
      : config.pools.public.size;

    // Prevent multiple refills of the same pool happening at once
    if (this.refillInProgress.has(poolKey)) {
      console.log(
        `[PoolManager] Refill already in progress for ${poolType} ${dieType}`
      );
      // Wait for the existing refill to complete before proceeding
      while (this.refillInProgress.has(poolKey)) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      return;
    }

    // Mark this pool as being refilled
    this.refillInProgress.add(poolKey);

    try {
      console.log(
        `[PoolManager] Starting refill for ${poolType} ${dieType} with ${refillSize} numbers`
      );

      // Call Random.org service to get a batch of random numbers
      const numbers = await randomOrgService.getRandomNumbers(
        dieType,
        refillSize
      );

      // Get or create the pool and update it
      const pool = userId
        ? await poolPersistence.getOrCreateUserPool(userId, dieType)
        : await poolPersistence.getOrCreatePublicPool(dieType);

      await poolPersistence.updatePoolNumbers(pool._id, numbers, poolType);

      // Update statistics
      this.stats.totalApiCalls++;
      this.stats.lastRefill[poolKey] = new Date().toISOString();

      console.log(
        `[PoolManager] Refill completed for ${poolType} ${dieType}: ${numbers.length} numbers added`
      );
    } catch (error) {
      console.error(
        `[PoolManager] Refill failed for ${poolType} ${dieType}:`,
        error.message
      );
      throw error;
    } finally {
      // Always remove the pool from the refill tracking, even if there was an error
      this.refillInProgress.delete(poolKey);
    }
  }

  /**
   * Get multiple random numbers for a die type
   * @param {string} dieType - Which die type to get numbers for
   * @param {number} quantity - How many numbers to get
   * @param {string} userId - User ID (null for public pool)
   * @param {string} ipAddress - IP address for usage tracking (only for public pool)
   * @returns {Promise<Array<number>>} Array of random numbers
   */
  async getNumbers(dieType, quantity, userId = null, ipAddress = null) {
    // Validate quantity
    if (quantity <= 0) {
      return [];
    }

    if (quantity > this.MAX_DICE_PER_TYPE) {
      throw new BadRequestError(
        `Maximum ${this.MAX_DICE_PER_TYPE} dice per die type allowed, requested: ${quantity}`
      );
    }

    const poolType = userId ? "user" : "public";
    console.log(
      `[PoolManager] Getting ${quantity} numbers for ${poolType} ${dieType}`
    );

    // Validate roll request for public pool
    if (!userId) {
      await usageTracker.validateRollRequest(quantity, true, ipAddress);
    }

    // Get the requested number of random numbers
    const results = [];
    for (let i = 0; i < quantity; i++) {
      results.push(await this.getNextNumber(dieType, userId));
    }

    // Record the rolls
    await usageTracker.recordRoll(quantity, !userId, ipAddress);

    return results;
  }

  /**
   * Get the current status of all pools for a user
   * @param {string} userId - User ID (null for public pools only)
   * @returns {Promise<Object>} Status of all pools
   */
  async getPoolStatus(userId = null) {
    const status = {};

    for (const dieType of this.DIE_TYPES) {
      const pool = await this._getPool(dieType, userId);
      const poolKey = userId ? `${userId}-${dieType}` : dieType;

      status[dieType] = {
        remaining: pool.numbers.length,
        lastRefill: this.stats.lastRefill[poolKey] || pool.lastRefill,
      };
    }

    return status;
  }

  /**
   * Get comprehensive statistics about the service
   * @param {string} ipAddress - IP address for usage stats (optional)
   * @returns {Promise<Object>} Complete statistics
   */
  async getStats(ipAddress = null) {
    const usageStats = await usageTracker.getUsageStats(ipAddress);

    return {
      ...this.stats,
      usageStats,
    };
  }
}

module.exports = new PoolManagerService();
