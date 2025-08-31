import express, {
  type Express,
  Response,
  NextFunction,
  Request,
} from "express";
import { createServer, type Server } from "http";
import crypto from "crypto";
import { storage } from "./storage";
import { fetchUpcomingEvents } from "./espn-api";
import { ZodError } from "zod";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";
import { insertThreadSchema, insertReplySchema, Thread } from "@shared/schema";
import { requireAuth, clerkClient } from "@clerk/express";
import { ensureLocalUser, requirePaidPlan } from "./auth";
import { handleUserDeleted } from "./stripe";
import sendEmail from "./helper/emailjs";

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId?: string;
        sessionId?: string;
        // Add other properties as needed
      };
    }
  }
}

// Create uploads directory if it doesn't exist
const uploadsDir = process.env.RAILWAY_VOLUME_MOUNT_PATH
  ? path.join(process.env.RAILWAY_VOLUME_MOUNT_PATH, "uploads")
  : path.join(process.cwd(), "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (
    req: any,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback,
  ) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG and GIF are allowed."));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Error handling middleware
  app.use((req: any, res: Response, next: NextFunction) => {
    try {
      next();
    } catch (error) {
      console.error("Server error:", error);

      if (error instanceof ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors,
        });
      }

      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Authentication endpoints are now handled by Clerk

  // Thread endpoints with Clerk authentication
  app.post(
    "/api/threads",
    requireAuth(),
    ensureLocalUser,
    requirePaidPlan,
    async (req: any, res: Response, next: NextFunction) => {
      try {
        // Get the Clerk user ID from the request body
        const clerkUserId = req.body.userId;

        if (!clerkUserId) {
          return res.status(400).json({ message: "User ID is required" });
        }

        console.log("Using Clerk user ID from request body:", clerkUserId);

        // Get the local user from the Clerk external ID
        const localUser = await storage.getUserByExternalId(clerkUserId);

        if (!localUser) {
          return res
            .status(400)
            .json({ message: "User not found in database" });
        }

        console.log(
          `POST /api/threads: Using local user ID ${localUser.id} for Clerk user ${clerkUserId}`,
        );

        // Use our internal user ID for database operations
        req.body.userId = localUser.id;

        const threadData = insertThreadSchema.parse(req.body);
        const { poll, media } = req.body;

        // Create thread
        const thread = await storage.createThread(threadData);
        console.log(`POST /api/threads: Thread created with ID ${thread.id}`);

        // Create poll if provided
        if (poll && poll.question && poll.options && poll.options.length >= 2) {
          const pollData = {
            threadId: thread.id,
            question: poll.question,
            expiresAt: poll.expiresAt
              ? new Date(poll.expiresAt)
              : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days
          };

          await storage.createPoll(pollData, poll.options);
          console.log(
            `POST /api/threads: Poll created for thread ${thread.id}`,
          );
        }

        // Create media if provided
        if (media && Array.isArray(media)) {
          for (const mediaItem of media) {
            const mediaData = {
              threadId: thread.id,
              type: mediaItem.type,
              url: mediaItem.url,
            };

            await storage.createThreadMedia(mediaData);
          }
          console.log(
            `POST /api/threads: ${media.length} media items created for thread ${thread.id}`,
          );
        }

        res.status(201).json(thread);
      } catch (error) {
        next(error);
      }
    },
  );

  // Update all other handlers that need the user ID from Clerk auth
  app.get(
    "/api/notifications",
    requireAuth(),
    ensureLocalUser,
    async (req: any, res: Response) => {
      try {
        // Get userId from local user
        if (!req.localUser || !req.localUser.id) {
          return res.status(400).json({ message: "User ID is required" });
        }
        const userId = req.localUser.id;

        const notifications = await storage.getNotifications(userId);

        // Fetch related user for each notification
        const notificationsWithRelatedUser = await Promise.all(
          notifications.map(async (notification) => {
            if (!notification.relatedUserId) {
              return notification;
            }

            const relatedUser = await storage.getUser(
              notification.relatedUserId,
            );

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
              const reply = await storage.getReply(
                notification.replyId,
                userId,
              );
              if (reply) {
                replyPreview =
                  reply.content.length > 100
                    ? reply.content.substring(0, 100) + "..."
                    : reply.content;
              }
            }

            return {
              ...notification,
              relatedUser: userWithoutPassword,
              threadTitle,
              replyPreview,
            };
          }),
        );

        res.json(notificationsWithRelatedUser);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch notifications" });
      }
    },
  );

  // Get users for admin view to be able to change role
  app.get(
    "/api/users",
    requireAuth(),
    ensureLocalUser,
    async (req: Request, res: Response) => {
      try {
        if (!req.localUser || !req.localUser.id) {
          return res.status(400).json({ message: "User ID is required" });
        }

        // Only admins can view all users
        if (req.localUser?.role !== "ADMIN") {
          return res.status(403).json({ message: "Unauthorized" });
        }

        // Parse pagination parameters
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = (req.query.search as string) || "";
        const sortBy = (req.query.sortBy as string) || "createdAt";
        const sortOrder = (req.query.sortOrder as string) || "desc";

        try {
          const result = await storage.getAllUsers({
            page,
            limit,
            search,
            sortBy,
            sortOrder,
          });

          if (!result.users || result.users.length === 0) {
            return res.json({
              users: [],
              pagination: {
                currentPage: page,
                totalPages: 0,
                totalUsers: 0,
                hasNext: false,
                hasPrevious: false,
              },
            });
          }

          // Only return users names, email, role, status, and id
          const users = result.users.map((user) => ({
            id: user?.id,
            username: user?.username,
            email: user?.email,
            firstName: user?.firstName,
            lastName: user?.lastName,
            role: user?.role,
            status: user?.status,
            isOnline: user?.isOnline,
            lastActive: user?.lastActive,
            points: user?.points,
            rank: user?.rank,
            createdAt: user?.createdAt,
          }));

          res.json({
            users,
            pagination: result.pagination,
          });
        } catch (storageError) {
          console.error(
            "Storage error fetching all users for admin view:",
            storageError,
          );
          return res.json({
            users: [],
            pagination: {
              currentPage: 1,
              totalPages: 0,
              totalUsers: 0,
              hasNext: false,
              hasPrevious: false,
            },
          });
        }
      } catch (error) {
        console.error("Error fetching all users for admin view:", error);
        return res.json({
          users: [],
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalUsers: 0,
            hasNext: false,
            hasPrevious: false,
          },
        });
      }
    },
  );

  // Get fighter invitations for admin view
  app.get(
    "/api/admin/fighter-invitations",
    requireAuth(),
    ensureLocalUser,
    async (req: Request, res: Response) => {
      try {
        if (!req.localUser || !req.localUser.id) {
          return res.status(400).json({ message: "User ID is required" });
        }

        // Only admins can view fighter invitations
        if (req.localUser?.role !== "ADMIN") {
          return res.status(403).json({ message: "Unauthorized" });
        }

        // Parse pagination parameters
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = (req.query.search as string) || "";
        const sortBy = (req.query.sortBy as string) || "createdAt";
        const sortOrder = (req.query.sortOrder as string) || "desc";

        try {
          const result = await storage.getFighterInvitationsWithFilters({
            page,
            limit,
            search,
            sortBy,
            sortOrder,
          });

          if (!result.invitations || result.invitations.length === 0) {
            return res.json({
              invitations: [],
              pagination: {
                currentPage: page,
                totalPages: 0,
                total: 0,
                hasNext: false,
                hasPrevious: false,
              },
            });
          }

          // Return fighter invitations with clean data structure
          const invitations = result.invitations.map((invitation) => ({
            id: invitation?.id,
            email: invitation?.email,
            fighterName: invitation?.fighterName,
            status: invitation?.status,
            invitedByAdmin: invitation?.invitedByAdmin,
            createdAt: invitation?.createdAt,
            expiresAt: invitation?.expiresAt,
            usedAt: invitation?.usedAt,
            usedByUserId: invitation?.usedByUserId,
          }));

          res.json({
            invitations,
            pagination: {
              ...result.pagination,
              hasNext:
                result.pagination.currentPage < result.pagination.totalPages,
              hasPrevious: result.pagination.currentPage > 1,
            },
          });
        } catch (storageError) {
          console.error(
            "Storage error fetching fighter invitations for admin view:",
            storageError,
          );
          return res.json({
            invitations: [],
            pagination: {
              currentPage: 1,
              totalPages: 0,
              total: 0,
              hasNext: false,
              hasPrevious: false,
            },
          });
        }
      } catch (error) {
        console.error(
          "Error fetching fighter invitations for admin view:",
          error,
        );
        return res.json({
          invitations: [],
          pagination: {
            currentPage: 1,
            totalPages: 0,
            total: 0,
            hasNext: false,
            hasPrevious: false,
          },
        });
      }
    },
  );

  // Admin message user endpoint
  app.post(
    "/api/admin/message-user",
    requireAuth(),
    ensureLocalUser,
    async (req: any, res: Response) => {
      try {
        const { targetUserId, message } = req.body;

        if (!targetUserId || !message) {
          return res.status(400).json({
            message: "Target user ID and message are required",
          });
        }

        // Check if the authenticated user is an admin
        const authenticatedUser = req.localUser;
        if (!authenticatedUser) {
          return res.status(401).json({ message: "Authentication required" });
        }

        if (authenticatedUser.role !== "ADMIN") {
          return res.status(403).json({
            message: "Only administrators can send messages to users",
          });
        }

        // Verify target user exists
        const targetUser = await storage.getUser(targetUserId);
        if (!targetUser) {
          return res.status(404).json({ message: "Target user not found" });
        }

        // Create notification for the target user
        const notification = await storage.createNotification({
          userId: targetUserId,
          type: "ADMIN_MESSAGE",
          relatedUserId: authenticatedUser.id,
          message: message.trim(),
        });

        res.json({
          message: "Message sent successfully",
          notification,
        });
      } catch (error) {
        console.error("Error sending admin message:", error);
        res.status(500).json({ message: "Failed to send message" });
      }
    },
  );

  // Admin bulk message users endpoint
  app.post(
    "/api/admin/message-users",
    requireAuth(),
    ensureLocalUser,
    async (req: any, res: Response) => {
      try {
        const { targetRole, message } = req.body as {
          targetRole?: string | null;
          message?: string;
        };

        if (!message || !message.trim()) {
          return res.status(400).json({ message: "Message is required" });
        }

        // Check if the authenticated user is an admin
        const authenticatedUser = req.localUser;
        if (!authenticatedUser) {
          return res.status(401).json({ message: "Authentication required" });
        }

        if (authenticatedUser.role !== "ADMIN") {
          return res.status(403).json({
            message: "Only administrators can send messages to users",
          });
        }

        let targets;
        if (targetRole && targetRole !== "ALL") {
          targets = await storage.getUsersByRole(targetRole);
        } else {
          targets = await storage.getAllUsersList();
        }

        if (!targets || targets.length === 0) {
          return res.json({
            message: "No users matched the selection",
            count: 0,
          });
        }

        await Promise.all(
          targets.map((u: any) =>
            storage.createNotification({
              userId: u.id,
              type: "ADMIN_MESSAGE",
              relatedUserId: authenticatedUser.id,
              message: message.trim(),
            }),
          ),
        );

        res.json({
          message: "Messages sent successfully",
          count: targets.length,
        });
      } catch (error) {
        console.error("Error sending bulk admin messages:", error);
        res.status(500).json({ message: "Failed to send messages" });
      }
    },
  );

  // Get top users based on daily fighter cred for the current day
  app.get("/api/users/top", async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 200;

      try {
        const topUsers = await storage.getTopUsersFromDailyCred(limit);

        if (!topUsers || topUsers.length === 0) {
          return res.json([]); // Return empty array if no users found
        }

        // Don't return passwords in response
        const usersWithoutPasswords = topUsers.map((user) => {
          // Use destructuring to exclude password
          const { password, ...userWithoutPassword } = user;
          return userWithoutPassword;
        });

        // Format the response with position
        const result = usersWithoutPasswords.map((user, index) => {
          // Check for tied positions
          const isTied =
            index > 0 &&
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
              pinnedByUserCount: user.pinnedByUserCount || 0,
              pinnedCount: user.pinnedCount || 0,
              potdCount: user.potdCount || 0,
              repliesCount: user.repliesCount || 0,
              status: user.status || "AMATEUR",
            },
          };
        });

        res.json(result);
      } catch (storageError) {
        console.error("Storage error fetching top users:", storageError);
        // In development, don't let this break the UI
        return res.json([]);
      }
    } catch (error) {
      console.error("Error fetching top users:", error);
      // Return empty array instead of error to avoid breaking the UI
      return res.json([]);
    }
  });

  app.get(
    "/api/users/username/:username",
    async (req: Request, res: Response) => {
      try {
        const username = req.params.username;

        if (!username) {
          return res.status(400).json({ message: "Username is required" });
        }

        const user = await storage.getUserByUsername(username);

        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        // Don't return password in response
        const { password, ...userWithoutPassword } = user;

        res.json(userWithoutPassword);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch user" });
      }
    },
  );

  app.get("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;

      // Directly use the ID string - our storage functions now handle both
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Don't return password in response
      const { password, ...userWithoutPassword } = user;

      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.get("/api/users/:id/followers", async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;

      if (!userId) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const followers = await storage.getFollowers(userId);

      // Don't return passwords in response
      const followersWithoutPasswords = followers.map((user) => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });

      res.json(followersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch followers" });
    }
  });

  app.get("/api/users/:id/posts", async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;

      if (!userId) {
        return res.status(400).json({ message: "Invalid user ID" });
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
              options,
            };
          }

          return {
            ...thread,
            user: userWithoutPassword,
            media: media || [],
            poll: pollWithOptions,
          };
        }),
      );

      res.json(threadsWithData);
    } catch (error) {
      console.error("Error fetching user posts:", error);
      res.status(500).json({ message: "Failed to fetch user posts" });
    }
  });

  app.get("/api/users/:id/following", async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;

      if (!userId) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const following = await storage.getFollowing(userId);

      // Don't return passwords in response
      const followingWithoutPasswords = following.map((user) => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });

      res.json(followingWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch following" });
    }
  });

  app.post(
    "/api/users/:id/follow",
    requireAuth(),
    async (req: Request, res: Response) => {
      try {
        const followingId = req.params.id;
        const { followerId } = req.body;

        if (!followingId || !followerId) {
          return res.status(400).json({
            message: "Both follower ID and following ID are required",
          });
        }

        const success = await storage.followUser(followerId, followingId);

        if (!success) {
          return res.status(400).json({ message: "Failed to follow user" });
        }

        res.json({ message: "User followed successfully" });
      } catch (error) {
        res.status(500).json({ message: "Failed to follow user" });
      }
    },
  );

  app.post(
    "/api/users/:id/unfollow",
    requireAuth(),
    async (req: Request, res: Response) => {
      try {
        const followingId = req.params.id;
        const { followerId } = req.body;

        if (!followingId || !followerId) {
          return res.status(400).json({
            message: "Both follower ID and following ID are required",
          });
        }

        const success = await storage.unfollowUser(followerId, followingId);

        if (!success) {
          return res.status(400).json({ message: "Failed to unfollow user" });
        }

        res.json({ message: "User unfollowed successfully" });
      } catch (error) {
        res.status(500).json({ message: "Failed to unfollow user" });
      }
    },
  );

  // Thread endpoints
  app.get("/api/threads/:categoryId", async (req: Request, res: Response) => {
    try {
      const categoryId = req.params.categoryId;
      const sort = (req.query.sort as string) || "recent";
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;
      const pinned = req.query.pinned === "true";
      const clerkUserId = req.query.userId as string | undefined;

      // Set cache control headers
      res.set({
        "Cache-Control":
          "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
        "Surrogate-Control": "no-store",
      });

      // Convert Clerk user ID to local user ID if provided
      let localUserId = undefined;
      if (clerkUserId) {
        console.log(
          "Looking up user by externalId for thread list:",
          clerkUserId,
        );
        const localUser = await storage.getUserByExternalId(clerkUserId);
        if (localUser) {
          console.log(
            `Thread list: Using local user ID ${localUser.id} for Clerk user ${clerkUserId}`,
          );
          localUserId = localUser.id;
        } else {
          console.log(`No local user found for Clerk user ${clerkUserId}`);
        }
      }

      // Get threads - if pinned is true, only get pinned threads
      const threads = await storage.getThreadsByCategory(
        categoryId,
        sort,
        limit,
        offset,
      );

      // Filter threads based on pinned status
      let filteredThreads: Thread[];
      if (pinned) {
        filteredThreads = threads.filter((thread) => thread.isPinned);
      } else {
        filteredThreads = threads;
      }

      // Fetch full thread data with user details for each thread
      const threadsWithUser = await Promise.all(
        filteredThreads.map(async (thread) => {
          // Get the full thread data including hasLiked and hasPotd status
          const fullThreadData = await storage.getThread(
            thread.id,
            localUserId,
          );

          if (!fullThreadData) {
            return null;
          }

          return fullThreadData;
        }),
      );

      // Filter out any null values from threads that couldn't be fetched
      const validThreads = threadsWithUser.filter((thread) => thread !== null);

      res.json(validThreads);
    } catch (error) {
      console.error("Error fetching threads:", error);
      res.status(500).json({ message: "Failed to fetch threads" });
    }
  });

  app.get("/api/threads/id/:id", async (req: Request, res: Response) => {
    try {
      const threadId = req.params.id;
      const clerkUserId = req.query.userId as string | undefined;

      if (!threadId) {
        return res.status(400).json({ message: "Invalid thread ID" });
      }

      let localUserId = undefined;

      // Convert Clerk user ID to local user ID if provided
      if (clerkUserId) {
        console.log(
          "Looking up user by externalId for thread view:",
          clerkUserId,
        );
        const localUser = await storage.getUserByExternalId(clerkUserId);
        if (localUser) {
          console.log(
            `Thread view: Using local user ID ${localUser.id} for Clerk user ${clerkUserId}`,
          );
          localUserId = localUser.id;
        } else {
          console.log(`No local user found for Clerk user ${clerkUserId}`);
        }
      }

      const thread = await storage.getThread(threadId, localUserId);

      if (!thread) {
        return res.status(404).json({ message: "Thread not found" });
      }

      res.json(thread);
    } catch (error) {
      console.error("Error fetching thread:", error);
      res.status(500).json({ message: "Failed to fetch thread" });
    }
  });

  app.delete(
    "/api/threads/:id",
    requireAuth(),
    async (req: any, res: Response) => {
      try {
        const threadId = req.params.id;
        const { userId: clerkUserId } = req.body;

        if (!clerkUserId) {
          return res.status(400).json({ message: "User ID is required" });
        }

        console.log("Using Clerk user ID from request body:", clerkUserId);

        // Get the local user from the Clerk external ID
        const localUser = await storage.getUserByExternalId(clerkUserId);

        if (!localUser) {
          return res
            .status(400)
            .json({ message: "User not found in database" });
        }

        console.log(
          `Delete thread: Using local user ID ${localUser.id} for Clerk user ${clerkUserId}`,
        );

        if (!threadId) {
          return res.status(400).json({ message: "Thread ID is required" });
        }

        const thread = await storage.getThread(threadId);

        if (!thread) {
          return res.status(404).json({ message: "Thread not found" });
        }

        // Only thread author, moderators, and admins can delete threads
        if (
          thread.userId !== localUser.id &&
          localUser.role !== "MODERATOR" &&
          localUser.role !== "ADMIN"
        ) {
          return res
            .status(403)
            .json({ message: "Not authorized to delete this thread" });
        }

        const success = await storage.deleteThread(threadId);

        if (!success) {
          return res.status(500).json({ message: "Failed to delete thread" });
        }

        res.json({ message: "Thread deleted successfully" });
      } catch (error) {
        console.error("Error in thread delete:", error);
        res.status(500).json({ message: "Failed to delete thread" });
      }
    },
  );

  app.put(
    "/api/threads/:id",
    requireAuth(),
    async (req: any, res: Response) => {
      try {
        const threadId = req.params.id;
        const { userId, title, content } = req.body;

        if (!userId) {
          return res.status(400).json({ message: "User ID is required" });
        }

        if (!title || !content) {
          return res
            .status(400)
            .json({ message: "Title and content are required" });
        }

        const thread = await storage.getThread(threadId);
        if (!thread) {
          return res.status(404).json({ message: "Thread not found" });
        }

        // Verify user is the thread author
        const user = await storage.getUserByExternalId(userId);
        if (thread.userId !== user?.id) {
          return res
            .status(403)
            .json({ message: "Not authorized to edit this thread" });
        }

        // Verify thread is less than 1 hour old
        if (thread.createdAt < new Date(Date.now() - 1000 * 60 * 60)) {
          return res
            .status(403)
            .json({ message: "Not authorized to edit this thread" });
        }

        const success = await storage.updateThread(threadId, {
          title,
          content,
          edited: true,
          editedAt: new Date(),
        });

        if (!success) {
          return res.status(400).json({ message: "Failed to edit thread" });
        }

        res.json({ message: "Thread edited successfully" });
      } catch (error) {
        console.error("Error in thread edit:", error);
      }
    },
  );

  app.post(
    "/api/threads/:id/pin",
    requireAuth(),
    async (req: any, res: Response) => {
      try {
        const threadId = req.params.id;

        // Get the Clerk user ID from the request body
        const clerkUserId = req.body.userId;

        if (!clerkUserId) {
          return res.status(400).json({ message: "User ID is required" });
        }

        console.log("Using Clerk user ID from request body:", clerkUserId);

        // Get the local user from the Clerk external ID
        const localUser = await storage.getUserByExternalId(clerkUserId);

        if (!localUser) {
          return res
            .status(400)
            .json({ message: "User not found in database" });
        }

        console.log(
          `Pin thread: Using local user ID ${localUser.id} for Clerk user ${clerkUserId}`,
        );

        // Check if user is admin or moderator
        if (localUser.role !== "ADMIN" && localUser.role !== "MODERATOR") {
          return res.status(403).json({
            message: "Only administrators and moderators can pin threads",
          });
        }

        if (!threadId) {
          return res.status(400).json({ message: "Thread ID is required" });
        }

        // Get current thread to check pin status and get thread owner
        const currentThread = await storage.getThread(threadId);
        if (!currentThread) {
          return res.status(404).json({ message: "Thread not found" });
        }

        // Toggle the pin status
        const newPinStatus = !currentThread.isPinned;

        // Update thread pin status and increment/decrement pinnedCount for thread owner
        const success = await storage.updateThreadPinStatus(
          threadId,
          newPinStatus,
          currentThread.userId,
          localUser.id,
        );

        if (!success) {
          return res
            .status(400)
            .json({ message: "Failed to update thread pin status" });
        }

        res.json({
          message: `Thread ${newPinStatus ? "pinned" : "unpinned"} successfully`,
          isPinned: newPinStatus,
        });
      } catch (error) {
        console.error("Error in thread pin:", error);
        res.status(500).json({ message: "Failed to update thread pin status" });
      }
    },
  );

  app.post(
    "/api/threads/:id/like",
    requireAuth(),
    async (req: any, res: Response) => {
      try {
        const threadId = req.params.id;

        // Get the Clerk user ID from the request body
        const clerkUserId = req.body.userId;

        if (!clerkUserId) {
          return res.status(400).json({ message: "User ID is required" });
        }

        console.log("Using Clerk user ID from request body:", clerkUserId);

        // Get the local user from the Clerk external ID
        const localUser = await storage.getUserByExternalId(clerkUserId);

        if (!localUser) {
          return res
            .status(400)
            .json({ message: "User not found in database" });
        }

        console.log(
          `Like thread: Using local user ID ${localUser.id} for Clerk user ${clerkUserId}`,
        );

        if (!threadId) {
          return res.status(400).json({ message: "Thread ID is required" });
        }

        const success = await storage.likeThread(threadId, localUser.id);

        if (!success) {
          return res.status(400).json({ message: "Failed to like thread" });
        }

        res.json({ message: "Thread liked successfully" });
      } catch (error) {
        console.error("Error in thread like:", error);
        res.status(500).json({ message: "Failed to like thread" });
      }
    },
  );

  app.post(
    "/api/threads/:id/dislike",
    requireAuth(),
    async (req: any, res: Response) => {
      try {
        const threadId = req.params.id;

        // Get the Clerk user ID from the request body
        const clerkUserId = req.body.userId;

        if (!clerkUserId) {
          return res.status(400).json({ message: "User ID is required" });
        }

        console.log("Using Clerk user ID from request body:", clerkUserId);

        // Get the local user from the Clerk external ID
        const localUser = await storage.getUserByExternalId(clerkUserId);

        if (!localUser) {
          return res
            .status(400)
            .json({ message: "User not found in database" });
        }

        console.log(
          `Dislike thread: Using local user ID ${localUser.id} for Clerk user ${clerkUserId}`,
        );

        if (!threadId) {
          return res.status(400).json({ message: "Thread ID is required" });
        }

        const success = await storage.dislikeThread(threadId, localUser.id);

        if (!success) {
          return res.status(400).json({ message: "Failed to dislike thread" });
        }

        res.json({ message: "Thread disliked successfully" });
      } catch (error) {
        console.error("Error in thread dislike:", error);
        res.status(500).json({ message: "Failed to dislike thread" });
      }
    },
  );

  app.post(
    "/api/threads/:id/potd",
    requireAuth(),
    async (req: any, res: Response) => {
      try {
        const threadId = req.params.id;

        // Get the Clerk user ID from the request body
        const clerkUserId = req.body.userId;

        if (!clerkUserId) {
          return res.status(400).json({ message: "User ID is required" });
        }

        console.log("Using Clerk user ID from request body:", clerkUserId);

        // Get the local user from the Clerk external ID
        const localUser = await storage.getUserByExternalId(clerkUserId);

        if (!localUser) {
          return res
            .status(400)
            .json({ message: "User not found in database" });
        }

        console.log(
          `POTD thread: Using local user ID ${localUser.id} for Clerk user ${clerkUserId}`,
        );

        if (!threadId) {
          return res.status(400).json({ message: "Thread ID is required" });
        }

        try {
          console.log(
            `Starting POTD operation for thread ${threadId} by user ${localUser.id}`,
          );
          await storage.potdThread(threadId, localUser.id);
          console.log(
            `POTD set successfully for thread ${threadId} by user ${localUser.id}`,
          );

          // Verify the update by fetching the thread with this user
          const updatedThread = await storage.getThread(threadId, localUser.id);
          console.log(
            `After POTD, hasPotd flag: ${updatedThread?.hasPotd}, potdCount: ${updatedThread?.potdCount}`,
          );

          res.json({ message: "Thread set as Post of the Day successfully" });
        } catch (potdError) {
          console.error("Error in thread POTD:", potdError);

          // Check for specific error messages and return appropriate status codes
          if (potdError instanceof Error) {
            if (potdError.message.includes("already used")) {
              return res.status(400).json({
                message: potdError.message,
                code: "ALREADY_USED_POTD",
              });
            } else if (potdError.message.includes("Thread not found")) {
              return res.status(404).json({
                message: "Thread not found",
                code: "THREAD_NOT_FOUND",
              });
            }
          }

          // Generic error case
          res.status(400).json({
            message:
              potdError instanceof Error
                ? potdError.message
                : "Failed to set thread as Post of the Day",
            code: "POTD_ERROR",
          });
        }
      } catch (error) {
        console.error("Error in thread POTD:", error);
        res.status(500).json({
          message: "Server error while processing POTD request",
          code: "SERVER_ERROR",
        });
      }
    },
  );

  app.post(
    "/api/threads/:id/poll/:optionId/vote",
    requireAuth(),
    async (req: any, res: Response) => {
      try {
        const threadId = req.params.id;
        const optionId = req.params.optionId;

        // Get the Clerk user ID from the request body
        const clerkUserId = req.body.userId;

        if (!clerkUserId) {
          return res.status(400).json({ message: "User ID is required" });
        }

        console.log("Using Clerk user ID from request body:", clerkUserId);

        // Get the local user from the Clerk external ID
        const localUser = await storage.getUserByExternalId(clerkUserId);

        if (!localUser) {
          return res
            .status(400)
            .json({ message: "User not found in database" });
        }

        console.log(
          `Poll vote: Using local user ID ${localUser.id} for Clerk user ${clerkUserId}`,
        );

        if (!threadId || !optionId) {
          return res
            .status(400)
            .json({ message: "Thread ID and option ID are required" });
        }

        // Get poll for this thread
        const poll = await storage.getPollByThread(threadId);

        if (!poll) {
          return res
            .status(404)
            .json({ message: "Poll not found for this thread" });
        }

        // Check if user has already voted on this poll
        const existingVote = await storage.getUserPollVote(
          poll.id,
          localUser.id,
        );

        if (existingVote) {
          return res.status(400).json({
            message: "You have already voted on this poll",
            votedOptionId: existingVote.optionId,
          });
        }

        const success = await storage.votePoll(poll.id, optionId, localUser.id);

        if (!success) {
          return res.status(400).json({ message: "Failed to vote in poll" });
        } else {
          res.json({ message: "Vote recorded successfully" });
        }
      } catch (error) {
        console.error("Error in poll vote:", error);
        res.status(500).json({
          message: "Failed to vote in poll",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  );

  // New endpoint to check if a user has voted on a poll
  app.get(
    "/api/threads/:id/poll/check-vote",
    async (req: Request, res: Response) => {
      try {
        const threadId = req.params.id;
        const userId = req.query.userId as string;

        if (!threadId || !userId) {
          return res.status(400).json({
            message: "Thread ID and user ID are required",
            hasVoted: false,
          });
        }

        // Get poll for this thread
        const poll = await storage.getPollByThread(threadId);

        if (!poll) {
          return res.status(404).json({
            message: "Poll not found for this thread",
            hasVoted: false,
          });
        }

        // Get the local user from the Clerk external ID
        const localUser = await storage.getUserByExternalId(userId);

        if (!localUser) {
          return res.status(200).json({
            hasVoted: false,
          });
        }

        // Check if user has already voted on this poll
        const existingVote = await storage.getUserPollVote(
          poll.id,
          localUser.id,
        );

        if (existingVote) {
          return res.status(200).json({
            hasVoted: true,
            votedOptionId: existingVote.optionId,
          });
        } else {
          return res.status(200).json({
            hasVoted: false,
          });
        }
      } catch (error) {
        console.error("Error checking poll vote:", error);
        res.status(200).json({
          hasVoted: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  );

  // Reply endpoints
  app.get("/api/threads/:id/replies", async (req: Request, res: Response) => {
    try {
      let localUserId: string | undefined = undefined;
      const threadId = req.params.id;
      const clerkUserId = req.query.userId as string | undefined;
      const limit = req.query.limit
        ? parseInt(req.query.limit as string)
        : undefined;
      const offset = req.query.offset
        ? parseInt(req.query.offset as string)
        : undefined;

      console.log(
        `Replies request for thread ${threadId}: limit=${limit}, offset=${offset}`,
      );

      if (!threadId) {
        return res.status(400).json({ message: "Invalid thread ID" });
      }
      if (clerkUserId) {
        const localUser = await storage.getUserByExternalId(clerkUserId);
        if (localUser) {
          localUserId = localUser.id;
        }
      }
      const replies = await storage.getRepliesByThread(
        threadId,
        localUserId,
        limit,
        offset,
      );

      console.log(`Replies response: returning ${replies.length} replies`);

      // Fetch user for each reply
      const repliesWithUser = await Promise.all(
        replies.map(async (reply) => {
          const replyUserId = reply.userId;
          const user = await storage.getUser(replyUserId);

          if (!user) {
            return { ...reply, user: null };
          }

          // Don't return user password
          const { password, ...userWithoutPassword } = user;

          // Get reply media
          // const media = await storage.getMediaByReply(reply.id);

          return {
            ...reply,
            user: userWithoutPassword,
            // media: media.length > 0 ? media : undefined
          };
        }),
      );

      res.json(repliesWithUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch replies" });
    }
  });

  app.post(
    "/api/threads/:id/replies",
    requireAuth(),
    ensureLocalUser,
    requirePaidPlan,
    async (req: any, res: Response) => {
      try {
        const threadId = req.params.id;

        if (!threadId) {
          return res.status(400).json({ message: "Invalid thread ID" });
        }
        // Get the Clerk user ID from the request body
        const clerkUserId = req.body.userId;

        if (!clerkUserId) {
          return res.status(400).json({ message: "User ID is required" });
        }

        console.log("Using Clerk user ID from request body:", clerkUserId);

        // Get the local user from the Clerk external ID
        const localUser = await storage.getUserByExternalId(clerkUserId);
        if (localUser) {
          req.body.userId = req.localUser.id;
        }

        const replyData = insertReplySchema.parse({
          ...req.body,
          threadId,
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
              url: mediaItem.url,
            };

            await storage.createThreadMedia(mediaData);
          }
        }

        res.status(201).json(reply);
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json({
            message: "Validation error",
            errors: error.errors,
          });
        }

        res.status(500).json({ message: "Failed to create reply" });
      }
    },
  );

  app.delete(
    "/api/replies/:id",
    requireAuth(),
    async (req: any, res: Response) => {
      try {
        const replyId = req.params.id;
        const { userId: clerkUserId, role } = req.body;

        if (!clerkUserId) {
          return res.status(400).json({ message: "User ID is required" });
        }

        console.log("Using Clerk user ID from request body:", clerkUserId);

        // Get the local user from the Clerk external ID
        const localUser = await storage.getUserByExternalId(clerkUserId);

        if (!localUser) {
          return res
            .status(400)
            .json({ message: "User not found in database" });
        }

        console.log(
          `Delete reply: Using local user ID ${localUser.id} for Clerk user ${clerkUserId}`,
        );

        if (!replyId) {
          return res.status(400).json({ message: "Reply ID is required" });
        }

        const reply = await storage.getReply(replyId, localUser.id);

        if (!reply) {
          return res.status(404).json({ message: "Reply not found" });
        }

        // Only reply author, moderators, and admins can delete replies
        if (
          reply.userId !== localUser.id &&
          role !== "MODERATOR" &&
          role !== "ADMIN"
        ) {
          return res
            .status(403)
            .json({ message: "Not authorized to delete this reply" });
        }

        const success = await storage.deleteReply(replyId);

        if (!success) {
          return res.status(500).json({ message: "Failed to delete reply" });
        }

        res.json({ message: "Reply deleted successfully" });
      } catch (error) {
        console.error("Error in reply delete:", error);
        res.status(500).json({ message: "Failed to delete reply" });
      }
    },
  );

  app.post(
    "/api/replies/:id/like",
    requireAuth(),
    async (req: any, res: Response) => {
      try {
        const replyId = req.params.id;

        // Get the Clerk user ID from the request body
        const clerkUserId = req.body.userId;

        if (!clerkUserId) {
          return res.status(400).json({ message: "User ID is required" });
        }

        console.log("Using Clerk user ID from request body:", clerkUserId);

        // Get the local user from the Clerk external ID
        const localUser = await storage.getUserByExternalId(clerkUserId);

        if (!localUser) {
          return res
            .status(400)
            .json({ message: "User not found in database" });
        }

        console.log(
          `Like reply: Using local user ID ${localUser.id} for Clerk user ${clerkUserId}`,
        );

        if (!replyId) {
          return res.status(400).json({ message: "Reply ID is required" });
        }

        const success = await storage.likeReply(replyId, localUser.id);

        if (!success) {
          return res.status(400).json({ message: "Failed to like reply" });
        }

        res.json({ message: "Reply liked successfully" });
      } catch (error) {
        console.error("Error in reply like:", error);
        res.status(500).json({ message: "Failed to like reply" });
      }
    },
  );

  app.post(
    "/api/replies/:id/dislike",
    requireAuth(),
    async (req: any, res: Response) => {
      try {
        const replyId = req.params.id;

        // Get the Clerk user ID from the request body
        const clerkUserId = req.body.userId;

        if (!clerkUserId) {
          return res.status(400).json({ message: "User ID is required" });
        }

        console.log("Using Clerk user ID from request body:", clerkUserId);

        // Get the local user from the Clerk external ID
        const localUser = await storage.getUserByExternalId(clerkUserId);

        if (!localUser) {
          return res
            .status(400)
            .json({ message: "User not found in database" });
        }

        console.log(
          `Dislike reply: Using local user ID ${localUser.id} for Clerk user ${clerkUserId}`,
        );

        if (!replyId) {
          return res.status(400).json({ message: "Reply ID is required" });
        }

        const success = await storage.dislikeReply(replyId, localUser.id);

        if (!success) {
          return res.status(400).json({ message: "Failed to dislike reply" });
        }

        res.json({ message: "Reply disliked successfully" });
      } catch (error) {
        console.error("Error in reply dislike:", error);
        res.status(500).json({ message: "Failed to dislike reply" });
      }
    },
  );

  app.post(
    "/api/notifications/read/:id",
    requireAuth(),
    ensureLocalUser,
    async (req: any, res: Response) => {
      try {
        const notificationId = req.params.id;

        if (!notificationId) {
          return res.status(400).json({ message: "Invalid notification ID" });
        }

        const success = await storage.markNotificationAsRead(notificationId);

        if (!success) {
          return res
            .status(400)
            .json({ message: "Failed to mark notification as read" });
        }

        res.json({ message: "Notification marked as read" });
      } catch (error) {
        res
          .status(500)
          .json({ message: "Failed to mark notification as read" });
      }
    },
  );

  app.post(
    "/api/notifications/read-all",
    requireAuth(),
    ensureLocalUser,
    async (req: any, res: Response) => {
      try {
        // Use local user ID
        const userId = req.localUser?.id;

        if (!userId) {
          return res.status(400).json({ message: "User ID is required" });
        }

        const success = await storage.markAllNotificationsAsRead(userId);

        if (!success) {
          return res
            .status(400)
            .json({ message: "Failed to mark all notifications as read" });
        }

        res.json({ message: "All notifications marked as read" });
      } catch (error) {
        res
          .status(500)
          .json({ message: "Failed to mark all notifications as read" });
      }
    },
  );

  // User status update endpoint
  app.put(
    "/api/users/:id/status",
    requireAuth(),
    async (req: Request, res: Response) => {
      try {
        const userId = req.params.id;
        const { status, updatedBy } = req.body;

        // Validate input
        if (!userId || !status) {
          return res
            .status(400)
            .json({ message: "User ID and status are required" });
        }

        // Validate status value
        const validStatuses = [
          "AMATEUR",
          "REGIONAL_POSTER",
          "COMPETITOR",
          "RANKED_POSTER",
          "CONTENDER",
          "CHAMPION",
          "HALL_OF_FAMER",
        ];

        if (!validStatuses.includes(status)) {
          return res.status(400).json({
            message: "Invalid status value",
            validStatuses,
          });
        }

        // Get the user performing the update
        const admin = await storage.getUser(updatedBy);
        if (!admin || (admin.role !== "ADMIN" && admin.role !== "MODERATOR")) {
          return res
            .status(403)
            .json({ message: "Not authorized to update user status" });
        }

        // Get the user being updated to ensure they exist
        const userToUpdate = await storage.getUser(userId);
        if (!userToUpdate) {
          return res.status(404).json({ message: "User not found" });
        }

        // Update the user's status
        const updatedUser = await storage.updateUser(userId, { status });

        if (!updatedUser) {
          return res
            .status(500)
            .json({ message: "Failed to update user status" });
        }

        // Don't return password in response
        const { password, ...userWithoutPassword } = updatedUser;

        res.json({
          message: "User status updated successfully",
          user: userWithoutPassword,
        });
      } catch (error) {
        console.error("Error updating user status:", error);
        res.status(500).json({ message: "Failed to update user status" });
      }
    },
  );

  // User role update endpoint
  app.put(
    "/api/users/:id/role",
    requireAuth(),
    ensureLocalUser,
    async (req: any, res: Response) => {
      try {
        const userId = req.params.id;
        const { role } = req.body;

        // Validate input
        if (!userId || !role) {
          console.log("Validation failed: missing userId or role");
          return res
            .status(400)
            .json({ message: "User ID and role are required" });
        }

        // Validate role value
        const validRoles = [
          "ADMIN",
          "MODERATOR",
          "FIGHTER",
          "USER",
          "PREMIUM_USER",
          "INDUSTRY_PROFESSIONAL",
        ];

        if (!validRoles.includes(role)) {
          console.log("Validation failed: invalid role", role);
          return res.status(400).json({
            message: "Invalid role value",
            validRoles,
          });
        }

        // Get the authenticated user from the bearer token (req.localUser is set by ensureLocalUser middleware)
        const authenticatedUser = req.localUser;
        if (!authenticatedUser) {
          return res.status(401).json({ message: "Authentication required" });
        }

        // Check if the authenticated user is an admin
        if (authenticatedUser.role !== "ADMIN") {
          return res
            .status(403)
            .json({ message: "Only administrators can update user roles" });
        }

        // Get the user being updated to ensure they exist
        const userToUpdate = await storage.getUser(userId);
        if (!userToUpdate) {
          return res.status(404).json({ message: "User not found" });
        }

        // If trying to set another user as ADMIN, require extra confirmation
        if (role === "ADMIN" && authenticatedUser.id !== userId) {
          const { confirmAdminPromotion } = req.body;
          if (!confirmAdminPromotion) {
            return res.status(400).json({
              message: "Admin promotion requires confirmation",
              requiresConfirmation: true,
            });
          }
        }

        // Update the user's role
        const updatedUser = await storage.updateUser(userId, { role });

        if (!updatedUser) {
          return res
            .status(500)
            .json({ message: "Failed to update user role" });
        }

        res.json({
          message: "User role updated successfully",
          previousRole: userToUpdate.role,
          newRole: role,
          user: updatedUser,
        });
      } catch (error) {
        console.error("Error updating user role:", error);
        res.status(500).json({ message: "Failed to update user role" });
      }
    },
  );

  // User plan type update endpoint - Removed manual admin update endpoint since we'll update via Stripe webhook

  // Get user plan type
  app.get(
    "/api/users/:id/plan",
    requireAuth(),
    async (req: any, res: Response) => {
      try {
        const userId = req.params.id;

        if (!userId) {
          return res.status(400).json({ message: "User ID is required" });
        }

        // Get the user to check plan type
        const user = await storage.getUser(userId);

        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        // Return just the plan info
        res.json({
          userId: user.id,
          username: user.username,
          planType: user.planType || "FREE",
        });
      } catch (error) {
        console.error("Error getting user plan:", error);
        res.status(500).json({ message: "Failed to get user plan" });
      }
    },
  );

  // Check and update user's plan type based on Stripe subscription status
  app.post(
    "/api/users/update-plan",
    requireAuth(),
    async (req: any, res: Response) => {
      try {
        const { clerkUserId, planType } = req.body;

        if (!clerkUserId || !planType) {
          return res
            .status(400)
            .json({ message: "Clerk user ID and plan type are required" });
        }

        // Validate plan type value
        const validPlanTypes = ["FREE", "BASIC", "PRO"];

        if (!validPlanTypes.includes(planType)) {
          return res.status(400).json({
            message: "Invalid plan type value",
            validPlanTypes,
          });
        }

        // Get the local user from the Clerk external ID
        const user = await storage.getUserByExternalId(clerkUserId);

        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        // Check if plan type needs updating
        if (user.planType === planType) {
          return res.json({
            message: "Plan type already up to date",
            planType,
            updated: false,
          });
        }

        // Update the user's plan type
        const updatedUser = await storage.updateUser(user.id, { planType });

        if (!updatedUser) {
          return res
            .status(500)
            .json({ message: "Failed to update user plan type" });
        }

        console.log(
          `Updated user ${user.username} (${user.id}) plan from ${user.planType || "FREE"} to ${planType}`,
        );

        // Don't return password in response
        const { password, ...userWithoutPassword } = updatedUser;

        res.json({
          message: "User plan updated successfully",
          previousPlan: user.planType || "FREE",
          newPlan: planType,
          updated: true,
          user: userWithoutPassword,
        });
      } catch (error) {
        console.error("Error updating user plan:", error);
        res.status(500).json({ message: "Failed to update user plan" });
      }
    },
  );

  // Auto-calculate user status endpoint
  app.post(
    "/api/users/:id/recalculate-status",
    requireAuth(),
    async (req: Request, res: Response) => {
      try {
        const userId = req.params.id;
        const { requestedBy } = req.body;

        if (!userId) {
          return res.status(400).json({ message: "User ID is required" });
        }

        // Check if the request is from an admin/moderator or the user themselves
        if (requestedBy) {
          const admin = await storage.getUser(requestedBy);
          if (
            requestedBy !== userId &&
            (!admin || (admin.role !== "ADMIN" && admin.role !== "MODERATOR"))
          ) {
            return res
              .status(403)
              .json({ message: "Not authorized to recalculate user status" });
          }
        }

        // Make sure the user exists
        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        // Recalculate status based on user's points and activity
        const newStatus = await storage.recalculateUserStatus(userId);

        if (!newStatus) {
          return res
            .status(500)
            .json({ message: "Failed to recalculate user status" });
        }

        // Get the updated user
        const updatedUser = await storage.getUser(userId);

        if (!updatedUser) {
          return res
            .status(500)
            .json({ message: "Failed to fetch updated user" });
        }

        // Don't return password in response
        const { password, ...userWithoutPassword } = updatedUser;

        res.json({
          message: "User status recalculated successfully",
          previousStatus: user.status,
          newStatus: newStatus,
          user: userWithoutPassword,
        });
      } catch (error) {
        console.error("Error recalculating user status:", error);
        res.status(500).json({ message: "Failed to recalculate user status" });
      }
    },
  );

  // Admin endpoint to recalculate all user statuses
  app.post(
    "/api/admin/recalculate-all-statuses",
    requireAuth(),
    async (req: Request, res: Response) => {
      try {
        const { adminId } = req.body;

        if (!adminId) {
          return res.status(400).json({ message: "Admin ID is required" });
        }

        // Check if the request is from an admin
        const admin = await storage.getUser(adminId);
        if (!admin || admin.role !== "ADMIN") {
          return res.status(403).json({
            message: "Only administrators can trigger this operation",
          });
        }

        // Log that this admin triggered the operation
        console.log(
          `Admin ${admin.username} (ID: ${adminId}) triggered manual recalculation of all user statuses`,
        );

        // Start the recalculation process
        // This might take a while for many users, so we return immediately
        // and let the process run in the background
        res.json({
          message: "Status recalculation started",
          info: "This process will run in the background. Check server logs for progress and results.",
        });

        // Run the recalculation after sending the response
        storage
          .recalculateAllUserStatuses()
          .then((result) => {
            console.log(
              `Manual status recalculation completed by admin ${admin.username}: ${result.success} updated, ${result.unchanged} unchanged, ${result.failed} failed`,
            );
          })
          .catch((error) => {
            console.error("Error during manual status recalculation:", error);
          });
      } catch (error) {
        console.error(
          "Error processing recalculate all statuses request:",
          error,
        );
        res
          .status(500)
          .json({ message: "Failed to start status recalculation process" });
      }
    },
  );

  // User account deletion endpoint
  app.delete(
    "/api/users/account",
    requireAuth(),
    async (req: any, res: Response) => {
      try {
        const { userId: userId } = req.body;

        if (!userId) {
          return res.status(400).json({ message: "User ID is required" });
        }

        console.log("Deleting user account for user ID:", userId);

        // Get the local user from the Clerk external ID
        const localUser = await storage.getUserByExternalId(userId);

        if (!localUser) {
          return res
            .status(400)
            .json({ message: "User not found in database" });
        }

        console.log(
          `Delete account: Using local user ID ${localUser.id} for user ${userId}`,
        );

        // Disable the clerk account
        await clerkClient.users.deleteUser(userId);

        // Disable stripe subscription
        await handleUserDeleted(localUser.stripeId);

        // Mark user as deactivated in database
        await storage.updateUser(localUser.id, {
          disabled: true,
          disabledAt: new Date(),
          planType: "FREE",
        });

        // Delete all user's posts, comments, and rankings
        await storage.deleteUserPosts(localUser.id);

        res.status(200).json({ message: "User account deleted successfully" });
      } catch (error) {
        console.error("Error in user account deletion:", error);
        res.status(500).json({ message: "Failed to delete user account" });
      }
    },
  );

  // MMA Schedule endpoints
  app.get("/api/events", async (req: Request, res: Response) => {
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
            imageUrl: event.imageUrl,
          });
        }

        // Fetch the newly saved events
        events = await storage.getMMAEvents(limit, offset);
      }

      // Map events to a client-friendly format
      const eventList = events.map((event) => ({
        id: event.id,
        name: event.name,
        shortName: event.shortName,
        date: event.date,
        organization: event.organization,
        venue: event.venue,
        location: event.location,
        imageUrl: event.imageUrl,
      }));

      res.json(eventList);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Failed to fetch MMA events" });
    }
  });

  app.get("/api/events/:id", async (req: Request, res: Response) => {
    try {
      const eventId = req.params.id;

      const event = await storage.getMMAEvent(eventId);

      if (!event) {
        return res.status(404).json({ message: "Event not found" });
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
        imageUrl: event.imageUrl,
      });
    } catch (error) {
      console.error("Error fetching event:", error);
      res.status(500).json({ message: "Failed to fetch event" });
    }
  });

  // Serve uploaded files statically
  app.use("/uploads", express.static(uploadsDir));

  // Image upload endpoint with Railway Volume
  app.post(
    "/api/upload",
    requireAuth(),
    upload.single("image"),
    async (req: Request, res: Response) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "No file uploaded" });
        }

        const file = req.file;
        const fileExtension = path.extname(file.originalname);
        const fileName = `${uuidv4()}${fileExtension}`;
        const filePath = path.join(uploadsDir, fileName);

        // Write file to Railway Volume
        await fs.promises.writeFile(filePath, file.buffer);

        // Generate the URL - use Railway app URL or localhost for development
        const baseUrl = process.env.RAILWAY_PUBLIC_DOMAIN
          ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
          : `http://localhost:${process.env.PORT || 5001}`;

        const fileUrl = `${baseUrl}/uploads/${fileName}`;

        res.json({ url: fileUrl });
      } catch (error) {
        console.error("Error uploading file:", error);
        res.status(500).json({ message: "Failed to upload file" });
      }
    },
  );

  // Add this GET endpoint after the existing POST endpoint
  app.get("/api/users/clerk/:clerkId", async (req: Request, res: Response) => {
    try {
      const clerkId = req.params.clerkId;

      if (!clerkId) {
        return res.status(400).json({ message: "Clerk ID is required" });
      }

      const user = await storage.getUserByExternalId(clerkId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Don't return password in response
      const { password, ...userWithoutPassword } = user;

      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user by Clerk ID:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Update user profile endpoint
  app.patch(
    "/api/users/:userId/profile",
    requireAuth(),
    ensureLocalUser,
    async (req: Request, res: Response) => {
      try {
        const userId = req.params.userId;
        const { bio, socialLinks, coverPhotoUrl, reqUserId } = req.body;

        // Check if user is updating their own profile or if they're an admin

        const currentUser = await storage.getUserByExternalId(reqUserId);

        const isOwnProfile = currentUser?.id === userId;
        const isAdmin = req.localUser?.role === "ADMIN";

        if (!isOwnProfile && !isAdmin) {
          return res.status(401).json({
            message: "Unauthorized: You can only update your own profile",
          });
        }

        // Update user profile
        const updatedUser = await storage.updateUser(userId, {
          bio,
          socialLinks,
          coverPhoto: coverPhotoUrl,
        });

        if (!updatedUser) {
          return res.status(404).json({ message: "User not found" });
        }

        // Don't return password in response
        const { password, ...userWithoutPassword } = updatedUser;

        res.json(userWithoutPassword);
      } catch (error) {
        console.error("Error updating user profile:", error);
        res.status(500).json({ message: "Failed to update profile" });
      }
    },
  );

  app.post(
    "/api/admin/invite-fighter",
    requireAuth(),
    ensureLocalUser,
    async (req: any, res: Response) => {
      try {
        const { email, fighterName, message } = req.body;
        const adminUser = req.localUser;

        if (adminUser.role !== "ADMIN") {
          return res.status(403).json({ message: "Admin access required" });
        }

        // Check if user already exists
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser) {
          return res
            .status(400)
            .json({ message: "User with this email already exists" });
        }

        // Check if invitation already exists
        const existingInvitation =
          await storage.getFighterInvitationByEmail(email);
        let invitation;
        let token;
        let isResend = false;

        if (
          existingInvitation &&
          existingInvitation.status === "PENDING" &&
          new Date(existingInvitation.expiresAt) > new Date()
        ) {
          // Active invitation exists - resend it
          invitation = existingInvitation;
          token = existingInvitation.invitationToken;
          isResend = true;

          // No need to update anything - just resend the email with existing token
        } else {
          // Create new invitation (either no invitation exists, or it's expired/used)
          token = crypto.randomUUID();
          invitation = await storage.createFighterInvitation({
            email,
            invitedByAdminId: adminUser.id,
            invitationToken: token,
            fighterName,
            message,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          });
        }

        const url = `http://${process.env.EXTERNAL_URL}/fighter-signup?token=${token}`;

        // Send email
        await sendEmail({
          email,
          link: url,
          name: fighterName || "Fighter",
        });

        res.json({
          message: isResend
            ? "Fighter invitation resent successfully"
            : "Fighter invitation sent successfully",
          invitation: {
            id: invitation.id,
            email,
            fighterName: fighterName || invitation.fighterName,
            isResend,
          },
        });
      } catch (error) {
        console.error("❌ ERROR sending fighter invitation:", error);
        res.status(500).json({ message: "Failed to send invitation" });
      }
    },
  );

  // Generate fighter invitation link (without sending email)
  app.post(
    "/api/admin/generate-fighter-link",
    requireAuth(),
    ensureLocalUser,
    async (req: any, res: Response) => {
      try {
        const { email, fighterName, message } = req.body;
        const adminUser = req.localUser;

        if (adminUser.role !== "ADMIN") {
          return res.status(403).json({ message: "Admin access required" });
        }

        // Check if user already exists
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser) {
          return res
            .status(400)
            .json({ message: "User with this email already exists" });
        }

        // Check if invitation already exists
        const existingInvitation =
          await storage.getFighterInvitationByEmail(email);
        let invitation;
        let token;
        let isExisting = false;

        if (
          existingInvitation &&
          existingInvitation.status === "PENDING" &&
          new Date(existingInvitation.expiresAt) > new Date()
        ) {
          // Active invitation exists - return existing link
          invitation = existingInvitation;
          token = existingInvitation.invitationToken;
          isExisting = true;
        } else {
          // Create new invitation (either no invitation exists, or it's expired/used)
          token = crypto.randomUUID();
          invitation = await storage.createFighterInvitation({
            email,
            invitedByAdminId: adminUser.id,
            invitationToken: token,
            fighterName,
            message,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          });
        }

        const url = `http://${process.env.EXTERNAL_URL}/fighter-signup?token=${token}`;

        res.json({
          message: isExisting
            ? "Retrieved existing fighter invitation link"
            : "Fighter invitation link generated successfully",
          url,
          invitation: {
            id: invitation.id,
            email,
            fighterName: fighterName || invitation.fighterName,
            isExisting,
          },
        });
      } catch (error) {
        console.error("❌ ERROR generating fighter invitation link:", error);
        res.status(500).json({ message: "Failed to generate invitation link" });
      }
    },
  );

  // Get fighter invitation by token (for signup page validation)
  app.get(
    "/api/fighter-invitation/:token",
    async (req: Request, res: Response) => {
      try {
        const { token } = req.params;
        const invitation = await storage.getFighterInvitationByToken(token);

        if (
          !invitation ||
          invitation.status !== "PENDING" ||
          invitation.expiresAt < new Date()
        ) {
          return res
            .status(404)
            .json({ message: "Invalid or expired invitation" });
        }

        res.json({
          email: invitation.email,
          fighterName: invitation.fighterName,
        });
      } catch (error) {
        console.error("Error fetching fighter invitation:", error);
        res.status(500).json({ message: "Failed to fetch invitation" });
      }
    },
  );

  return httpServer;
}
