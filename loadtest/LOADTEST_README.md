# ThreePunchConvo Load Test Suite

A comprehensive load testing suite for the ThreePunchConvo MMA forum
application. This suite tests all major API endpoints and simulates realistic
user behavior patterns.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- A running instance of ThreePunchConvo server
- Database populated with test data

### Installation

```bash
# Install dependencies
npm install autocannon @faker-js/faker

# Or use the provided package.json
npm install -f loadtest-package.json
```

### Basic Usage

```bash
# Run basic read-only tests
node loadtest.js --scenario=basic

# Run write operation tests
node loadtest.js --scenario=write

# Run full test suite
node loadtest.js --scenario=full

# Run all scenarios sequentially
node loadtest.js --scenario=all
```

## 📊 Test Scenarios

### Basic Scenario

- **Duration**: 30 seconds
- **Connections**: 10 concurrent
- **Tests**: Read-only operations (top users, threads, events)
- **Use case**: Simulating typical user browsing

### Write Scenario

- **Duration**: 60 seconds
- **Connections**: 5 concurrent
- **Tests**: Content creation and interactions
- **Use case**: Simulating active user engagement

### Full Scenario

- **Duration**: 120 seconds
- **Connections**: 20 concurrent
- **Tests**: All available endpoints
- **Use case**: Comprehensive performance testing

### Custom Scenario

- **Duration**: Configurable
- **Connections**: Configurable
- **Tests**: Configurable
- **Use case**: Tailored testing scenarios

## 🎯 Tested Endpoints

### Read Operations

- `GET /api/users/top` - Top users leaderboard
- `GET /api/threads/:categoryId` - Threads by category
- `GET /api/threads/id/:id` - Individual thread details
- `GET /api/threads/:id/replies` - Thread replies
- `GET /api/users/:id` - User profiles
- `GET /api/users/:id/posts` - User posts
- `GET /api/users/:id/followers` - User followers
- `GET /api/events` - MMA events
- `GET /api/notifications` - User notifications

### Write Operations

- `POST /api/threads` - Create new thread
- `POST /api/threads/:id/replies` - Create reply
- `POST /api/threads/:id/like` - Like thread
- `POST /api/threads/:id/dislike` - Dislike thread
- `POST /api/threads/:id/potd` - Post of the Day
- `POST /api/replies/:id/like` - Like reply
- `POST /api/users/:id/follow` - Follow user
- `POST /api/threads/:id/poll/:optionId/vote` - Vote in poll
- `POST /api/notifications/read/:id` - Mark notification read

## ⚙️ Configuration

### Environment Variables

```bash
# Test target configuration
TEST_URL=http://localhost:5001              # Target server URL
TEST_DURATION=30                            # Test duration in seconds
TEST_CONNECTIONS=10                         # Concurrent connections
TEST_PIPELINING=1                           # Request pipelining factor

# Custom scenario configuration
CUSTOM_DURATION=60                          # Custom test duration
CUSTOM_CONNECTIONS=15                       # Custom concurrent connections
CUSTOM_TESTS=getTopUsers,createThread       # Comma-separated test names
```

### Test Data Configuration

The load test generates realistic test data using Faker.js:

- **Users**: Realistic usernames, emails, bios
- **Threads**: Random titles, multi-paragraph content, optional media/polls
- **Replies**: Contextual responses with varied lengths
- **Categories**: UFC, General, Boxing, Bellator, PFL, ONE

## 📈 Performance Metrics

The suite tracks and reports:

- **Request Rate**: Requests per second (RPS)
- **Latency**: Average, P95, P99 response times
- **Error Rate**: Percentage of failed requests
- **Throughput**: Bytes per second
- **Connection Utilization**: Concurrent connection efficiency

### Sample Output

```
🥊 ThreePunchConvo Load Test Suite
===================================

🧪 Running test: getTopUsers
✅ getTopUsers completed:
  - Requests: 1,245
  - RPS: 41.5
  - Latency: 241ms
  - Errors: 0

📈 Performance Analysis:
📊 Results:
  - Total Requests: 1,245
  - Average RPS: 41.5
  - Average Latency: 241ms
  - Total Errors: 0
  - Error Rate: 0.00%
  - P95 Latency: 298ms
  - P99 Latency: 445ms
```

## 🔧 Advanced Usage

### Custom Test Scenarios

```javascript
// Add custom test to loadtest.js
const customTests = {
  async myCustomTest() {
    return {
      url: `${config.baseUrl}/api/custom-endpoint`,
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    };
  },
};
```

### Programmatic Usage

```javascript
const { runScenario, runSingleTest } = require("./loadtest");

// Run specific scenario
const results = await runScenario("basic");

// Run individual test
const testResult = await runSingleTest("getTopUsers", {
  connections: 5,
  duration: 15,
});
```

### CI/CD Integration

```yaml
# Example GitHub Actions workflow
name: Load Test
on: [push, pull_request]

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      - run: npm install autocannon @faker-js/faker
      - run: node loadtest.js --scenario=basic
        env:
          TEST_URL: ${{ secrets.STAGING_URL }}
          TEST_DURATION: 30
          TEST_CONNECTIONS: 5
```

## 🛠️ Customization

### Test Weights

The load test uses weighted random selection to simulate realistic user
behavior:

```javascript
const weights = {
  getTopUsers: 10, // High frequency - typical browsing
  getThreadsByCategory: 15, // Very high - main content
  createThread: 3, // Low frequency - content creation
  likeThread: 8, // Medium-high - engagement
  potdThread: 1, // Rare - special interactions
};
```

### Authentication

For authenticated endpoints, you need to:

1. Set up test users in your database
2. Generate valid authentication tokens
3. Update the `setupTestData()` function

```javascript
// Example real auth setup
async function setupTestData() {
  // Create test users
  const users = await createTestUsers(10);

  // Generate auth tokens
  config.testUsers.authTokens = await generateAuthTokens(users);

  // Populate sample data
  config.sampleUserIds = users.map((u) => u.id);
  config.sampleThreadIds = await createTestThreads(users);
}
```

## 🚨 Troubleshooting

### Common Issues

1. **High Error Rates**

   - Check server capacity and database connections
   - Verify authentication tokens are valid
   - Ensure test data exists in database

2. **Connection Timeouts**

   - Reduce concurrent connections
   - Increase test duration
   - Check network latency

3. **Memory Issues**
   - Reduce test data size
   - Implement data cleanup
   - Monitor server resources

### Debug Mode

```bash
# Enable verbose logging
DEBUG=* node loadtest.js --scenario=basic

# Test single endpoint
node -e "
const { runSingleTest } = require('./loadtest');
runSingleTest('getTopUsers', { connections: 1, duration: 5 });
"
```

## 📋 Best Practices

### Before Running Tests

1. **Backup Production Data**: Never run against production
2. **Prepare Test Environment**: Use dedicated test database
3. **Monitor Resources**: Check server CPU, memory, disk I/O
4. **Network Conditions**: Consider network latency and bandwidth

### During Tests

1. **Monitor Server Metrics**: CPU, memory, database connections
2. **Watch for Errors**: High error rates indicate issues
3. **Check Logs**: Server logs reveal bottlenecks
4. **Resource Limits**: Ensure test doesn't overwhelm server

### After Tests

1. **Analyze Results**: Look for patterns and bottlenecks
2. **Clean Up**: Remove test data if needed
3. **Document Findings**: Record performance baselines
4. **Plan Improvements**: Identify optimization opportunities

## 🔄 Continuous Improvement

### Performance Baselines

Track performance over time:

```bash
# Save results to file
node loadtest.js --scenario=full > results-$(date +%Y%m%d).txt

# Compare with previous results
diff results-20231201.txt results-20231215.txt
```

### Automated Monitoring

Set up alerts for performance degradation:

```javascript
// Example performance check
const results = await runScenario("basic");
if (results.latency.average > 500) {
  console.error("Performance degradation detected!");
  process.exit(1);
}
```

## 📚 Resources

- [Autocannon Documentation](https://github.com/mcollina/autocannon)
- [Faker.js Documentation](https://fakerjs.dev/)
- [Node.js Performance Tips](https://nodejs.org/en/docs/guides/simple-profiling/)
- [Load Testing Best Practices](https://blog.loadninja.com/articles/load-testing-best-practices/)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-test`)
3. Add your test scenarios
4. Commit your changes (`git commit -am 'Add amazing test'`)
5. Push to the branch (`git push origin feature/amazing-test`)
6. Create a Pull Request

## 📄 License

This load test suite is part of the ThreePunchConvo project and follows the same
license terms.

---

**Happy Load Testing! 🥊**
