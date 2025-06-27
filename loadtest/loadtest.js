#!/usr/bin/env node

/**
 * ThreePunchConvo Load Test Suite
 *
 * This comprehensive load test covers all major API endpoints of the MMA forum application.
 * It simulates realistic user behavior including authentication, posting, commenting, and social interactions.
 *
 * Prerequisites:
 * - npm install autocannon faker
 * - Set up environment variables for test server
 * - Ensure test database is populated with sample data
 *
 * Usage:
 * - node loadtest.js --scenario=basic     (Basic read-only tests)
 * - node loadtest.js --scenario=write     (Write operations)
 * - node loadtest.js --scenario=full      (Full test suite)
 * - node loadtest.js --scenario=custom    (Custom configuration)
 */

import autocannon from "autocannon";
import { faker } from "@faker-js/faker";
import { fileURLToPath } from "url";
import { dirname } from "path";

// ES module equivalents for __dirname and __filename
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const config = {
  baseUrl:
    process.env.TEST_URL || "https://threepunchconvo-staging.up.railway.app",
  duration: process.env.TEST_DURATION || 30, // seconds
  connections: process.env.TEST_CONNECTIONS || 10,
  pipelining: process.env.TEST_PIPELINING || 1,

  // Test data configuration
  testUsers: {
    count: 50,
    authTokens: [], // Will be populated during setup
  },

  // Sample category IDs (should match your database)
  categories: ["ufc", "general", "boxing", "bellator", "pfl", "one"],

  // Sample thread and user IDs (will be populated during setup)
  sampleThreadIds: [],
  sampleUserIds: [],
  sampleReplyIds: [],
};

// Test scenarios configuration
const scenarios = {
  basic: {
    name: "Basic Read Operations",
    duration: 30,
    connections: 10,
    tests: [
      "getTopUsers",
      "getThreadsByCategory",
      "getEvents",
      "getThreadById",
      "getThreadReplies",
    ],
  },

  write: {
    name: "Write Operations (Auth Required)",
    duration: 60,
    connections: 5,
    tests: ["createThread", "createReply", "likeThread", "followUser"],
    requiresAuth: true,
  },

  noauth: {
    name: "Public Endpoints (No Auth)",
    duration: 60,
    connections: 15,
    tests: [
      "getTopUsers",
      "getThreadsByCategory",
      "getEvents",
      "getThreadById",
      "getThreadReplies",
      "getUserProfile",
      "getUserPosts",
      "getUserFollowers",
    ],
  },

  mass_posting: {
    name: "Mass Posting - 200 Concurrent Users",
    duration: 30,
    connections: 200,
    tests: ["createThread", "createReply"],
    requiresAuth: true,
    description:
      "Simulates 200 users posting threads and replies simultaneously",
  },

  realistic_load: {
    name: "Realistic Load - 200 Concurrent Users Browsing",
    duration: 60,
    connections: 200,
    tests: [
      "getTopUsers",
      "getThreadsByCategory",
      "getThreadById",
      "getThreadReplies",
      "getUserProfile",
      "getUserPosts",
      "getEvents",
    ],
    description:
      "Simulates 200 users browsing the forum simultaneously (read-heavy workload)",
  },

  mixed_traffic: {
    name: "Mixed Traffic - 200 Users (90% read, 10% write)",
    duration: 90,
    connections: 200,
    tests: "mixed",
    requiresAuth: false,
    description:
      "Realistic traffic pattern: mostly reading with some posting attempts",
  },

  full: {
    name: "Full Load Test Suite",
    duration: 120,
    connections: 20,
    tests: "all",
  },

  custom: {
    name: "Custom Load Test",
    duration: parseInt(process.env.CUSTOM_DURATION) || 60,
    connections: parseInt(process.env.CUSTOM_CONNECTIONS) || 15,
    tests: process.env.CUSTOM_TESTS
      ? process.env.CUSTOM_TESTS.split(",")
      : "all",
  },
};

// Test data generators
class TestDataGenerator {
  static generateUser() {
    return {
      username:
        faker.internet
          .username()
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "") + Math.random().toString(36).substring(7),
      email: faker.internet.email(),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      bio: faker.lorem.paragraph(),
    };
  }

  static generateThread(userId, categoryId) {
    return {
      title: faker.lorem.sentence(),
      content: faker.lorem.paragraphs(3),
      userId: userId,
      categoryId: categoryId,
      media:
        Math.random() > 0.7
          ? [
              {
                type: "IMAGE",
                url: "https://picsum.photos/400/300",
              },
            ]
          : undefined,
      poll:
        Math.random() > 0.8
          ? {
              question: faker.lorem.sentence() + "?",
              options: [
                faker.lorem.words(2),
                faker.lorem.words(2),
                faker.lorem.words(2),
              ],
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            }
          : undefined,
    };
  }

  static generateReply(userId, threadId) {
    return {
      content: faker.lorem.paragraphs(2),
      userId: userId,
      threadId: threadId,
    };
  }
}

// Individual test functions
const tests = {
  // ==================== READ OPERATIONS ====================

  async getTopUsers() {
    return {
      url: `${config.baseUrl}/api/users/top?limit=20`,
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    };
  },

  async getThreadsByCategory() {
    const category =
      config.categories[Math.floor(Math.random() * config.categories.length)];
    const sort = ["recent", "popular", "trending"][
      Math.floor(Math.random() * 3)
    ];
    return {
      url: `${config.baseUrl}/api/threads/${category}?sort=${sort}&limit=20&offset=${Math.floor(Math.random() * 100)}`,
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    };
  },

  async getThreadById() {
    if (config.sampleThreadIds.length === 0) return null;
    const threadId =
      config.sampleThreadIds[
        Math.floor(Math.random() * config.sampleThreadIds.length)
      ];
    return {
      url: `${config.baseUrl}/api/threads/id/${threadId}`,
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    };
  },

  async getThreadReplies() {
    if (config.sampleThreadIds.length === 0) return null;
    const threadId =
      config.sampleThreadIds[
        Math.floor(Math.random() * config.sampleThreadIds.length)
      ];
    return {
      url: `${config.baseUrl}/api/threads/${threadId}/replies`,
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    };
  },

  async getUserProfile() {
    if (config.sampleUserIds.length === 0) return null;
    const userId =
      config.sampleUserIds[
        Math.floor(Math.random() * config.sampleUserIds.length)
      ];
    return {
      url: `${config.baseUrl}/api/users/${userId}`,
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    };
  },

  async getUserPosts() {
    if (config.sampleUserIds.length === 0) return null;
    const userId =
      config.sampleUserIds[
        Math.floor(Math.random() * config.sampleUserIds.length)
      ];
    return {
      url: `${config.baseUrl}/api/users/${userId}/posts`,
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    };
  },

  async getUserFollowers() {
    if (config.sampleUserIds.length === 0) return null;
    const userId =
      config.sampleUserIds[
        Math.floor(Math.random() * config.sampleUserIds.length)
      ];
    return {
      url: `${config.baseUrl}/api/users/${userId}/followers`,
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    };
  },

  async getEvents() {
    return {
      url: `${config.baseUrl}/api/events?limit=10&offset=${Math.floor(Math.random() * 50)}`,
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    };
  },

  async getNotifications() {
    const authToken = getRandomAuthToken();
    if (!authToken) return null;

    return {
      url: `${config.baseUrl}/api/notifications`,
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    };
  },

  // ==================== WRITE OPERATIONS (Authenticated) ====================

  async createThread() {
    const authToken = getRandomAuthToken();
    const userId = getRandomUserId();
    if (!authToken || !userId) return null;

    const categoryId =
      config.categories[Math.floor(Math.random() * config.categories.length)];
    const threadData = TestDataGenerator.generateThread(userId, categoryId);

    return {
      url: `${config.baseUrl}/api/threads`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(threadData),
    };
  },

  async createReply() {
    const authToken = getRandomAuthToken();
    const userId = getRandomUserId();
    if (!authToken || !userId || config.sampleThreadIds.length === 0)
      return null;

    const threadId =
      config.sampleThreadIds[
        Math.floor(Math.random() * config.sampleThreadIds.length)
      ];
    const replyData = TestDataGenerator.generateReply(userId, threadId);

    return {
      url: `${config.baseUrl}/api/threads/${threadId}/replies`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(replyData),
    };
  },

  async likeThread() {
    const authToken = getRandomAuthToken();
    const userId = getRandomUserId();
    if (!authToken || !userId || config.sampleThreadIds.length === 0)
      return null;

    const threadId =
      config.sampleThreadIds[
        Math.floor(Math.random() * config.sampleThreadIds.length)
      ];

    return {
      url: `${config.baseUrl}/api/threads/${threadId}/like`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ userId }),
    };
  },

  async dislikeThread() {
    const authToken = getRandomAuthToken();
    const userId = getRandomUserId();
    if (!authToken || !userId || config.sampleThreadIds.length === 0)
      return null;

    const threadId =
      config.sampleThreadIds[
        Math.floor(Math.random() * config.sampleThreadIds.length)
      ];

    return {
      url: `${config.baseUrl}/api/threads/${threadId}/dislike`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ userId }),
    };
  },

  async potdThread() {
    const authToken = getRandomAuthToken();
    const userId = getRandomUserId();
    if (!authToken || !userId || config.sampleThreadIds.length === 0)
      return null;

    const threadId =
      config.sampleThreadIds[
        Math.floor(Math.random() * config.sampleThreadIds.length)
      ];

    return {
      url: `${config.baseUrl}/api/threads/${threadId}/potd`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ userId }),
    };
  },

  async likeReply() {
    const authToken = getRandomAuthToken();
    const userId = getRandomUserId();
    if (!authToken || !userId || config.sampleReplyIds.length === 0)
      return null;

    const replyId =
      config.sampleReplyIds[
        Math.floor(Math.random() * config.sampleReplyIds.length)
      ];

    return {
      url: `${config.baseUrl}/api/replies/${replyId}/like`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ userId }),
    };
  },

  async followUser() {
    const authToken = getRandomAuthToken();
    const followerId = getRandomUserId();
    if (!authToken || !followerId || config.sampleUserIds.length < 2)
      return null;

    const followingId =
      config.sampleUserIds[
        Math.floor(Math.random() * config.sampleUserIds.length)
      ];
    if (followerId === followingId) return null; // Can't follow yourself

    return {
      url: `${config.baseUrl}/api/users/${followingId}/follow`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ followerId }),
    };
  },

  async votePoll() {
    const authToken = getRandomAuthToken();
    const userId = getRandomUserId();
    if (!authToken || !userId || config.sampleThreadIds.length === 0)
      return null;

    const threadId =
      config.sampleThreadIds[
        Math.floor(Math.random() * config.sampleThreadIds.length)
      ];
    // This is a simplified version - in reality, you'd need to get poll options first
    const optionId = faker.string.uuid();

    return {
      url: `${config.baseUrl}/api/threads/${threadId}/poll/${optionId}/vote`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ userId }),
    };
  },

  async markNotificationRead() {
    const authToken = getRandomAuthToken();
    if (!authToken) return null;

    const notificationId = faker.string.uuid(); // Simplified

    return {
      url: `${config.baseUrl}/api/notifications/read/${notificationId}`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    };
  },
};

// Helper functions
function getRandomAuthToken() {
  if (config.testUsers.authTokens.length === 0) return null;
  return config.testUsers.authTokens[
    Math.floor(Math.random() * config.testUsers.authTokens.length)
  ];
}

function getRandomUserId() {
  if (config.sampleUserIds.length === 0) return null;
  return config.sampleUserIds[
    Math.floor(Math.random() * config.sampleUserIds.length)
  ];
}

// Test weights (higher = more frequent)
function getTestWeight(testName) {
  const weights = {
    // High frequency - typical user browsing
    getTopUsers: 10,
    getThreadsByCategory: 15,
    getThreadById: 12,
    getThreadReplies: 8,
    getUserProfile: 6,
    getEvents: 5,

    // Medium frequency - engaged users
    getUserPosts: 4,
    getUserFollowers: 3,
    getNotifications: 7,
    likeThread: 8,
    dislikeThread: 2,

    // Lower frequency - content creation
    createThread: 3,
    createReply: 6,
    potdThread: 1,
    likeReply: 4,
    followUser: 2,
    votePoll: 2,
    markNotificationRead: 3,
  };

  return weights[testName] || 1;
}

// Setup functions
async function setupTestData() {
  console.log("🔧 Setting up test data...");

  try {
    // In a real scenario, you would:
    // 1. Create test users via API or directly in database
    // 2. Generate auth tokens for those users
    // 3. Create sample threads, replies, etc.
    // 4. Populate the config objects with real IDs

    console.log(
      "⚠️  Using mock test data. Replace with actual setup in production.",
    );

    // Mock setup - replace with real API calls
    // Generate more test data to support high-concurrency scenarios
    config.sampleUserIds = Array.from({ length: 200 }, () =>
      faker.string.uuid(),
    );
    config.sampleThreadIds = Array.from({ length: 500 }, () =>
      faker.string.uuid(),
    );
    config.sampleReplyIds = Array.from({ length: 1000 }, () =>
      faker.string.uuid(),
    );
    // Generate 200 auth tokens for mass posting scenario
    config.testUsers.authTokens = Array.from(
      { length: 200 },
      () => "mock-auth-token-" + faker.string.alphanumeric(32),
    );

    console.log(`✅ Test data setup complete:
    - Users: ${config.sampleUserIds.length}
    - Threads: ${config.sampleThreadIds.length}
    - Replies: ${config.sampleReplyIds.length}
    - Auth tokens: ${config.testUsers.authTokens.length}`);
  } catch (error) {
    console.error("❌ Error setting up test data:", error);
    throw error;
  }
}

async function runSingleTest(testName, options = {}) {
  console.log(`\n🧪 Running test: ${testName}`);

  const testFunction = tests[testName];
  if (!testFunction) {
    console.error(`❌ Test "${testName}" not found`);
    return;
  }

  const testConfig = await testFunction();
  if (!testConfig) {
    console.log(`⚠️  Skipping test "${testName}" - insufficient test data`);
    return;
  }

  // Log the request details for debugging
  console.log(`📝 Request: ${testConfig.method} ${testConfig.url}`);

  const result = await autocannon({
    url: testConfig.url,
    method: testConfig.method,
    headers: testConfig.headers,
    body: testConfig.body,
    connections: options.connections || 5,
    duration: options.duration || 10,
    pipelining: options.pipelining || 1,

    // Configure autocannon to handle redirects and provide more details
    followRedirects: true,
    maxRedirects: 5,

    // Add response tracking
    setupClient: (client) => {
      client.on("response", (statusCode, resBytes, responseTime) => {
        if (statusCode >= 300 && statusCode < 400) {
          console.log(`⚠️  Redirect detected: ${statusCode}`);
        } else if (statusCode >= 400) {
          console.log(`❌ Error response: ${statusCode}`);
        }
      });
    },

    ...options,
  });

  console.log(`✅ ${testName} completed:
    - Requests: ${result.requests.total}
    - RPS: ${result.requests.average}
    - Latency: ${result.latency.average}ms
    - Errors: ${result.errors}
    - 2xx responses: ${result["2xx"] || "N/A"}
    - 3xx responses: ${result["3xx"] || "N/A"}
    - 4xx responses: ${result["4xx"] || "N/A"}
    - 5xx responses: ${result["5xx"] || "N/A"}`);

  return result;
}

async function runScenario(scenarioName) {
  console.log(`\n🚀 Starting scenario: ${scenarioName}`);

  const scenario = scenarios[scenarioName];
  if (!scenario) {
    console.error(`❌ Scenario "${scenarioName}" not found`);
    return;
  }

  console.log(`📊 Scenario: ${scenario.name}
    - Duration: ${scenario.duration}s
    - Connections: ${scenario.connections}
    - Tests: ${Array.isArray(scenario.tests) ? scenario.tests.join(", ") : scenario.tests}
    ${scenario.description ? `- Description: ${scenario.description}` : ""}`);

  // Special handling for different scenario types
  if (scenarioName === "mass_posting") {
    return await runMassPostingScenario(scenario);
  }

  if (scenarioName === "realistic_load") {
    return await runRealisticLoadScenario(scenario);
  }

  if (scenarioName === "mixed_traffic") {
    return await runMixedTrafficScenario(scenario);
  }

  // Check if scenario requires authentication
  if (
    scenario.requiresAuth &&
    config.testUsers.authTokens.every((token) => token.startsWith("mock-"))
  ) {
    console.log(
      `⚠️  Warning: This scenario requires real authentication tokens.`,
    );
    console.log(
      `   Currently using mock tokens which will result in 302 redirects.`,
    );
    console.log(
      `   To test with real auth, set up actual user tokens in setupTestData().`,
    );
    console.log(`   Continuing with mock tokens - expect redirects...\n`);
  }

  const testNames =
    scenario.tests === "all" ? Object.keys(tests) : scenario.tests;

  if (testNames.length === 1) {
    // Single test
    return await runSingleTest(testNames[0], {
      connections: scenario.connections,
      duration: scenario.duration,
    });
  } else {
    // Run multiple tests sequentially with shorter durations
    const results = [];
    const individualDuration = Math.max(
      5,
      Math.floor(scenario.duration / testNames.length),
    );

    for (const testName of testNames) {
      console.log(`\n🔄 Running ${testName}...`);

      // Skip auth-required tests if we don't have real tokens and this isn't an auth scenario
      const testFunction = tests[testName];
      if (testFunction && !scenario.requiresAuth) {
        const testConfig = await testFunction();
        if (
          testConfig &&
          testConfig.headers &&
          testConfig.headers.Authorization &&
          testConfig.headers.Authorization.includes("mock-")
        ) {
          console.log(
            `⏭️  Skipping ${testName} - requires authentication (would cause 302 redirects)`,
          );
          continue;
        }
      }

      const result = await runSingleTest(testName, {
        connections: scenario.connections,
        duration: individualDuration,
      });
      if (result) {
        results.push(result);
      }

      // Brief pause between tests
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    if (results.length === 0) {
      console.log(
        `⚠️  No tests completed successfully in scenario "${scenarioName}"`,
      );
      return null;
    }

    // Aggregate results
    const totalRequests = results.reduce((sum, r) => sum + r.requests.total, 0);
    const avgRPS =
      results.reduce((sum, r) => sum + r.requests.average, 0) / results.length;
    const avgLatency =
      results.reduce((sum, r) => sum + r.latency.average, 0) / results.length;
    const totalErrors = results.reduce((sum, r) => sum + r.errors, 0);

    console.log(`✅ Scenario "${scenarioName}" completed:
      - Total Requests: ${totalRequests}
      - Average RPS: ${avgRPS.toFixed(2)}
      - Average Latency: ${avgLatency.toFixed(2)}ms
      - Total Errors: ${totalErrors}
      - Tests Run: ${results.length}`);

    return {
      requests: { total: totalRequests, average: avgRPS },
      latency: { average: avgLatency },
      errors: totalErrors,
      throughput: { average: 0 }, // Placeholder
      results: results,
    };
  }
}

// Specialized function for mass posting scenario
async function runMassPostingScenario(scenario) {
  console.log(
    `\n🚀 Starting MASS POSTING simulation with ${scenario.connections} concurrent users!`,
  );
  console.log(`⚠️  Warning: This will generate high load on your server.`);
  console.log(
    `   Make sure your server can handle ${scenario.connections} concurrent connections.`,
  );

  // Check if we have real auth tokens
  const hasRealAuth = config.testUsers.authTokens.some(
    (token) => !token.startsWith("mock-"),
  );

  if (!hasRealAuth) {
    console.log(`\n❌ AUTHENTICATION ISSUE:`);
    console.log(
      `   This scenario requires REAL authentication tokens to create actual posts.`,
    );
    console.log(
      `   Currently using mock tokens which will result in 302 redirects.`,
    );
    console.log(`\n💡 To test actual posting:`);
    console.log(`   1. Get real Clerk JWT tokens from your frontend`);
    console.log(`   2. Replace mock tokens in setupTestData() with real ones`);
    console.log(
      `   3. Or use 'realistic_load' scenario to test read operations`,
    );
    console.log(
      `\n🔄 Running test anyway to demonstrate server behavior under auth load...`,
    );
  }

  console.log(`   Press Ctrl+C to cancel within the next 5 seconds...`);

  // Give user a chance to cancel
  await new Promise((resolve) => setTimeout(resolve, 5000));

  console.log(`\n🎯 Starting mass posting test...`);

  const results = [];

  // Run createThread test with 200 connections
  console.log(`\n📝 Phase 1: 200 users creating threads simultaneously...`);
  const threadResult = await runSingleTest("createThread", {
    connections: scenario.connections,
    duration: Math.floor(scenario.duration / 2), // Half the duration for threads
    pipelining: 1, // Ensure each connection gets a fair share
  });

  if (threadResult) {
    results.push({ test: "createThread", ...threadResult });
  }

  // Brief pause to let server recover
  console.log(`\n⏸️  Pausing 3 seconds to let server process...`);
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Run createReply test with 200 connections
  console.log(`\n💬 Phase 2: 200 users creating replies simultaneously...`);
  const replyResult = await runSingleTest("createReply", {
    connections: scenario.connections,
    duration: Math.floor(scenario.duration / 2), // Half the duration for replies
    pipelining: 1,
  });

  if (replyResult) {
    results.push({ test: "createReply", ...replyResult });
  }

  // Aggregate and analyze results
  if (results.length > 0) {
    const totalRequests = results.reduce((sum, r) => sum + r.requests.total, 0);
    const avgRPS =
      results.reduce((sum, r) => sum + r.requests.average, 0) / results.length;
    const avgLatency =
      results.reduce((sum, r) => sum + r.latency.average, 0) / results.length;
    const totalErrors = results.reduce((sum, r) => sum + r.errors, 0);

    console.log(`\n🏁 MASS POSTING SIMULATION COMPLETED!`);
    console.log(`📊 Results for ${scenario.connections} concurrent users:`);

    if (hasRealAuth) {
      console.log(`   - Total Posts Created: ${totalRequests}`);
      console.log(`   - Average Posts/Second: ${avgRPS.toFixed(2)}`);
    } else {
      console.log(`   - Total Requests (redirects): ${totalRequests}`);
      console.log(`   - Average Redirects/Second: ${avgRPS.toFixed(2)}`);
      console.log(
        `   - Note: All requests were redirected due to auth - no actual posts created`,
      );
    }

    console.log(`   - Average Response Time: ${avgLatency.toFixed(2)}ms`);
    console.log(`   - Total Errors: ${totalErrors}`);
    console.log(
      `   - Success Rate: ${(((totalRequests - totalErrors) / totalRequests) * 100).toFixed(2)}%`,
    );

    // Performance analysis for mass posting
    if (totalErrors > totalRequests * 0.05) {
      console.log(
        `⚠️  HIGH ERROR RATE: ${((totalErrors / totalRequests) * 100).toFixed(2)}% of requests failed!`,
      );
      console.log(`   - Check server capacity and database connections`);
      console.log(`   - Consider implementing rate limiting`);
      console.log(
        `   - Monitor server resources (CPU, Memory, DB connections)`,
      );
    }

    if (avgLatency > 2000) {
      console.log(`⚠️  HIGH LATENCY: Average response time over 2 seconds!`);
      console.log(`   - Database may be overwhelmed`);
      console.log(`   - Consider connection pooling optimization`);
      console.log(`   - Check for database locks or slow queries`);
    }

    if (avgRPS < scenario.connections * 0.1) {
      console.log(
        `⚠️  LOW THROUGHPUT: Server handling much fewer requests than expected`,
      );
      console.log(
        `   - Expected: ~${(scenario.connections * 0.5).toFixed(0)} RPS`,
      );
      console.log(`   - Actual: ${avgRPS.toFixed(2)} RPS`);
      console.log(
        `   - Consider horizontal scaling or performance optimization`,
      );
    }

    return {
      requests: { total: totalRequests, average: avgRPS },
      latency: { average: avgLatency },
      errors: totalErrors,
      throughput: { average: 0 },
      results: results,
      scenario: "mass_posting",
      connections: scenario.connections,
    };
  }

  return null;
}

// Specialized function for realistic load scenario
async function runRealisticLoadScenario(scenario) {
  console.log(
    `\n🌐 Starting REALISTIC LOAD simulation with ${scenario.connections} concurrent users!`,
  );
  console.log(
    `📖 This simulates real users browsing the forum - all read operations`,
  );
  console.log(`🚀 Testing server's ability to handle high concurrent traffic`);

  // Give user a moment to read
  await new Promise((resolve) => setTimeout(resolve, 2000));

  console.log(`\n🎯 Starting realistic browsing simulation...`);

  const results = [];
  const testDuration = Math.floor(scenario.duration / scenario.tests.length);

  for (const testName of scenario.tests) {
    console.log(
      `\n📊 Running ${testName} with ${scenario.connections} concurrent users...`,
    );

    const result = await runSingleTest(testName, {
      connections: scenario.connections,
      duration: testDuration,
      pipelining: 1,
    });

    if (result) {
      results.push({ test: testName, ...result });

      // Show immediate results for this test
      console.log(
        `   ✅ ${testName}: ${result.requests.total} requests, ${result.requests.average.toFixed(2)} RPS, ${result.latency.average.toFixed(2)}ms avg`,
      );
    }

    // Brief pause between test types
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // Aggregate results
  if (results.length > 0) {
    const totalRequests = results.reduce((sum, r) => sum + r.requests.total, 0);
    const avgRPS =
      results.reduce((sum, r) => sum + r.requests.average, 0) / results.length;
    const avgLatency =
      results.reduce((sum, r) => sum + r.latency.average, 0) / results.length;
    const totalErrors = results.reduce((sum, r) => sum + r.errors, 0);

    console.log(`\n🏁 REALISTIC LOAD SIMULATION COMPLETED!`);
    console.log(
      `📊 Results for ${scenario.connections} concurrent browsing users:`,
    );
    console.log(`   - Total Page Views: ${totalRequests}`);
    console.log(`   - Average Requests/Second: ${avgRPS.toFixed(2)}`);
    console.log(`   - Average Response Time: ${avgLatency.toFixed(2)}ms`);
    console.log(`   - Total Errors: ${totalErrors}`);
    console.log(
      `   - Success Rate: ${(((totalRequests - totalErrors) / totalRequests) * 100).toFixed(2)}%`,
    );
    console.log(
      `   - Tests Completed: ${results.length}/${scenario.tests.length}`,
    );

    // Performance analysis
    if (avgLatency < 100) {
      console.log(`🚀 EXCELLENT: Sub-100ms response times under high load!`);
    } else if (avgLatency < 500) {
      console.log(
        `✅ GOOD: Response times under 500ms with ${scenario.connections} concurrent users`,
      );
    } else {
      console.log(`⚠️  SLOW: High response times may impact user experience`);
    }

    if (avgRPS > scenario.connections) {
      console.log(
        `🚀 EXCELLENT: Server handling more RPS than concurrent users (efficient connection reuse)`,
      );
    }

    // Show breakdown by test type
    console.log(`\n📋 Breakdown by operation:`);
    results.forEach((result) => {
      console.log(
        `   ${result.test}: ${result.requests.total} requests (${result.requests.average.toFixed(1)} RPS, ${result.latency.average.toFixed(1)}ms)`,
      );
    });

    return {
      requests: { total: totalRequests, average: avgRPS },
      latency: { average: avgLatency },
      errors: totalErrors,
      throughput: { average: 0 },
      results: results,
      scenario: "realistic_load",
      connections: scenario.connections,
    };
  }

  return null;
}

// Mixed traffic scenario - simulates realistic usage patterns
async function runMixedTrafficScenario(scenario) {
  console.log(
    `\n🌐 Starting MIXED TRAFFIC simulation with ${scenario.connections} concurrent users!`,
  );
  console.log(`📊 Realistic traffic: 90% read operations, 10% write attempts`);
  console.log(`🎯 This simulates actual forum usage patterns`);

  await new Promise((resolve) => setTimeout(resolve, 2000));

  console.log(`\n🎯 Starting mixed traffic simulation...`);

  const results = [];

  // Phase 1: Heavy read traffic (90% of time)
  const readPhaseTime = Math.floor(scenario.duration * 0.9);
  const writePhaseTime = scenario.duration - readPhaseTime;

  console.log(
    `\n📖 Phase 1: Read-heavy traffic (${readPhaseTime}s with ${scenario.connections} users)`,
  );

  const readTests = [
    "getTopUsers",
    "getThreadsByCategory",
    "getThreadById",
    "getThreadReplies",
    "getUserProfile",
    "getEvents",
  ];

  const readDuration = Math.floor(readPhaseTime / readTests.length);

  for (const testName of readTests) {
    console.log(`   📄 ${testName}...`);
    const result = await runSingleTest(testName, {
      connections: scenario.connections,
      duration: readDuration,
      pipelining: 2, // Higher pipelining for read operations
    });

    if (result) {
      results.push({ test: testName, phase: "read", ...result });
      console.log(
        `      ✅ ${result.requests.total} requests, ${result.requests.average.toFixed(1)} RPS`,
      );
    }
  }

  // Phase 2: Write attempts (10% of time, fewer connections)
  console.log(
    `\n✍️  Phase 2: Write attempts (${writePhaseTime}s with reduced connections)`,
  );
  console.log(
    `   Note: These will be redirected due to mock auth, but tests server under write load`,
  );

  const writeTests = ["createThread", "createReply"];
  const writeConnections = Math.floor(scenario.connections * 0.1); // Only 10% try to write
  const writeDuration = Math.floor(writePhaseTime / writeTests.length);

  for (const testName of writeTests) {
    console.log(`   ✏️  ${testName} (${writeConnections} users)...`);
    const result = await runSingleTest(testName, {
      connections: writeConnections,
      duration: writeDuration,
      pipelining: 1,
    });

    if (result) {
      results.push({ test: testName, phase: "write", ...result });
      console.log(
        `      ✅ ${result.requests.total} requests, ${result.requests.average.toFixed(1)} RPS`,
      );
    }
  }

  // Aggregate results
  if (results.length > 0) {
    const totalRequests = results.reduce((sum, r) => sum + r.requests.total, 0);
    const avgRPS =
      results.reduce((sum, r) => sum + r.requests.average, 0) / results.length;
    const avgLatency =
      results.reduce((sum, r) => sum + r.latency.average, 0) / results.length;
    const totalErrors = results.reduce((sum, r) => sum + r.errors, 0);

    const readResults = results.filter((r) => r.phase === "read");
    const writeResults = results.filter((r) => r.phase === "write");

    console.log(`\n🏁 MIXED TRAFFIC SIMULATION COMPLETED!`);
    console.log(`📊 Results for realistic traffic patterns:`);
    console.log(`   - Total Requests: ${totalRequests}`);
    console.log(`   - Average RPS: ${avgRPS.toFixed(2)}`);
    console.log(`   - Average Response Time: ${avgLatency.toFixed(2)}ms`);
    console.log(`   - Total Errors: ${totalErrors}`);
    console.log(
      `   - Success Rate: ${(((totalRequests - totalErrors) / totalRequests) * 100).toFixed(2)}%`,
    );

    if (readResults.length > 0) {
      const readRequests = readResults.reduce(
        (sum, r) => sum + r.requests.total,
        0,
      );
      const readRPS =
        readResults.reduce((sum, r) => sum + r.requests.average, 0) /
        readResults.length;
      console.log(`\n📖 Read Operations (${readResults.length} tests):`);
      console.log(
        `   - Requests: ${readRequests} (${((readRequests / totalRequests) * 100).toFixed(1)}%)`,
      );
      console.log(`   - Average RPS: ${readRPS.toFixed(2)}`);
    }

    if (writeResults.length > 0) {
      const writeRequests = writeResults.reduce(
        (sum, r) => sum + r.requests.total,
        0,
      );
      const writeRPS =
        writeResults.reduce((sum, r) => sum + r.requests.average, 0) /
        writeResults.length;
      console.log(`\n✍️  Write Attempts (${writeResults.length} tests):`);
      console.log(
        `   - Requests: ${writeRequests} (${((writeRequests / totalRequests) * 100).toFixed(1)}%)`,
      );
      console.log(`   - Average RPS: ${writeRPS.toFixed(2)}`);
      console.log(`   - Note: All redirected due to mock auth tokens`);
    }

    // Performance insights
    if (avgLatency < 200) {
      console.log(`\n🚀 EXCELLENT: Great performance under mixed load!`);
    } else if (avgLatency < 1000) {
      console.log(`\n✅ GOOD: Acceptable performance under mixed load`);
    } else {
      console.log(
        `\n⚠️  CONCERN: High latency under mixed load - consider optimization`,
      );
    }

    return {
      requests: { total: totalRequests, average: avgRPS },
      latency: { average: avgLatency },
      errors: totalErrors,
      throughput: { average: 0 },
      results: results,
      scenario: "mixed_traffic",
      connections: scenario.connections,
      readResults,
      writeResults,
    };
  }

  return null;
}

// Performance analysis
function analyzeResults(results) {
  console.log("\n📈 Performance Analysis:");

  if (Array.isArray(results)) {
    const totalRequests = results.reduce((sum, r) => sum + r.requests.total, 0);
    const avgRPS =
      results.reduce((sum, r) => sum + r.requests.average, 0) / results.length;
    const avgLatency =
      results.reduce((sum, r) => sum + r.latency.average, 0) / results.length;
    const totalErrors = results.reduce((sum, r) => sum + r.errors, 0);

    console.log(`
    📊 Aggregate Results:
    - Total Requests: ${totalRequests}
    - Average RPS: ${avgRPS.toFixed(2)}
    - Average Latency: ${avgLatency.toFixed(2)}ms
    - Total Errors: ${totalErrors}
    - Error Rate: ${((totalErrors / totalRequests) * 100).toFixed(2)}%
    `);
  } else if (results) {
    const errorRate = (results.errors / results.requests.total) * 100;
    console.log(`
    📊 Results:
    - Total Requests: ${results.requests.total}
    - Average RPS: ${results.requests.average}
    - Average Latency: ${results.latency.average}ms
    - Total Errors: ${results.errors}
    - Error Rate: ${errorRate.toFixed(2)}%
    - P95 Latency: ${results.latency.p95}ms
    - P99 Latency: ${results.latency.p99}ms
    `);

    // Performance recommendations
    if (errorRate > 5) {
      console.log(
        "⚠️  High error rate detected. Check server logs and capacity.",
      );
    }
    if (results.latency.average > 1000) {
      console.log(
        "⚠️  High latency detected. Consider optimizing database queries and caching.",
      );
    }
    if (results.requests.average < 100) {
      console.log(
        "💡 Low throughput. Consider horizontal scaling or performance optimization.",
      );
    }
  }
}

// Cleanup function
async function cleanup() {
  console.log("\n🧹 Cleaning up test data...");
  // Add cleanup logic here if needed
  // e.g., delete test users, threads, etc.
  console.log("✅ Cleanup completed");
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const scenarioArg = args.find((arg) => arg.startsWith("--scenario="));
  const scenario = scenarioArg ? scenarioArg.split("=")[1] : "basic";

  console.log(`
  🥊 ThreePunchConvo Load Test Suite
  ===================================
  
  Configuration:
  - Base URL: ${config.baseUrl}
  - Scenario: ${scenario}
  - Default Duration: ${config.duration}s
  - Default Connections: ${config.connections}
  `);

  try {
    // Setup
    await setupTestData();

    // Run tests
    let results;
    if (scenario === "all") {
      console.log("\n🎯 Running all scenarios...");
      results = [];
      for (const scenarioName of Object.keys(scenarios)) {
        const result = await runScenario(scenarioName);
        if (result) results.push(result);

        // Brief pause between scenarios
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    } else {
      results = await runScenario(scenario);
    }

    // Analysis
    analyzeResults(results);
  } catch (error) {
    console.error("❌ Load test failed:", error);
    process.exit(1);
  } finally {
    await cleanup();
  }

  console.log("\n🏁 Load test completed successfully!");
}

// Handle process termination
process.on("SIGINT", async () => {
  console.log("\n⏹️  Load test interrupted");
  await cleanup();
  process.exit(0);
});

// Export for programmatic use
export {
  config,
  scenarios,
  tests,
  runScenario,
  runSingleTest,
  setupTestData,
  cleanup,
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
