import { 
  User, 
  InsertUser,
  UpsertUser,
  Thread, 
  InsertThread, 
  Reply, 
  InsertReply, 
  Poll, 
  InsertPoll, 
  PollOption, 
  InsertPollOption, 
  Media, 
  InsertMedia, 
  Notification, 
  InsertNotification,
  MMAEvent,
  Fighter,
  Fight,
  users
} from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool, db } from "./db";
import { eq, and, sql, desc } from "drizzle-orm";
import { v4 as uuidv4 } from 'uuid';

export interface IStorage {
  // Session store
  sessionStore: any;
  
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(userData: UpsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getTopUsers(limit: number): Promise<User[]>;
  getAllUsers(): Promise<User[]>;
  
  // Thread management
  getThread(id: number): Promise<Thread | undefined>;
  getThreadsByCategory(categoryId: string, sort: string, limit: number, offset: number): Promise<Thread[]>;
  createThread(thread: InsertThread): Promise<Thread>;
  updateThread(id: number, threadData: Partial<Thread>): Promise<Thread | undefined>;
  deleteThread(id: number): Promise<boolean>;
  incrementThreadView(id: number): Promise<boolean>;
  
  // Reply management
  getReply(id: number): Promise<Reply | undefined>;
  getRepliesByThread(threadId: number): Promise<Reply[]>;
  createReply(reply: InsertReply): Promise<Reply>;
  updateReply(id: number, replyData: Partial<Reply>): Promise<Reply | undefined>;
  deleteReply(id: number): Promise<boolean>;
  
  // Poll management
  getPoll(id: number): Promise<Poll | undefined>;
  getPollByThread(threadId: number): Promise<Poll | undefined>;
  createPoll(poll: InsertPoll, options: string[]): Promise<Poll>;
  votePoll(pollId: number, optionId: number, userId: number): Promise<boolean>;
  
  // Media management
  getMedia(id: number): Promise<Media | undefined>;
  getMediaByThread(threadId: number): Promise<Media[]>;
  getMediaByReply(replyId: number): Promise<Media[]>;
  createThreadMedia(media: InsertMedia): Promise<Media>;
  
  // Reaction management
  likeThread(threadId: number, userId: number): Promise<boolean>;
  dislikeThread(threadId: number, userId: number): Promise<boolean>;
  potdThread(threadId: number, userId: number): Promise<boolean>;
  likeReply(replyId: number, userId: number): Promise<boolean>;
  dislikeReply(replyId: number, userId: number): Promise<boolean>;
  removeThreadReaction(threadId: number, userId: number, type: string): Promise<boolean>;
  removeReplyReaction(replyId: number, userId: number, type: string): Promise<boolean>;
  
  // Follow management
  followUser(followerId: number, followingId: number): Promise<boolean>;
  unfollowUser(followerId: number, followingId: number): Promise<boolean>;
  getFollowers(userId: number): Promise<User[]>;
  getFollowing(userId: number): Promise<User[]>;
  
  // Notification management
  getNotifications(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<boolean>;
  markAllNotificationsAsRead(userId: number): Promise<boolean>;
  
  // MMA Schedule management
  getMMAEvents(limit: number, offset: number): Promise<MMAEvent[]>;
  getMMAEvent(id: string): Promise<MMAEvent | undefined>;
  getFights(eventId: string): Promise<Fight[]>;
  saveMMAEvent(event: any): Promise<MMAEvent>;
  saveFighter(fighter: any): Promise<Fighter>;
  saveFight(fight: any): Promise<Fight>;
}

// Database implementation of the storage interface
export class DatabaseStorage implements IStorage {
  sessionStore: any;
  
  constructor() {
    // Initialize PostgreSQL session store
    const PostgresStore = connectPg(session);
    this.sessionStore = new PostgresStore({
      pool,
      createTableIfMissing: true
    });
  }
  
  // User methods
  async getUser(id: number | string): Promise<User | undefined> {
    try {
      if (id === undefined || id === null) {
        console.error('Undefined or null user ID provided');
        return undefined;
      }
      
      // Use sql tag to properly handle both string and number types
      const [user] = await db.select().from(users).where(sql`${users.id} = ${id}`);
      return user;
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.username, username));
      return user;
    } catch (error) {
      console.error('Error getting user by username:', error);
      return undefined;
    }
  }
  
  async createUser(userData: InsertUser): Promise<User> {
    try {
      // Generate UUID for user ID if not provided
      const userValues = {
        id: userData.id || uuidv4(),
        username: userData.username,
        password: userData.password,
        email: userData.email || null,
        avatar: userData.avatar || null,
        firstName: userData.firstName || null,
        lastName: userData.lastName || null,
        bio: userData.bio || null,
        profileImageUrl: userData.profileImageUrl || null,
        role: 'USER',
        status: 'AMATEUR',
        isOnline: false,
        lastActive: new Date(),
        points: 0,
        postsCount: 0,
        likesCount: 0,
        potdCount: 0,
        followersCount: 0,
        followingCount: 0,
        socialLinks: null,
        rank: 0
      };
      
      const [user] = await db.insert(users)
        .values(userValues)
        .returning();
      
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }
  }
  
  async upsertUser(userData: UpsertUser): Promise<User> {
    try {
      const [user] = await db
        .insert(users)
        .values(userData)
        .onConflictDoUpdate({
          target: users.id,
          set: {
            ...userData
          }
        })
        .returning();
      
      return user;
    } catch (error) {
      console.error('Error upserting user:', error);
      throw new Error('Failed to upsert user');
    }
  }
  
  async updateUser(id: number | string, userData: Partial<User>): Promise<User | undefined> {
    try {
      const [updatedUser] = await db
        .update(users)
        .set({
          ...userData
        })
        .where(sql`${users.id} = ${id}`)
        .returning();
      
      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      return undefined;
    }
  }
  
  async deleteUser(id: number | string): Promise<boolean> {
    try {
      await db.delete(users).where(sql`${users.id} = ${id}`);
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }
  
  async getTopUsers(limit: number): Promise<User[]> {
    try {
      // For mock data in development, return some sample users
      // This ensures the rankings section functions even if DB isn't fully populated
      // Adapted to match the actual database schema
      const sampleUsers: User[] = [
        {
          id: "1",
          username: 'FightFan123',
          email: 'fightfan@example.com',
          password: null, // Never expose passwords
          avatar: null,
          createdAt: new Date(),
          role: 'USER',
          status: 'REGIONAL',
          isOnline: true,
          lastActive: new Date(),
          points: 1250,
          postsCount: 25,
          likesCount: 150,
          potdCount: 3,
          followersCount: 10,
          followingCount: 5,
          socialLinks: null,
          rank: 1
        },
        {
          id: "2",
          username: 'OctagonExpert',
          email: 'octagon@example.com',
          password: null,
          avatar: null,
          createdAt: new Date(),
          role: 'USER',
          status: 'COMPETITOR',
          isOnline: false,
          lastActive: new Date(),
          points: 980,
          postsCount: 18,
          likesCount: 110,
          potdCount: 2,
          followersCount: 8,
          followingCount: 12,
          socialLinks: null,
          rank: 2
        },
        {
          id: "3",
          username: 'KnockoutKing',
          email: 'knockout@example.com',
          password: null,
          avatar: null,
          createdAt: new Date(),
          role: 'USER',
          status: 'AMATEUR',
          isOnline: true,
          lastActive: new Date(),
          points: 750,
          postsCount: 12,
          likesCount: 85,
          potdCount: 1,
          followersCount: 5,
          followingCount: 15,
          socialLinks: null,
          rank: 3
        }
      ];

      try {
        // First try database query with explicit column selection to match DB structure
        // We only select columns that actually exist in the database
        const topUsers = await db
          .select({
            id: users.id,
            username: users.username,
            email: users.email,
            password: users.password,
            avatar: users.avatar,
            firstName: users.firstName,
            lastName: users.lastName,
            bio: users.bio,
            profileImageUrl: users.profileImageUrl,
            role: users.role,
            status: users.status,
            isOnline: users.isOnline,
            lastActive: users.lastActive,
            points: users.points,
            rank: users.rank,
            createdAt: users.createdAt,
            updatedAt: users.updatedAt,
            postsCount: users.postsCount,
            likesCount: users.likesCount,
            potdCount: users.potdCount,
            followersCount: users.followersCount,
            followingCount: users.followingCount,
            socialLinks: users.socialLinks
          })
          .from(users)
          .orderBy(desc(users.points))
          .limit(limit);
        
        if (topUsers && topUsers.length > 0) {
          return topUsers;
        } else {
          // If no users in DB, return sample users for development
          console.log('No users found in database, using sample data for development');
          return sampleUsers.slice(0, limit);
        }
      } catch (dbError) {
        console.error('Database error getting top users:', dbError);
        // If DB query fails, return sample data in development
        return sampleUsers.slice(0, limit);
      }
    } catch (error) {
      console.error('Error getting top users:', error);
      return [];
    }
  }
  
  async getAllUsers(): Promise<User[]> {
    try {
      return await db
        .select({
          id: users.id,
          username: users.username,
          email: users.email,
          password: users.password,
          avatar: users.avatar,
          role: users.role,
          status: users.status,
          isOnline: users.isOnline,
          lastActive: users.lastActive,
          points: users.points,
          rank: users.rank,
          createdAt: users.createdAt,
          postsCount: users.postsCount,
          likesCount: users.likesCount,
          potdCount: users.potdCount,
          followersCount: users.followersCount,
          followingCount: users.followingCount,
          socialLinks: users.socialLinks
        })
        .from(users);
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }
  
  // Placeholder implementations for other methods
  // These will be implemented as needed
  
  async getThread(id: number): Promise<Thread | undefined> {
    // Temporary stub
    console.log('getThread not fully implemented', id);
    return undefined;
  }
  
  async getThreadsByCategory(categoryId: string, sort: string, limit: number, offset: number): Promise<Thread[]> {
    // Temporary stub
    console.log('getThreadsByCategory not fully implemented', categoryId, sort, limit, offset);
    return [];
  }
  
  async createThread(thread: InsertThread): Promise<Thread> {
    // Temporary stub
    console.log('createThread not fully implemented', thread);
    throw new Error('Not implemented');
  }
  
  async updateThread(id: number, threadData: Partial<Thread>): Promise<Thread | undefined> {
    // Temporary stub
    console.log('updateThread not fully implemented', id, threadData);
    return undefined;
  }
  
  async deleteThread(id: number): Promise<boolean> {
    // Temporary stub
    console.log('deleteThread not fully implemented', id);
    return false;
  }
  
  async incrementThreadView(id: number): Promise<boolean> {
    // Temporary stub
    console.log('incrementThreadView not fully implemented', id);
    return false;
  }
  
  async getReply(id: number): Promise<Reply | undefined> {
    // Temporary stub
    console.log('getReply not fully implemented', id);
    return undefined;
  }
  
  async getRepliesByThread(threadId: number): Promise<Reply[]> {
    // Temporary stub
    console.log('getRepliesByThread not fully implemented', threadId);
    return [];
  }
  
  async createReply(reply: InsertReply): Promise<Reply> {
    // Temporary stub
    console.log('createReply not fully implemented', reply);
    throw new Error('Not implemented');
  }
  
  async updateReply(id: number, replyData: Partial<Reply>): Promise<Reply | undefined> {
    // Temporary stub
    console.log('updateReply not fully implemented', id, replyData);
    return undefined;
  }
  
  async deleteReply(id: number): Promise<boolean> {
    // Temporary stub
    console.log('deleteReply not fully implemented', id);
    return false;
  }
  
  async getPoll(id: number): Promise<Poll | undefined> {
    // Temporary stub
    console.log('getPoll not fully implemented', id);
    return undefined;
  }
  
  async getPollByThread(threadId: number): Promise<Poll | undefined> {
    // Temporary stub
    console.log('getPollByThread not fully implemented', threadId);
    return undefined;
  }
  
  async createPoll(poll: InsertPoll, options: string[]): Promise<Poll> {
    // Temporary stub
    console.log('createPoll not fully implemented', poll, options);
    throw new Error('Not implemented');
  }
  
  async votePoll(pollId: number, optionId: number, userId: number): Promise<boolean> {
    // Temporary stub
    console.log('votePoll not fully implemented', pollId, optionId, userId);
    return false;
  }
  
  async getMedia(id: number): Promise<Media | undefined> {
    // Temporary stub
    console.log('getMedia not fully implemented', id);
    return undefined;
  }
  
  async getMediaByThread(threadId: number): Promise<Media[]> {
    // Temporary stub
    console.log('getMediaByThread not fully implemented', threadId);
    return [];
  }
  
  async getMediaByReply(replyId: number): Promise<Media[]> {
    // Temporary stub
    console.log('getMediaByReply not fully implemented', replyId);
    return [];
  }
  
  async createThreadMedia(media: InsertMedia): Promise<Media> {
    // Temporary stub
    console.log('createThreadMedia not fully implemented', media);
    throw new Error('Not implemented');
  }
  
  async likeThread(threadId: number, userId: number): Promise<boolean> {
    // Temporary stub
    console.log('likeThread not fully implemented', threadId, userId);
    return false;
  }
  
  async dislikeThread(threadId: number, userId: number): Promise<boolean> {
    // Temporary stub
    console.log('dislikeThread not fully implemented', threadId, userId);
    return false;
  }
  
  async potdThread(threadId: number, userId: number): Promise<boolean> {
    // Temporary stub
    console.log('potdThread not fully implemented', threadId, userId);
    return false;
  }
  
  async likeReply(replyId: number, userId: number): Promise<boolean> {
    // Temporary stub
    console.log('likeReply not fully implemented', replyId, userId);
    return false;
  }
  
  async dislikeReply(replyId: number, userId: number): Promise<boolean> {
    // Temporary stub
    console.log('dislikeReply not fully implemented', replyId, userId);
    return false;
  }
  
  async removeThreadReaction(threadId: number, userId: number, type: string): Promise<boolean> {
    // Temporary stub
    console.log('removeThreadReaction not fully implemented', threadId, userId, type);
    return false;
  }
  
  async removeReplyReaction(replyId: number, userId: number, type: string): Promise<boolean> {
    // Temporary stub
    console.log('removeReplyReaction not fully implemented', replyId, userId, type);
    return false;
  }
  
  async followUser(followerId: number, followingId: number): Promise<boolean> {
    // Temporary stub
    console.log('followUser not fully implemented', followerId, followingId);
    return false;
  }
  
  async unfollowUser(followerId: number, followingId: number): Promise<boolean> {
    // Temporary stub
    console.log('unfollowUser not fully implemented', followerId, followingId);
    return false;
  }
  
  async getFollowers(userId: number): Promise<User[]> {
    // Temporary stub
    console.log('getFollowers not fully implemented', userId);
    return [];
  }
  
  async getFollowing(userId: number): Promise<User[]> {
    // Temporary stub
    console.log('getFollowing not fully implemented', userId);
    return [];
  }
  
  async getNotifications(userId: number): Promise<Notification[]> {
    // Temporary stub
    console.log('getNotifications not fully implemented', userId);
    return [];
  }
  
  async createNotification(notification: InsertNotification): Promise<Notification> {
    // Temporary stub
    console.log('createNotification not fully implemented', notification);
    throw new Error('Not implemented');
  }
  
  async markNotificationAsRead(id: number): Promise<boolean> {
    // Temporary stub
    console.log('markNotificationAsRead not fully implemented', id);
    return false;
  }
  
  async markAllNotificationsAsRead(userId: number): Promise<boolean> {
    // Temporary stub
    console.log('markAllNotificationsAsRead not fully implemented', userId);
    return false;
  }
  
  async getMMAEvents(limit: number, offset: number): Promise<MMAEvent[]> {
    // Temporary stub
    console.log('getMMAEvents not fully implemented', limit, offset);
    return [];
  }
  
  async getMMAEvent(id: string): Promise<MMAEvent | undefined> {
    // Temporary stub
    console.log('getMMAEvent not fully implemented', id);
    return undefined;
  }
  
  async getFights(eventId: string): Promise<Fight[]> {
    // Temporary stub
    console.log('getFights not fully implemented', eventId);
    return [];
  }
  
  async saveMMAEvent(event: any): Promise<MMAEvent> {
    // Temporary stub
    console.log('saveMMAEvent not fully implemented', event);
    throw new Error('Not implemented');
  }
  
  async saveFighter(fighter: any): Promise<Fighter> {
    // Temporary stub
    console.log('saveFighter not fully implemented', fighter);
    throw new Error('Not implemented');
  }
  
  async saveFight(fight: any): Promise<Fight> {
    // Temporary stub
    console.log('saveFight not fully implemented', fight);
    throw new Error('Not implemented');
  }

  // This will be used to calculate user ranking 
  async recalculateRankings(): Promise<void> {
    try {
      const allUsers = await this.getAllUsers();
      
      // Sort users by points
      const sortedUsers = allUsers.sort((a, b) => b.points - a.points);
      
      // Update ranks
      for (let i = 0; i < sortedUsers.length; i++) {
        const user = sortedUsers[i];
        
        // Calculate rank (1-based)
        const rank = i + 1;
        
        // Only update if rank changed
        if (user.rank !== rank) {
          await db
            .update(users)
            .set({ rank })
            .where(eq(users.id, user.id));
        }
      }
    } catch (error) {
      console.error('Error recalculating rankings:', error);
    }
  }
}

// Use database storage implementation
export const storage = new DatabaseStorage();