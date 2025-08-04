const poolPersistence = require("./poolPersistence");

class CleanupService {
  constructor() {
    this.cleanupInterval = null;
    this.isRunning = false;
  }

  /**
   * Start periodic cleanup tasks
   * @param {number} intervalHours - How often to run cleanup (default: 24 hours)
   */
  startPeriodicCleanup(intervalHours = 24) {
    if (this.isRunning) {
      console.log("[CleanupService] Cleanup service is already running");
      return;
    }

    this.isRunning = true;
    const intervalMs = intervalHours * 60 * 60 * 1000;

    // Run initial cleanup
    this.runCleanup();

    // Schedule periodic cleanup
    this.cleanupInterval = setInterval(() => {
      this.runCleanup();
    }, intervalMs);

    console.log(`[CleanupService] Started periodic cleanup every ${intervalHours} hours`);
  }

  /**
   * Stop periodic cleanup tasks
   */
  stopPeriodicCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      this.isRunning = false;
      console.log("[CleanupService] Stopped periodic cleanup");
    }
  }

  /**
   * Run cleanup tasks
   */
  async runCleanup() {
    try {
      console.log("[CleanupService] Starting cleanup tasks...");
      
      // Clean up old usage records (keep last 7 days)
      const deletedRecords = await poolPersistence.cleanupOldUsageRecords(7);
      
      // Get usage statistics for monitoring
      const stats = await poolPersistence.getUsageStatistics();
      
      console.log(`[CleanupService] Cleanup completed: ${deletedRecords} records deleted`);
      console.log(`[CleanupService] Current stats: ${stats.totalRecords} total records, ${stats.todayRecords} today`);
      
    } catch (error) {
      console.error("[CleanupService] Error during cleanup:", error.message);
    }
  }

  /**
   * Get cleanup service status
   * @returns {Object} Service status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      hasInterval: !!this.cleanupInterval,
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = new CleanupService(); 