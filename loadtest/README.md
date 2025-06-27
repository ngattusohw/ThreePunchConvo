# ThreePunchConvo Load Testing Suite

This directory contains comprehensive load testing tools for the ThreePunchConvo
MMA forum application.

## 🚀 Quick Start

```bash
# Install dependencies
cd loadtest
npm install

# Run a realistic load test with 200 users
./run-loadtest.sh -s realistic_load -c 200 -d 120

# Or run directly with Node.js
node loadtest.js --scenario=realistic_load
```

## 📁 Files Overview

- **`loadtest.js`** - Main load testing script with multiple scenarios
- **`package.json`** - Dependencies and npm scripts
- **`run-loadtest.sh`** - Shell script wrapper for easy execution
- **`README.md`** - This documentation

## 🎯 Available Test Scenarios

### 1. Basic (`basic`)

- **Purpose**: Basic read operations, low load
- **Default**: 10 connections, 30 seconds
- **Tests**: Top users, thread listing, events

### 2. Realistic Load (`realistic_load`)

- **Purpose**: Simulates real users browsing the forum
- **Default**: 200 connections, 60 seconds
- **Tests**: All read operations (browsing, profiles, posts)

### 3. Mixed Traffic (`mixed_traffic`)

- **Purpose**: Realistic traffic pattern (90% read, 10% write)
- **Default**: 200 connections, 90 seconds
- **Tests**: Heavy reading + some posting attempts

### 4. Mass Posting (`mass_posting`)

- **Purpose**: Stress test posting capabilities
- **Default**: 200 connections, 30 seconds
- **Tests**: Thread creation, reply posting
- **Note**: Requires real authentication tokens

### 5. No Auth (`noauth`)

- **Purpose**: Test public endpoints only
- **Default**: 15 connections, 60 seconds
- **Tests**: All endpoints that don't require authentication

## 🛠️ Usage Examples

### Using the Shell Script

```bash
# Basic test
./run-loadtest.sh -s basic

# High load browsing test
./run-loadtest.sh -s realistic_load -c 200 -d 120

# Test against local server
./run-loadtest.sh -u http://localhost:5001 -s basic

# Mixed traffic simulation
./run-loadtest.sh -s mixed_traffic -c 100 -d 180
```

### Using Node.js Directly

```bash
# Set target URL
export TEST_URL="https://your-server.com"

# Run specific scenario
node loadtest.js --scenario=realistic_load

# Run all scenarios
node loadtest.js --scenario=all
```

### Using NPM Scripts

```bash
npm run test:basic           # Basic load test
npm run test:realistic       # Realistic browsing load
npm run test:mixed          # Mixed traffic pattern
npm run test:mass-posting   # Mass posting stress test
npm run test:all            # All scenarios
```

## ⚙️ Configuration

### Environment Variables

```bash
export TEST_URL="https://your-server.com"      # Target server
export TEST_DURATION="60"                      # Test duration in seconds
export TEST_CONNECTIONS="50"                   # Concurrent connections
```

### Command Line Options

```bash
./run-loadtest.sh [OPTIONS]

Options:
  -s, --scenario SCENARIO    Test scenario to run
  -d, --duration SECONDS     Test duration in seconds
  -c, --connections NUM      Number of concurrent connections
  -u, --url URL             Target server URL
  -h, --help                Show help message
```

## 📊 Understanding Results

### Key Metrics

- **RPS (Requests Per Second)**: Server throughput
- **Latency**: Average response time
- **Error Rate**: Percentage of failed requests
- **Success Rate**: Percentage of successful requests

### Performance Benchmarks

- **Excellent**: < 100ms latency, > 1000 RPS
- **Good**: < 500ms latency, > 500 RPS
- **Needs Improvement**: > 1000ms latency, < 100 RPS

### Sample Output

```
🏁 REALISTIC LOAD SIMULATION COMPLETED!
📊 Results for 200 concurrent browsing users:
   - Total Page Views: 47,340
   - Average Requests/Second: 845.36
   - Average Response Time: 255.32ms
   - Total Errors: 7
   - Success Rate: 99.99%
```

## 🔧 Advanced Configuration

### Custom Test Data

The load test uses mock data by default. To test with real authentication:

1. Obtain real Clerk JWT tokens from your frontend
2. Replace mock tokens in `setupTestData()` function
3. Run authenticated scenarios like `mass_posting`

### Adding New Tests

Add new test functions to the `tests` object in `loadtest.js`:

```javascript
const tests = {
  // ... existing tests ...

  async myCustomTest() {
    return {
      url: `${config.baseUrl}/api/my-endpoint`,
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    };
  },
};
```

### Creating New Scenarios

Add new scenarios to the `scenarios` object:

```javascript
const scenarios = {
  // ... existing scenarios ...

  my_scenario: {
    name: "My Custom Scenario",
    duration: 60,
    connections: 20,
    tests: ["myCustomTest", "getTopUsers"],
    description: "Custom test scenario",
  },
};
```

## 🐛 Troubleshooting

### Common Issues

1. **302 Redirects**: Authentication required endpoints redirect unauthenticated
   requests

   - **Solution**: Use scenarios like `realistic_load` or `noauth` for public
     endpoints

2. **500 Errors**: Server overwhelmed or configuration issues

   - **Solution**: Check server logs, reduce connections, ensure database is
     running

3. **Connection Refused**: Server not running

   - **Solution**: Start your server, verify the URL

4. **High Latency**: Server performance issues
   - **Solution**: Check server resources, database performance, network

### Debug Mode

Add console logging for debugging:

```javascript
// In loadtest.js, uncomment debug lines
console.log(`📝 Request: ${testConfig.method} ${testConfig.url}`);
```

## 🔒 Security Considerations

- **Mock Tokens**: Default uses fake authentication tokens (safe for testing)
- **Real Tokens**: Only use real tokens in secure environments
- **Rate Limiting**: Be respectful when testing production servers
- **Resource Usage**: Monitor server resources during high-load tests

## 📈 Performance Optimization Tips

1. **Database**: Ensure proper indexing and connection pooling
2. **Caching**: Implement Redis or similar for frequently accessed data
3. **CDN**: Use CDN for static assets and images
4. **Scaling**: Consider horizontal scaling for high traffic
5. **Monitoring**: Set up APM tools to identify bottlenecks

## 🤝 Contributing

To add new load tests:

1. Add test functions to the `tests` object
2. Create scenarios that use your tests
3. Update documentation
4. Test your changes

## 📝 License

This load testing suite is part of the ThreePunchConvo project.
