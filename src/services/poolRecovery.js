const poolPersistence = require("./poolPersistence");
const poolManager = require("./poolManager");
const { DIE_TYPES, LOW_POOL_THRESHOLD } = require("../utils/constants");

class PoolRecoveryService {
  constructor() {
    // Constants
    this.DIE_TYPES = DIE_TYPES;
    this.LOW_POOL_THRESHOLD = LOW_POOL_THRESHOLD;
  }

  /**
   * Initialize all pools on server startup
   * This ensures pools exist and are ready for use
   */
  async initializePools() {
    try {
      console.log("[PoolRecovery] Starting pool initialization...");

      // Initialize public pools
      for (const dieType of this.DIE_TYPES) {
        try {
          await poolPersistence.getOrCreatePublicPool(dieType);
          console.log(`[PoolRecovery] Public pool for ${dieType} initialized`);
        } catch (error) {
          console.error(
            `[PoolRecovery] Failed to initialize public pool for ${dieType}:`,
            error.message
          );
        }
      }

      // Load existing pools from database
      const { publicPools, userPools } = await poolPersistence.loadAllPools();

      console.log(`[PoolRecovery] Pool initialization completed:`);
      console.log(`[PoolRecovery] - ${publicPools.length} public pools loaded`);
      console.log(`[PoolRecovery] - ${userPools.length} user pools loaded`);

      // Log pool status for monitoring
      for (const pool of publicPools) {
        console.log(
          `[PoolRecovery] Public ${pool.dieType}: ${pool.numbers.length} numbers remaining`
        );
      }
    } catch (error) {
      console.error(
        "[PoolRecovery] Error during pool initialization:",
        error.message
      );
    }
  }

  /**
   * Recover pools after server restart
   * This ensures pools are properly loaded and accessible
   */
  async recoverPools() {
    try {
      console.log("[PoolRecovery] Starting pool recovery...");

      // Initialize pools first
      await this.initializePools();

      // Verify pool accessibility by checking status
      const poolStatus = await poolManager.getPoolStatus();
      const stats = await poolManager.getStats();

      console.log("[PoolRecovery] Pool recovery completed successfully");
      console.log(`[PoolRecovery] Pool status:`, poolStatus);
      console.log(`[PoolRecovery] Usage stats:`, stats.usageStats);
    } catch (error) {
      console.error(
        "[PoolRecovery] Error during pool recovery:",
        error.message
      );
    }
  }

  /**
   * Health check for pools
   * @returns {Promise<Object>} Health status of pools
   */
  async healthCheck() {
    try {
      const poolStatus = await poolManager.getPoolStatus();
      const stats = await poolManager.getStats();

      // Check if any pools are critically low
      const lowPools = Object.entries(poolStatus).filter(
        ([, status]) => status.remaining < this.LOW_POOL_THRESHOLD
      );

      return {
        status: "healthy",
        poolStatus,
        usageStats: stats.usageStats,
        lowPools: lowPools.length > 0 ? lowPools : null,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("[PoolRecovery] Health check failed:", error.message);
      return {
        status: "unhealthy",
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

module.exports = new PoolRecoveryService();
