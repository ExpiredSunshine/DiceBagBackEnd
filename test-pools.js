const axios = require("axios");

// Configuration
const BASE_URL = "http://localhost:3001/api";
const TEST_USER_EMAIL = "test@example.com";
const TEST_USER_PASSWORD = "testpassword123";

class PoolTester {
  constructor() {
    this.authToken = null;
    this.testResults = [];
  }

  async log(message, data = null) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
    console.log("---");
  }

  async makeRequest(method, endpoint, data = null, headers = {}) {
    try {
      const config = {
        method,
        url: `${BASE_URL}${endpoint}`,
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
      };

      if (data) {
        config.data = data;
      }

      const response = await axios(config);
      return { success: true, data: response.data, status: response.status };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || error.message,
        status: error.response?.status,
      };
    }
  }

  async registerUser() {
    this.log("🔐 Registering test user...");
    const result = await this.makeRequest("POST", "/register", {
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
    });

    if (result.success) {
      this.log("✅ User registered successfully");
    } else {
      this.log("❌ User registration failed:", result.error);
    }
    return result;
  }

  async loginUser() {
    this.log("🔐 Logging in test user...");
    const result = await this.makeRequest("POST", "/login", {
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
    });

    if (result.success) {
      this.authToken = result.data.token;
      this.log("✅ User logged in successfully");
    } else {
      this.log("❌ User login failed:", result.error);
    }
    return result;
  }

  async testAnonymousRolls() {
    this.log("🎲 Testing anonymous rolls (public pool)...");

    const testCases = [
      { name: "Single d6 roll", dice: { d6: 1 } },
      { name: "Multiple dice roll", dice: { d6: 3, d20: 2, d4: 1 } },
      { name: "Large roll", dice: { d6: 10, d20: 5 } },
      {
        name: "All die types",
        dice: { d4: 2, d6: 2, d8: 2, d10: 2, d12: 2, d20: 2, d100: 2 },
      },
    ];

    for (const testCase of testCases) {
      this.log(`Testing: ${testCase.name}`);
      const result = await this.makeRequest("POST", "/dice/roll", {
        diceQuantities: testCase.dice,
      });

      if (result.success) {
        this.log(`✅ ${testCase.name} successful:`, {
          rolls: result.data.rolls.length,
          grandTotal: result.data.grandTotal,
          duration: result.data.duration,
        });
      } else {
        this.log(`❌ ${testCase.name} failed:`, result.error);
      }
    }
  }

  async testAuthenticatedRolls() {
    this.log("🎲 Testing authenticated rolls (user pool)...");

    if (!this.authToken) {
      this.log("❌ No auth token available");
      return;
    }

    const testCases = [
      { name: "Single d20 roll", dice: { d20: 1 } },
      { name: "Multiple dice roll", dice: { d6: 5, d12: 3 } },
      { name: "Large roll", dice: { d6: 20, d20: 10 } },
      {
        name: "All die types",
        dice: { d4: 3, d6: 3, d8: 3, d10: 3, d12: 3, d20: 3, d100: 3 },
      },
    ];

    for (const testCase of testCases) {
      this.log(`Testing: ${testCase.name}`);
      const result = await this.makeRequest(
        "POST",
        "/dice/roll",
        {
          diceQuantities: testCase.dice,
        },
        {
          Authorization: `Bearer ${this.authToken}`,
        }
      );

      if (result.success) {
        this.log(`✅ ${testCase.name} successful:`, {
          rolls: result.data.rolls.length,
          grandTotal: result.data.grandTotal,
          duration: result.data.duration,
        });
      } else {
        this.log(`❌ ${testCase.name} failed:`, result.error);
      }
    }
  }

  async testDailyLimits() {
    this.log("📊 Testing daily limits for anonymous users...");

    let rollCount = 0;
    const maxRolls = 55; // Test beyond the 50 roll limit

    for (let i = 1; i <= maxRolls; i++) {
      const result = await this.makeRequest("POST", "/dice/roll", {
        diceQuantities: { d6: 1 },
      });

      if (result.success) {
        rollCount++;
        if (i % 10 === 0) {
          this.log(`✅ Roll ${i} successful (${rollCount} total)`);
        }
      } else {
        this.log(`❌ Roll ${i} failed (expected at limit):`, result.error);
        break;
      }
    }

    this.log(`📈 Total successful rolls: ${rollCount}/50 expected`);
  }

  async testPoolStatus() {
    this.log("📊 Testing pool status endpoints...");

    // Test public pool status
    this.log("Testing public pool status...");
    const publicStatus = await this.makeRequest("GET", "/dice/pools/public");
    if (publicStatus.success) {
      this.log("✅ Public pool status:", publicStatus.data);
    } else {
      this.log("❌ Public pool status failed:", publicStatus.error);
    }

    // Test user pool status (requires auth)
    if (this.authToken) {
      this.log("Testing user pool status...");
      const userStatus = await this.makeRequest(
        "GET",
        "/dice/pools/user",
        null,
        {
          Authorization: `Bearer ${this.authToken}`,
        }
      );
      if (userStatus.success) {
        this.log("✅ User pool status:", userStatus.data);
      } else {
        this.log("❌ User pool status failed:", userStatus.error);
      }
    }
  }

  async testUsageStats() {
    this.log("📈 Testing usage statistics...");

    const stats = await this.makeRequest("GET", "/dice/stats");
    if (stats.success) {
      this.log("✅ Service stats:", stats.data);
    } else {
      this.log("❌ Service stats failed:", stats.error);
    }

    const monitor = await this.makeRequest("GET", "/dice/monitor");
    if (monitor.success) {
      this.log("✅ Monitor data:", monitor.data);
    } else {
      this.log("❌ Monitor data failed:", monitor.error);
    }
  }

  async testConcurrentRolls() {
    this.log("⚡ Testing concurrent rolls...");

    const concurrentRolls = 10;
    const promises = [];

    for (let i = 0; i < concurrentRolls; i++) {
      promises.push(
        this.makeRequest("POST", "/dice/roll", {
          diceQuantities: { d6: 1 },
        })
      );
    }

    const results = await Promise.all(promises);
    const successful = results.filter((r) => r.success).length;

    this.log(
      `✅ Concurrent rolls: ${successful}/${concurrentRolls} successful`
    );
  }

  async testPoolRefill() {
    this.log("🔄 Testing pool refill...");

    // Make many rolls to potentially trigger refill
    const rollsToTriggerRefill = 100;

    for (let i = 1; i <= rollsToTriggerRefill; i++) {
      const result = await this.makeRequest("POST", "/dice/roll", {
        diceQuantities: { d6: 1 },
      });

      if (!result.success) {
        this.log(`❌ Roll ${i} failed:`, result.error);
        break;
      }

      if (i % 20 === 0) {
        this.log(`✅ Completed ${i} rolls`);
      }
    }

    // Check pool status after refill
    const status = await this.makeRequest("GET", "/dice/pools/public");
    if (status.success) {
      this.log("✅ Pool status after refill:", status.data.poolStatus.d6);
    }
  }

  async runAllTests() {
    this.log("🚀 Starting comprehensive pool testing...");

    try {
      // 1. Test anonymous rolls
      await this.testAnonymousRolls();

      // 2. Test daily limits
      await this.testDailyLimits();

      // 3. Test concurrent rolls
      await this.testConcurrentRolls();

      // 4. Test pool refill
      await this.testPoolRefill();

      // 5. Register and login user
      await this.registerUser();
      await this.loginUser();

      // 6. Test authenticated rolls
      await this.testAuthenticatedRolls();

      // 7. Test pool status endpoints
      await this.testPoolStatus();

      // 8. Test usage statistics
      await this.testUsageStats();

      this.log("🎉 All tests completed!");
    } catch (error) {
      this.log("❌ Test suite failed:", error.message);
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new PoolTester();
  tester.runAllTests();
}

module.exports = PoolTester;
