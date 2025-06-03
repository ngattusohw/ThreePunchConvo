# Use Node.js LTS version as the base image
FROM node:18

# Create app directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json first to leverage Docker cache
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy everything including .env file
COPY . .

# Export VITE_ environment variables and build
RUN npx vite build

# Debug: List files to verify build output
RUN ls -la
RUN ls -la dist || echo "dist directory doesn't exist"

# Expose the port your app runs on (Railway will set PORT env var)
EXPOSE $PORT

# Command to run the application using node directly instead of npm
CMD ["node", "node_modules/.bin/tsx", "server/index.ts"]