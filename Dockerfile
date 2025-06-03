# Use Node.js LTS version as the base image
FROM node:18

# Build arguments for Railway environment variables
ARG VITE_CLERK_PUBLISHABLE_KEY
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_APP_ID
ARG VITE_STRIPE_PUBLISHABLE_KEY

# Set environment variables from build args
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY
ENV VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID
ENV VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID
ENV VITE_STRIPE_PUBLISHABLE_KEY=$VITE_STRIPE_PUBLISHABLE_KEY

# Create app directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json first to leverage Docker cache
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy everything including .env file
COPY . .

# Build frontend (now with environment variables available)
RUN npx vite build

# Debug: List files to verify build output
RUN ls -la
RUN ls -la dist || echo "dist directory doesn't exist"

# Expose the port your app runs on (Railway will set PORT env var)
EXPOSE $PORT

# Command to run the application using node directly instead of npm
CMD ["node", "node_modules/.bin/tsx", "server/index.ts"]