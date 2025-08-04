const { config } = require("../config/config");
const { BadRequestError, ConflictError } = require("../utils/error-classes");

class RandomOrgService {
  constructor() {
    // Load API key and URL from configuration
    this.apiKey = config.randomOrgApiKey;
    this.apiUrl = config.randomOrgUrl;

    // Track request IDs for debugging and logging
    this.requestId = 0;
  }

  /**
   * Fetches random numbers from Random.org API for a specific die type
   * @param {string} dieType - The type of die (d4, d6, d8, d10, d12, d20, d100)
   * @param {number} quantity - Number of random numbers to fetch (default: config.poolSize)
   * @returns {Promise<Array<number>>} Array of random numbers
   * @throws {BadRequestError} If die type is invalid
   * @throws {ConflictError} If API quota is exceeded
   */
  async getRandomNumbers(dieType, quantity = config.poolSize) {
    // Generate unique request ID for tracking
    const requestId = ++this.requestId;

    try {
      // Define the valid range for each die type
      // Each die type has a minimum of 1 and maximum equal to the die size
      const dieRanges = {
        d4: { min: 1, max: 4 },
        d6: { min: 1, max: 6 },
        d8: { min: 1, max: 8 },
        d10: { min: 1, max: 10 },
        d12: { min: 1, max: 12 },
        d20: { min: 1, max: 20 },
        d100: { min: 1, max: 100 },
      };

      // Validate that the requested die type is supported
      const range = dieRanges[dieType];
      if (!range) {
        throw new BadRequestError(`Invalid die type: ${dieType}`);
      }

      // Prepare the JSON-RPC request body for Random.org API
      const requestBody = {
        jsonrpc: "2.0",
        method: "generateIntegerSequences",
        params: {
          apiKey: this.apiKey,
          n: 1,
          length: quantity,
          min: range.min,
          max: range.max,
          replacement: true, // Allow duplicate numbers
          base: 10, // Use base 10 to generate integers
        },
        id: requestId,
      };

      console.log(
        `[RandomOrg] Requesting ${quantity} numbers for ${dieType} (request ${requestId})`
      );

      // Make HTTP POST request to Random.org API
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json", // Tell the server it's JSON
          "User-Agent": "DiceBag/1.0", // Identify the application
        },
        body: JSON.stringify(requestBody), // Convert request body to JSON
        timeout: 30000, // 30 second timeout
      });

      // Check if the HTTP request was successful
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Parse the JSON response
      const data = await response.json();

      // Check for returned error
      if (data.error) {
        console.error(
          `[RandomOrg] API Error (request ${requestId}):`,
          data.error
        );

        // Handle specific API errors
        if (data.error.code === 5) {
          // Code 5 means API quota exceeded
          throw new ConflictError(
            "API quota exceeded. Please try again later."
          );
        }

        // Generic error message
        throw new Error(`Random.org API Error: ${data.error.message}`);
      }

      // Extract the random numbers from the response
      const numbers = data.result.random.data[0];

      // Log successful response
      console.log(
        `[RandomOrg] Success (request ${requestId}): ${numbers.length} numbers received`
      );
      console.log(
        `[RandomOrg] Bits used: ${data.result.bitsUsed}, Bits left: ${data.result.bitsLeft}, Requests left: ${data.result.requestsLeft}`
      );

      // Return the array of random numbers
      return numbers;
    } catch (error) {
      // Log any errors that occurred
      console.error(
        `[RandomOrg] Failed to get random numbers for ${dieType} (request ${requestId}):`,
        error.message
      );
      throw error;
    }
  }
}

module.exports = new RandomOrgService();
