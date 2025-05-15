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
  users,
  threads,
  replies,
  polls,
  pollOptions,
  threadMedia,
  notifications,
  threadReactions
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
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(userData: UpsertUser): Promise<User>;
  updateUser(id: string, userData: Partial<User>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  getTopUsers(limit: number): Promise<User[]>;
  getAllUsers(): Promise<User[]>;
  
  // Thread management
  getThread(id: string): Promise<Thread | undefined>;
  getThreadsByCategory(categoryId: string, sort: string, limit: number, offset: number): Promise<Thread[]>;
  createThread(thread: InsertThread): Promise<Thread>;
  updateThread(id: string, threadData: Partial<Thread>): Promise<Thread | undefined>;
  deleteThread(id: string): Promise<boolean>;
  incrementThreadView(id: string): Promise<boolean>;
  
  // Reply management
  getReply(id: string): Promise<Reply | undefined>;
  getRepliesByThread(threadId: string): Promise<Reply[]>;
  createReply(reply: InsertReply): Promise<Reply>;
  updateReply(id: string, replyData: Partial<Reply>): Promise<Reply | undefined>;
  deleteReply(id: string): Promise<boolean>;
  
  // Poll management
  getPoll(id: string): Promise<Poll | undefined>;
  getPollByThread(threadId: string): Promise<Poll | undefined>;
  createPoll(poll: InsertPoll, options: string[]): Promise<Poll>;
  votePoll(pollId: string, optionId: string, userId: string): Promise<boolean>;
  
  // Media management
  getMedia(id: string): Promise<Media | undefined>;
  getMediaByThread(threadId: string): Promise<Media[]>;
  getMediaByReply(replyId: string): Promise<Media[]>;
  createThreadMedia(media: InsertMedia): Promise<Media>;
  
  // Reaction management
  likeThread(threadId: string, userId: string): Promise<boolean>;
  dislikeThread(threadId: string, userId: string): Promise<boolean>;
  potdThread(threadId: string, userId: string): Promise<boolean>;
  likeReply(replyId: string, userId: string): Promise<boolean>;
  dislikeReply(replyId: string, userId: string): Promise<boolean>;
  removeThreadReaction(threadId: string, userId: string, type: string): Promise<boolean>;
  removeReplyReaction(replyId: string, userId: string, type: string): Promise<boolean>;
  
  // Follow management
  followUser(followerId: string, followingId: string): Promise<boolean>;
  unfollowUser(followerId: string, followingId: string): Promise<boolean>;
  getFollowers(userId: string): Promise<User[]>;
  getFollowing(userId: string): Promise<User[]>;
  
  // Notification management
  getNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: string): Promise<boolean>;
  markAllNotificationsAsRead(userId: string): Promise<boolean>;
  
  // MMA Schedule management
  getMMAEvents(limit: number, offset: number): Promise<MMAEvent[]>;
  getMMAEvent(id: string): Promise<MMAEvent | undefined>;
  getFights(eventId: string): Promise<Fight[]>;
  saveMMAEvent(event: any): Promise<MMAEvent>;
  saveFighter(fighter: any): Promise<Fighter>;
  saveFight(fight: any): Promise<Fight>;
}

// Extended Thread type that includes associated data
type ThreadWithAssociatedData = Thread & {
  user: Omit<User, 'password'>;
  media?: Media[];
  poll?: Poll & {
    options: PollOption[];
  };
};

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
  async getUser(id: string): Promise<User | undefined> {
    try {
      if (id === undefined || id === null) {
        console.error('Undefined or null user ID provided');
        return undefined;
      }
      
      // Use sql tag to properly handle both string and number types
      // Use explicit column selection to match schema
      const [user] = await db
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
        .where(sql`${users.id} = ${id}`);
      
      return user;
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      // Use explicit column selection to match schema
      const [user] = await db
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
        .where(eq(users.username, username));
      
      return user;
    } catch (error) {
      console.error('Error getting user by username:', error);
      return undefined;
    }
  }
  
  async createUser(userData: InsertUser): Promise<User> {
    try {
      // Generate a numeric ID using timestamp and random number
      const generateId = () => {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        return Math.floor(timestamp / 1000) + random;
      };
      
      // Generate numeric ID for user if not provided
      const userValues = {
        id: String(generateId()), // Convert to string since schema expects string
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
      
      console.log('Creating user with values:', {
        ...userValues,
        password: userValues.password ? '*****' : null // Don't log the password
      });
      
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
  
  async updateUser(id: string, userData: Partial<User>): Promise<User | undefined> {
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
  
  async deleteUser(id: string): Promise<boolean> {
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
          firstName: 'Fight',
          lastName: 'Fan',
          bio: 'MMA enthusiast and UFC superfan',
          profileImageUrl: null,
          createdAt: new Date(),
          updatedAt: new Date(),
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
          firstName: 'Octagon',
          lastName: 'Expert',
          bio: 'Breaking down fights since 2010',
          profileImageUrl: null,
          createdAt: new Date(),
          updatedAt: new Date(),
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
          firstName: 'Knockout',
          lastName: 'King',
          bio: 'Always predicting the KO',
          profileImageUrl: null,
          createdAt: new Date(),
          updatedAt: new Date(),
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
        .from(users);
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }
  
  // Placeholder implementations for other methods
  // These will be implemented as needed
  
  async getThread(id: string): Promise<ThreadWithAssociatedData | undefined> {
    try {
      // Build query with explicit column selection
      const [thread] = await db
        .select({
          id: threads.id,
          title: threads.title,
          content: threads.content,
          userId: threads.userId,
          categoryId: threads.categoryId,
          isPinned: threads.isPinned,
          isLocked: threads.isLocked,
          createdAt: threads.createdAt,
          updatedAt: threads.updatedAt,
          lastActivityAt: threads.lastActivityAt,
          viewCount: threads.viewCount,
          likesCount: threads.likesCount,
          dislikesCount: threads.dislikesCount,
          repliesCount: threads.repliesCount,
          isPotd: threads.isPotd
        })
        .from(threads)
        .where(eq(threads.id, id));

      if (!thread) {
        return undefined;
      }

      // Get thread author
      const user = await this.getUser(thread.userId);
      if (!user) {
        console.error(`User not found for thread ${id} with userId ${thread.userId}`);
        return undefined;
      }

      // Get thread media
      const media = await this.getMediaByThread(id);

      // Get thread poll and its options
      const poll = await this.getPollByThread(id);
      const pollWithOptions = poll ? {
        ...poll,
        options: await this.getPollOptions(poll.id)
      } : undefined;

      // Return thread with associated data
      return {
        ...thread,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          firstName: user.firstName,
          lastName: user.lastName,
          bio: user.bio,
          profileImageUrl: user.profileImageUrl,
          updatedAt: user.updatedAt,
          role: user.role,
          status: user.status,
          createdAt: user.createdAt,
          isOnline: user.isOnline,
          lastActive: user.lastActive,
          points: user.points,
          rank: user.rank,
          postsCount: user.postsCount,
          likesCount: user.likesCount,
          potdCount: user.potdCount,
          followersCount: user.followersCount,
          followingCount: user.followingCount,
          socialLinks: user.socialLinks
        },
        media: media || [],
        poll: pollWithOptions
      };
    } catch (error) {
      console.error('Error getting thread:', error);
      return undefined;
    }
  }
  
  async getThreadsByCategory(categoryId: string, sort: string, limit: number, offset: number): Promise<Thread[]> {
    try {
      // Build the base query with explicit column selection
      let baseQuery = db
        .select({
          id: threads.id,
          title: threads.title,
          content: threads.content,
          userId: threads.userId,
          categoryId: threads.categoryId,
          isPinned: threads.isPinned,
          isLocked: threads.isLocked,
          createdAt: threads.createdAt,
          updatedAt: threads.updatedAt,
          lastActivityAt: threads.lastActivityAt,
          viewCount: threads.viewCount,
          likesCount: threads.likesCount,
          dislikesCount: threads.dislikesCount,
          repliesCount: threads.repliesCount,
          isPotd: threads.isPotd
        })
        .from(threads)
        .where(eq(threads.categoryId, categoryId));

      // Add sorting based on the sort parameter
      const sortedQuery = (() => {
        switch (sort) {
          case 'recent':
            return baseQuery.orderBy(desc(threads.lastActivityAt));
          case 'popular':
            return baseQuery.orderBy(desc(threads.viewCount));
          case 'new':
            return baseQuery.orderBy(desc(threads.createdAt));
          case 'likes':
            return baseQuery.orderBy(desc(threads.likesCount));
          case 'replies':
            return baseQuery.orderBy(desc(threads.repliesCount));
          default:
            return baseQuery.orderBy(desc(threads.lastActivityAt));
        }
      })();

      // Add pagination
      const results = await sortedQuery.limit(limit).offset(offset);

      // If no results, return empty array
      if (!results || results.length === 0) {
        return [];
      }

      return results;
    } catch (error) {
      console.error('Error fetching threads by category:', error);
      // Return empty array instead of throwing to prevent UI breaks
      return [];
    }
  }
  
  async createThread(thread: InsertThread): Promise<Thread> {
    try {
      const threadValues = {
        id: uuidv4(), // Use UUID for thread ID
        title: thread.title,
        content: thread.content,
        userId: thread.userId,
        categoryId: thread.categoryId,
        isPinned: false,
        isLocked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastActivityAt: new Date(),
        viewCount: 0,
        likesCount: 0,
        dislikesCount: 0,
        repliesCount: 0,
        isPotd: false
      };
      
      const [newThread] = await db.insert(threads)
        .values(threadValues)
        .returning();
      
      return newThread;
    } catch (error) {
      console.error('Error creating thread:', error);
      throw new Error('Failed to create thread');
    }
  }
  
  async updateThread(id: string, threadData: Partial<Thread>): Promise<Thread | undefined> {
    // Temporary stub
    console.log('updateThread not fully implemented', id, threadData);
    return undefined;
  }
  
  async deleteThread(id: string): Promise<boolean> {
    // Temporary stub
    console.log('deleteThread not fully implemented', id);
    return false;
  }
  
  async incrementThreadView(id: string): Promise<boolean> {
    // Temporary stub
    console.log('incrementThreadView not fully implemented', id);
    return false;
  }
  
  async getReply(id: string): Promise<Reply | undefined> {
    // Temporary stub
    console.log('getReply not fully implemented', id);
    return undefined;
  }
  
  async getRepliesByThread(threadId: string): Promise<Reply[]> {
    try {
      // Build query with explicit column selection
      const threadReplies = await db
        .select({
          id: replies.id,
          threadId: replies.threadId,
          userId: replies.userId,
          content: replies.content,
          parentReplyId: replies.parentReplyId,
          createdAt: replies.createdAt,
          updatedAt: replies.updatedAt,
          likesCount: replies.likesCount,
          dislikesCount: replies.dislikesCount
        })
        .from(replies)
        .where(eq(replies.threadId, threadId))
        .orderBy(replies.createdAt);

      return threadReplies;
    } catch (error) {
      // Log the specific error for debugging
      console.error('Error fetching replies for thread:', {
        threadId,
        errorCode: (error as any)?.code,
        errorMessage: (error as Error)?.message
      });

      // If it's a connection error (57P01), let's try to reconnect
      if ((error as any)?.code === '57P01') {
        console.log('Attempting to reconnect to database...');
        try {
          // Import and reconnect using your db configuration
          const { db: freshDb } = await import('./db');
          
          // Retry the query with the fresh connection
          const threadReplies = await freshDb
            .select({
              id: replies.id,
              threadId: replies.threadId,
              userId: replies.userId,
              content: replies.content,
              parentReplyId: replies.parentReplyId,
              createdAt: replies.createdAt,
              updatedAt: replies.updatedAt,
              likesCount: replies.likesCount,
              dislikesCount: replies.dislikesCount
            })
            .from(replies)
            .where(eq(replies.threadId, threadId))
            .orderBy(replies.createdAt);

          return threadReplies;
        } catch (retryError) {
          console.error('Failed to reconnect and retry query:', retryError);
          return [];
        }
      }

      // For other errors, return empty array
      return [];
    }
  }
  
  async createReply(reply: InsertReply): Promise<Reply> {
    try {
      const replyValues = {
        id: uuidv4(), // Use UUID for reply ID
        threadId: reply.threadId,
        userId: reply.userId,
        content: reply.content,
        parentReplyId: reply.parentReplyId || null,
        createdAt: new Date(),
        updatedAt: new Date(),
        likesCount: 0,
        dislikesCount: 0
      };
      
      // Start a transaction
      const [newReply] = await db.transaction(async (tx) => {
        // Create the reply
        const [reply] = await tx.insert(replies)
          .values(replyValues)
          .returning();
        
        // Update the thread's repliesCount and lastActivityAt
        await tx.update(threads)
          .set({
            repliesCount: sql`${threads.repliesCount} + 1`,
            lastActivityAt: new Date()
          })
          .where(eq(threads.id, replyValues.threadId));
        
        return [reply];
      });
      
      return newReply;
    } catch (error) {
      console.error('Error creating reply:', error);
      throw new Error('Failed to create reply');
    }
  }
  
  async updateReply(id: string, replyData: Partial<Reply>): Promise<Reply | undefined> {
    // Temporary stub
    console.log('updateReply not fully implemented', id, replyData);
    return undefined;
  }
  
  async deleteReply(id: string): Promise<boolean> {
    try {
      // Get the reply to find its threadId
      const [reply] = await db
        .select()
        .from(replies)
        .where(eq(replies.id, id));

      if (!reply) {
        return false;
      }

      // Start a transaction
      await db.transaction(async (tx) => {
        // Delete the reply
        await tx.delete(replies)
          .where(eq(replies.id, id));
        
        // Update the thread's repliesCount
        await tx.update(threads)
          .set({
            repliesCount: sql`${threads.repliesCount} - 1`
          })
          .where(eq(threads.id, reply.threadId));
      });

      return true;
    } catch (error) {
      console.error('Error deleting reply:', error);
      return false;
    }
  }
  
  async getPoll(id: string): Promise<Poll | undefined> {
    // Temporary stub
    console.log('getPoll not fully implemented', id);
    return undefined;
  }
  
  async getPollByThread(threadId: string): Promise<Poll | undefined> {
    try {
      const [poll] = await db
        .select({
          id: polls.id,
          threadId: polls.threadId,
          question: polls.question,
          expiresAt: polls.expiresAt,
          createdAt: polls.createdAt,
          votesCount: polls.votesCount
        })
        .from(polls)
        .where(eq(polls.threadId, threadId));

      return poll;
    } catch (error) {
      console.error('Error fetching poll for thread:', error);
      return undefined;
    }
  }
  
  async createPoll(poll: InsertPoll, options: string[]): Promise<Poll> {
    try {
      const pollId = uuidv4(); // Use UUID for poll ID
      
      const pollValues = {
        id: pollId,
        threadId: poll.threadId,
        question: poll.question,
        expiresAt: poll.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days
        createdAt: new Date(),
        votesCount: 0
      };
      
      const [newPoll] = await db.insert(polls)
        .values(pollValues)
        .returning();
      
      // Create poll options
      for (const optionText of options) {
        await db.insert(pollOptions)
          .values({
            id: uuidv4(), // Use UUID for option ID
            pollId,
            text: optionText,
            votesCount: 0
          });
      }
      
      return newPoll;
    } catch (error) {
      console.error('Error creating poll:', error);
      throw new Error('Failed to create poll');
    }
  }
  
  async votePoll(pollId: string, optionId: string, userId: string): Promise<boolean> {
    // Temporary stub
    console.log('votePoll not fully implemented', pollId, optionId, userId);
    return false;
  }
  
  async getMedia(id: string): Promise<Media | undefined> {
    // Temporary stub
    console.log('getMedia not fully implemented', id);
    return undefined;
  }
  
  async getMediaByThread(threadId: string): Promise<Media[]> {
    try {
      const media = await db
        .select({
          id: threadMedia.id,
          threadId: threadMedia.threadId,
          type: threadMedia.type,
          url: threadMedia.url,
          createdAt: threadMedia.createdAt
        })
        .from(threadMedia)
        .where(eq(threadMedia.threadId, threadId))
        .orderBy(threadMedia.createdAt);

      return media;
    } catch (error) {
      console.error('Error fetching media for thread:', error);
      return [];
    }
  }
  
  async getMediaByReply(replyId: string): Promise<Media[]> {
    // Temporary stub
    console.log('getMediaByReply not fully implemented', replyId);
    return [];
  }
  
  async createThreadMedia(media: InsertMedia): Promise<Media> {
    try {
      const mediaValues = {
        id: uuidv4(), // Use UUID for media ID
        threadId: media.threadId,
        type: media.type,
        url: media.url,
        createdAt: new Date()
      };
      
      const [newMedia] = await db.insert(threadMedia)
        .values(mediaValues)
        .returning();
      
      return newMedia;
    } catch (error) {
      console.error('Error creating media:', error);
      throw new Error('Failed to create media');
    }
  }
  
  async likeThread(threadId: string, userId: string): Promise<boolean> {
    try {
      // Start a transaction
      return await db.transaction(async (tx) => {
        // Check if user has already liked this thread
        const existingReaction = await tx.query.threadReactions.findFirst({
          where: and(
            eq(threadReactions.threadId, threadId),
            eq(threadReactions.userId, userId),
            eq(threadReactions.type, 'LIKE')
          )
        });

        if (existingReaction) {
          return false; // User has already liked this thread
        }

        // Get the thread to check if it exists and get the owner's ID
        const thread = await tx.query.threads.findFirst({
          where: eq(threads.id, threadId),
          columns: {
            userId: true
          }
        });

        if (!thread) {
          return false; // Thread doesn't exist
        }

        // Create the reaction
        await tx.insert(threadReactions).values({
          id: uuidv4(),
          threadId,
          userId,
          type: 'LIKE',
          createdAt: new Date()
        });

        // Update thread likes count
        await tx.update(threads)
          .set({
            likesCount: sql`${threads.likesCount} + 1`
          })
          .where(eq(threads.id, threadId));

        // Create notification for thread owner
        // Don't notify if the user is liking their own thread
        if (thread.userId !== userId) {
          await tx.insert(notifications).values({
            id: uuidv4(),
            userId: thread.userId,
            type: 'LIKE',
            relatedUserId: userId,
            threadId,
            message: 'liked your thread',
            isRead: false,
            createdAt: new Date()
          });
        }

        return true;
      });
    } catch (error) {
      console.error('Error liking thread:', error);
      return false;
    }
  }
  
  async dislikeThread(threadId: string, userId: string): Promise<boolean> {
    // Temporary stub
    console.log('dislikeThread not fully implemented', threadId, userId);
    return false;
  }
  
  async potdThread(threadId: string, userId: string): Promise<boolean> {
    // Temporary stub
    console.log('potdThread not fully implemented', threadId, userId);
    return false;
  }
  
  async likeReply(replyId: string, userId: string): Promise<boolean> {
    // Temporary stub
    console.log('likeReply not fully implemented', replyId, userId);
    return false;
  }
  
  async dislikeReply(replyId: string, userId: string): Promise<boolean> {
    // Temporary stub
    console.log('dislikeReply not fully implemented', replyId, userId);
    return false;
  }
  
  async removeThreadReaction(threadId: string, userId: string, type: string): Promise<boolean> {
    // Temporary stub
    console.log('removeThreadReaction not fully implemented', threadId, userId, type);
    return false;
  }
  
  async removeReplyReaction(replyId: string, userId: string, type: string): Promise<boolean> {
    // Temporary stub
    console.log('removeReplyReaction not fully implemented', replyId, userId, type);
    return false;
  }
  
  async followUser(followerId: string, followingId: string): Promise<boolean> {
    // Temporary stub
    console.log('followUser not fully implemented', followerId, followingId);
    return false;
  }
  
  async unfollowUser(followerId: string, followingId: string): Promise<boolean> {
    // Temporary stub
    console.log('unfollowUser not fully implemented', followerId, followingId);
    return false;
  }
  
  async getFollowers(userId: string): Promise<User[]> {
    // Temporary stub
    console.log('getFollowers not fully implemented', userId);
    return [];
  }
  
  async getFollowing(userId: string): Promise<User[]> {
    // Temporary stub
    console.log('getFollowing not fully implemented', userId);
    return [];
  }
  
  async getNotifications(userId: string): Promise<Notification[]> {
    // Temporary stub
    console.log('getNotifications not fully implemented', userId);
    return [];
  }
  
  async createNotification(notification: InsertNotification): Promise<Notification> {
    try {
      const notificationValues = {
        id: uuidv4(), // Use UUID for notification ID
        userId: notification.userId,
        type: notification.type,
        relatedUserId: notification.relatedUserId || null,
        threadId: notification.threadId || null,
        replyId: notification.replyId || null,
        message: notification.message || null,
        isRead: false,
        createdAt: new Date()
      };
      
      const [newNotification] = await db.insert(notifications)
        .values(notificationValues)
        .returning();
      
      return newNotification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw new Error('Failed to create notification');
    }
  }
  
  async markNotificationAsRead(id: string): Promise<boolean> {
    // Temporary stub
    console.log('markNotificationAsRead not fully implemented', id);
    return false;
  }
  
  async markAllNotificationsAsRead(userId: string): Promise<boolean> {
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

  async getPollOptions(pollId: string): Promise<PollOption[]> {
    try {
      const options = await db
        .select({
          id: pollOptions.id,
          pollId: pollOptions.pollId,
          text: pollOptions.text,
          votesCount: pollOptions.votesCount
        })
        .from(pollOptions)
        .where(eq(pollOptions.pollId, pollId))
        .orderBy(pollOptions.id);

      return options;
    } catch (error) {
      console.error('Error getting poll options:', error);
      return [];
    }
  }
}

// Use database storage implementation
export const storage = new DatabaseStorage();