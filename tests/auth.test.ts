import request from 'supertest';
import express from 'express';
import { db } from '../server/db';
import { users } from '../shared/schema';
import { hashPassword } from '../server/auth';
import { storage } from '../server/storage';
import { sql } from 'drizzle-orm';

const app = express();
app.use(express.json());

// Import routes setup function
import { registerRoutes } from '../server/routes';

// Setup for tests
beforeAll(async () => {
  // Register all routes
  await registerRoutes(app);
  
  // Clean up database before tests
  await db.delete(users);
});

// Clean up after tests
afterAll(async () => {
  await db.delete(users);
});

describe('Authentication System', () => {
  // Test registration
  describe('User Registration', () => {
    it('should register a new user with valid data', async () => {
      const userData = {
        username: 'testuser',
        password: 'password123',
        email: 'test@example.com'
      };
      
      const response = await request(app)
        .post('/api/dev/register')
        .send(userData)
        .expect(201);
      
      // Check response
      expect(response.body).toHaveProperty('id');
      expect(response.body.username).toBe(userData.username);
      expect(response.body.email).toBe(userData.email);
      expect(response.body).not.toHaveProperty('password'); // Password should not be returned
      
      // Verify user exists in database
      const dbUser = await storage.getUserByUsername(userData.username);
      expect(dbUser).toBeTruthy();
      expect(dbUser?.username).toBe(userData.username);
    });
    
    it('should fail to register with missing required fields', async () => {
      const invalidUserData = {
        username: 'testuser2',
        // Missing password
      };
      
      await request(app)
        .post('/api/dev/register')
        .send(invalidUserData)
        .expect(400);
    });
    
    it('should fail to register with duplicate username', async () => {
      const existingUser = {
        username: 'existinguser',
        password: 'password123',
        email: 'existing@example.com'
      };
      
      // First create the user
      await request(app)
        .post('/api/dev/register')
        .send(existingUser)
        .expect(201);
      
      // Try to create again with same username
      await request(app)
        .post('/api/dev/register')
        .send(existingUser)
        .expect(400); // Should fail with 400 Bad Request
    });
    
    it('should properly hash passwords during registration', async () => {
      const userData = {
        username: 'secureuser',
        password: 'securepassword',
        email: 'secure@example.com'
      };
      
      await request(app)
        .post('/api/dev/register')
        .send(userData)
        .expect(201);
      
      // Get user from database
      const user = await storage.getUserByUsername(userData.username);
      expect(user).toBeTruthy();
      
      // Check that password is hashed
      expect(user?.password).not.toBe(userData.password);
      expect(user?.password).toContain('.'); // Our hash format includes a dot separator
    });
  });
  
  // Test login
  describe('User Login', () => {
    beforeEach(async () => {
      // Create a test user for login tests
      const hashedPassword = await hashPassword('loginpassword');
      await storage.createUser({
        id: 'test123',
        username: 'loginuser',
        password: hashedPassword,
        email: 'login@example.com'
      });
    });
    
    it('should login successfully with correct credentials', async () => {
      const loginData = {
        username: 'loginuser',
        password: 'loginpassword'
      };
      
      const response = await request(app)
        .post('/api/dev/login')
        .send(loginData)
        .expect(200);
      
      // Check response
      expect(response.body).toHaveProperty('id');
      expect(response.body.username).toBe(loginData.username);
      expect(response.body).not.toHaveProperty('password'); // Password should not be returned
    });
    
    it('should fail to login with incorrect password', async () => {
      const loginData = {
        username: 'loginuser',
        password: 'wrongpassword'
      };
      
      await request(app)
        .post('/api/dev/login')
        .send(loginData)
        .expect(401);
    });
    
    it('should fail to login with non-existent username', async () => {
      const loginData = {
        username: 'nonexistentuser',
        password: 'anypassword'
      };
      
      await request(app)
        .post('/api/dev/login')
        .send(loginData)
        .expect(401);
    });
  });
  
  // Test logout
  describe('User Logout', () => {
    it('should successfully log out a user', async () => {
      // For this test, we need to create, login and get session cookie
      const userData = {
        username: 'logoutuser',
        password: 'logoutpassword',
        email: 'logout@example.com'
      };
      
      // Register user
      await request(app)
        .post('/api/dev/register')
        .send(userData)
        .expect(201);
      
      // Login to get session
      const loginResponse = await request(app)
        .post('/api/dev/login')
        .send({
          username: userData.username,
          password: userData.password
        })
        .expect(200);
      
      // Get session cookie
      const cookies = loginResponse.headers['set-cookie'];
      
      // Logout with session cookie
      await request(app)
        .post('/api/dev/logout')
        .set('Cookie', cookies)
        .expect(200);
      
      // Try to access protected route, should fail now
      await request(app)
        .get('/api/auth/user')
        .set('Cookie', cookies)
        .expect(401);
    });
  });
});