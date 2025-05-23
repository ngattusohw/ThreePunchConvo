import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { fetchUpcomingEvents } from "./espn-api";
import { z } from "zod";
import { ZodError } from "zod";
import multer from "multer";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import {
  insertThreadSchema,
  insertReplySchema,
  insertUserSchema,
  insertPollSchema,
  insertMediaSchema,
  insertNotificationSchema,
  PollOption
} from "@shared/schema";
import { setupAuth, isAuthenticated } from "./auth";

// Configure S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG and GIF are allowed.'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Error handling middleware
  app.use((req: Request, res: Response, next: Function) => {
    try {
      next();
    } catch (error) {
      console.error('Server error:', error);
      
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: 'Validation error',
          errors: error.errors
        });
      }
      
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Set up authentication - this must come after error handling middleware
  await setupAuth(app);

  // Authentication endpoints are now handled by auth.ts
  // Remove duplicate routes and continue with other API endpoints...

  // User endpoints
  app.get('/api/users/top', async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      
      try {
        const topUsers = await storage.getTopUsers(limit);
        
        if (!topUsers || topUsers.length === 0) {
          return res.json([]); // Return empty array if no users found
        }
        
        // Don't return passwords in response
        const usersWithoutPasswords = topUsers.map(user => {
          // Use destructuring to exclude password
          const { password, ...userWithoutPassword } = user;
          return userWithoutPassword;
        });
        
        // Format the response with position
        const result = usersWithoutPasswords.map((user, index) => {
          // Check for tied positions
          const isTied = index > 0 && 
            user.points !== undefined && 
            topUsers[index - 1].points !== undefined &&
            user.points === topUsers[index - 1].points;
            
          const position = index + 1; // Use index+1 as position if user.rank is not set
          
          return {
            position: user.rank || position,
            isTied,
            points: user.points || 0, // Default to 0 points if undefined
            user: {
              ...user,
              postsCount: user.postsCount || 0,
              likesCount: user.likesCount || 0,
              potdCount: user.potdCount || 0,
              status: user.status || 'AMATEUR'
            }
          };
        });
        
        res.json(result);
      } catch (storageError) {
        console.error('Storage error fetching top users:', storageError);
        // In development, don't let this break the UI
        return res.json([]);
      }
    } catch (error) {
      console.error('Error fetching top users:', error);
      // Return empty array instead of error to avoid breaking the UI
      return res.json([]);
    }
  });

  app.get('/api/users/username/:username', async (req: Request, res: Response) => {
    try {
      const username = req.params.username;
      
      if (!username) {
        return res.status(400).json({ message: 'Username is required' });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Don't return password in response
      const { password, ...userWithoutPassword } = user;
      
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch user' });
    }
  });

  app.get('/api/users/:id', async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      
      // Directly use the ID string - our storage functions now handle both
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Don't return password in response
      const { password, ...userWithoutPassword } = user;
      
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch user' });
    }
  });

  app.get('/api/users/:id/followers', async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      
      if (!userId) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      
      const followers = await storage.getFollowers(userId);
      
      // Don't return passwords in response
      const followersWithoutPasswords = followers.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json(followersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch followers' });
    }
  });

  app.get('/api/users/:id/posts', async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      
      if (!userId) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      
      const threads = await storage.getThreadsByUser(userId);
      
      // Fetch user and additional data for each thread
      const threadsWithData = await Promise.all(
        threads.map(async (thread) => {
          const user = await storage.getUser(thread.userId);
          
          if (!user) {
            return { ...thread, user: null };
          }
          
          // Don't return user password
          const { password, ...userWithoutPassword } = user;
          
          // Get thread media
          const media = await storage.getMediaByThread(thread.id);
          
          // Get thread poll
          const poll = await storage.getPollByThread(thread.id);
          
          let pollWithOptions;
          if (poll) {
            const options = await storage.getPollOptions(poll.id);
            pollWithOptions = {
              ...poll,
              options
            };
          }
          
          return {
            ...thread,
            user: userWithoutPassword,
            media: media || [],
            poll: pollWithOptions
          };
        })
      );
      
      res.json(threadsWithData);
    } catch (error) {
      console.error('Error fetching user posts:', error);
      res.status(500).json({ message: 'Failed to fetch user posts' });
    }
  });

  app.get('/api/users/:id/following', async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      
      if (!userId) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      
      const following = await storage.getFollowing(userId);
      
      // Don't return passwords in response
      const followingWithoutPasswords = following.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json(followingWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch following' });
    }
  });

  app.post('/api/users/:id/follow', async (req: Request, res: Response) => {
    try {
      const followingId = req.params.id;
      const { followerId } = req.body;
      
      if (!followingId || !followerId) {
        return res.status(400).json({ message: 'Both follower ID and following ID are required' });
      }
      
      const success = await storage.followUser(followerId, followingId);
      
      if (!success) {
        return res.status(400).json({ message: 'Failed to follow user' });
      }
      
      res.json({ message: 'User followed successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to follow user' });
    }
  });

  app.post('/api/users/:id/unfollow', async (req: Request, res: Response) => {
    try {
      const followingId = req.params.id;
      const { followerId } = req.body;
      
      if (!followingId || !followerId) {
        return res.status(400).json({ message: 'Both follower ID and following ID are required' });
      }
      
      const success = await storage.unfollowUser(followerId, followingId);
      
      if (!success) {
        return res.status(400).json({ message: 'Failed to unfollow user' });
      }
      
      res.json({ message: 'User unfollowed successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to unfollow user' });
    }
  });

  // Thread endpoints
  app.get('/api/threads/:categoryId', async (req: Request, res: Response) => {
    try {
      const categoryId = req.params.categoryId;
      const sort = req.query.sort as string || 'recent';
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;
      const potdFilter = req.query.potdFilter as string || 'include'; // 'only', 'exclude', or 'include'
      
      // Set cache control headers
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      });
      
      // Get threads with more buffer if we need to filter
      const fetchLimit = potdFilter !== 'include' ? limit + 20 : limit;
      const threads = await storage.getThreadsByCategory(categoryId, sort, fetchLimit, offset);
      
      // Filter threads based on POTD status
      let filteredThreads = threads;
      if (potdFilter === 'only') {
        filteredThreads = threads.filter(thread => thread.isPotd);
      } else if (potdFilter === 'exclude') {
        filteredThreads = threads.filter(thread => !thread.isPotd);
      }
      
      // Apply limit if we've filtered
      if (potdFilter !== 'include' && filteredThreads.length > limit) {
        filteredThreads = filteredThreads.slice(0, limit);
      }
      
      // Fetch user for each thread
      const threadsWithUser = await Promise.all(
        filteredThreads.map(async (thread) => {
          const user = await storage.getUser(thread.userId);
          
          if (!user) {
            return { ...thread, user: null };
          }
          
          // Don't return user password
          const { password, ...userWithoutPassword } = user;
          
          // Get thread media
          const media = await storage.getMediaByThread(thread.id);
          
          // Get thread poll
          const poll = await storage.getPollByThread(thread.id);
          
          let pollWithOptions;
          if (poll) {
            // Get poll options
            const options = await storage.getPollOptions(poll.id);
            pollWithOptions = {
              ...poll,
              options
            };
          }
          
          return {
            ...thread,
            user: userWithoutPassword,
            media: media || [],
            poll: pollWithOptions
          };
        })
      );
      
      res.json(threadsWithUser);
    } catch (error) {
      console.error('Error fetching threads:', error);
      res.status(500).json({ message: 'Failed to fetch threads' });
    }
  });

  app.get('/api/threads/id/:id', async (req: Request, res: Response) => {
    try {
      const threadId = req.params.id;
      const userId = req.query.userId as string | undefined;
      
      if (!threadId) {
        return res.status(400).json({ message: 'Invalid thread ID' });
      }
      
      const thread = await storage.getThread(threadId, userId);
      
      if (!thread) {
        return res.status(404).json({ message: 'Thread not found' });
      }
      
      res.json(thread);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch thread' });
    }
  });

  app.post('/api/threads', async (req: Request, res: Response) => {
    try {
      const threadData = insertThreadSchema.parse(req.body);
      const { poll, media } = req.body;
      
      // Create thread
      const thread = await storage.createThread(threadData);
      
      // Create poll if provided
      if (poll && poll.question && poll.options && poll.options.length >= 2) {
        const pollData = {
          threadId: thread.id,
          question: poll.question,
          expiresAt: poll.expiresAt ? new Date(poll.expiresAt) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Default 7 days
        };
        
        await storage.createPoll(pollData, poll.options);
      }
      
      // Create media if provided
      if (media && Array.isArray(media)) {
        for (const mediaItem of media) {
          const mediaData = {
            threadId: thread.id,
            type: mediaItem.type,
            url: mediaItem.url
          };
          
          await storage.createThreadMedia(mediaData);
        }
      }
      
      res.status(201).json(thread);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: 'Validation error',
          errors: error.errors
        });
      }
      
      res.status(500).json({ message: 'Failed to create thread' });
    }
  });

  app.delete('/api/threads/:id', async (req: Request, res: Response) => {
    try {
      const threadId = req.params.id;
      const { userId, role } = req.body;
      
      if (!threadId) {
        return res.status(400).json({ message: 'Invalid thread ID' });
      }
      
      const thread = await storage.getThread(threadId);
      
      if (!thread) {
        return res.status(404).json({ message: 'Thread not found' });
      }
      
      // Only thread author, moderators, and admins can delete threads
      if (thread.userId !== userId && role !== 'MODERATOR' && role !== 'ADMIN') {
        return res.status(403).json({ message: 'Not authorized to delete this thread' });
      }
      
      const success = await storage.deleteThread(threadId);
      
      if (!success) {
        return res.status(500).json({ message: 'Failed to delete thread' });
      }
      
      res.json({ message: 'Thread deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete thread' });
    }
  });

  app.post('/api/threads/:id/like', async (req: Request, res: Response) => {
    try {
      const threadId = req.params.id;
      const { userId } = req.body;
      
      if (!threadId || !userId) {
        return res.status(400).json({ message: 'Thread ID and user ID are required' });
      }
      
      const success = await storage.likeThread(threadId, userId);
      
      if (!success) {
        return res.status(400).json({ message: 'Failed to like thread' });
      }
      
      res.json({ message: 'Thread liked successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to like thread' });
    }
  });

  app.post('/api/threads/:id/dislike', async (req: Request, res: Response) => {
    try {
      const threadId = req.params.id;
      const { userId } = req.body;
      
      if (!threadId || !userId) {
        return res.status(400).json({ message: 'Thread ID and user ID are required' });
      }
      
      const success = await storage.dislikeThread(threadId, userId);
      
      if (!success) {
        return res.status(400).json({ message: 'Failed to dislike thread' });
      }
      
      res.json({ message: 'Thread disliked successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to dislike thread' });
    }
  });

  app.post('/api/threads/:id/potd', async (req: Request, res: Response) => {
    try {
      const threadId = req.params.id;
      const { userId } = req.body;
      
      if (!threadId || !userId) {
        return res.status(400).json({ message: 'Thread ID and user ID are required' });
      }
      
      const success = await storage.potdThread(threadId, userId);
      
      if (!success) {
        return res.status(400).json({ message: 'Failed to set thread as POTD' });
      }
      
      res.json({ message: 'Thread set as POTD successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to set thread as POTD' });
    }
  });

  app.post('/api/threads/:id/poll/:optionId/vote', async (req: Request, res: Response) => {
    try {
      const threadId = req.params.id;
      const optionId = req.params.optionId;
      const { userId } = req.body;
      
      if (!threadId || !optionId || !userId) {
        return res.status(400).json({ message: 'Thread ID, option ID, and user ID are required' });
      }
      
      // Get poll for this thread
      const poll = await storage.getPollByThread(threadId);
      
      if (!poll) {
        return res.status(404).json({ message: 'Poll not found for this thread' });
      }
      
      const success = await storage.votePoll(poll.id, optionId, userId);
      
      if (!success) {
        return res.status(400).json({ message: 'Failed to vote in poll' });
      }
      
      res.json({ message: 'Vote recorded successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to vote in poll' });
    }
  });

  // Reply endpoints
  app.get('/api/threads/:id/replies', async (req: Request, res: Response) => {
    try {
      const threadId = req.params.id;
      
      if (!threadId) {
        return res.status(400).json({ message: 'Invalid thread ID' });
      }
      
      const replies = await storage.getRepliesByThread(threadId);
      
      // Fetch user for each reply
      const repliesWithUser = await Promise.all(
        replies.map(async (reply) => {
          const userId = reply.userId;
          const user = await storage.getUser(userId);
          
          if (!user) {
            return { ...reply, user: null };
          }
          
          // Don't return user password
          const { password, ...userWithoutPassword } = user;
          
          // Get reply media
          const media = await storage.getMediaByReply(reply.id);
          
          return {
            ...reply,
            user: userWithoutPassword,
            media: media.length > 0 ? media : undefined
          };
        })
      );
      
      res.json(repliesWithUser);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch replies' });
    }
  });

  app.post('/api/threads/:id/replies', async (req: Request, res: Response) => {
    try {
      const threadId = req.params.id;
      
      if (!threadId) {
        return res.status(400).json({ message: 'Invalid thread ID' });
      }
      
      const replyData = insertReplySchema.parse({
        ...req.body,
        threadId
      });
      
      const { media } = req.body;
      
      // Create reply
      const reply = await storage.createReply(replyData);
      
      // Create media if provided
      if (media && Array.isArray(media)) {
        for (const mediaItem of media) {
          const mediaData = {
            threadId: reply.threadId,
            type: mediaItem.type,
            url: mediaItem.url
          };
          
          await storage.createThreadMedia(mediaData);
        }
      }
      
      res.status(201).json(reply);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: 'Validation error',
          errors: error.errors
        });
      }
      
      res.status(500).json({ message: 'Failed to create reply' });
    }
  });

  app.delete('/api/replies/:id', async (req: Request, res: Response) => {
    try {
      const replyId = req.params.id;
      const { userId, role } = req.body;
      
      if (!replyId) {
        return res.status(400).json({ message: 'Invalid reply ID' });
      }
      
      const reply = await storage.getReply(replyId);
      
      if (!reply) {
        return res.status(404).json({ message: 'Reply not found' });
      }
      
      // Only reply author, moderators, and admins can delete replies
      if (reply.userId !== userId && role !== 'MODERATOR' && role !== 'ADMIN') {
        return res.status(403).json({ message: 'Not authorized to delete this reply' });
      }
      
      const success = await storage.deleteReply(replyId);
      
      if (!success) {
        return res.status(500).json({ message: 'Failed to delete reply' });
      }
      
      res.json({ message: 'Reply deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete reply' });
    }
  });

  app.post('/api/replies/:id/like', async (req: Request, res: Response) => {
    try {
      const replyId = req.params.id;
      const { userId } = req.body;
      
      if (!replyId || !userId) {
        return res.status(400).json({ message: 'Reply ID and user ID are required' });
      }
      
      const success = await storage.likeReply(replyId, userId);
      
      if (!success) {
        return res.status(400).json({ message: 'Failed to like reply' });
      }
      
      res.json({ message: 'Reply liked successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to like reply' });
    }
  });

  app.post('/api/replies/:id/dislike', async (req: Request, res: Response) => {
    try {
      const replyId = req.params.id;
      const { userId } = req.body;
      
      if (!replyId || !userId) {
        return res.status(400).json({ message: 'Reply ID and user ID are required' });
      }
      
      const success = await storage.dislikeReply(replyId, userId);
      
      if (!success) {
        return res.status(400).json({ message: 'Failed to dislike reply' });
      }
      
      res.json({ message: 'Reply disliked successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to dislike reply' });
    }
  });

  // Notification endpoints
  app.get('/api/notifications', async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId as string;
      
      if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
      }
      
      const notifications = await storage.getNotifications(userId);
      
      // Fetch related user for each notification
      const notificationsWithRelatedUser = await Promise.all(
        notifications.map(async (notification) => {
          if (!notification.relatedUserId) {
            return notification;
          }
          
          const relatedUser = await storage.getUser(notification.relatedUserId);
          
          if (!relatedUser) {
            return notification;
          }
          
          // Don't return user password
          const { password, ...userWithoutPassword } = relatedUser;
          
          // Get thread title if applicable
          let threadTitle;
          if (notification.threadId) {
            const thread = await storage.getThread(notification.threadId);
            if (thread) {
              threadTitle = thread.title;
            }
          }
          
          // Get reply preview if applicable
          let replyPreview;
          if (notification.replyId) {
            const reply = await storage.getReply(notification.replyId);
            if (reply) {
              replyPreview = reply.content.length > 100 
                ? reply.content.substring(0, 100) + '...' 
                : reply.content;
            }
          }
          
          return {
            ...notification,
            relatedUser: userWithoutPassword,
            threadTitle,
            replyPreview
          };
        })
      );
      
      res.json(notificationsWithRelatedUser);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch notifications' });
    }
  });

  app.post('/api/notifications/read/:id', async (req: Request, res: Response) => {
    try {
      const notificationId = req.params.id;
      
      if (!notificationId) {
        return res.status(400).json({ message: 'Invalid notification ID' });
      }
      
      const success = await storage.markNotificationAsRead(notificationId);
      
      if (!success) {
        return res.status(400).json({ message: 'Failed to mark notification as read' });
      }
      
      res.json({ message: 'Notification marked as read' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to mark notification as read' });
    }
  });

  app.post('/api/notifications/read-all', async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
      }
      
      const success = await storage.markAllNotificationsAsRead(userId);
      
      if (!success) {
        return res.status(400).json({ message: 'Failed to mark all notifications as read' });
      }
      
      res.json({ message: 'All notifications marked as read' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to mark all notifications as read' });
    }
  });

  // User status update endpoint
  app.put('/api/users/:id/status', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      const { status, updatedBy } = req.body;
      
      // Validate input
      if (!userId || !status) {
        return res.status(400).json({ message: 'User ID and status are required' });
      }
      
      // Validate status value
      const validStatuses = [
        'AMATEUR', 
        'REGIONAL_POSTER', 
        'COMPETITOR', 
        'RANKED_POSTER', 
        'CONTENDER', 
        'CHAMPION', 
        'HALL_OF_FAMER'
      ];
      
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
          message: 'Invalid status value', 
          validStatuses 
        });
      }
      
      // Get the user performing the update
      const admin = await storage.getUser(updatedBy);
      if (!admin || (admin.role !== 'ADMIN' && admin.role !== 'MODERATOR')) {
        return res.status(403).json({ message: 'Not authorized to update user status' });
      }
      
      // Get the user being updated to ensure they exist
      const userToUpdate = await storage.getUser(userId);
      if (!userToUpdate) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Update the user's status
      const updatedUser = await storage.updateUser(userId, { status });
      
      if (!updatedUser) {
        return res.status(500).json({ message: 'Failed to update user status' });
      }
      
      // Don't return password in response
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.json({
        message: 'User status updated successfully',
        user: userWithoutPassword
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      res.status(500).json({ message: 'Failed to update user status' });
    }
  });

  // User role update endpoint
  app.put('/api/users/:id/role', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      const { role, updatedBy } = req.body;
      
      // Validate input
      if (!userId || !role) {
        return res.status(400).json({ message: 'User ID and role are required' });
      }
      
      // Validate role value
      const validRoles = [
        'ADMIN', 
        'MODERATOR', 
        'PRO', 
        'USER',
        'PREMIUM_USER'
      ];
      
      if (!validRoles.includes(role)) {
        return res.status(400).json({ 
          message: 'Invalid role value', 
          validRoles 
        });
      }
      
      // Get the user performing the update - only admins can update roles
      const admin = await storage.getUser(updatedBy);
      if (!admin || admin.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Only administrators can update user roles' });
      }
      
      // Get the user being updated to ensure they exist
      const userToUpdate = await storage.getUser(userId);
      if (!userToUpdate) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // If trying to set another user as ADMIN, require extra confirmation
      if (role === 'ADMIN' && updatedBy !== userId) {
        const { confirmAdminPromotion } = req.body;
        if (!confirmAdminPromotion) {
          return res.status(400).json({ 
            message: 'Admin promotion requires confirmation',
            requiresConfirmation: true
          });
        }
      }
      
      // Update the user's role
      const updatedUser = await storage.updateUser(userId, { role });
      
      if (!updatedUser) {
        return res.status(500).json({ message: 'Failed to update user role' });
      }
      
      // Log the role change for audit purposes
      console.log(`User role updated: ${userToUpdate.username} (${userId}) from ${userToUpdate.role} to ${role} by admin ${admin.username} (${updatedBy})`);
      
      // Don't return password in response
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.json({
        message: 'User role updated successfully',
        previousRole: userToUpdate.role,
        newRole: role,
        user: userWithoutPassword
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      res.status(500).json({ message: 'Failed to update user role' });
    }
  });

  // Auto-calculate user status endpoint
  app.post('/api/users/:id/recalculate-status', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      const { requestedBy } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
      }
      
      // Check if the request is from an admin/moderator or the user themselves
      if (requestedBy) {
        const admin = await storage.getUser(requestedBy);
        if (requestedBy !== userId && 
            (!admin || (admin.role !== 'ADMIN' && admin.role !== 'MODERATOR'))) {
          return res.status(403).json({ message: 'Not authorized to recalculate user status' });
        }
      }
      
      // Make sure the user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Recalculate status based on user's points and activity
      const newStatus = await storage.recalculateUserStatus(userId);
      
      if (!newStatus) {
        return res.status(500).json({ message: 'Failed to recalculate user status' });
      }
      
      // Get the updated user
      const updatedUser = await storage.getUser(userId);
      
      if (!updatedUser) {
        return res.status(500).json({ message: 'Failed to fetch updated user' });
      }
      
      // Don't return password in response
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.json({
        message: 'User status recalculated successfully',
        previousStatus: user.status,
        newStatus: newStatus,
        user: userWithoutPassword
      });
    } catch (error) {
      console.error('Error recalculating user status:', error);
      res.status(500).json({ message: 'Failed to recalculate user status' });
    }
  });

  // Admin endpoint to recalculate all user statuses
  app.post('/api/admin/recalculate-all-statuses', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { adminId } = req.body;
      
      if (!adminId) {
        return res.status(400).json({ message: 'Admin ID is required' });
      }
      
      // Check if the request is from an admin
      const admin = await storage.getUser(adminId);
      if (!admin || admin.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Only administrators can trigger this operation' });
      }
      
      // Log that this admin triggered the operation
      console.log(`Admin ${admin.username} (ID: ${adminId}) triggered manual recalculation of all user statuses`);
      
      // Start the recalculation process
      // This might take a while for many users, so we return immediately
      // and let the process run in the background
      res.json({ 
        message: 'Status recalculation started',
        info: 'This process will run in the background. Check server logs for progress and results.'
      });
      
      // Run the recalculation after sending the response
      storage.recalculateAllUserStatuses()
        .then(result => {
          console.log(`Manual status recalculation completed by admin ${admin.username}: ${result.success} updated, ${result.unchanged} unchanged, ${result.failed} failed`);
        })
        .catch(error => {
          console.error('Error during manual status recalculation:', error);
        });
    } catch (error) {
      console.error('Error processing recalculate all statuses request:', error);
      res.status(500).json({ message: 'Failed to start status recalculation process' });
    }
  });

  // MMA Schedule endpoints
  app.get('/api/events', async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;
      
      // Try to fetch from storage first
      let events = await storage.getMMAEvents(limit, offset);
      
      // If no events in storage, fetch from ESPN API
      if (events.length === 0) {
        const apiEvents = await fetchUpcomingEvents();
        
        // Save each event to storage
        for (const event of apiEvents) {
          await storage.saveMMAEvent({
            id: event.id,
            name: event.name,
            shortName: event.shortName,
            date: event.date,
            organization: event.organization,
            venue: event.venue,
            location: event.location,
            imageUrl: event.imageUrl
          });
        }
        
        // Fetch the newly saved events
        events = await storage.getMMAEvents(limit, offset);
      }
      
      // Map events to a client-friendly format
      const eventList = events.map(event => ({
        id: event.id,
        name: event.name,
        shortName: event.shortName,
        date: event.date,
        organization: event.organization,
        venue: event.venue,
        location: event.location,
        imageUrl: event.imageUrl
      }));
      
      res.json(eventList);
    } catch (error) {
      console.error('Error fetching events:', error);
      res.status(500).json({ message: 'Failed to fetch MMA events' });
    }
  });

  app.get('/api/events/:id', async (req: Request, res: Response) => {
    try {
      const eventId = req.params.id;
      
      const event = await storage.getMMAEvent(eventId);
      
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }
      
      // Return the event details
      res.json({
        id: event.id,
        name: event.name,
        shortName: event.shortName,
        date: event.date,
        organization: event.organization,
        venue: event.venue,
        location: event.location,
        imageUrl: event.imageUrl
      });
    } catch (error) {
      console.error('Error fetching event:', error);
      res.status(500).json({ message: 'Failed to fetch event' });
    }
  });

  // Image upload endpoint
  app.post('/api/upload', upload.single('image'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const file = req.file;
      const fileExtension = path.extname(file.originalname);
      const fileName = `${uuidv4()}${fileExtension}`;

      // Upload to S3
      const uploadParams = {
        Bucket: process.env.AWS_S3_BUCKET || 'your-bucket-name',
        Key: `uploads/${fileName}`,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read'
      };

      await s3Client.send(new PutObjectCommand(uploadParams));

      // Generate the CDN URL
      const cdnUrl = `${process.env.CDN_BASE_URL || `https://${uploadParams.Bucket}.s3.amazonaws.com`}/uploads/${fileName}`;
      
      res.json({ url: cdnUrl });
    } catch (error) {
      console.error('Error uploading file:', error);
      res.status(500).json({ message: 'Failed to upload file' });
    }
  });

  return httpServer;
}
