#!/bin/bash

# ThreePunchConvo Load Test Runner
# Usage: ./run-loadtest.sh [scenario] [options]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
SCENARIO="realistic_load"
DURATION=60
CONNECTIONS=50
TARGET_URL="https://threepunchconvo-staging.up.railway.app"

# Function to display usage
usage() {
    echo -e "${BLUE}ThreePunchConvo Load Test Runner${NC}"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -s, --scenario SCENARIO    Test scenario to run (default: realistic_load)"
    echo "  -d, --duration SECONDS     Test duration in seconds (default: 60)"
    echo "  -c, --connections NUM      Number of concurrent connections (default: 50)"
    echo "  -u, --url URL             Target server URL"
    echo "  -h, --help                Show this help message"
    echo ""
    echo "Available scenarios:"
    echo "  basic                     Basic read operations (low load)"
    echo "  realistic_load            200 users browsing (read-heavy)"
    echo "  mixed_traffic             90% read, 10% write attempts"
    echo "  mass_posting              200 users posting (requires auth)"
    echo "  noauth                    Public endpoints only"
    echo "  all                       Run all scenarios"
    echo ""
    echo "Examples:"
    echo "  $0 -s realistic_load -c 200 -d 120"
    echo "  $0 --scenario mass_posting --connections 100"
    echo "  $0 -u http://localhost:5001 -s basic"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -s|--scenario)
            SCENARIO="$2"
            shift 2
            ;;
        -d|--duration)
            DURATION="$2"
            shift 2
            ;;
        -c|--connections)
            CONNECTIONS="$2"
            shift 2
            ;;
        -u|--url)
            TARGET_URL="$2"
            shift 2
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            usage
            exit 1
            ;;
    esac
done

# Check if we're in the right directory
if [[ ! -f "loadtest.js" ]]; then
    echo -e "${RED}Error: loadtest.js not found. Please run this script from the loadtest directory.${NC}"
    exit 1
fi

# Check if dependencies are installed
if [[ ! -d "node_modules" ]]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
fi

echo -e "${BLUE}🥊 ThreePunchConvo Load Test${NC}"
echo -e "${BLUE}================================${NC}"
echo -e "📊 Scenario: ${GREEN}$SCENARIO${NC}"
echo -e "⏱️  Duration: ${GREEN}${DURATION}s${NC}"
echo -e "👥 Connections: ${GREEN}$CONNECTIONS${NC}"
echo -e "🎯 Target: ${GREEN}$TARGET_URL${NC}"
echo ""

# Set environment variables
export TEST_URL="$TARGET_URL"
export TEST_DURATION="$DURATION"
export TEST_CONNECTIONS="$CONNECTIONS"

# Run the load test
echo -e "${YELLOW}Starting load test...${NC}"
node loadtest.js --scenario="$SCENARIO"

echo -e "${GREEN}✅ Load test completed!${NC}" 