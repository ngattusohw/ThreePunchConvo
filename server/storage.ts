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
  Media,
  InsertMedia,
  Notification,
  InsertNotification,
  FighterInvitation,
  InsertFighterInvitation,
  CreateFighterInvitationData,
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
  dailyFighterCred,
  statusConfig,
  fighterInvitations,
} from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool, db } from "./db";
import { eq, and, sql, desc, inArray, not, notInArray, or, ilike, asc, count } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import {
  USER_ROLES,
  NOTIFICATION_EXCLUDED_ROLES,
  NOTIFICATION_TYPES,
} from "@shared/constants";

export interface IStorage {
  // Session store
  sessionStore: any;

  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByExternalId(externalId: string): Promise<User | undefined>;
  getUserByStripeId(stripeId: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(userData: UpsertUser): Promise<User>;
  updateUser(id: string, userData: Partial<User>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  getTopUsers(limit: number): Promise<User[]>;
  getTopUsersFromDailyCred(limit: number): Promise<User[]>;
  getAllUsers(options?: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<{
    users: User[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalUsers: number;
      hasNext: boolean;
      hasPrevious: boolean;
    };
  }>;

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
  getReply(id: string, currentUserId: string): Promise<Reply | undefined>;
  getRepliesByThread(
    threadId: string,
    currentUserId?: string,
    limit?: number,
    offset?: number,
  ): Promise<Reply[]>;
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

  updateThreadPinStatus(
    threadId: string,
    isPinned: boolean,
    threadOwnerId: string,
    moderatorId: string,
  ): Promise<boolean>;

  recalculateFighterCred(): Promise<void>;
  updateUserFighterCred(
    userId: string,
    totalFighterCred: number,
  ): Promise<boolean>;
  getUserFighterCred(userId: string): Promise<number>;
  updateAllUsersFighterCred(): Promise<boolean>;

  // Fighter invitation management
  createFighterInvitation(data: CreateFighterInvitationData): Promise<FighterInvitation>;
  getFighterInvitationByToken(token: string): Promise<FighterInvitation | null>;
  getFighterInvitationByEmail(email: string): Promise<FighterInvitation | null>;
  updateFighterInvitationStatus(id: string, status: string, usedByUserId?: string): Promise<void>;
  getAllFighterInvitations(): Promise<FighterInvitation[]>;
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
          pinnedCount: users.pinnedCount,
          followersCount: users.followersCount,
          followingCount: users.followingCount,
          socialLinks: users.socialLinks,
          disabled: users.disabled,
          disabledAt: users.disabledAt,
          metadata: users.metadata,
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
        .select()
        .from(users)
        .where(and(eq(users.username, username), not(eq(users.disabled, true))))
        .orderBy(desc(users.createdAt));

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
          pinnedCount: users.pinnedCount,
          followersCount: users.followersCount,
          followingCount: users.followingCount,
          socialLinks: users.socialLinks,
          disabled: users.disabled,
          disabledAt: users.disabledAt,
          metadata: users.metadata,
          coverPhoto: users.coverPhoto,
          potdCount: users.potdCount,
          repliesCount: users.repliesCount,
        })
        .from(users)
        .where(
          and(eq(users.externalId, externalId), eq(users.disabled, false)),
        );

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
          pinnedCount: users.pinnedCount,
          followersCount: users.followersCount,
          followingCount: users.followingCount,
          socialLinks: users.socialLinks,
          disabled: users.disabled,
          disabledAt: users.disabledAt,
          metadata: users.metadata,
          coverPhoto: users.coverPhoto,
          potdCount: users.potdCount,
          repliesCount: users.repliesCount,
        })
        .from(users)
        .where(eq(users.stripeId, stripeId));

      return user;
    } catch (error) {
      console.error("Error getting user by Stripe ID:", error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));
      return user;
    } catch (error) {
      console.error("Error getting user by email:", error);
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
        planType: userData.planType || "FREE",
        profileImageUrl: userData.profileImageUrl || null,
        role: userData.role || "USER",
        status: userData.status || "AMATEUR",
        isOnline: userData.isOnline || false,
        lastActive: new Date(),
        points: userData.points || 0,
        postsCount: userData.postsCount || 0,
        likesCount: userData.likesCount || 0,
        pinnedByUserCount: userData.pinnedByUserCount || 0,
        pinnedCount: userData.pinnedCount || 0,
        followersCount: userData.followersCount || 0,
        followingCount: userData.followingCount || 0,
        socialLinks: userData.socialLinks || {},
        rank: userData.rank || 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        disabled: userData.disabled || false,
        disabledAt: userData.disabledAt || null,
        metadata: userData.metadata || {},
        coverPhoto: userData.coverPhoto || null,
        potdCount: userData.potdCount || 0,
        repliesCount: userData.repliesCount || 0,
      };

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
      console.log("Updating user:", id, userData);

      const [updatedUser] = await db
        .update(users)
        .set({
          ...userData,
        })
        .where(eq(users.id, id))
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
      // Query database for top users ordered by points, excluding certain roles
      const userResults = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.disabled, false),
            notInArray(users.role, [
              "ADMIN",
              "MODERATOR",
              "FIGHTER",
              "INDUSTRY_PROFESSIONAL",
            ]),
          ),
        )
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

  async getTopUsersFromDailyCred(limit: number): Promise<any[]> {
    try {
      // First, get the latest interaction day from the daily_fighter_cred table
      const latestDayResult = await db
        .select({ interactionDay: dailyFighterCred.interactionDay })
        .from(dailyFighterCred)
        .orderBy(desc(dailyFighterCred.interactionDay))
        .limit(1);

      if (!latestDayResult || latestDayResult.length === 0) {
        console.log("No daily fighter cred data found in the database");
        return [];
      }

      const latestDay = latestDayResult[0].interactionDay;
      console.log("Looking for daily fighter cred for date:", latestDay);

      // First, get the top users from daily_fighter_cred table for the latest day with a single query
      const topDailyCredResults = await db
        .select({
          userId: dailyFighterCred.userId,
          currentStatus: dailyFighterCred.currentStatus,
          dailyFighterCred: dailyFighterCred.dailyFighterCred,
          totalFighterCred: dailyFighterCred.totalFighterCred,
          // User data from the join
          username: users.username,
          avatar: users.avatar,
          profileImageUrl: users.profileImageUrl,
          role: users.role,
          likesCount: users.likesCount,
          postsCount: users.postsCount,
          repliesCount: users.repliesCount,
          potdCount: users.potdCount,
          pinnedCount: users.pinnedCount,
        })
        .from(dailyFighterCred)
        .innerJoin(users, eq(dailyFighterCred.userId, users.id))
        .where(
          and(
            eq(dailyFighterCred.interactionDay, latestDay),
            eq(users.disabled, false),
            notInArray(users.role, [
              "ADMIN",
              "MODERATOR",
              "FIGHTER",
              "INDUSTRY_PROFESSIONAL",
            ]),
          ),
        )
        .orderBy(desc(dailyFighterCred.totalFighterCred))
        .limit(limit);

      if (topDailyCredResults.length === 0) {
        console.log("No daily fighter cred data found for the latest day");
        return [];
      }

      // No need for separate user query or combining - we have all data in one result
      const combinedResults = topDailyCredResults.map((result) => ({
        id: result.userId,
        username: result.username,
        avatar: result.avatar,
        profileImageUrl: result.profileImageUrl,
        role: result.role,
        likesCount: result.likesCount,
        postsCount: result.postsCount,
        repliesCount: result.repliesCount,
        potdCount: result.potdCount,
        pinnedCount: result.pinnedCount,
        status: result.currentStatus,
        dailyFighterCred: result.dailyFighterCred,
        totalFighterCred: result.totalFighterCred,
      }));

      return combinedResults;
    } catch (error) {
      console.error("Error getting top users from daily fighter cred:", error);
      return [];
    }
  }

  async getAllUsers(options?: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<{
    users: User[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalUsers: number;
      hasNext: boolean;
      hasPrevious: boolean;
    };
  }> {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = options || {};

      const offset = (page - 1) * limit;

      // Build the query with search and sorting
      let query = db.select().from(users);

      // Add search functionality
      if (search) {
        query = query.where(
          or(
            ilike(users.username, `%${search}%`),
            ilike(users.email, `%${search}%`),
            ilike(users.firstName, `%${search}%`),
            ilike(users.lastName, `%${search}%`)
          )
        );
      }

      // Add sorting
      const orderColumn = users[sortBy as keyof typeof users] || users.createdAt;
      if (sortOrder === 'asc') {
        query = query.orderBy(asc(orderColumn));
      } else {
        query = query.orderBy(desc(orderColumn));
      }

      // Get total count for pagination
      const countQuery = db.select({ count: count() }).from(users);
      if (search) {
        countQuery.where(
          or(
            ilike(users.username, `%${search}%`),
            ilike(users.email, `%${search}%`),
            ilike(users.firstName, `%${search}%`),
            ilike(users.lastName, `%${search}%`)
          )
        );
      }

      const [usersResult, countResult] = await Promise.all([
        query.limit(limit).offset(offset),
        countQuery
      ]);

      const totalUsers = countResult[0]?.count || 0;
      const totalPages = Math.ceil(totalUsers / limit);

      return {
        users: usersResult,
        pagination: {
          currentPage: page,
          totalPages,
          totalUsers,
          hasNext: page < totalPages,
          hasPrevious: page > 1
        }
      };
    } catch (error) {
      console.error("Error getting all users:", error);
      return {
        users: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalUsers: 0,
          hasNext: false,
          hasPrevious: false
        }
      };
    }
  }

  async getUsersByRole(role: string): Promise<User[]> {
    try {
      const result = await db.select().from(users).where(eq(users.role, role));
      return result;
    } catch (error) {
      console.error("Error getting users by role:", error);
      return [];
    }
  }

  async getAllUsersList(): Promise<User[]> {
    try {
      const result = await db.select().from(users);
      return result;
    } catch (error) {
      console.error("Error getting all users list:", error);
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
        .select()
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
          pinnedCount: user.pinnedCount,
          followersCount: user.followersCount,
          followingCount: user.followingCount,
          socialLinks: user.socialLinks,
          disabled: user.disabled,
          disabledAt: user.disabledAt,
          metadata: user.metadata,
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
        .select()
        .from(threads)
        .where(eq(threads.categoryId, categoryId));

      // Add sorting based on the sort parameter, but always prioritize pinned threads
      const sortedQuery = (() => {
        switch (sort) {
          case "recent":
            return baseQuery.orderBy(
              desc(threads.isPinned),
              desc(threads.lastActivityAt),
            );
          case "popular":
            return baseQuery.orderBy(
              desc(threads.isPinned),
              desc(threads.viewCount),
            );
          case "new":
            return baseQuery.orderBy(
              desc(threads.isPinned),
              desc(threads.createdAt),
            );
          case "likes":
            return baseQuery.orderBy(
              desc(threads.isPinned),
              desc(threads.likesCount),
            );
          case "replies":
            return baseQuery.orderBy(
              desc(threads.isPinned),
              desc(threads.repliesCount),
            );
          default:
            return baseQuery.orderBy(
              desc(threads.isPinned),
              desc(threads.lastActivityAt),
            );
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
        .select()
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
        isPinnedByUser: false,
        isLocked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastActivityAt: new Date(),
        edited: false,
        editedAt: null,
        viewCount: 0,
        likesCount: 0,
        dislikesCount: 0,
        repliesCount: 0,
        potdCount: 0,
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
            postsCount: sql`${users.postsCount} + 1`,
          })
          .where(eq(users.id, thread.userId));

        // check if user is fighter or mma industry role
        const user = await this.getUser(thread.userId);
        if (
          user?.role === USER_ROLES.FIGHTER ||
          user?.role === USER_ROLES.INDUSTRY_PROFESSIONAL
        ) {
          // add notification for all users (excluding other fighters and MMA industry users)
          const postType =
            user.role === USER_ROLES.FIGHTER
              ? NOTIFICATION_TYPES.FIGHTER_POST
              : NOTIFICATION_TYPES.INDUSTRY_PROFESSIONAL_POST;
          await this.createNotificationForAllNormalUsers(
            {
              type: postType,
              relatedUserId: thread.userId,
              threadId: thread.id, // Use the actual thread ID from the database
              message: `${user.username} just posted! Check out their latest thread.`,
            },
            undefined, // excludeUserId
            tx, // Pass the transaction context
          );
        }

        return [thread];
      });

      return newThread;
    } catch (error) {
      console.error("Error creating thread:", error);
      throw new Error("Failed to create thread");
    }
  }

  async updateThreadPinStatus(
    threadId: string,
    isPinned: boolean,
    threadOwnerId: string,
    moderatorId: string,
  ): Promise<boolean> {
    try {
      // Start a transaction to update thread and user pinnedCount
      await db.transaction(async (tx) => {
        // Update the thread's pin status
        await tx
          .update(threads)
          .set({ isPinned })
          .where(eq(threads.id, threadId));

        // Update the thread owner's pinnedCount
        if (isPinned) {
          // Increment pinnedCount when pinning
          await tx
            .update(users)
            .set({
              pinnedCount: sql`${users.pinnedCount} + 1`,
            })
            .where(eq(users.id, threadOwnerId));
        } else {
          // Decrement pinnedCount when unpinning (but don't go below 0)
          await tx
            .update(users)
            .set({
              pinnedCount: sql`GREATEST(${users.pinnedCount} - 1, 0)`,
            })
            .where(eq(users.id, threadOwnerId));
        }
      });

      // Create notification for the thread owner
      try {
        const thread = await this.getThread(threadId);
        if (thread) {
          await this.createNotification({
            userId: threadOwnerId,
            type: NOTIFICATION_TYPES.THREAD_PINNED,
            threadId: threadId,
            relatedUserId: moderatorId,
            message: "Your thread has been pinned by a moderator",
          });
        }
      } catch (notificationError) {
        console.error("Error creating pin notification:", notificationError);
        // Don't fail the entire operation if notification creation fails
      }

      return true;
    } catch (error) {
      console.error("Error updating thread pin status:", error);
      return false;
    }
  }

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
          await tx.insert(notifications).values({
            id: uuidv4(),
            userId: currentThread.userId,
            type: threadData.isPinned ? "THREAD_PINNED" : "THREAD_UNPINNED",
            threadId: id,
            message: threadData.isPinned
              ? "Your thread has been pinned"
              : "Your thread has been unpinned",
            isRead: false,
            createdAt: new Date(),
          });
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
            repliesCount: true,
            potdCount: true,
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
            repliesCount: sql`${users.repliesCount} - ${thread.repliesCount}`, // Remove all replies from user's total
            potdCount: sql`${users.potdCount} - ${thread.potdCount}`, // Remove all POTD from user's total
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

        // Find all reply IDs for this thread
        const threadReplyIds = await tx
          .select({ id: replies.id })
          .from(replies)
          .where(eq(replies.threadId, id));
        const replyIds = threadReplyIds.map((r) => r.id);

        if (replyIds.length > 0) {
          // Delete all notifications that reference these replies
          await tx
            .delete(notifications)
            .where(inArray(notifications.replyId, replyIds));
        }

        // Delete all thread replies
        await tx.delete(replies).where(eq(replies.threadId, id));

        // Delete all notifications that reference this thread
        await tx.delete(notifications).where(eq(notifications.threadId, id));

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

  async getReply(
    id: string,
    currentUserId: string,
  ): Promise<Reply | undefined> {
    try {
      // Check if the current user has liked this thread
      let hasLiked = false;
      if (currentUserId) {
        const existingLikeReaction = await db.query.replyReactions.findFirst({
          where: and(
            eq(replyReactions.replyId, id),
            eq(replyReactions.userId, currentUserId),
            eq(replyReactions.type, "LIKE"),
          ),
        });
        hasLiked = !!existingLikeReaction;
      }
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
          hasLiked: hasLiked,
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

  async getRepliesByThread(
    threadId: string,
    currentUserId?: string,
    limit?: number,
    offset?: number,
  ): Promise<Reply[]> {
    try {
      console.log(
        `getRepliesByThread: threadId=${threadId}, limit=${limit}, offset=${offset}`,
      );

      // Build query with explicit column selection and apply pagination
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
        .orderBy(replies.createdAt)
        .limit(limit || 1000) // Use a reasonable default if limit is undefined
        .offset(offset || 0); // Use 0 as default if offset is undefined

      console.log(`Database query returned ${threadReplies.length} replies`);

      // If we have a current user, check which replies they've liked
      if (currentUserId) {
        const repliesWithLikeStatus = await Promise.all(
          threadReplies.map(async (reply) => {
            const existingLikeReaction =
              await db.query.replyReactions.findFirst({
                where: and(
                  eq(replyReactions.replyId, reply.id),
                  eq(replyReactions.userId, currentUserId),
                  eq(replyReactions.type, "LIKE"),
                ),
              });

            const hasLiked = !!existingLikeReaction;
            return {
              ...reply,
              hasLiked,
            };
          }),
        );

        console.log(
          `Returning ${repliesWithLikeStatus.length} replies with like status`,
        );
        return repliesWithLikeStatus;
      }

      // If no current user, return replies without like status
      const repliesWithoutLikeStatus = threadReplies.map((reply) => ({
        ...reply,
        hasLiked: false,
      }));
      console.log(
        `Returning ${repliesWithoutLikeStatus.length} replies without like status`,
      );
      return repliesWithoutLikeStatus;
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
            .orderBy(replies.createdAt)
            .limit(limit || 1000) // Use a reasonable default if limit is undefined
            .offset(offset || 0); // Use 0 as default if offset is undefined

          // If we have a current user, check which replies they've liked
          if (currentUserId) {
            const repliesWithLikeStatus = await Promise.all(
              threadReplies.map(async (reply) => {
                const existingLikeReaction =
                  await db.query.replyReactions.findFirst({
                    where: and(
                      eq(replyReactions.replyId, reply.id),
                      eq(replyReactions.userId, currentUserId),
                      eq(replyReactions.type, "LIKE"),
                    ),
                  });

                return {
                  ...reply,
                  hasLiked: !!existingLikeReaction,
                };
              }),
            );

            return repliesWithLikeStatus;
          }

          // If no current user, return replies without like status
          return threadReplies.map((reply) => ({
            ...reply,
            hasLiked: false,
          }));
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
        // Get the thread to find the owner
        const thread = await tx.query.threads.findFirst({
          where: eq(threads.id, replyValues.threadId),
          columns: {
            userId: true,
          },
        });

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

        // Create notification for thread owner (if not replying to their own thread)
        if (thread && thread.userId !== replyValues.userId) {
          console.log("Creating notification for thread owner:", thread.userId);
          try {
            await tx.insert(notifications).values({
              id: uuidv4(),
              userId: thread.userId,
              type: "REPLY",
              relatedUserId: replyValues.userId,
              threadId: replyValues.threadId,
              replyId: replyValues.id,
              isRead: false,
              createdAt: new Date(),
            });
            console.log("Notification created successfully");
          } catch (notificationError) {
            console.error("Error creating notification:", notificationError);
            throw notificationError;
          }
        } else {
          console.log("No notification created - same user or no thread found");
        }

        // Increment the thread owner's replies_count (replies received on their threads)
        if (thread && thread.userId !== replyValues.userId) {
          await tx.execute(
            sql`UPDATE users SET replies_count = replies_count + 1 WHERE id = ${thread.userId}`,
          );
        }

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
      // Get the reply to find its threadId and the thread owner
      const [reply] = await db.select().from(replies).where(eq(replies.id, id));

      if (!reply) {
        return false;
      }

      // Get the thread to find the owner
      const thread = await db.query.threads.findFirst({
        where: eq(threads.id, reply.threadId),
        columns: {
          userId: true,
        },
      });

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

        // Decrement the thread owner's replies_count (replies received on their threads)
        if (thread && thread.userId !== reply.userId) {
          await tx.execute(
            sql`UPDATE users SET replies_count = replies_count - 1 WHERE id = ${thread.userId}`,
          );
        }
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
          return false; // already liked thread
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
              likesCount: sql`${users.likesCount} + 1`, // Track total likes received
            })
            .where(eq(users.id, thread.userId));

          // Create notification for thread owner
          await tx.insert(notifications).values({
            id: uuidv4(),
            userId: thread.userId,
            type: "LIKE",
            relatedUserId: userId,
            threadId,
            isRead: false,
            createdAt: new Date(),
          });
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
            eq(threadReactions.type, "PINNED_BY_USER"),
          ),
        });

        if (existingReaction) {
          // Get the thread to check if it's currently set as isPinnedByUser
          const thread = await tx.query.threads.findFirst({
            where: eq(threads.id, threadId),
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
                  eq(threadReactions.type, "PINNED_BY_USER"),
                ),
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
                pinnedByUserCount: sql`${users.pinnedByUserCount} - 1`,
                // Points are not removed since PINNED_BY_USER is a rotating feature
              })
              .where(eq(users.id, userId));
          }
        } else {
          // Add new PINNED_BY_USER reaction
          await tx.insert(threadReactions).values({
            id: uuidv4(),
            threadId,
            userId,
            type: "PINNED_BY_USER",
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
      console.error("Error in pinnedByUserThread:", error);
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
              eq(threadReactions.type, "POTD"),
              sql`${threadReactions.createdAt} >= ${today}`,
            ),
          });

          if (recentPotd) {
            // User has already used their POTD for today
            throw new Error(
              "You've already used your Post of the Day for today",
            );
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
            type: "POTD",
            createdAt: new Date(),
          });

          // Update thread potdCount directly with SQL to avoid type issues
          await tx.execute(
            sql`UPDATE threads SET potd_count = potd_count + 1 WHERE id = ${threadId}`,
          );

          // Add bonus points for thread owner (if not marking their own thread)
          if (thread.userId !== userId) {
            // Create notification for thread owner
            await tx.insert(notifications).values({
              id: uuidv4(),
              userId: thread.userId,
              type: "POTD",
              relatedUserId: userId,
              threadId,
              isRead: false,
              createdAt: new Date(),
            });
          }

          // Update thread owner's potdCount (the user who received the POTD)
          await tx.execute(
            sql`UPDATE users SET potd_count = potd_count + 1 WHERE id = ${thread.userId}`,
          );

          return true;
        } catch (txError) {
          console.error("Transaction error in potdThread:", txError);
          throw txError; // Rethrow to trigger rollback
        }
      });
    } catch (error) {
      console.error("Error in potdThread:", error);
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
          // User has already liked this reply
          return false;
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
          // Create notification for reply owner
          await tx.insert(notifications).values({
            id: uuidv4(),
            userId: reply.userId,
            type: "LIKE",
            relatedUserId: userId,
            threadId: reply.threadId,
            replyId,
            isRead: false,
            createdAt: new Date(),
          });
        }

        return true; // Successfully liked
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
          // User has already disliked this reply
          return false;
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
          await tx.insert(notifications).values({
            id: uuidv4(),
            userId: reply.userId,
            type: "DISLIKE_REPLY",
            relatedUserId: userId,
            threadId: reply.threadId,
            replyId,
            message: "disliked your reply",
            isRead: false,
            createdAt: new Date(),
          });
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
    try {
      console.log("Fetching notifications for userId:", userId);

      const userNotifications = await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt));

      return userNotifications;
    } catch (error) {
      console.error("Error fetching notifications:", error);
      return [];
    }
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
    try {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.id, id));

      return true;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      return false;
    }
  }

  async markAllNotificationsAsRead(userId: string): Promise<boolean> {
    try {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(
          and(
            eq(notifications.userId, userId),
            not(eq(notifications.type, NOTIFICATION_TYPES.ADMIN_MESSAGE))
          )
        );

      return true;
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      return false;
    }
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
        { status: "HALL_OF_FAMER", points: 5000, posts: 200, pinned: 10 },
        { status: "CHAMPION", points: 2500, posts: 100, pinned: 5 },
        { status: "CONTENDER", points: 1000, posts: 50, pinned: 2 },
        { status: "RANKED_POSTER", points: 500, posts: 25, pinned: 1 },
        { status: "COMPETITOR", points: 250, posts: 15, pinned: 0 },
        { status: "REGIONAL_POSTER", points: 100, posts: 5, pinned: 0 },
        { status: "AMATEUR", points: 0, posts: 0, pinned: 0 },
      ];

      // Find the highest status the user qualifies for
      let newStatus = "AMATEUR";
      for (const threshold of statusThresholds) {
        if (
          user.points >= threshold.points &&
          user.postsCount >= threshold.posts &&
          user.pinnedCount >= threshold.pinned
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
        { status: "HALL_OF_FAMER", points: 5000, posts: 200, pinned: 10 },
        { status: "CHAMPION", points: 2500, posts: 100, pinned: 5 },
        { status: "CONTENDER", points: 1000, posts: 50, pinned: 2 },
        { status: "RANKED_POSTER", points: 500, posts: 25, pinned: 1 },
        { status: "COMPETITOR", points: 250, posts: 15, pinned: 0 },
        { status: "REGIONAL_POSTER", points: 100, posts: 5, pinned: 0 },
        { status: "AMATEUR", points: 0, posts: 0, pinned: 0 },
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
        await Promise.all(
          userBatch.map(async (user) => {
            try {
              // Find the highest status the user qualifies for
              let newStatus = "AMATEUR";
              for (const threshold of statusThresholds) {
                if (
                  user.points >= threshold.points &&
                  user.postsCount >= threshold.posts &&
                  user.pinnedCount >= threshold.pinned
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
          }),
        );
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

  async deleteUserPosts(userId: string): Promise<boolean> {
    try {
      await db.delete(threads).where(eq(threads.userId, userId));
      await db
        .delete(threadReactions)
        .where(eq(threadReactions.userId, userId));
      await db.delete(replies).where(eq(replies.userId, userId));
      return true;
    } catch (error) {
      console.error("Error deleting user posts:", error);
      return false;
    }
  }

  async recalculateFighterCred(): Promise<void> {
    try {
      console.log("Starting fighter cred recalculation...");

      // Run the complex query from the migration file
      const query = `
        WITH all_interactions AS (
          -- Reactions to threads
          SELECT
            t.user_id,
            tr.user_id AS actor_id,
            tr.type AS interaction_type,
            DATE_TRUNC('day', tr.created_at) AS interaction_day,
            tr.created_at AS interaction_timestamp
          FROM threads t
          JOIN thread_reactions tr ON tr.thread_id = t.id
          WHERE tr.user_id IS DISTINCT FROM t.user_id

          UNION ALL

          -- Replies
          SELECT 
            COALESCE(pr.user_id, t.user_id) AS user_id,
            r.user_id AS actor_id,
            'REPLY' AS interaction_type,
            DATE_TRUNC('day', r.created_at) AS interaction_day,
            r.created_at AS interaction_timestamp
          FROM threads t
          JOIN replies r ON r.thread_id = t.id 
          LEFT JOIN replies pr ON r.parent_reply_id = pr.id
          WHERE r.user_id IS DISTINCT FROM COALESCE(pr.user_id, t.user_id)

          UNION ALL

          -- Reactions to replies
          SELECT
            r.user_id,
            rr.user_id AS actor_id,
            rr.type AS interaction_type,
            DATE_TRUNC('day', rr.created_at) AS interaction_day,
            rr.created_at AS interaction_timestamp
          FROM reply_reactions rr
          JOIN replies r ON rr.reply_id = r.id
          JOIN threads t ON r.thread_id = t.id
          WHERE rr.user_id IS DISTINCT FROM r.user_id
        ),

        scored_interactions_today AS (
          SELECT
            ai.user_id,
            ai.interaction_day,
            ai.interaction_type,
            COALESCE(w.weight, 0) AS weight
          FROM all_interactions ai
          LEFT JOIN users u ON ai.user_id = u.id 
          LEFT JOIN reaction_weights w
            ON w.reaction_type = ai.interaction_type
               AND w.role = u.role
          WHERE u.disabled IS DISTINCT FROM TRUE
            AND ai.interaction_timestamp >= NOW() - INTERVAL '24 hours'
            AND u.plan_type != 'FREE'
            AND u.role NOT IN ('ADMIN', 'MODERATOR', 'FIGHTER', 'INDUSTRY_PROFESSIONAL')
        ),

        aggregated_scores AS (
          SELECT
            si.user_id,
            COUNT(*) FILTER (WHERE si.interaction_type = 'LIKE') AS like_count,
            COUNT(*) FILTER (WHERE si.interaction_type = 'POTD') AS potd_count,
            COUNT(*) FILTER (WHERE si.interaction_type = 'REPLY') AS reply_count,

            SUM(weight) FILTER (WHERE si.interaction_type = 'LIKE') AS like_score,
            SUM(weight) FILTER (WHERE si.interaction_type = 'POTD') AS potd_score,
            SUM(weight) FILTER (WHERE si.interaction_type = 'REPLY') AS reply_score,

            SUM(weight) AS daily_fighter_cred
          FROM scored_interactions_today si
          GROUP BY si.user_id
        )

        SELECT
          u.id AS user_id,
          CURRENT_DATE AS interaction_day,
          COALESCE(a.like_count, 0) AS like_count,
          COALESCE(a.potd_count, 0) AS potd_count,
          COALESCE(a.reply_count, 0) AS reply_count,

          COALESCE(a.like_score, 0) AS like_score,
          COALESCE(a.potd_score, 0) AS potd_score,
          COALESCE(a.reply_score, 0) AS reply_score,

          COALESCE(a.daily_fighter_cred, 0) AS daily_fighter_cred
        FROM users u
        LEFT JOIN aggregated_scores a ON a.user_id = u.id
        WHERE u.disabled IS DISTINCT FROM TRUE
          AND u.role NOT IN ('ADMIN', 'MODERATOR', 'FIGHTER', 'INDUSTRY_PROFESSIONAL')
          AND u.plan_type != 'FREE'
        ORDER BY COALESCE(a.daily_fighter_cred, 0) DESC;
      `;

      const queryResult = await db.execute(sql.raw(query));
      const results = queryResult.rows;

      console.log(
        `Query executed successfully. Found ${results.length} users with fighter cred data.`,
      );

      // Store the results in the daily_fighter_cred table
      if (results && results.length > 0) {
        // Clear existing data for today
        await db
          .delete(dailyFighterCred)
          .where(
            eq(
              dailyFighterCred.interactionDay,
              new Date().toISOString().slice(0, 10),
            ),
          );

        // Get the previous day's total fighter cred for each user
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().slice(0, 10);

        // Fetch previous day's total fighter cred for all users
        const previousDayCreds = await db
          .select({
            userId: dailyFighterCred.userId,
            totalFighterCred: dailyFighterCred.totalFighterCred,
          })
          .from(dailyFighterCred)
          .where(eq(dailyFighterCred.interactionDay, yesterdayStr));

        // Create a map for quick lookup
        const previousCredMap = new Map(
          previousDayCreds.map((cred) => [cred.userId, cred.totalFighterCred]),
        );

        // Create the user data array for status calculation
        const userDataForStatus = results
          .map((row: any) => {
            const userId = row.user_id;
            const dailyCred = parseInt(row.daily_fighter_cred) || 0;
            const previousTotal = previousCredMap.get(userId) || 0;
            const totalCred = previousTotal + dailyCred;

            return {
              userId,
              totalFighterCred: totalCred,
            };
          })
          .sort((a, b) => b.totalFighterCred - a.totalFighterCred);

        console.log("Number of users:", userDataForStatus.length);

        // Insert new data with proper totalFighterCred calculation
        const insertData = await Promise.all(
          results.map(async (row: any) => {
            const userId = row.user_id;
            const dailyCred = parseInt(row.daily_fighter_cred) || 0;
            const previousTotal = previousCredMap.get(userId) || 0;
            const totalCred = previousTotal + dailyCred;

            return {
              userId,
              interactionDay: row.interaction_day,
              likeCount: parseInt(row.like_count) || 0,
              potdCount: parseInt(row.potd_count) || 0,
              replyCount: parseInt(row.reply_count) || 0,
              likeScore: parseInt(row.like_score) || 0,
              potdScore: parseInt(row.potd_score) || 0,
              replyScore: parseInt(row.reply_score) || 0,
              dailyFighterCred: dailyCred,
              totalFighterCred: totalCred,
              currentStatus: await this.calculateUserStatus(
                userId,
                totalCred,
                userDataForStatus,
              ),
            };
          }),
        );

        // Insert in batches to avoid overwhelming the database
        const batchSize = 1;
        for (let i = 0; i < insertData.length; i += batchSize) {
          const batch = insertData.slice(i, i + batchSize);
          await db.insert(dailyFighterCred).values(batch);
        }

        // Update users table with totalFighterCred scores
        await this.updateAllUsersFighterCred();

        console.log(
          `Successfully stored fighter cred data for ${insertData.length} users`,
        );
      } else {
        console.log("No fighter cred data found for today");
      }
    } catch (error) {
      console.error("Error recalculating fighter cred:", error);
      throw error;
    }
  }

  async updateUserFighterCred(
    userId: string,
    totalFighterCred: number,
  ): Promise<boolean> {
    try {
      await db.execute(
        sql`UPDATE users SET points = ${totalFighterCred} WHERE id = ${userId}`,
      );
      return true;
    } catch (error) {
      console.error("Error updating user fighter cred:", error);
      return false;
    }
  }

  async getUserFighterCred(userId: string): Promise<number> {
    try {
      const user = await this.getUser(userId);
      if (!user) {
        throw new Error("User not found");
      }
      return user.points;
    } catch (error) {
      console.error("Error getting user fighter cred:", error);
      throw error;
    }
  }

  async updateAllUsersFighterCred(): Promise<boolean> {
    try {
      // Get the latest fighter cred data for all users
      const latestFighterCred = await db
        .select({
          userId: dailyFighterCred.userId,
          totalFighterCred: dailyFighterCred.totalFighterCred,
        })
        .from(dailyFighterCred)
        .where(
          eq(
            dailyFighterCred.interactionDay,
            new Date().toISOString().slice(0, 10),
          ),
        );

      // Update each user's points with their total fighter cred
      for (const cred of latestFighterCred) {
        await this.updateUserFighterCred(cred.userId, cred.totalFighterCred);
      }

      console.log(`Updated fighter cred for ${latestFighterCred.length} users`);
      return true;
    } catch (error) {
      console.error("Error updating all users' fighter cred:", error);
      return false;
    }
  }

  async updateUserStatus(userId: string, status: string): Promise<boolean> {
    try {
      await db.execute(
        sql`UPDATE users SET status = ${status} WHERE id = ${userId}`,
      );
      return true;
    } catch (error) {
      console.error("Error updating user status:", error);
      return false;
    }
  }

  async calculateUserStatus(
    userId: string,
    totalFighterCred: number,
    allUserCreds?: Array<{ userId: string; totalFighterCred: number }>,
  ): Promise<string> {
    try {
      let userCreds: Array<{ userId: string; totalFighterCred: number }>;

      if (totalFighterCred === 0) {
        await this.updateUserStatus(userId, "AMATEUR");
        return "AMATEUR";
      }

      if (allUserCreds) {
        // Use provided data (for when we're calculating during fighter cred recalculation)
        userCreds = allUserCreds;
      } else {
        // Get all users' total fighter cred for today from database
        const today = new Date().toISOString().slice(0, 10);
        userCreds = await db
          .select({
            userId: dailyFighterCred.userId,
            totalFighterCred: dailyFighterCred.totalFighterCred,
          })
          .from(dailyFighterCred)
          .where(eq(dailyFighterCred.interactionDay, today))
          .orderBy(desc(dailyFighterCred.totalFighterCred));
      }

      if (userCreds.length === 0) {
        await this.updateUserStatus(userId, "AMATEUR");
        return "AMATEUR"; // Default status if no data
      }

      const userCredsWithoutZero = userCreds.filter(
        (user) => user.totalFighterCred > 0,
      );

      const N = userCredsWithoutZero.length;

      const credMap = new Map<number, number[]>();
      userCredsWithoutZero.forEach((user, i) => {
        const pts = user.totalFighterCred;
        if (!credMap.has(pts)) credMap.set(pts, []);
        credMap.get(pts)!.push(i);
      });

      const userPositions = credMap.get(totalFighterCred);

      if (!userPositions) {
        await this.updateUserStatus(userId, "AMATEUR");
        return "AMATEUR"; // User not found in ranking
      }

      const avgRank =
        userPositions.reduce((acc, curr) => acc + curr, 0) /
          userPositions.length +
        1;
      const percentile =
        N === 1 ? 100 : Math.round(((N - avgRank) / (N - 1)) * 100);

      if (Math.min(...userPositions) === 0) {
        await this.updateUserStatus(userId, "GOAT");
        return "GOAT"; // User is the top poster
      }

      const statusConfigs = await db
        .select()
        .from(statusConfig)
        .orderBy(desc(statusConfig.percentile));

      for (const config of statusConfigs) {
        if (percentile >= config.percentile) {
          const formattedStatus = config.status
            .replace(/_/g, " ")
            .toUpperCase(); // HALL_OF_FAMER → HALL OF FAMER
          await this.updateUserStatus(userId, formattedStatus);
          return formattedStatus;
        }
      }

      await this.updateUserStatus(userId, "AMATEUR");
      return "AMATEUR";
    } catch (error) {
      console.error("Error calculating user status:", error);
      return "AMATEUR"; // Default status on error
    }
  }

  // Helper function to create notifications for all users when a fighter/MMA person posts
  async createNotificationForAllNormalUsers(
    notificationData: Omit<InsertNotification, "userId">,
    excludeUserId?: string,
    transaction?: any, // Add transaction parameter
  ): Promise<void> {
    try {
      // Use transaction if provided, otherwise use global db
      const dbInstance = transaction || db;

      // Get all users except fighters and MMA industry users (and the excluded user if provided)
      const allUsers = await dbInstance
        .select({ id: users.id })
        .from(users)
        .where(
          excludeUserId
            ? and(
                eq(users.disabled, false),
                notInArray(users.role, NOTIFICATION_EXCLUDED_ROLES),
                not(eq(users.id, excludeUserId)),
              )
            : and(
                eq(users.disabled, false),
                notInArray(users.role, NOTIFICATION_EXCLUDED_ROLES),
              ),
        );

      if (allUsers.length === 0) {
        console.log("No users found to notify");
        return;
      }

      // Create notifications for all users in batches to avoid overwhelming the database
      const batchSize = 50;
      for (let i = 0; i < allUsers.length; i += batchSize) {
        const batch = allUsers.slice(i, i + batchSize);

        const notificationsToInsert = batch.map((user) => ({
          id: uuidv4(),
          userId: user.id,
          type: notificationData.type,
          relatedUserId: notificationData.relatedUserId || null,
          threadId: notificationData.threadId || null,
          replyId: notificationData.replyId || null,
          message: notificationData.message || null,
          isRead: false,
          createdAt: new Date(),
        }));

        await dbInstance.insert(notifications).values(notificationsToInsert);
      }

      console.log(`Created notifications for ${allUsers.length} users`);
    } catch (error) {
      console.error("Error creating notifications for all users:", error);
      // Don't throw error to avoid breaking the main operation
    }
  }

  // Fighter invitation management
  async createFighterInvitation(data: CreateFighterInvitationData): Promise<FighterInvitation> {
    try {
      const invitationValues = {
        id: uuidv4(),
        email: data?.email,
        invitedByAdminId: data?.invitedByAdminId,
        invitationToken: data?.invitationToken, // Use the passed token instead of generating new one
        fighterName: data?.fighterName,
        message: data?.message,
        status: "PENDING",
        expiresAt: data?.expiresAt, // Also use the passed expiration date
        usedAt: null,
        usedByUserId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const [invitation] = await db.insert(fighterInvitations).values(invitationValues).returning();
      return invitation;
    } catch (error) {
      console.error("Error creating fighter invitation:", error);
      throw error;
    }
  }

  async getFighterInvitationByToken(token: string): Promise<FighterInvitation | null> {
    try {
      const [invitation] = await db
        .select()
        .from(fighterInvitations)
        .where(eq(fighterInvitations.invitationToken, token))
        .limit(1);
      return invitation || null;
    } catch (error) {
      console.error("Error fetching fighter invitation by token:", error);
      throw error;
    }
  }

  async getFighterInvitationByEmail(email: string): Promise<FighterInvitation | null> {
    try {
      const [invitation] = await db
        .select()
        .from(fighterInvitations)
        .where(eq(fighterInvitations.email, email))
        .limit(1);
      return invitation || null;
    } catch (error) {
      console.error("Error fetching fighter invitation by email:", error);
      throw error;
    }
  }

  async updateFighterInvitationStatus(id: string, status: string, usedByUserId?: string): Promise<void> {
    try {
      const updateData = {
        status,
        usedAt: status === "ACCEPTED" ? new Date() : null,
        usedByUserId,
        updatedAt: new Date(),
      };

      await db
        .update(fighterInvitations)
        .set(updateData)
        .where(eq(fighterInvitations.id, id));
    } catch (error) {
      console.error("Error updating fighter invitation status:", error);
      throw error;
    }
  }

  async getAllFighterInvitations(): Promise<FighterInvitation[]> {
    try {
      const invitations = await db
        .select()
        .from(fighterInvitations)
        .orderBy(desc(fighterInvitations.createdAt));
      return invitations;
    } catch (error) {
      console.error("Error fetching all fighter invitations:", error);
      throw error;
    }
  }
}

// Use database storage implementation
export const storage = new DatabaseStorage();
