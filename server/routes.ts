import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { fetchUpcomingEvents } from "./espn-api";
import { z } from "zod";
import { ZodError } from "zod";
import {
  insertThreadSchema,
  insertReplySchema,
  insertUserSchema,
  insertPollSchema,
  insertMediaSchema,
  insertNotificationSchema,
  PollOption
} from "@shared/schema";
import { setupAuth, isAuthenticated } from "./replitAuth";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Set up authentication
  setupAuth(app);

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

  // Authentication endpoints
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: 'Username is already taken' });
      }
      
      // Create user
      const user = await storage.createUser(userData);
      
      // Don't return password in response
      const { password, ...userWithoutPassword } = user;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: 'Validation error',
          errors: error.errors
        });
      }
      
      res.status(500).json({ message: 'Failed to register user' });
    }
  });

  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }
      
      // Mark user as online
      await storage.updateUser(user.id.toString(), { isOnline: true, lastActive: new Date() });
      
      // Don't return password in response
      const { password: _, ...userWithoutPassword } = user;
      
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: 'Failed to login' });
    }
  });

  app.post('/api/auth/logout', async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
      }
      
      await storage.updateUser(userId, { isOnline: false, lastActive: new Date() });
      
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to logout' });
    }
  });

  // User endpoints
  app.get('/api/users/:id', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      
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

  app.get('/api/users/:id/followers', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      
      if (isNaN(userId)) {
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

  app.get('/api/users/:id/following', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      
      if (isNaN(userId)) {
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
      const followingId = parseInt(req.params.id);
      const { followerId } = req.body;
      
      if (isNaN(followingId) || !followerId) {
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
      const followingId = parseInt(req.params.id);
      const { followerId } = req.body;
      
      if (isNaN(followingId) || !followerId) {
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
      
      const threads = await storage.getThreadsByCategory(categoryId, sort, limit, offset);
      
      // Fetch user for each thread
      const threadsWithUser = await Promise.all(
        threads.map(async (thread) => {
          // Ensure userId is treated as a number
          const userId = typeof thread.userId === 'string' ? parseInt(thread.userId, 10) : thread.userId;
          const user = await storage.getUser(userId);
          
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
            // Get poll options using the storage interface
            // This is a temporary solution for the interface not exposing pollOptions directly
            let pollOptions: PollOption[] = [];
            try {
              // If using MemStorage 
              if ('pollOptions' in (storage as any)) {
                const values = Array.from((storage as any)['pollOptions'].values());
                pollOptions = values
                  .filter((option: any) => option.pollId === poll.id) as PollOption[];
              } else {
                // Fallback - in a real implementation, we would add a proper method to the interface
                pollOptions = [];
              }
            } catch (err) {
              console.error('Error getting poll options:', err);
              pollOptions = [];
            }
            
            pollWithOptions = {
              ...poll,
              options: pollOptions
            };
          }
          
          return {
            ...thread,
            user: userWithoutPassword,
            media: media.length > 0 ? media : undefined,
            poll: poll ? pollWithOptions : undefined
          };
        })
      );
      
      res.json(threadsWithUser);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch threads' });
    }
  });

  app.get('/api/threads/id/:id', async (req: Request, res: Response) => {
    try {
      const threadId = parseInt(req.params.id);
      
      if (isNaN(threadId)) {
        return res.status(400).json({ message: 'Invalid thread ID' });
      }
      
      const thread = await storage.getThread(threadId);
      
      if (!thread) {
        return res.status(404).json({ message: 'Thread not found' });
      }
      
      // Increment view count
      await storage.incrementThreadView(threadId);
      
      // Get thread author
      // Ensure userId is treated as a number
      const userId = typeof thread.userId === 'string' ? parseInt(thread.userId, 10) : thread.userId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'Thread author not found' });
      }
      
      // Don't return user password
      const { password, ...userWithoutPassword } = user;
      
      // Get thread media
      const media = await storage.getMediaByThread(threadId);
      
      // Get thread poll
      const poll = await storage.getPollByThread(threadId);
      
      let pollWithOptions;
      if (poll) {
        // Get poll options using the storage interface
        // This is a temporary solution for the interface not exposing pollOptions directly
        let pollOptions: PollOption[] = [];
        try {
          // If using MemStorage 
          if ('pollOptions' in (storage as any)) {
            const values = Array.from((storage as any)['pollOptions'].values());
            pollOptions = values
              .filter((option: any) => option.pollId === poll.id) as PollOption[];
          } else {
            // Fallback - in a real implementation, we would add a proper method to the interface
            pollOptions = [];
          }
        } catch (err) {
          console.error('Error getting poll options:', err);
          pollOptions = [];
        }
        
        pollWithOptions = {
          ...poll,
          options: pollOptions
        };
      }
      
      const threadWithDetails = {
        ...thread,
        user: userWithoutPassword,
        media: media.length > 0 ? media : undefined,
        poll: poll ? pollWithOptions : undefined
      };
      
      res.json(threadWithDetails);
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
      const threadId = parseInt(req.params.id);
      const { userId, role } = req.body;
      
      if (isNaN(threadId)) {
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
      const threadId = parseInt(req.params.id);
      const { userId } = req.body;
      
      if (isNaN(threadId) || !userId) {
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
      const threadId = parseInt(req.params.id);
      const { userId } = req.body;
      
      if (isNaN(threadId) || !userId) {
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
      const threadId = parseInt(req.params.id);
      const { userId } = req.body;
      
      if (isNaN(threadId) || !userId) {
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
      const threadId = parseInt(req.params.id);
      const optionId = parseInt(req.params.optionId);
      const { userId } = req.body;
      
      if (isNaN(threadId) || isNaN(optionId) || !userId) {
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
      const threadId = parseInt(req.params.id);
      
      if (isNaN(threadId)) {
        return res.status(400).json({ message: 'Invalid thread ID' });
      }
      
      const replies = await storage.getRepliesByThread(threadId);
      
      // Fetch user for each reply
      const repliesWithUser = await Promise.all(
        replies.map(async (reply) => {
          // Ensure userId is treated as a number
          const userId = typeof reply.userId === 'string' ? parseInt(reply.userId, 10) : reply.userId;
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
      const threadId = parseInt(req.params.id);
      
      if (isNaN(threadId)) {
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
            threadId: reply.threadId, // Use threadId since we don't have a specific reply media method
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
      const replyId = parseInt(req.params.id);
      const { userId, role } = req.body;
      
      if (isNaN(replyId)) {
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
      const replyId = parseInt(req.params.id);
      const { userId } = req.body;
      
      if (isNaN(replyId) || !userId) {
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
      const replyId = parseInt(req.params.id);
      const { userId } = req.body;
      
      if (isNaN(replyId) || !userId) {
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
      const userId = parseInt(req.query.userId as string);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'User ID is required' });
      }
      
      const notifications = await storage.getNotifications(userId);
      
      // Fetch related user for each notification
      const notificationsWithRelatedUser = await Promise.all(
        notifications.map(async (notification) => {
          if (!notification.relatedUserId) {
            return notification;
          }
          
          // Ensure relatedUserId is treated as a number
          const relatedUserId = typeof notification.relatedUserId === 'string' 
            ? parseInt(notification.relatedUserId, 10) 
            : notification.relatedUserId;
          const relatedUser = await storage.getUser(relatedUserId);
          
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
      const notificationId = parseInt(req.params.id);
      
      if (isNaN(notificationId)) {
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

  return httpServer;
}
