const randomOrgService = require("./randomOrgService");
const { config } = require("../config/config");
const { BadRequestError } = require("../utils/error-classes");

//DicePoolService - caching system for random numbers

class DicePoolService {
  constructor() {
    // separate pools for each die type - each pool holds an array of random numbers
    this.pools = {
      d4: [],
      d6: [],
      d8: [],
      d10: [],
      d12: [],
      d20: [],
      d100: [],
    };

    // track which pools are currently being refilled to prevent multiple refills at once
    this.refillInProgress = new Set();

    // statistics to monitor how the service is performing
    this.stats = {
      totalRolls: 0, // How many dice have been rolled total
      totalApiCalls: 0, // How many times Random.org has been called
      lastRefill: {}, // When each pool was last refilled
    };
  }

  /**
   * Check if a pool is empty (no random numbers left)
   * @param {string} dieType - Which die type to check (d4, d6, d8, etc.)
   * @returns {boolean} - True if the pool is empty, false if it has numbers left
   */
  isPoolEmpty(dieType) {
    return this.pools[dieType].length === 0;
  }

  /**
   * Refill a pool with fresh random numbers from Random.org
   * Only call this when a pool runs out of numbers
   * @param {string} dieType - Which die type to refill
   */
  async refillPool(dieType) {
    // prevent multiple refills of the same die type happening at once
    // This could happen if multiple requests need the same die type simultaneously
    if (this.refillInProgress.has(dieType)) {
      console.log(`[DicePool] Refill already in progress for ${dieType}`);
      // wait for the existing refill to complete before proceeding
      while (this.refillInProgress.has(dieType)) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      return;
    }

    // mark this die type as being refilled
    this.refillInProgress.add(dieType);

    try {
      console.log(`[DicePool] Starting refill for ${dieType}`);

      // call Random.org service to get a batch of random numbers
      // get config.poolSize numbers to last for a while
      const numbers = await randomOrgService.getRandomNumbers(
        dieType,
        config.poolSize
      );

      // replace the entire pool with the new numbers
      this.pools[dieType] = numbers;

      // update statistics
      this.stats.totalApiCalls++;
      this.stats.lastRefill[dieType] = new Date().toISOString();

      console.log(
        `[DicePool] Refill completed for ${dieType}: ${numbers.length} numbers added`
      );
    } catch (error) {
      // if something goes wrong with the refill, log it and re-throw the error
      console.error(`[DicePool] Refill failed for ${dieType}:`, error.message);
      throw error;
    } finally {
      // always remove the die type from the refill tracking, even if there was an error
      this.refillInProgress.delete(dieType);
    }
  }

  /**
   * Get the next random number from a pool
   * If the pool is empty, automatically refill it first
   * @param {string} dieType - Which die type to get a number for
   * @returns {number} - A random number for that die type
   */
  async getNextNumber(dieType) {
    // check if the pool is empty and refill it if needed
    if (this.isPoolEmpty(dieType)) {
      await this.refillPool(dieType);
    }

    // take the first number from the pool (shift removes and returns the first element)
    const number = this.pools[dieType].shift();

    // increment roll counter
    this.stats.totalRolls++;

    console.log(
      `[DicePool] Retrieved ${number} for ${dieType} (${this.pools[dieType].length} remaining)`
    );

    return number;
  }

  /**
   * Get multiple random numbers for a die type
   * validate the quantity and get numbers one by one
   * @param {string} dieType - Which die type to get numbers for
   * @param {number} quantity - How many numbers to get
   * @returns {Array<number>} - Array of random numbers
   */
  async getNumbers(dieType, quantity) {
    // if someone asks for 0 or negative numbers, return an empty array
    if (quantity <= 0) {
      return [];
    }

    // limit the quantity to prevent abuse and keep performance good
    if (quantity > 50) {
      throw new BadRequestError(
        `Maximum 50 dice per die type allowed, requested: ${quantity}`
      );
    }

    console.log(`[DicePool] Getting ${quantity} numbers for ${dieType}`);

    // get the requested number of random numbers
    const results = [];
    for (let i = 0; i < quantity; i++) {
      results.push(await this.getNextNumber(dieType));
    }

    return results;
  }

  /**
   * Get the current status of all pools
   * return how many numbers are left in each pool and when they were last refilled
   * @returns {Object} - Status of all pools
   */
  getPoolStatus() {
    const status = {};
    Object.keys(this.pools).forEach((dieType) => {
      status[dieType] = {
        remaining: this.pools[dieType].length, // How many numbers are left
        lastRefill: this.stats.lastRefill[dieType] || null, // When last refilled
      };
    });
    return status;
  }

  /**
   * Get comprehensive statistics about my service
   * include both the stats and the pool status
   * @returns {Object} - Complete statistics
   */
  getStats() {
    return {
      ...this.stats, // basic stats (totalRolls, totalApiCalls, lastRefill)
      poolStatus: this.getPoolStatus(), // Current status of all pools
    };
  }
}

module.exports = new DicePoolService();
