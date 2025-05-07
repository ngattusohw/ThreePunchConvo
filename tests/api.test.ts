import request from 'supertest';
import express from 'express';
import fetch from 'node-fetch';
import { registerRoutes } from '../server/routes';

// Mock environment variables
process.env.SESSION_SECRET = 'test-secret';
process.env.DATABASE_URL = 'mock-db-url';

describe('API Endpoints Check', () => {
  // Direct HTTP requests to check if the routes are available
  // This is a simpler test that doesn't rely on the mocked Express app
  
  it('should check if the /api/login endpoint is accessible', async () => {
    // This is a basic connectivity check to see if the route exists
    try {
      const response = await fetch('http://localhost:5000/api/login');
      
      console.log('Login response status:', response.status);
      
      // We only check if the route exists, not the actual response
      // Valid status codes would include 200 (success) or 302 (redirect for auth)
      expect([200, 302, 401, 500].includes(response.status)).toBe(true);
    } catch (error) {
      console.error('Error accessing /api/login:', error);
      // Even if the test fails, this provides diagnostics
      throw error;
    }
  });
  
  it('should check if the /api/auth/user endpoint is accessible', async () => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/user');
      
      console.log('Auth user response status:', response.status);
      
      // For unauthenticated requests, we expect 401 Unauthorized
      expect([200, 401].includes(response.status)).toBe(true);
    } catch (error) {
      console.error('Error accessing /api/auth/user:', error);
      throw error;
    }
  });
});