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
  threadReactions,
  pollVotes,
  replyReactions,
} from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool, db } from "./db";
import { eq, and, sql, desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export interface IStorage {
  // Session store
  sessionStore: any;

  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByExternalId(externalId: string): Promise<User | undefined>;
  getUserByStripeId(stripeId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(userData: UpsertUser): Promise<User>;
  updateUser(id: string, userData: Partial<User>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  getTopUsers(limit: number): Promise<User[]>;
  getAllUsers(): Promise<User[]>;

  // Thread management
  getThread(
    id: string,
    currentUserId?: string,
  ): Promise<ThreadWithAssociatedData | undefined>;
  getThreadsByCategory(
    categoryId: string,
    sort: string,
    limit: number,
    offset: number,
  ): Promise<Thread[]>;
  getThreadsByUser(userId: string): Promise<Thread[]>;
  createThread(thread: InsertThread): Promise<Thread>;
  updateThread(
    id: string,
    threadData: Partial<Thread>,
  ): Promise<Thread | undefined>;
  deleteThread(id: string): Promise<boolean>;
  incrementThreadView(id: string): Promise<boolean>;

  // Reply management
  getReply(id: string): Promise<Reply | undefined>;
  getRepliesByThread(threadId: string): Promise<Reply[]>;
  createReply(reply: InsertReply): Promise<Reply>;
  updateReply(
    id: string,
    replyData: Partial<Reply>,
  ): Promise<Reply | undefined>;
  deleteReply(id: string): Promise<boolean>;

  // Poll management
  getPoll(id: string): Promise<Poll | undefined>;
  getPollByThread(threadId: string): Promise<Poll | undefined>;
  createPoll(poll: InsertPoll, options: string[]): Promise<Poll>;
  votePoll(pollId: string, optionId: string, userId: string): Promise<boolean>;
  getUserPollVote(
    pollId: string,
    userId: string,
  ): Promise<{ optionId: string } | null>;

  // Media management
  getMedia(id: string): Promise<Media | undefined>;
  getMediaByThread(threadId: string): Promise<Media[]>;
  getMediaByReply(replyId: string): Promise<Media[]>;
  createThreadMedia(media: InsertMedia): Promise<Media>;

  // Reaction management
  likeThread(threadId: string, userId: string): Promise<boolean>;
  dislikeThread(threadId: string, userId: string): Promise<boolean>;
  pinnedByUserThread(threadId: string, userId: string): Promise<boolean>;
  potdThread(threadId: string, userId: string): Promise<boolean>;
  likeReply(replyId: string, userId: string): Promise<boolean>;
  dislikeReply(replyId: string, userId: string): Promise<boolean>;

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

  // User ranking and status management
  recalculateRankings(): Promise<void>;
  recalculateUserStatus(userId: string): Promise<string | undefined>;
  recalculateAllUserStatuses(): Promise<{
    success: number;
    failed: number;
    unchanged: number;
  }>;
}

// Extended Thread type that includes associated data
type ThreadWithAssociatedData = Thread & {
  user: Omit<User, "password">;
  media?: Media[];
  poll?: Poll & {
    options: PollOption[];
  };
  hasLiked: boolean;
  hasPotd: boolean;
};

// Database implementation of the storage interface
export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    // Initialize PostgreSQL session store
    const PostgresStore = connectPg(session);
    this.sessionStore = new PostgresStore({
      pool,
      // Don't try to create the table automatically
      createTableIfMissing: false,
      // Use a custom table name to avoid conflicts
      tableName: "user_sessions",
    });
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    try {
      if (id === undefined || id === null) {
        console.error("Undefined or null user ID provided");
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
          externalId: users.externalId,
          stripeId: users.stripeId,
          planType: users.planType,
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
          pinnedByUserCount: users.pinnedByUserCount,
          followersCount: users.followersCount,
          followingCount: users.followingCount,
          socialLinks: users.socialLinks,
        })
        .from(users)
        .where(sql`${users.id} = ${id}`);

      return user;
    } catch (error) {
      console.error("Error getting user:", error);
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
          externalId: users.externalId,
          stripeId: users.stripeId,
          planType: users.planType,
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
          pinnedByUserCount: users.pinnedByUserCount,
          followersCount: users.followersCount,
          followingCount: users.followingCount,
          socialLinks: users.socialLinks,
        })
        .from(users)
        .where(eq(users.username, username));

      return user;
    } catch (error) {
      console.error("Error getting user by username:", error);
      return undefined;
    }
  }

  async getUserByExternalId(externalId: string): Promise<User | undefined> {
    console.log(`Looking up user by externalId: ${externalId}`);
    try {
      const [user] = await db
        .select({
          id: users.id,
          username: users.username,
          email: users.email,
          password: users.password,
          externalId: users.externalId,
          stripeId: users.stripeId,
          planType: users.planType,
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
          pinnedByUserCount: users.pinnedByUserCount,
          followersCount: users.followersCount,
          followingCount: users.followingCount,
          socialLinks: users.socialLinks,
        })
        .from(users)
        .where(eq(users.externalId, externalId));

      return user;
    } catch (error) {
      console.error("Error getting user by external ID:", error);
      return undefined;
    }
  }

  async getUserByStripeId(stripeId: string): Promise<User | undefined> {
    try {
      // Use explicit column selection to match schema
      const [user] = await db
        .select({
          id: users.id,
          username: users.username,
          email: users.email,
          password: users.password,
          externalId: users.externalId,
          stripeId: users.stripeId,
          planType: users.planType,
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
          pinnedByUserCount: users.pinnedByUserCount,
          followersCount: users.followersCount,
          followingCount: users.followingCount,
          socialLinks: users.socialLinks,
        })
        .from(users)
        .where(eq(users.stripeId, stripeId));

      return user;
    } catch (error) {
      console.error("Error getting user by Stripe ID:", error);
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
        id: userData.id || String(generateId()), // Convert to string since schema expects string
        username: userData.username,
        password: userData.password || null,
        email: userData.email || null,
        externalId: userData.externalId || null,
        stripeId: userData.stripeId || null,
        avatar: userData.avatar || null,
        firstName: userData.firstName || null,
        lastName: userData.lastName || null,
        bio: userData.bio || null,
        profileImageUrl: userData.profileImageUrl || null,
        role: userData.role || "USER",
        status: userData.status || "AMATEUR",
        isOnline: userData.isOnline || false,
        lastActive: new Date(),
        points: userData.points || 0,
        postsCount: userData.postsCount || 0,
        likesCount: userData.likesCount || 0,
        pinnedByUserCount: userData.pinnedByUserCount || 0,
        followersCount: userData.followersCount || 0,
        followingCount: userData.followingCount || 0,
        socialLinks: userData.socialLinks || {},
        rank: userData.rank || 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      console.log("Creating user with values:", {
        ...userValues,
        password: "[REDACTED]", // Don't log the password
      });

      const [user] = await db.insert(users).values(userValues).returning();

      if (!user) {
        throw new Error("Failed to create user");
      }

      return user;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
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
            ...userData,
          },
        })
        .returning();

      return user;
    } catch (error) {
      console.error("Error upserting user:", error);
      throw new Error("Failed to upsert user");
    }
  }

  async updateUser(
    id: string,
    userData: Partial<User>,
  ): Promise<User | undefined> {
    try {
      const [updatedUser] = await db
        .update(users)
        .set({
          ...userData,
        })
        .where(sql`${users.id} = ${id}`)
        .returning();

      return updatedUser;
    } catch (error) {
      console.error("Error updating user:", error);
      return undefined;
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      await db.delete(users).where(sql`${users.id} = ${id}`);
      return true;
    } catch (error) {
      console.error("Error deleting user:", error);
      return false;
    }
  }

  async getTopUsers(limit: number): Promise<User[]> {
    try {
      // Query database for top users ordered by points
      const userResults = await db
        .select({
          id: users.id,
          username: users.username,
          email: users.email,
          password: users.password,
          externalId: users.externalId,
          stripeId: users.stripeId,
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
          pinnedByUserCount: users.pinnedByUserCount,
          followersCount: users.followersCount,
          followingCount: users.followingCount,
          socialLinks: users.socialLinks,
        })
        .from(users)
        .orderBy(desc(users.points))
        .limit(limit);

      // Process users to handle ties correctly
      let currentRank = 1;
      let currentPoints = -1;
      let usersAtCurrentRank = 0;

      // First pass: identify ties and assign ranks
      const processedUsers = userResults.map((user, index) => {
        // If this is a new points value, update the rank
        if (user.points !== currentPoints) {
          // The new rank should be the position after all previous users
          currentRank = index + 1;
          currentPoints = user.points;
          usersAtCurrentRank = 1;
        } else {
          // Same points as previous user, keep the same rank
          usersAtCurrentRank++;
        }

        // Return user with updated rank
        return {
          ...user,
          rank: currentRank,
        };
      });

      // Update ranks in database
      await Promise.all(
        processedUsers.map((user) =>
          db
            .update(users)
            .set({ rank: user.rank })
            .where(eq(users.id, user.id)),
        ),
      );

      return processedUsers;
    } catch (error) {
      console.error("Error getting top users:", error);
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
          externalId: users.externalId,
          stripeId: users.stripeId,
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
          pinnedByUserCount: users.pinnedByUserCount,
          followersCount: users.followersCount,
          followingCount: users.followingCount,
          socialLinks: users.socialLinks,
        })
        .from(users);
    } catch (error) {
      console.error("Error getting all users:", error);
      return [];
    }
  }

  // Placeholder implementations for other methods
  // These will be implemented as needed

  async getThread(
    id: string,
    currentUserId?: string,
  ): Promise<ThreadWithAssociatedData | undefined> {
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
          isPinnedByUser: threads.isPinnedByUser,
          potdCount: threads.potdCount
        })
        .from(threads)
        .where(eq(threads.id, id));

      if (!thread) {
        return undefined;
      }

      // Get thread author
      const user = await this.getUser(thread.userId);
      if (!user) {
        console.error(
          `User not found for thread ${id} with userId ${thread.userId}`,
        );
        return undefined;
      }

      // Get thread media
      const media = await this.getMediaByThread(id);

      // Get thread poll and its options
      const poll = await this.getPollByThread(id);
      const pollWithOptions = poll
        ? {
            ...poll,
            options: await this.getPollOptions(poll.id),
          }
        : undefined;

      // Check if the current user has liked this thread
      let hasLiked = false;
      let hasPotd = false;
      if (currentUserId) {
        const existingLikeReaction = await db.query.threadReactions.findFirst({
          where: and(
            eq(threadReactions.threadId, id),
            eq(threadReactions.userId, currentUserId),
            eq(threadReactions.type, "LIKE"),
          ),
        });
        hasLiked = !!existingLikeReaction;
        
        // Check if the current user has marked this thread as POTD
        const existingPotdReaction = await db.query.threadReactions.findFirst({
          where: and(
            eq(threadReactions.threadId, id),
            eq(threadReactions.userId, currentUserId),
            eq(threadReactions.type, "POTD"),
          ),
        });
        hasPotd = !!existingPotdReaction;
      }

      // Return thread with associated data
      return {
        ...thread,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          externalId: user.externalId,
          stripeId: user.stripeId,
          planType: user.planType,
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
          pinnedByUserCount: user.pinnedByUserCount,
          followersCount: user.followersCount,
          followingCount: user.followingCount,
          socialLinks: user.socialLinks,
        },
        media: media || [],
        poll: pollWithOptions,
        hasLiked,
        hasPotd,
      };
    } catch (error) {
      console.error("Error getting thread:", error);
      return undefined;
    }
  }

  async getThreadsByCategory(
    categoryId: string,
    sort: string,
    limit: number,
    offset: number,
  ): Promise<Thread[]> {
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
          isPinnedByUser: threads.isPinnedByUser,
          potdCount: threads.potdCount
        })
        .from(threads)
        .where(eq(threads.categoryId, categoryId));

      // Add sorting based on the sort parameter
      const sortedQuery = (() => {
        switch (sort) {
          case "recent":
            return baseQuery.orderBy(desc(threads.lastActivityAt));
          case "popular":
            return baseQuery.orderBy(desc(threads.viewCount));
          case "new":
            return baseQuery.orderBy(desc(threads.createdAt));
          case "likes":
            return baseQuery.orderBy(desc(threads.likesCount));
          case "replies":
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
      console.error("Error fetching threads by category:", error);
      // Return empty array instead of throwing to prevent UI breaks
      return [];
    }
  }

  async getThreadsByUser(userId: string): Promise<Thread[]> {
    try {
      // Build query with explicit column selection
      const userThreads = await db
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
          isPinnedByUser: threads.isPinnedByUser,
          potdCount: threads.potdCount
        })
        .from(threads)
        .where(eq(threads.userId, userId))
        .orderBy(desc(threads.createdAt));

      return userThreads;
    } catch (error) {
      console.error("Error fetching threads for user:", error);
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
        isPinnedByUser: false,
        potdCount: 0
      };

      // Start a transaction to create thread and update user points
      const [newThread] = await db.transaction(async (tx) => {
        // Create the thread
        const [thread] = await tx
          .insert(threads)
          .values(threadValues)
          .returning();

        // Update user's points and posts count
        await tx
          .update(users)
          .set({
            points: sql`${users.points} + 1`,
            postsCount: sql`${users.postsCount} + 1`,
          })
          .where(eq(users.id, thread.userId));

        return [thread];
      });

      return newThread;
    } catch (error) {
      console.error("Error creating thread:", error);
      throw new Error("Failed to create thread");
    }
  }

  // TODO test
  async updateThread(
    id: string,
    threadData: Partial<Thread>,
  ): Promise<Thread | undefined> {
    try {
      // Get current thread data to check if it exists and compare changes
      const currentThread = await db.query.threads.findFirst({
        where: eq(threads.id, id),
      });

      if (!currentThread) {
        return undefined;
      }

      // Prepare update data with updatedAt timestamp
      const updateData = {
        ...threadData,
        updatedAt: new Date(),
      };

      // If content or title is updated, also update lastActivityAt
      if (threadData.content || threadData.title) {
        updateData.lastActivityAt = new Date();
      }

      // Start a transaction for the update
      const [updatedThread] = await db.transaction(async (tx) => {
        // Update the thread
        const [thread] = await tx
          .update(threads)
          .set(updateData)
          .where(eq(threads.id, id))
          .returning();

        // If thread is being locked/unlocked, create a notification for the thread owner
        if (
          threadData.isLocked !== undefined &&
          threadData.isLocked !== currentThread.isLocked
        ) {
          // await tx.insert(notifications).values({
          //   id: uuidv4(),
          //   userId: currentThread.userId,
          //   type: threadData.isLocked ? 'THREAD_LOCKED' : 'THREAD_UNLOCKED',
          //   threadId: id,
          //   message: threadData.isLocked ? 'Your thread has been locked' : 'Your thread has been unlocked',
          //   isRead: false,
          //   createdAt: new Date()
          // });
        }

        // If thread is being pinned/unpinned, create a notification for the thread owner
        if (
          threadData.isPinned !== undefined &&
          threadData.isPinned !== currentThread.isPinned
        ) {
          // await tx.insert(notifications).values({
          //   id: uuidv4(),
          //   userId: currentThread.userId,
          //   type: threadData.isPinned ? 'THREAD_PINNED' : 'THREAD_UNPINNED',
          //   threadId: id,
          //   message: threadData.isPinned ? 'Your thread has been pinned' : 'Your thread has been unpinned',
          //   isRead: false,
          //   createdAt: new Date()
          // });
        }

        return [thread];
      });

      return updatedThread;
    } catch (error) {
      console.error("Error updating thread:", error);
      return undefined;
    }
  }

  async deleteThread(id: string): Promise<boolean> {
    try {
      // Start a transaction to delete the thread and all associated data
      await db.transaction(async (tx) => {
        // Get the thread first to get the userId and likes count
        const thread = await tx.query.threads.findFirst({
          where: eq(threads.id, id),
          columns: {
            userId: true,
            likesCount: true,
          },
        });

        if (!thread) {
          return false;
        }

        // Update user's counts before deleting thread data
        await tx
          .update(users)
          .set({
            postsCount: sql`${users.postsCount} - 1`,
            likesCount: sql`${users.likesCount} - ${thread.likesCount}`, // Remove all likes from user's total
          })
          .where(eq(users.id, thread.userId));

        // Delete all thread reactions
        await tx
          .delete(threadReactions)
          .where(eq(threadReactions.threadId, id));

        // Delete all poll votes and options if the thread has a poll
        const poll = await tx.query.polls.findFirst({
          where: eq(polls.threadId, id),
        });

        if (poll) {
          await tx.delete(pollVotes).where(eq(pollVotes.pollId, poll.id));
          await tx.delete(pollOptions).where(eq(pollOptions.pollId, poll.id));
          await tx.delete(polls).where(eq(polls.threadId, id));
        }

        // Delete all thread media
        await tx.delete(threadMedia).where(eq(threadMedia.threadId, id));

        // Delete all thread replies
        await tx.delete(replies).where(eq(replies.threadId, id));

        // Finally, delete the thread itself
        await tx.delete(threads).where(eq(threads.id, id));
      });

      return true;
    } catch (error) {
      console.error("Error deleting thread:", error);
      return false;
    }
  }

  // TODO test
  async incrementThreadView(id: string): Promise<boolean> {
    try {
      // Check if thread exists first
      const thread = await db.query.threads.findFirst({
        where: eq(threads.id, id),
      });

      if (!thread) {
        return false;
      }

      // Increment the view count
      await db
        .update(threads)
        .set({
          viewCount: sql`${threads.viewCount} + 1`,
          lastActivityAt: new Date(), // Update last activity time on view
        })
        .where(eq(threads.id, id));

      return true;
    } catch (error) {
      console.error("Error incrementing thread view:", error);
      return false;
    }
  }

  async getReply(id: string): Promise<Reply | undefined> {
    try {
      // Get reply with explicit column selection
      const [reply] = await db
        .select({
          id: replies.id,
          threadId: replies.threadId,
          userId: replies.userId,
          content: replies.content,
          parentReplyId: replies.parentReplyId,
          createdAt: replies.createdAt,
          updatedAt: replies.updatedAt,
          likesCount: replies.likesCount,
          dislikesCount: replies.dislikesCount,
        })
        .from(replies)
        .where(eq(replies.id, id));

      if (!reply) {
        return undefined;
      }

      return reply;
    } catch (error) {
      console.error("Error getting reply:", error);
      return undefined;
    }
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
          dislikesCount: replies.dislikesCount,
        })
        .from(replies)
        .where(eq(replies.threadId, threadId))
        .orderBy(replies.createdAt);

      return threadReplies;
    } catch (error) {
      // Log the specific error for debugging
      console.error("Error fetching replies for thread:", {
        threadId,
        errorCode: (error as any)?.code,
        errorMessage: (error as Error)?.message,
      });

      // If it's a connection error (57P01), let's try to reconnect
      if ((error as any)?.code === "57P01") {
        console.log("Attempting to reconnect to database...");
        try {
          // Use the existing db instance instead of creating a new one
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
              dislikesCount: replies.dislikesCount,
            })
            .from(replies)
            .where(eq(replies.threadId, threadId))
            .orderBy(replies.createdAt);

          return threadReplies;
        } catch (retryError) {
          console.error("Failed to retry query:", retryError);
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
        dislikesCount: 0,
      };

      // Start a transaction
      const [newReply] = await db.transaction(async (tx) => {
        // Create the reply
        const [reply] = await tx
          .insert(replies)
          .values(replyValues)
          .returning();

        // Update the thread's repliesCount and lastActivityAt
        await tx
          .update(threads)
          .set({
            repliesCount: sql`${threads.repliesCount} + 1`,
            lastActivityAt: new Date(),
          })
          .where(eq(threads.id, replyValues.threadId));

        return [reply];
      });

      return newReply;
    } catch (error) {
      console.error("Error creating reply:", error);
      throw new Error("Failed to create reply");
    }
  }

  // T
  async updateReply(
    id: string,
    replyData: Partial<Reply>,
  ): Promise<Reply | undefined> {
    try {
      // Get current reply data to check if it exists
      const currentReply = await db.query.replies.findFirst({
        where: eq(replies.id, id),
      });

      if (!currentReply) {
        return undefined;
      }

      // Prepare update data with updatedAt timestamp
      const updateData = {
        ...replyData,
        updatedAt: new Date(),
      };

      // Start a transaction for the update
      const [updatedReply] = await db.transaction(async (tx) => {
        // Update the reply
        const [reply] = await tx
          .update(replies)
          .set(updateData)
          .where(eq(replies.id, id))
          .returning();

        // Update the thread's lastActivityAt to show recent activity
        if (replyData.content) {
          await tx
            .update(threads)
            .set({ lastActivityAt: new Date() })
            .where(eq(threads.id, currentReply.threadId));
        }

        return [reply];
      });

      return updatedReply;
    } catch (error) {
      console.error("Error updating reply:", error);
      return undefined;
    }
  }

  async deleteReply(id: string): Promise<boolean> {
    try {
      // Get the reply to find its threadId
      const [reply] = await db.select().from(replies).where(eq(replies.id, id));

      if (!reply) {
        return false;
      }

      // Start a transaction
      await db.transaction(async (tx) => {
        // Delete the reply
        await tx.delete(replies).where(eq(replies.id, id));

        // Update the thread's repliesCount
        await tx
          .update(threads)
          .set({
            repliesCount: sql`${threads.repliesCount} - 1`,
          })
          .where(eq(threads.id, reply.threadId));
      });

      return true;
    } catch (error) {
      console.error("Error deleting reply:", error);
      return false;
    }
  }

  // TODO test
  async getPoll(id: string): Promise<Poll | undefined> {
    try {
      // Build query with explicit column selection
      const [poll] = await db
        .select({
          id: polls.id,
          threadId: polls.threadId,
          question: polls.question,
          expiresAt: polls.expiresAt,
          createdAt: polls.createdAt,
          votesCount: polls.votesCount,
        })
        .from(polls)
        .where(eq(polls.id, id));

      if (!poll) {
        return undefined;
      }

      return poll;
    } catch (error) {
      console.error("Error getting poll:", error);
      return undefined;
    }
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
          votesCount: polls.votesCount,
        })
        .from(polls)
        .where(eq(polls.threadId, threadId));

      return poll;
    } catch (error) {
      console.error("Error fetching poll for thread:", error);
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
        expiresAt:
          poll.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days
        createdAt: new Date(),
        votesCount: 0,
      };

      const [newPoll] = await db.insert(polls).values(pollValues).returning();

      // Create poll options
      for (const optionText of options) {
        await db.insert(pollOptions).values({
          id: uuidv4(), // Use UUID for option ID
          pollId,
          text: optionText,
          votesCount: 0,
        });
      }

      return newPoll;
    } catch (error) {
      console.error("Error creating poll:", error);
      throw new Error("Failed to create poll");
    }
  }

  async votePoll(
    pollId: string,
    optionId: string,
    userId: string,
  ): Promise<boolean> {
    try {
      // Start a transaction
      return await db.transaction(async (tx) => {
        // Check if user has already voted in this poll
        const existingVote = await tx.query.pollVotes.findFirst({
          where: and(
            eq(pollVotes.pollId, pollId),
            eq(pollVotes.userId, userId),
          ),
        });

        if (existingVote) {
          return false; // User has already voted
        }

        // Check if poll and option exist
        const poll = await tx.query.polls.findFirst({
          where: eq(polls.id, pollId),
        });

        const option = await tx.query.pollOptions.findFirst({
          where: eq(pollOptions.id, optionId),
        });

        if (!poll || !option) {
          return false; // Poll or option doesn't exist
        }

        // Check if poll has expired
        if (poll.expiresAt && new Date() > poll.expiresAt) {
          return false; // Poll has expired
        }

        // Record the vote
        await tx.insert(pollVotes).values({
          id: uuidv4(),
          pollId,
          pollOptionId: optionId,
          userId,
          createdAt: new Date(),
        });

        // Increment the vote count for the chosen option
        await tx
          .update(pollOptions)
          .set({
            votesCount: sql`${pollOptions.votesCount} + 1`,
          })
          .where(eq(pollOptions.id, optionId));

        // Increment the total votes count for the poll
        await tx
          .update(polls)
          .set({
            votesCount: sql`${polls.votesCount} + 1`,
          })
          .where(eq(polls.id, pollId));

        return true;
      });
    } catch (error) {
      console.error("Error voting in poll:", error);
      return false;
    }
  }

  async getUserPollVote(
    pollId: string,
    userId: string,
  ): Promise<{ optionId: string } | null> {
    try {
      // Lookup if the user has already voted on this poll
      const existingVote = await db.query.pollVotes.findFirst({
        where: and(eq(pollVotes.pollId, pollId), eq(pollVotes.userId, userId)),
        columns: {
          pollOptionId: true,
        },
      });

      if (existingVote) {
        return { optionId: existingVote.pollOptionId };
      }

      return null;
    } catch (error) {
      console.error("Error getting user poll vote:", error);
      return null;
    }
  }

  async getMedia(id: string): Promise<Media | undefined> {
    // Temporary stub
    console.log("getMedia not fully implemented", id);
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
          createdAt: threadMedia.createdAt,
        })
        .from(threadMedia)
        .where(eq(threadMedia.threadId, threadId))
        .orderBy(threadMedia.createdAt);

      return media;
    } catch (error) {
      console.error("Error fetching media for thread:", error);
      return [];
    }
  }

  async getMediaByReply(replyId: string): Promise<Media[]> {
    // Temporary stub
    console.log("getMediaByReply not fully implemented", replyId);
    return [];
  }

  async createThreadMedia(media: InsertMedia): Promise<Media> {
    try {
      const mediaValues = {
        id: uuidv4(), // Use UUID for media ID
        threadId: media.threadId,
        type: media.type,
        url: media.url,
        createdAt: new Date(),
      };

      const [newMedia] = await db
        .insert(threadMedia)
        .values(mediaValues)
        .returning();

      return newMedia;
    } catch (error) {
      console.error("Error creating media:", error);
      throw new Error("Failed to create media");
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
            eq(threadReactions.type, "LIKE"),
          ),
        });

        // Get the thread to check if it exists and get the owner's ID
        const thread = await tx.query.threads.findFirst({
          where: eq(threads.id, threadId),
          columns: {
            userId: true,
          },
        });

        if (!thread) {
          return false; // Thread doesn't exist
        }

        if (existingReaction) {
          // User has already liked this thread - remove the like
          await tx
            .delete(threadReactions)
            .where(
              and(
                eq(threadReactions.threadId, threadId),
                eq(threadReactions.userId, userId),
                eq(threadReactions.type, "LIKE"),
              ),
            );

          // Decrease thread likes count
          await tx
            .update(threads)
            .set({
              likesCount: sql`${threads.likesCount} - 1`,
            })
            .where(eq(threads.id, threadId));

          // Remove points and decrement likesCount from thread owner (if not liking their own thread)
          if (thread.userId !== userId) {
            await tx
              .update(users)
              .set({
                points: sql`${users.points} - 2`,
                likesCount: sql`${users.likesCount} - 1`, // Track total likes received
              })
              .where(eq(users.id, thread.userId));
          }

          return true;
        }

        // Create new like reaction
        await tx.insert(threadReactions).values({
          id: uuidv4(),
          threadId,
          userId,
          type: "LIKE",
          createdAt: new Date(),
        });

        // Update thread likes count
        await tx
          .update(threads)
          .set({
            likesCount: sql`${threads.likesCount} + 1`,
          })
          .where(eq(threads.id, threadId));

        // Add points and increment likesCount for thread owner (if not liking their own thread)
        if (thread.userId !== userId) {
          await tx
            .update(users)
            .set({
              points: sql`${users.points} + 2`,
              likesCount: sql`${users.likesCount} + 1`, // Track total likes received
            })
            .where(eq(users.id, thread.userId));

          // Create notification for thread owner
          // await tx.insert(notifications).values({
          //   id: uuidv4(),
          //   userId: thread.userId,
          //   type: 'LIKE',
          //   relatedUserId: userId,
          //   threadId,
          //   message: 'liked your thread',
          //   isRead: false,
          //   createdAt: new Date()
          // });
        }

        return true;
      });
    } catch (error) {
      console.error("Error liking thread:", error);
      return false;
    }
  }

  // TODO test
  async dislikeThread(threadId: string, userId: string): Promise<boolean> {
    try {
      // Start a transaction
      return await db.transaction(async (tx) => {
        // Check if user has already disliked this thread
        const existingReaction = await tx.query.threadReactions.findFirst({
          where: and(
            eq(threadReactions.threadId, threadId),
            eq(threadReactions.userId, userId),
            eq(threadReactions.type, "DISLIKE"),
          ),
        });

        // Get the thread to check if it exists and get the owner's ID
        const thread = await tx.query.threads.findFirst({
          where: eq(threads.id, threadId),
          columns: {
            userId: true,
          },
        });

        if (!thread) {
          return false; // Thread doesn't exist
        }

        if (existingReaction) {
          // User has already disliked this thread - remove the dislike
          await tx
            .delete(threadReactions)
            .where(
              and(
                eq(threadReactions.threadId, threadId),
                eq(threadReactions.userId, userId),
                eq(threadReactions.type, "DISLIKE"),
              ),
            );

          // Decrease thread dislikes count
          await tx
            .update(threads)
            .set({
              dislikesCount: sql`${threads.dislikesCount} - 1`,
            })
            .where(eq(threads.id, threadId));

          return true;
        }

        // Create new dislike reaction
        await tx.insert(threadReactions).values({
          id: uuidv4(),
          threadId,
          userId,
          type: "DISLIKE",
          createdAt: new Date(),
        });

        // Update thread dislikes count
        await tx
          .update(threads)
          .set({
            dislikesCount: sql`${threads.dislikesCount} + 1`,
          })
          .where(eq(threads.id, threadId));

        // Create notification for thread owner (if not disliking their own thread)
        if (thread.userId !== userId) {
          // await tx.insert(notifications).values({
          //   id: uuidv4(),
          //   userId: thread.userId,
          //   type: 'DISLIKE',
          //   relatedUserId: userId,
          //   threadId,
          //   message: 'disliked your thread',
          //   isRead: false,
          //   createdAt: new Date()
          // });
        }

        return true;
      });
    } catch (error) {
      console.error("Error disliking thread:", error);
      return false;
    }
  }
  
  async pinnedByUserThread(threadId: string, userId: string): Promise<boolean> {
    try {
      // Begin transaction
      await db.transaction(async (tx) => {
        // Check if user has already marked this thread as PINNED_BY_USER
        const existingReaction = await tx.query.threadReactions.findFirst({
          where: and(
            eq(threadReactions.threadId, threadId),
            eq(threadReactions.userId, userId),
            eq(threadReactions.type, 'PINNED_BY_USER')
          )
        });
  
        if (existingReaction) {
          // Get the thread to check if it's currently set as isPinnedByUser
          const thread = await tx.query.threads.findFirst({
            where: eq(threads.id, threadId)
          });
  
          if (!thread) throw new Error("Thread not found");
  
          if (thread.isPinnedByUser) {
            // If user has already marked as PINNED_BY_USER, remove the PINNED_BY_USER status
            
            // Delete the PINNED_BY_USER reaction
            await tx
              .delete(threadReactions)
              .where(
                and(
                  eq(threadReactions.threadId, threadId),
                  eq(threadReactions.userId, userId),
                  eq(threadReactions.type, 'PINNED_BY_USER')
                )
              );
  
            // Update thread isPinnedByUser status
            await tx
              .update(threads)
              .set({ isPinnedByUser: false })
              .where(eq(threads.id, threadId));
  
            // Update user's PINNED_BY_USER count only, keep the points
            await tx
              .update(users)
              .set({
                pinnedByUserCount: sql`${users.pinnedByUserCount} - 1`
                // Points are not removed since PINNED_BY_USER is a rotating feature
              })
              .where(eq(users.id, userId));
          }
        } else {
          // Add new PINNED_BY_USER reaction
          await tx
            .insert(threadReactions)
            .values({
              id: uuidv4(),
              threadId,
              userId,
              type: 'PINNED_BY_USER',
            });
  
          // Update thread isPinnedByUser status and increment user points
          await tx
            .update(threads)
            .set({ isPinnedByUser: true })
            .where(eq(threads.id, threadId));
  
          // Update user's points and PINNED_BY_USER count
          await tx
            .update(users)
            .set({
              pinnedByUserCount: sql`${users.pinnedByUserCount} + 1`,
              points: sql`${users.points} + 40` // Add 40 points for PINNED_BY_USER
            })
            .where(eq(users.id, userId));
  
          // Create notification for thread owner (disabled for now)
          // await tx.insert(notifications).values({
          //   id: uuidv4(),
          //   userId: thread.userId, // Thread owner gets the notification
          //   type: 'PINNED_BY_USER',
          //   relatedUserId: userId, // User who marked as PINNED_BY_USER
          //   threadId,
          //   message: `Your thread was selected as a Pinned Post!`,
          //   isRead: false,
          // });
        }
      });
  
      return true;
    } catch (error) {
      console.error('Error in pinnedByUserThread:', error);
      return false;
    }
  }

  async potdThread(threadId: string, userId: string): Promise<boolean> {
    try {
      // Begin transaction
      return await db.transaction(async (tx) => {
        try {
          // Check if user has already used POTD today
          const today = new Date();
          today.setHours(0, 0, 0, 0); // Set to beginning of day
          
          const recentPotd = await tx.query.threadReactions.findFirst({
            where: and(
              eq(threadReactions.userId, userId),
              eq(threadReactions.type, 'POTD'),
              sql`${threadReactions.createdAt} >= ${today}`
            ),
          });
          
          if (recentPotd) {
            // User has already used their POTD for today
            throw new Error("You've already used your Post of the Day for today");
          }
          
          // Check if thread exists
          const thread = await tx.query.threads.findFirst({
            where: eq(threads.id, threadId),
            columns: {
              userId: true,
            },
          });
          
          if (!thread) {
            throw new Error("Thread not found");
          }
          
          // Add POTD reaction
          await tx.insert(threadReactions).values({
            id: uuidv4(),
            threadId,
            userId,
            type: 'POTD',
            createdAt: new Date(),
          });
          
          // Update thread potdCount directly with SQL to avoid type issues
          await tx.execute(
            sql`UPDATE threads SET potd_count = potd_count + 1 WHERE id = ${threadId}`
          );
          
          // Add bonus points for thread owner (if not marking their own thread)
          if (thread.userId !== userId) {
            await tx.execute(
              sql`UPDATE users SET points = points + 5 WHERE id = ${thread.userId}`
            );
          }
          
          return true;
        } catch (txError) {
          console.error("Transaction error in potdThread:", txError);
          throw txError; // Rethrow to trigger rollback
        }
      });
    } catch (error) {
      console.error('Error in potdThread:', error);
      // Convert the error to a more specific message
      if (error instanceof Error) {
        throw error; // Rethrow original error with message
      } else {
        throw new Error("Failed to set thread as Post of the Day");
      }
    }
  }

  async likeReply(replyId: string, userId: string): Promise<boolean> {
    try {
      // Start a transaction
      return await db.transaction(async (tx) => {
        // Check if user has already liked this reply
        const existingReaction = await tx.query.replyReactions.findFirst({
          where: and(
            eq(replyReactions.replyId, replyId),
            eq(replyReactions.userId, userId),
            eq(replyReactions.type, "LIKE"),
          ),
        });

        // Get the reply to check if it exists and get the owner's ID
        const reply = await tx.query.replies.findFirst({
          where: eq(replies.id, replyId),
          columns: {
            userId: true,
            threadId: true,
          },
        });

        if (!reply) {
          return false; // Reply doesn't exist
        }

        if (existingReaction) {
          // User has already liked this reply - remove the like
          await tx
            .delete(replyReactions)
            .where(
              and(
                eq(replyReactions.replyId, replyId),
                eq(replyReactions.userId, userId),
                eq(replyReactions.type, "LIKE"),
              ),
            );

          // Decrease reply likes count
          await tx
            .update(replies)
            .set({
              likesCount: sql`${replies.likesCount} - 1`,
            })
            .where(eq(replies.id, replyId));

          // Remove points from reply owner (if not liking their own reply)
          if (reply.userId !== userId) {
            await tx
              .update(users)
              .set({
                points: sql`${users.points} - 1`, // 1 point for a reply like
              })
              .where(eq(users.id, reply.userId));
          }

          return true;
        }

        // Create new like reaction
        await tx.insert(replyReactions).values({
          id: uuidv4(),
          replyId,
          userId,
          type: "LIKE",
          createdAt: new Date(),
        });

        // Update reply likes count
        await tx
          .update(replies)
          .set({
            likesCount: sql`${replies.likesCount} + 1`,
          })
          .where(eq(replies.id, replyId));

        // Add points for reply owner (if not liking their own reply)
        if (reply.userId !== userId) {
          await tx
            .update(users)
            .set({
              points: sql`${users.points} + 1`, // 1 point for a reply like
            })
            .where(eq(users.id, reply.userId));

          // Create notification for reply owner
          // await tx.insert(notifications).values({
          //   id: uuidv4(),
          //   userId: reply.userId,
          //   type: 'LIKE_REPLY',
          //   relatedUserId: userId,
          //   threadId: reply.threadId,
          //   replyId,
          //   message: 'liked your reply',
          //   isRead: false,
          //   createdAt: new Date()
          // });
        }

        return true;
      });
    } catch (error) {
      console.error("Error liking reply:", error);
      return false;
    }
  }

  async dislikeReply(replyId: string, userId: string): Promise<boolean> {
    try {
      // Start a transaction
      return await db.transaction(async (tx) => {
        // Check if user has already disliked this reply
        const existingReaction = await tx.query.replyReactions.findFirst({
          where: and(
            eq(replyReactions.replyId, replyId),
            eq(replyReactions.userId, userId),
            eq(replyReactions.type, "DISLIKE"),
          ),
        });

        // Get the reply to check if it exists and get the owner's ID
        const reply = await tx.query.replies.findFirst({
          where: eq(replies.id, replyId),
          columns: {
            userId: true,
            threadId: true,
          },
        });

        if (!reply) {
          return false; // Reply doesn't exist
        }

        if (existingReaction) {
          // User has already disliked this reply - remove the dislike
          await tx
            .delete(replyReactions)
            .where(
              and(
                eq(replyReactions.replyId, replyId),
                eq(replyReactions.userId, userId),
                eq(replyReactions.type, "DISLIKE"),
              ),
            );

          // Decrease reply dislikes count
          await tx
            .update(replies)
            .set({
              dislikesCount: sql`${replies.dislikesCount} - 1`,
            })
            .where(eq(replies.id, replyId));

          return true;
        }

        // Create new dislike reaction
        await tx.insert(replyReactions).values({
          id: uuidv4(),
          replyId,
          userId,
          type: "DISLIKE",
          createdAt: new Date(),
        });

        // Update reply dislikes count
        await tx
          .update(replies)
          .set({
            dislikesCount: sql`${replies.dislikesCount} + 1`,
          })
          .where(eq(replies.id, replyId));

        // Create notification for reply owner (if not disliking their own reply)
        if (reply.userId !== userId) {
          // await tx.insert(notifications).values({
          //   id: uuidv4(),
          //   userId: reply.userId,
          //   type: 'DISLIKE_REPLY',
          //   relatedUserId: userId,
          //   threadId: reply.threadId,
          //   replyId,
          //   message: 'disliked your reply',
          //   isRead: false,
          //   createdAt: new Date()
          // });
        }

        return true;
      });
    } catch (error) {
      console.error("Error disliking reply:", error);
      return false;
    }
  }

  async followUser(followerId: string, followingId: string): Promise<boolean> {
    // Temporary stub
    console.log("followUser not fully implemented", followerId, followingId);
    return false;
  }

  async unfollowUser(
    followerId: string,
    followingId: string,
  ): Promise<boolean> {
    // Temporary stub
    console.log("unfollowUser not fully implemented", followerId, followingId);
    return false;
  }

  async getFollowers(userId: string): Promise<User[]> {
    // Temporary stub
    console.log("getFollowers not fully implemented", userId);
    return [];
  }

  async getFollowing(userId: string): Promise<User[]> {
    // Temporary stub
    console.log("getFollowing not fully implemented", userId);
    return [];
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    // Temporary stub
    console.log("getNotifications not fully implemented", userId);
    return [];
  }

  async createNotification(
    notification: InsertNotification,
  ): Promise<Notification> {
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
        createdAt: new Date(),
      };

      const [newNotification] = await db
        .insert(notifications)
        .values(notificationValues)
        .returning();

      return newNotification;
    } catch (error) {
      console.error("Error creating notification:", error);
      throw new Error("Failed to create notification");
    }
  }

  async markNotificationAsRead(id: string): Promise<boolean> {
    // Temporary stub
    console.log("markNotificationAsRead not fully implemented", id);
    return false;
  }

  async markAllNotificationsAsRead(userId: string): Promise<boolean> {
    // Temporary stub
    console.log("markAllNotificationsAsRead not fully implemented", userId);
    return false;
  }

  async getMMAEvents(limit: number, offset: number): Promise<MMAEvent[]> {
    // Temporary stub
    console.log("getMMAEvents not fully implemented", limit, offset);
    return [];
  }

  async getMMAEvent(id: string): Promise<MMAEvent | undefined> {
    // Temporary stub
    console.log("getMMAEvent not fully implemented", id);
    return undefined;
  }

  async getFights(eventId: string): Promise<Fight[]> {
    // Temporary stub
    console.log("getFights not fully implemented", eventId);
    return [];
  }

  async saveMMAEvent(event: any): Promise<MMAEvent> {
    // Temporary stub
    console.log("saveMMAEvent not fully implemented", event);
    throw new Error("Not implemented");
  }

  async saveFighter(fighter: any): Promise<Fighter> {
    // Temporary stub
    console.log("saveFighter not fully implemented", fighter);
    throw new Error("Not implemented");
  }

  async saveFight(fight: any): Promise<Fight> {
    // Temporary stub
    console.log("saveFight not fully implemented", fight);
    throw new Error("Not implemented");
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
          await db.update(users).set({ rank }).where(eq(users.id, user.id));
        }
      }
    } catch (error) {
      console.error("Error recalculating rankings:", error);
    }
  }

  // Calculate and update user status based on points and activity
  async recalculateUserStatus(userId: string): Promise<string | undefined> {
    try {
      const user = await this.getUser(userId);

      if (!user) {
        return undefined;
      }

      // Define thresholds for different statuses
      // These can be adjusted as needed
      const statusThresholds = [
        { status: 'HALL_OF_FAMER', points: 5000, posts: 200, pinned: 10 },
        { status: 'CHAMPION', points: 2500, posts: 100, pinned: 5 },
        { status: 'CONTENDER', points: 1000, posts: 50, pinned: 2 },
        { status: 'RANKED_POSTER', points: 500, posts: 25, pinned: 1 },
        { status: 'COMPETITOR', points: 250, posts: 15, pinned: 0 },
        { status: 'REGIONAL_POSTER', points: 100, posts: 5, pinned: 0 },
        { status: 'AMATEUR', points: 0, posts: 0, pinned: 0 }
      ];

      // Find the highest status the user qualifies for
      let newStatus = "AMATEUR";
      for (const threshold of statusThresholds) {
        if (
          user.points >= threshold.points && 
          user.postsCount >= threshold.posts && 
          user.pinnedByUserCount >= threshold.pinned
        ) {
          newStatus = threshold.status;
          break;
        }
      }

      // Only update if status has changed
      if (newStatus !== user.status) {
        const updatedUser = await this.updateUser(userId, {
          status: newStatus,
        });

        if (updatedUser) {
          return newStatus;
        }
      }

      return user.status;
    } catch (error) {
      console.error("Error recalculating user status:", error);
      return undefined;
    }
  }

  // Recalculate statuses for all users - to be called by cron job
  async recalculateAllUserStatuses(): Promise<{
    success: number;
    failed: number;
    unchanged: number;
  }> {
    try {
      // Get all users
      const allUsers = await this.getAllUsers();

      // Status thresholds - same as in recalculateUserStatus
      const statusThresholds = [
        { status: 'HALL_OF_FAMER', points: 5000, posts: 200, pinned: 10 },
        { status: 'CHAMPION', points: 2500, posts: 100, pinned: 5 },
        { status: 'CONTENDER', points: 1000, posts: 50, pinned: 2 },
        { status: 'RANKED_POSTER', points: 500, posts: 25, pinned: 1 },
        { status: 'COMPETITOR', points: 250, posts: 15, pinned: 0 },
        { status: 'REGIONAL_POSTER', points: 100, posts: 5, pinned: 0 },
        { status: 'AMATEUR', points: 0, posts: 0, pinned: 0 }
      ];

      // Track statistics
      let success = 0;
      let failed = 0;
      let unchanged = 0;

      // Process users in smaller batches to avoid memory issues
      const batchSize = 50;
      for (let i = 0; i < allUsers.length; i += batchSize) {
        const userBatch = allUsers.slice(i, i + batchSize);

        // Process each user in the batch
        await Promise.all(userBatch.map(async (user) => {
          try {
            // Find the highest status the user qualifies for
            let newStatus = 'AMATEUR';
            for (const threshold of statusThresholds) {
              if (
                user.points >= threshold.points && 
                user.postsCount >= threshold.posts && 
                user.pinnedByUserCount >= threshold.pinned
              ) {
                newStatus = threshold.status;
                break;
              }
            }

            // Only update if status has changed
            if (newStatus !== user.status) {
              const updatedUser = await this.updateUser(user.id, {
                status: newStatus,
              });

              if (updatedUser) {
                console.log(
                  `Updated user ${user.username} status from ${user.status} to ${newStatus}`,
                );
                success++;
              } else {
                console.error(
                  `Failed to update status for user ${user.username}`,
                );
                failed++;
              }
            } else {
              unchanged++;
            }
          } catch (userError) {
            console.error(`Error processing user ${user.id}:`, userError);
            failed++;
          }
        }));
      }

      console.log(
        `Status recalculation complete: ${success} updated, ${unchanged} unchanged, ${failed} failed`,
      );
      return { success, failed, unchanged };
    } catch (error) {
      console.error("Error recalculating all user statuses:", error);
      return { success: 0, failed: 0, unchanged: 0 };
    }
  }

  async getPollOptions(pollId: string): Promise<PollOption[]> {
    try {
      const options = await db
        .select({
          id: pollOptions.id,
          pollId: pollOptions.pollId,
          text: pollOptions.text,
          votesCount: pollOptions.votesCount,
        })
        .from(pollOptions)
        .where(eq(pollOptions.pollId, pollId))
        .orderBy(pollOptions.id);

      return options;
    } catch (error) {
      console.error("Error getting poll options:", error);
      return [];
    }
  }
}

// Use database storage implementation
export const storage = new DatabaseStorage();
