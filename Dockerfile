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

# Expose the port your app runs on
EXPOSE 5000

# Command to run the application using tsx directly
CMD ["npx", "tsx", "server/index.ts"]