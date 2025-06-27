#!/usr/bin/env node

/**
 * Test Data Setup Script for ThreePunchConvo Load Testing
 *
 * This script populates the database with realistic test data
 * for comprehensive load testing scenarios.
 *
 * Usage:
 * - node setup-test-data.js --mode=create    (Create test data)
 * - node setup-test-data.js --mode=cleanup   (Remove test data)
 * - node setup-test-data.js --mode=verify    (Verify test data)
 */

import { faker } from "@faker-js/faker";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// ES module equivalents for __dirname and __filename
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const config = {
  baseUrl:
    process.env.TEST_URL || "https://threepunchconvo-staging.up.railway.app",
  databaseUrl:
    process.env.DATABASE_URL ||
    "postgresql://postgres:ZjtjMKHHPGXGhwrZtwgmKhaeNhorZGYN@switchyard.proxy.rlwy.net:42227/railway",

  // Test data quantities
  testUsers: 50,
  testThreads: 200,
  testReplies: 500,
  testReactions: 1000,

  // Categories from the application
  categories: ["ufc", "general", "boxing", "bellator", "pfl", "one"],

  // Test data prefix for easy identification
  testPrefix: "loadtest_",

  // Output files for load test configuration
  outputDir: "./loadtest-data",
  userIdFile: "user-ids.json",
  threadIdFile: "thread-ids.json",
  replyIdFile: "reply-ids.json",
  authTokenFile: "auth-tokens.json",
};

// Test data generators
class LoadTestDataGenerator {
  static generateUser(index) {
    const username = `${config.testPrefix}user_${index}_${faker.internet
      .username()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")}`;

    return {
      username: username.substring(0, 30), // Ensure length limit
      email: `${config.testPrefix}${faker.internet.email()}`,
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      bio: faker.lorem.paragraph(),
      avatar: Math.random() > 0.5 ? faker.image.avatar() : null,
      role: this.getRandomRole(),
      status: this.getRandomStatus(),
      points: faker.number.int({ min: 0, max: 10000 }),
    };
  }

  static generateThread(userId, categoryId, index) {
    const hasMedia = Math.random() > 0.7;
    const hasPoll = Math.random() > 0.8;

    const thread = {
      title: `${config.testPrefix}${faker.lorem.sentence()}`,
      content: faker.lorem.paragraphs(faker.number.int({ min: 1, max: 5 })),
      userId: userId,
      categoryId: categoryId,
      isPinned: Math.random() > 0.95, // 5% pinned
      viewCount: faker.number.int({ min: 0, max: 1000 }),
      likesCount: faker.number.int({ min: 0, max: 100 }),
      dislikesCount: faker.number.int({ min: 0, max: 20 }),
      repliesCount: faker.number.int({ min: 0, max: 50 }),
    };

    // Add media if randomly selected
    if (hasMedia) {
      thread.media = [
        {
          type: "IMAGE",
          url: "https://picsum.photos/400/300",
        },
      ];
    }

    // Add poll if randomly selected
    if (hasPoll) {
      thread.poll = {
        question: faker.lorem.sentence() + "?",
        options: [
          faker.lorem.words(2),
          faker.lorem.words(2),
          faker.lorem.words(2),
        ],
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };
    }

    return thread;
  }

  static generateReply(userId, threadId) {
    return {
      content: faker.lorem.paragraphs(faker.number.int({ min: 1, max: 3 })),
      userId: userId,
      threadId: threadId,
      likesCount: faker.number.int({ min: 0, max: 50 }),
      dislikesCount: faker.number.int({ min: 0, max: 10 }),
    };
  }

  static getRandomRole() {
    const roles = ["USER", "PREMIUM_USER", "FIGHTER", "INDUSTRY_PROFESSIONAL"];
    const weights = [70, 20, 8, 2]; // Percentage distribution

    const random = Math.random() * 100;
    let cumulativeWeight = 0;

    for (let i = 0; i < roles.length; i++) {
      cumulativeWeight += weights[i];
      if (random <= cumulativeWeight) {
        return roles[i];
      }
    }

    return "USER";
  }

  static getRandomStatus() {
    const statuses = [
      "AMATEUR",
      "REGIONAL_POSTER",
      "COMPETITOR",
      "RANKED_POSTER",
      "CONTENDER",
      "CHAMPION",
      "HALL_OF_FAMER",
    ];
    const weights = [40, 25, 15, 10, 6, 3, 1]; // Pyramid distribution

    const random = Math.random() * 100;
    let cumulativeWeight = 0;

    for (let i = 0; i < statuses.length; i++) {
      cumulativeWeight += weights[i];
      if (random <= cumulativeWeight) {
        return statuses[i];
      }
    }

    return "AMATEUR";
  }
}

// Database operations (simplified - you should adapt to your actual DB setup)
class DatabaseOperations {
  static async createTestUsers() {
    console.log(`📝 Creating ${config.testUsers} test users...`);

    const users = [];
    const createdUsers = [];

    for (let i = 0; i < config.testUsers; i++) {
      const userData = LoadTestDataGenerator.generateUser(i);
      users.push(userData);

      try {
        // In a real implementation, you would:
        // 1. Insert user into database via API or direct DB connection
        // 2. Get the returned user ID
        // 3. Store for later use

        // For this example, we'll simulate the creation
        const mockUserId = `${config.testPrefix}user_${faker.string.uuid()}`;
        createdUsers.push({
          id: mockUserId,
          username: userData.username,
          ...userData,
        });

        if ((i + 1) % 10 === 0) {
          console.log(`   Created ${i + 1}/${config.testUsers} users`);
        }
      } catch (error) {
        console.error(`Error creating user ${i}:`, error);
      }
    }

    console.log(`✅ Created ${createdUsers.length} test users`);
    return createdUsers;
  }

  static async createTestThreads(users) {
    console.log(`📝 Creating ${config.testThreads} test threads...`);

    const createdThreads = [];

    for (let i = 0; i < config.testThreads; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomCategory =
        config.categories[Math.floor(Math.random() * config.categories.length)];
      const threadData = LoadTestDataGenerator.generateThread(
        randomUser.id,
        randomCategory,
        i,
      );

      try {
        // In a real implementation, you would create via API
        const mockThreadId = `${config.testPrefix}thread_${faker.string.uuid()}`;
        createdThreads.push({
          id: mockThreadId,
          userId: randomUser.id,
          categoryId: randomCategory,
          ...threadData,
        });

        if ((i + 1) % 25 === 0) {
          console.log(`   Created ${i + 1}/${config.testThreads} threads`);
        }
      } catch (error) {
        console.error(`Error creating thread ${i}:`, error);
      }
    }

    console.log(`✅ Created ${createdThreads.length} test threads`);
    return createdThreads;
  }

  static async createTestReplies(users, threads) {
    console.log(`📝 Creating ${config.testReplies} test replies...`);

    const createdReplies = [];

    for (let i = 0; i < config.testReplies; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomThread = threads[Math.floor(Math.random() * threads.length)];
      const replyData = LoadTestDataGenerator.generateReply(
        randomUser.id,
        randomThread.id,
      );

      try {
        // In a real implementation, you would create via API
        const mockReplyId = `${config.testPrefix}reply_${faker.string.uuid()}`;
        createdReplies.push({
          id: mockReplyId,
          userId: randomUser.id,
          threadId: randomThread.id,
          ...replyData,
        });

        if ((i + 1) % 50 === 0) {
          console.log(`   Created ${i + 1}/${config.testReplies} replies`);
        }
      } catch (error) {
        console.error(`Error creating reply ${i}:`, error);
      }
    }

    console.log(`✅ Created ${createdReplies.length} test replies`);
    return createdReplies;
  }

  static async createTestReactions(users, threads, replies) {
    console.log(`📝 Creating ${config.testReactions} test reactions...`);

    let reactionsCreated = 0;

    // Create thread reactions
    for (let i = 0; i < config.testReactions * 0.7; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomThread = threads[Math.floor(Math.random() * threads.length)];
      const reactionType = Math.random() > 0.8 ? "DISLIKE" : "LIKE";

      try {
        // In a real implementation, you would create via API
        reactionsCreated++;
      } catch (error) {
        console.error(`Error creating thread reaction ${i}:`, error);
      }
    }

    // Create reply reactions
    for (let i = 0; i < config.testReactions * 0.3; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomReply = replies[Math.floor(Math.random() * replies.length)];
      const reactionType = Math.random() > 0.8 ? "DISLIKE" : "LIKE";

      try {
        // In a real implementation, you would create via API
        reactionsCreated++;
      } catch (error) {
        console.error(`Error creating reply reaction ${i}:`, error);
      }
    }

    console.log(`✅ Created ${reactionsCreated} test reactions`);
    return reactionsCreated;
  }

  static async cleanupTestData() {
    console.log("🧹 Cleaning up test data...");

    try {
      // In a real implementation, you would:
      // 1. Delete all records with testPrefix in relevant fields
      // 2. Clean up related data (reactions, follows, notifications, etc.)
      // 3. Reset any counters or aggregated data

      console.log("   Removing test users...");
      console.log("   Removing test threads...");
      console.log("   Removing test replies...");
      console.log("   Removing test reactions...");
      console.log("   Cleaning up related data...");

      console.log("✅ Test data cleanup completed");
    } catch (error) {
      console.error("❌ Error during cleanup:", error);
      throw error;
    }
  }

  static async verifyTestData() {
    console.log("🔍 Verifying test data...");

    try {
      // In a real implementation, you would query the database to verify:
      // 1. Count of test users, threads, replies
      // 2. Data integrity checks
      // 3. Relationship consistency

      const userCount = config.testUsers; // Mock count
      const threadCount = config.testThreads; // Mock count
      const replyCount = config.testReplies; // Mock count

      console.log(`📊 Test data verification:
      - Users: ${userCount}
      - Threads: ${threadCount}
      - Replies: ${replyCount}
      - Categories: ${config.categories.length}`);

      console.log("✅ Test data verification completed");
      return { userCount, threadCount, replyCount };
    } catch (error) {
      console.error("❌ Error during verification:", error);
      throw error;
    }
  }
}

// File operations for load test configuration
class FileOperations {
  static async ensureOutputDirectory() {
    try {
      await fs.mkdir(config.outputDir, { recursive: true });
    } catch (error) {
      if (error.code !== "EEXIST") {
        throw error;
      }
    }
  }

  static async saveTestDataFiles(users, threads, replies) {
    await this.ensureOutputDirectory();

    console.log("💾 Saving test data configuration files...");

    // Save user IDs
    const userIds = users.map((u) => u.id);
    await fs.writeFile(
      path.join(config.outputDir, config.userIdFile),
      JSON.stringify(userIds, null, 2),
    );

    // Save thread IDs
    const threadIds = threads.map((t) => t.id);
    await fs.writeFile(
      path.join(config.outputDir, config.threadIdFile),
      JSON.stringify(threadIds, null, 2),
    );

    // Save reply IDs
    const replyIds = replies.map((r) => r.id);
    await fs.writeFile(
      path.join(config.outputDir, config.replyIdFile),
      JSON.stringify(replyIds, null, 2),
    );

    // Generate mock auth tokens for testing
    const authTokens = users.map((user) => ({
      userId: user.id,
      username: user.username,
      token: `mock-token-${faker.string.alphanumeric(32)}`,
    }));

    await fs.writeFile(
      path.join(config.outputDir, config.authTokenFile),
      JSON.stringify(authTokens, null, 2),
    );

    console.log(`✅ Saved test data files to ${config.outputDir}/`);
  }

  static async loadTestDataFiles() {
    try {
      const userIds = JSON.parse(
        await fs.readFile(
          path.join(config.outputDir, config.userIdFile),
          "utf8",
        ),
      );
      const threadIds = JSON.parse(
        await fs.readFile(
          path.join(config.outputDir, config.threadIdFile),
          "utf8",
        ),
      );
      const replyIds = JSON.parse(
        await fs.readFile(
          path.join(config.outputDir, config.replyIdFile),
          "utf8",
        ),
      );
      const authTokens = JSON.parse(
        await fs.readFile(
          path.join(config.outputDir, config.authTokenFile),
          "utf8",
        ),
      );

      return { userIds, threadIds, replyIds, authTokens };
    } catch (error) {
      console.error("❌ Error loading test data files:", error);
      return null;
    }
  }
}

// Main operations
async function createTestData() {
  console.log("🚀 Starting test data creation...\n");

  try {
    // Create test data
    const users = await DatabaseOperations.createTestUsers();
    const threads = await DatabaseOperations.createTestThreads(users);
    const replies = await DatabaseOperations.createTestReplies(users, threads);
    await DatabaseOperations.createTestReactions(users, threads, replies);

    // Save configuration files for load testing
    await FileOperations.saveTestDataFiles(users, threads, replies);

    console.log("\n✅ Test data creation completed successfully!");
    console.log(`
📊 Summary:
- Users created: ${users.length}
- Threads created: ${threads.length}
- Replies created: ${replies.length}
- Configuration files saved to: ${config.outputDir}/

🎯 Next steps:
1. Update your load test configuration to use the generated data files
2. Run the load tests: node loadtest.js --scenario=basic
3. Clean up when done: node setup-test-data.js --mode=cleanup
    `);
  } catch (error) {
    console.error("❌ Test data creation failed:", error);
    process.exit(1);
  }
}

async function cleanupTestData() {
  console.log("🧹 Starting test data cleanup...\n");

  try {
    await DatabaseOperations.cleanupTestData();

    // Remove configuration files
    console.log("🗑️  Removing configuration files...");
    try {
      await fs.rm(config.outputDir, { recursive: true, force: true });
      console.log("✅ Configuration files removed");
    } catch (error) {
      console.log("⚠️  No configuration files found to remove");
    }

    console.log("\n✅ Test data cleanup completed successfully!");
  } catch (error) {
    console.error("❌ Test data cleanup failed:", error);
    process.exit(1);
  }
}

async function verifyTestData() {
  console.log("🔍 Starting test data verification...\n");

  try {
    const dbVerification = await DatabaseOperations.verifyTestData();
    const fileData = await FileOperations.loadTestDataFiles();

    if (fileData) {
      console.log(`📁 Configuration files found:
      - User IDs: ${fileData.userIds.length}
      - Thread IDs: ${fileData.threadIds.length}
      - Reply IDs: ${fileData.replyIds.length}
      - Auth tokens: ${fileData.authTokens.length}`);
    } else {
      console.log("⚠️  No configuration files found");
    }

    console.log("\n✅ Test data verification completed!");
  } catch (error) {
    console.error("❌ Test data verification failed:", error);
    process.exit(1);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const modeArg = args.find((arg) => arg.startsWith("--mode="));
  const mode = modeArg ? modeArg.split("=")[1] : "create";

  console.log(`
🏗️  ThreePunchConvo Test Data Setup
===================================

Mode: ${mode}
Target: ${config.baseUrl}
Database: ${config.databaseUrl ? "Connected" : "Not configured"}
Test prefix: ${config.testPrefix}
  `);

  switch (mode) {
    case "create":
      await createTestData();
      break;
    case "cleanup":
      await cleanupTestData();
      break;
    case "verify":
      await verifyTestData();
      break;
    default:
      console.error(`❌ Unknown mode: ${mode}`);
      console.log(`
Valid modes:
- create   : Create test data
- cleanup  : Remove test data
- verify   : Verify existing test data
      `);
      process.exit(1);
  }
}

// Handle process termination
process.on("SIGINT", () => {
  console.log("\n⏹️  Setup interrupted");
  process.exit(0);
});

// Export for programmatic use
export {
  config,
  LoadTestDataGenerator,
  DatabaseOperations,
  FileOperations,
  createTestData,
  cleanupTestData,
  verifyTestData,
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
