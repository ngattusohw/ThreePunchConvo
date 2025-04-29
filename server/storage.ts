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
  Fight
} from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool, db } from "./db";
import { eq } from "drizzle-orm";

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

export class MemStorage implements IStorage {
  sessionStore: any;
  
  private users: Map<number, User>;
  private threads: Map<number, Thread>;
  private replies: Map<number, Reply>;
  private polls: Map<number, Poll>;
  private pollOptions: Map<number, PollOption>;
  private pollVotes: Map<string, number>; // userId-pollId -> optionId
  private threadMedia: Map<number, Media>;
  private replyMedia: Map<number, Media>;
  private threadReactions: Map<string, string>; // userId-threadId -> type
  private replyReactions: Map<string, string>; // userId-replyId -> type
  private follows: Map<string, boolean>; // followerId-followingId -> true
  private notifications: Map<number, Notification>;
  private mmaEvents: Map<string, MMAEvent>;
  private fighters: Map<string, Fighter>;
  private fights: Map<string, Fight>;
  
  private userIdCounter: number;
  private threadIdCounter: number;
  private replyIdCounter: number;
  private pollIdCounter: number;
  private pollOptionIdCounter: number;
  private mediaIdCounter: number;
  private notificationIdCounter: number;
  
  private readonly USER_STATUSES = {
    HALL_OF_FAMER: { minPoints: 10000 },
    CHAMPION: { minPoints: 5000 },
    CONTENDER: { minPoints: 1000 },
    RANKED_POSTER: { minPoints: 500 },
    COMPETITOR: { minPoints: 100 },
    REGIONAL_POSTER: { minPoints: 50 },
    AMATEUR: { minPoints: 0 }
  };

  constructor() {
    // Initialize a memory session store
    const createMemoryStore = require('memorystore')(session);
    this.sessionStore = new createMemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    this.users = new Map();
    this.threads = new Map();
    this.replies = new Map();
    this.polls = new Map();
    this.pollOptions = new Map();
    this.pollVotes = new Map();
    this.threadMedia = new Map();
    this.replyMedia = new Map();
    this.threadReactions = new Map();
    this.replyReactions = new Map();
    this.follows = new Map();
    this.notifications = new Map();
    this.mmaEvents = new Map();
    this.fighters = new Map();
    this.fights = new Map();
    
    this.userIdCounter = 1;
    this.threadIdCounter = 1;
    this.replyIdCounter = 1;
    this.pollIdCounter = 1;
    this.pollOptionIdCounter = 1;
    this.mediaIdCounter = 1;
    this.notificationIdCounter = 1;
    
    this.seedData();
  }

  // Seed some initial data for development
  private seedData() {
    // Create some users
    const users = [
      {
        username: "admin",
        password: "admin123",
        email: "admin@3punchconvo.com",
        avatar: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=144&h=144&q=80",
        role: "ADMIN",
        status: "HALL OF FAMER",
        isOnline: true,
        points: 15000,
        postsCount: 157,
        likesCount: 3200,
        potdCount: 12,
        followersCount: 420,
        followingCount: 63
      },
      {
        username: "KnockoutKing",
        password: "password123",
        email: "knockout@example.com",
        avatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=144&h=144&q=80",
        role: "USER",
        status: "CHAMPION",
        isOnline: true,
        points: 7500,
        postsCount: 94,
        likesCount: 1203,
        potdCount: 8,
        followersCount: 215,
        followingCount: 44
      },
      {
        username: "DustinPoirier",
        password: "ufc123",
        email: "dustin@example.com",
        avatar: "https://images.unsplash.com/photo-1614632537197-38a17061c2bd?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=144&h=144&q=80",
        role: "PRO",
        status: "HALL OF FAMER",
        isOnline: true,
        points: 12000,
        postsCount: 73,
        likesCount: 4120,
        potdCount: 14,
        followersCount: 1200,
        followingCount: 23
      }
    ];
    
    users.forEach(user => {
      this.createUser(user as InsertUser);
    });
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => 
      user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    
    const user: User = {
      id,
      ...userData,
      role: userData.role || "USER",
      status: userData.status || "AMATEUR",
      createdAt: now,
      isOnline: userData.isOnline || false,
      lastActive: now,
      points: 0,
      rank: 0,
      postsCount: 0,
      likesCount: 0,
      potdCount: 0,
      followersCount: 0,
      followingCount: 0,
      socialLinks: userData.socialLinks || {}
    };
    
    this.users.set(id, user);
    
    // Calculate ranking
    this.recalculateRankings();
    
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    
    if (!user) {
      return undefined;
    }
    
    const updatedUser = { ...user, ...userData };
    
    // Update status based on points
    if (userData.points !== undefined) {
      updatedUser.status = this.calculateUserStatus(updatedUser.points);
    }
    
    this.users.set(id, updatedUser);
    
    // Recalculate rankings if points changed
    if (userData.points !== undefined) {
      this.recalculateRankings();
    }
    
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  async getTopUsers(limit: number): Promise<User[]> {
    return Array.from(this.users.values())
      .sort((a, b) => b.points - a.points)
      .slice(0, limit);
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  // Thread methods
  async getThread(id: number): Promise<Thread | undefined> {
    return this.threads.get(id);
  }

  async getThreadsByCategory(
    categoryId: string,
    sort: string = "recent",
    limit: number = 10,
    offset: number = 0
  ): Promise<Thread[]> {
    let threads = Array.from(this.threads.values())
      .filter(thread => thread.categoryId === categoryId || categoryId === "all");
    
    // Sort threads
    switch (sort) {
      case "recent":
        threads = threads.sort((a, b) => 
          new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime()
        );
        break;
      case "popular":
        threads = threads.sort((a, b) => b.likesCount - a.likesCount);
        break;
      case "new":
        threads = threads.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      default:
        threads = threads.sort((a, b) => 
          new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime()
        );
    }
    
    // Always put pinned threads first
    threads = [
      ...threads.filter(thread => thread.isPinned),
      ...threads.filter(thread => !thread.isPinned)
    ];
    
    return threads.slice(offset, offset + limit);
  }

  async createThread(threadData: InsertThread): Promise<Thread> {
    const id = this.threadIdCounter++;
    const now = new Date();
    
    const thread: Thread = {
      id,
      ...threadData,
      createdAt: now,
      updatedAt: now,
      lastActivityAt: now,
      viewCount: 0,
      likesCount: 0,
      dislikesCount: 0,
      repliesCount: 0,
      isPotd: false
    };
    
    this.threads.set(id, thread);
    
    // Increment user post count
    const user = this.users.get(thread.userId);
    if (user) {
      this.updateUser(user.id, {
        postsCount: user.postsCount + 1,
        points: user.points + 5 // Award points for creating a thread
      });
    }
    
    return thread;
  }

  async updateThread(id: number, threadData: Partial<Thread>): Promise<Thread | undefined> {
    const thread = this.threads.get(id);
    
    if (!thread) {
      return undefined;
    }
    
    const updatedThread = {
      ...thread,
      ...threadData,
      updatedAt: new Date()
    };
    
    this.threads.set(id, updatedThread);
    
    return updatedThread;
  }

  async deleteThread(id: number): Promise<boolean> {
    const thread = this.threads.get(id);
    
    if (!thread) {
      return false;
    }
    
    // Remove associated data
    // Remove replies
    Array.from(this.replies.values())
      .filter(reply => reply.threadId === id)
      .forEach(reply => this.replies.delete(reply.id));
    
    // Remove thread media
    Array.from(this.threadMedia.values())
      .filter(media => media.threadId === id)
      .forEach(media => this.threadMedia.delete(media.id));
    
    // Remove poll
    const poll = Array.from(this.polls.values())
      .find(poll => poll.threadId === id);
    
    if (poll) {
      // Remove poll options
      Array.from(this.pollOptions.values())
        .filter(option => option.pollId === poll.id)
        .forEach(option => this.pollOptions.delete(option.id));
      
      this.polls.delete(poll.id);
    }
    
    // Remove thread reactions
    Array.from(this.threadReactions.keys())
      .filter(key => key.endsWith(`-${id}`))
      .forEach(key => this.threadReactions.delete(key));
    
    return this.threads.delete(id);
  }

  async incrementThreadView(id: number): Promise<boolean> {
    const thread = this.threads.get(id);
    
    if (!thread) {
      return false;
    }
    
    thread.viewCount += 1;
    this.threads.set(id, thread);
    
    return true;
  }
  
  // Reply methods
  async getReply(id: number): Promise<Reply | undefined> {
    return this.replies.get(id);
  }

  async getRepliesByThread(threadId: number): Promise<Reply[]> {
    return Array.from(this.replies.values())
      .filter(reply => reply.threadId === threadId)
      .sort((a, b) => {
        // Sort parent replies by created date
        if (!a.parentReplyId && !b.parentReplyId) {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        
        // Parent replies come before child replies
        if (!a.parentReplyId && b.parentReplyId) {
          return -1;
        }
        
        if (a.parentReplyId && !b.parentReplyId) {
          return 1;
        }
        
        // Child replies of the same parent are sorted by created date
        if (a.parentReplyId === b.parentReplyId) {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        
        return 0;
      });
  }

  async createReply(replyData: InsertReply): Promise<Reply> {
    const id = this.replyIdCounter++;
    const now = new Date();
    
    const reply: Reply = {
      id,
      ...replyData,
      createdAt: now,
      updatedAt: now,
      likesCount: 0,
      dislikesCount: 0
    };
    
    this.replies.set(id, reply);
    
    // Update thread last activity and reply count
    const thread = this.threads.get(reply.threadId);
    if (thread) {
      this.updateThread(thread.id, {
        lastActivityAt: now,
        repliesCount: thread.repliesCount + 1
      });
      
      // Create notification for thread author if it's not the same user
      if (thread.userId !== reply.userId) {
        this.createNotification({
          userId: thread.userId,
          type: "REPLY",
          relatedUserId: reply.userId,
          threadId: thread.id,
          replyId: reply.id,
          message: "replied to your post"
        });
      }
      
      // If this is a reply to another reply, notify that user
      if (reply.parentReplyId) {
        const parentReply = this.replies.get(reply.parentReplyId);
        if (parentReply && parentReply.userId !== reply.userId) {
          this.createNotification({
            userId: parentReply.userId,
            type: "REPLY",
            relatedUserId: reply.userId,
            threadId: thread.id,
            replyId: reply.id,
            message: "replied to your comment"
          });
        }
      }
    }
    
    // Increment user post count
    const user = this.users.get(reply.userId);
    if (user) {
      this.updateUser(user.id, {
        postsCount: user.postsCount + 1,
        points: user.points + 2 // Award points for creating a reply
      });
    }
    
    return reply;
  }

  async updateReply(id: number, replyData: Partial<Reply>): Promise<Reply | undefined> {
    const reply = this.replies.get(id);
    
    if (!reply) {
      return undefined;
    }
    
    const updatedReply = {
      ...reply,
      ...replyData,
      updatedAt: new Date()
    };
    
    this.replies.set(id, updatedReply);
    
    return updatedReply;
  }

  async deleteReply(id: number): Promise<boolean> {
    const reply = this.replies.get(id);
    
    if (!reply) {
      return false;
    }
    
    // Remove child replies
    Array.from(this.replies.values())
      .filter(r => r.parentReplyId === id)
      .forEach(r => this.replies.delete(r.id));
    
    // Remove reply media
    Array.from(this.replyMedia.values())
      .filter(media => media.replyId === id)
      .forEach(media => this.replyMedia.delete(media.id));
    
    // Remove reply reactions
    Array.from(this.replyReactions.keys())
      .filter(key => key.endsWith(`-${id}`))
      .forEach(key => this.replyReactions.delete(key));
    
    // Update thread reply count
    const thread = this.threads.get(reply.threadId);
    if (thread) {
      this.updateThread(thread.id, {
        repliesCount: Math.max(0, thread.repliesCount - 1)
      });
    }
    
    return this.replies.delete(id);
  }
  
  // Poll methods
  async getPoll(id: number): Promise<Poll | undefined> {
    return this.polls.get(id);
  }

  async getPollByThread(threadId: number): Promise<Poll | undefined> {
    return Array.from(this.polls.values())
      .find(poll => poll.threadId === threadId);
  }

  async createPoll(pollData: InsertPoll, optionTexts: string[]): Promise<Poll> {
    const id = this.pollIdCounter++;
    const now = new Date();
    
    const poll: Poll = {
      id,
      ...pollData,
      createdAt: now,
      votesCount: 0
    };
    
    this.polls.set(id, poll);
    
    // Create poll options
    optionTexts.forEach(optionText => {
      const optionId = this.pollOptionIdCounter++;
      const option: PollOption = {
        id: optionId,
        pollId: id,
        text: optionText,
        votesCount: 0
      };
      
      this.pollOptions.set(optionId, option);
    });
    
    return poll;
  }

  async votePoll(pollId: number, optionId: number, userId: number): Promise<boolean> {
    const poll = this.polls.get(pollId);
    const option = this.pollOptions.get(optionId);
    const user = this.users.get(userId);
    
    if (!poll || !option || !user || option.pollId !== pollId) {
      return false;
    }
    
    const voteKey = `${userId}-${pollId}`;
    const existingVoteOptionId = this.pollVotes.get(voteKey);
    
    // If user already voted for this option, do nothing
    if (existingVoteOptionId === optionId) {
      return true;
    }
    
    // If user voted for a different option, remove that vote
    if (existingVoteOptionId) {
      const existingOption = this.pollOptions.get(existingVoteOptionId);
      if (existingOption) {
        existingOption.votesCount = Math.max(0, existingOption.votesCount - 1);
        this.pollOptions.set(existingVoteOptionId, existingOption);
        poll.votesCount = Math.max(0, poll.votesCount - 1);
      }
    }
    
    // Add the new vote
    option.votesCount += 1;
    this.pollOptions.set(optionId, option);
    
    poll.votesCount += 1;
    this.polls.set(pollId, poll);
    
    this.pollVotes.set(voteKey, optionId);
    
    return true;
  }
  
  // Media methods
  async getMedia(id: number): Promise<Media | undefined> {
    return this.threadMedia.get(id) || this.replyMedia.get(id);
  }

  async getMediaByThread(threadId: number): Promise<Media[]> {
    return Array.from(this.threadMedia.values())
      .filter(media => media.threadId === threadId);
  }

  async getMediaByReply(replyId: number): Promise<Media[]> {
    return Array.from(this.replyMedia.values())
      .filter(media => media.replyId === replyId);
  }

  async createThreadMedia(mediaData: InsertMedia): Promise<Media> {
    const id = this.mediaIdCounter++;
    const now = new Date();
    
    const media: Media = {
      id,
      ...mediaData,
      createdAt: now
    };
    
    if (mediaData.threadId) {
      this.threadMedia.set(id, media);
    } else if (mediaData.replyId) {
      this.replyMedia.set(id, { ...media, threadId: 0 });
    }
    
    return media;
  }
  
  // Reaction methods
  async likeThread(threadId: number, userId: number): Promise<boolean> {
    const thread = this.threads.get(threadId);
    const user = this.users.get(userId);
    
    if (!thread || !user) {
      return false;
    }
    
    const reactionKey = `${userId}-${threadId}`;
    const existingReaction = this.threadReactions.get(reactionKey);
    
    // If already liked, do nothing
    if (existingReaction === "LIKE") {
      return true;
    }
    
    // If user disliked, remove the dislike
    if (existingReaction === "DISLIKE") {
      thread.dislikesCount = Math.max(0, thread.dislikesCount - 1);
    }
    
    // Add the like
    thread.likesCount += 1;
    this.threads.set(threadId, thread);
    
    this.threadReactions.set(reactionKey, "LIKE");
    
    // Update user points and like count if not self-liking
    if (thread.userId !== userId) {
      const threadAuthor = this.users.get(thread.userId);
      if (threadAuthor) {
        this.updateUser(threadAuthor.id, {
          likesCount: threadAuthor.likesCount + 1,
          points: threadAuthor.points + 1 // Award points for receiving a like
        });
        
        // Create notification
        this.createNotification({
          userId: thread.userId,
          type: "LIKE",
          relatedUserId: userId,
          threadId,
          message: "liked your post"
        });
      }
    }
    
    return true;
  }

  async dislikeThread(threadId: number, userId: number): Promise<boolean> {
    const thread = this.threads.get(threadId);
    const user = this.users.get(userId);
    
    if (!thread || !user) {
      return false;
    }
    
    const reactionKey = `${userId}-${threadId}`;
    const existingReaction = this.threadReactions.get(reactionKey);
    
    // If already disliked, do nothing
    if (existingReaction === "DISLIKE") {
      return true;
    }
    
    // If user liked, remove the like
    if (existingReaction === "LIKE") {
      thread.likesCount = Math.max(0, thread.likesCount - 1);
      
      // Update thread author's like count
      if (thread.userId !== userId) {
        const threadAuthor = this.users.get(thread.userId);
        if (threadAuthor) {
          this.updateUser(threadAuthor.id, {
            likesCount: Math.max(0, threadAuthor.likesCount - 1),
            points: Math.max(0, threadAuthor.points - 1) // Remove points
          });
        }
      }
    }
    
    // Add the dislike
    thread.dislikesCount += 1;
    this.threads.set(threadId, thread);
    
    this.threadReactions.set(reactionKey, "DISLIKE");
    
    return true;
  }

  async potdThread(threadId: number, userId: number): Promise<boolean> {
    const thread = this.threads.get(threadId);
    const user = this.users.get(userId);
    
    if (!thread || !user) {
      return false;
    }
    
    // Check if user already used POTD today
    const today = new Date().toDateString();
    const userAlreadyVotedPOTD = Array.from(this.threadReactions.entries())
      .some(([key, type]) => key.startsWith(`${userId}-`) && type === "POTD" && 
           new Date(this.threads.get(parseInt(key.split('-')[1]))?.createdAt || 0).toDateString() === today);
    
    if (userAlreadyVotedPOTD) {
      return false;
    }
    
    // Remove any existing POTD from this thread
    const existingPOTD = Array.from(this.threads.values())
      .find(t => t.isPotd && t.categoryId === thread.categoryId);
    
    if (existingPOTD) {
      existingPOTD.isPotd = false;
      this.threads.set(existingPOTD.id, existingPOTD);
    }
    
    // Set this thread as POTD
    thread.isPotd = true;
    this.threads.set(threadId, thread);
    
    const reactionKey = `${userId}-${threadId}`;
    this.threadReactions.set(reactionKey, "POTD");
    
    // Update author's POTD count and points
    const threadAuthor = this.users.get(thread.userId);
    if (threadAuthor && threadAuthor.id !== userId) {
      this.updateUser(threadAuthor.id, {
        potdCount: threadAuthor.potdCount + 1,
        points: threadAuthor.points + 10 // Award points for receiving POTD
      });
      
      // Create notification
      this.createNotification({
        userId: thread.userId,
        type: "SYSTEM",
        threadId,
        message: "Your post was selected as Post of the Day!"
      });
    }
    
    return true;
  }

  async likeReply(replyId: number, userId: number): Promise<boolean> {
    const reply = this.replies.get(replyId);
    const user = this.users.get(userId);
    
    if (!reply || !user) {
      return false;
    }
    
    const reactionKey = `${userId}-${replyId}`;
    const existingReaction = this.replyReactions.get(reactionKey);
    
    // If already liked, do nothing
    if (existingReaction === "LIKE") {
      return true;
    }
    
    // If user disliked, remove the dislike
    if (existingReaction === "DISLIKE") {
      reply.dislikesCount = Math.max(0, reply.dislikesCount - 1);
    }
    
    // Add the like
    reply.likesCount += 1;
    this.replies.set(replyId, reply);
    
    this.replyReactions.set(reactionKey, "LIKE");
    
    // Update user points if not self-liking
    if (reply.userId !== userId) {
      const replyAuthor = this.users.get(reply.userId);
      if (replyAuthor) {
        this.updateUser(replyAuthor.id, {
          likesCount: replyAuthor.likesCount + 1,
          points: replyAuthor.points + 1 // Award points for receiving a like
        });
        
        // Create notification
        this.createNotification({
          userId: reply.userId,
          type: "LIKE",
          relatedUserId: userId,
          threadId: reply.threadId,
          replyId,
          message: "liked your reply"
        });
      }
    }
    
    return true;
  }

  async dislikeReply(replyId: number, userId: number): Promise<boolean> {
    const reply = this.replies.get(replyId);
    const user = this.users.get(userId);
    
    if (!reply || !user) {
      return false;
    }
    
    const reactionKey = `${userId}-${replyId}`;
    const existingReaction = this.replyReactions.get(reactionKey);
    
    // If already disliked, do nothing
    if (existingReaction === "DISLIKE") {
      return true;
    }
    
    // If user liked, remove the like
    if (existingReaction === "LIKE") {
      reply.likesCount = Math.max(0, reply.likesCount - 1);
      
      // Update reply author's like count
      if (reply.userId !== userId) {
        const replyAuthor = this.users.get(reply.userId);
        if (replyAuthor) {
          this.updateUser(replyAuthor.id, {
            likesCount: Math.max(0, replyAuthor.likesCount - 1),
            points: Math.max(0, replyAuthor.points - 1) // Remove points
          });
        }
      }
    }
    
    // Add the dislike
    reply.dislikesCount += 1;
    this.replies.set(replyId, reply);
    
    this.replyReactions.set(reactionKey, "DISLIKE");
    
    return true;
  }

  async removeThreadReaction(threadId: number, userId: number, type: string): Promise<boolean> {
    const thread = this.threads.get(threadId);
    const user = this.users.get(userId);
    
    if (!thread || !user) {
      return false;
    }
    
    const reactionKey = `${userId}-${threadId}`;
    const existingReaction = this.threadReactions.get(reactionKey);
    
    if (!existingReaction || existingReaction !== type) {
      return false;
    }
    
    // Remove the reaction
    if (type === "LIKE") {
      thread.likesCount = Math.max(0, thread.likesCount - 1);
      
      // Update thread author's like count
      if (thread.userId !== userId) {
        const threadAuthor = this.users.get(thread.userId);
        if (threadAuthor) {
          this.updateUser(threadAuthor.id, {
            likesCount: Math.max(0, threadAuthor.likesCount - 1),
            points: Math.max(0, threadAuthor.points - 1) // Remove points
          });
        }
      }
    } else if (type === "DISLIKE") {
      thread.dislikesCount = Math.max(0, thread.dislikesCount - 1);
    } else if (type === "POTD") {
      thread.isPotd = false;
      
      // Update thread author's POTD count
      if (thread.userId !== userId) {
        const threadAuthor = this.users.get(thread.userId);
        if (threadAuthor) {
          this.updateUser(threadAuthor.id, {
            potdCount: Math.max(0, threadAuthor.potdCount - 1),
            points: Math.max(0, threadAuthor.points - 10) // Remove points
          });
        }
      }
    }
    
    this.threads.set(threadId, thread);
    this.threadReactions.delete(reactionKey);
    
    return true;
  }

  async removeReplyReaction(replyId: number, userId: number, type: string): Promise<boolean> {
    const reply = this.replies.get(replyId);
    const user = this.users.get(userId);
    
    if (!reply || !user) {
      return false;
    }
    
    const reactionKey = `${userId}-${replyId}`;
    const existingReaction = this.replyReactions.get(reactionKey);
    
    if (!existingReaction || existingReaction !== type) {
      return false;
    }
    
    // Remove the reaction
    if (type === "LIKE") {
      reply.likesCount = Math.max(0, reply.likesCount - 1);
      
      // Update reply author's like count
      if (reply.userId !== userId) {
        const replyAuthor = this.users.get(reply.userId);
        if (replyAuthor) {
          this.updateUser(replyAuthor.id, {
            likesCount: Math.max(0, replyAuthor.likesCount - 1),
            points: Math.max(0, replyAuthor.points - 1) // Remove points
          });
        }
      }
    } else if (type === "DISLIKE") {
      reply.dislikesCount = Math.max(0, reply.dislikesCount - 1);
    }
    
    this.replies.set(replyId, reply);
    this.replyReactions.delete(reactionKey);
    
    return true;
  }
  
  // Follow methods
  async followUser(followerId: number, followingId: number): Promise<boolean> {
    const follower = this.users.get(followerId);
    const following = this.users.get(followingId);
    
    if (!follower || !following || followerId === followingId) {
      return false;
    }
    
    const followKey = `${followerId}-${followingId}`;
    const alreadyFollowing = this.follows.has(followKey);
    
    if (alreadyFollowing) {
      return true;
    }
    
    this.follows.set(followKey, true);
    
    // Update follower counts
    this.updateUser(followerId, {
      followingCount: follower.followingCount + 1
    });
    
    this.updateUser(followingId, {
      followersCount: following.followersCount + 1,
      points: following.points + 2 // Award points for gaining a follower
    });
    
    // Create notification
    this.createNotification({
      userId: followingId,
      type: "FOLLOW",
      relatedUserId: followerId,
      message: "started following you"
    });
    
    return true;
  }

  async unfollowUser(followerId: number, followingId: number): Promise<boolean> {
    const follower = this.users.get(followerId);
    const following = this.users.get(followingId);
    
    if (!follower || !following) {
      return false;
    }
    
    const followKey = `${followerId}-${followingId}`;
    const alreadyFollowing = this.follows.has(followKey);
    
    if (!alreadyFollowing) {
      return false;
    }
    
    this.follows.delete(followKey);
    
    // Update follower counts
    this.updateUser(followerId, {
      followingCount: Math.max(0, follower.followingCount - 1)
    });
    
    this.updateUser(followingId, {
      followersCount: Math.max(0, following.followersCount - 1),
      points: Math.max(0, following.points - 2) // Remove points
    });
    
    return true;
  }

  async getFollowers(userId: number): Promise<User[]> {
    const followerIds = Array.from(this.follows.keys())
      .filter(key => {
        const [followerId, followingId] = key.split('-').map(id => parseInt(id));
        return followingId === userId;
      })
      .map(key => parseInt(key.split('-')[0]));
    
    return followerIds.map(id => this.users.get(id)).filter(Boolean) as User[];
  }

  async getFollowing(userId: number): Promise<User[]> {
    const followingIds = Array.from(this.follows.keys())
      .filter(key => {
        const [followerId, followingId] = key.split('-').map(id => parseInt(id));
        return followerId === userId;
      })
      .map(key => parseInt(key.split('-')[1]));
    
    return followingIds.map(id => this.users.get(id)).filter(Boolean) as User[];
  }
  
  // Notification methods
  async getNotifications(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    const id = this.notificationIdCounter++;
    const now = new Date();
    
    const notification: Notification = {
      id,
      ...notificationData,
      isRead: false,
      createdAt: now
    };
    
    this.notifications.set(id, notification);
    
    return notification;
  }

  async markNotificationAsRead(id: number): Promise<boolean> {
    const notification = this.notifications.get(id);
    
    if (!notification) {
      return false;
    }
    
    notification.isRead = true;
    this.notifications.set(id, notification);
    
    return true;
  }

  async markAllNotificationsAsRead(userId: number): Promise<boolean> {
    const userNotifications = Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId);
    
    userNotifications.forEach(notification => {
      notification.isRead = true;
      this.notifications.set(notification.id, notification);
    });
    
    return true;
  }
  
  // MMA Schedule methods
  async getMMAEvents(limit: number = 10, offset: number = 0): Promise<MMAEvent[]> {
    const events = Array.from(this.mmaEvents.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return events.slice(offset, offset + limit);
  }

  async getMMAEvent(id: string): Promise<MMAEvent | undefined> {
    return this.mmaEvents.get(id);
  }

  async getFights(eventId: string): Promise<Fight[]> {
    return Array.from(this.fights.values())
      .filter(fight => fight.eventId === eventId)
      .sort((a, b) => {
        // Sort by main card first, then by order
        if (a.isMainCard && !b.isMainCard) return -1;
        if (!a.isMainCard && b.isMainCard) return 1;
        return a.order - b.order;
      });
  }

  async saveMMAEvent(eventData: any): Promise<MMAEvent> {
    const now = new Date();
    
    const event: MMAEvent = {
      id: eventData.id,
      name: eventData.name,
      shortName: eventData.shortName || eventData.name,
      date: new Date(eventData.date),
      organization: eventData.organization,
      venue: eventData.venue,
      location: eventData.location,
      imageUrl: eventData.imageUrl,
      createdAt: now,
      updatedAt: now
    };
    
    this.mmaEvents.set(event.id, event);
    
    return event;
  }

  async saveFighter(fighterData: any): Promise<Fighter> {
    const now = new Date();
    
    const fighter: Fighter = {
      id: fighterData.id,
      name: fighterData.name,
      nickname: fighterData.nickname,
      record: fighterData.record,
      imageUrl: fighterData.imageUrl,
      createdAt: now,
      updatedAt: now
    };
    
    this.fighters.set(fighter.id, fighter);
    
    return fighter;
  }

  async saveFight(fightData: any): Promise<Fight> {
    const now = new Date();
    
    const fight: Fight = {
      id: fightData.id,
      eventId: fightData.eventId,
      fighter1Id: fightData.fighter1Id,
      fighter2Id: fightData.fighter2Id,
      weightClass: fightData.weightClass,
      isTitleFight: fightData.isTitleFight || false,
      isMainCard: fightData.isMainCard || false,
      order: fightData.order || 0,
      createdAt: now,
      updatedAt: now
    };
    
    this.fights.set(fight.id, fight);
    
    return fight;
  }
  
  // Helper methods
  private calculateUserStatus(points: number): string {
    if (points >= this.USER_STATUSES.HALL_OF_FAMER.minPoints) {
      return "HALL OF FAMER";
    } else if (points >= this.USER_STATUSES.CHAMPION.minPoints) {
      return "CHAMPION";
    } else if (points >= this.USER_STATUSES.CONTENDER.minPoints) {
      return "CONTENDER";
    } else if (points >= this.USER_STATUSES.RANKED_POSTER.minPoints) {
      return "RANKED POSTER";
    } else if (points >= this.USER_STATUSES.COMPETITOR.minPoints) {
      return "COMPETITOR";
    } else if (points >= this.USER_STATUSES.REGIONAL_POSTER.minPoints) {
      return "REGIONAL POSTER";
    } else {
      return "AMATEUR";
    }
  }

  private recalculateRankings(): void {
    // Sort users by points
    const sortedUsers = Array.from(this.users.values())
      .filter(user => user.role !== "PRO") // PROs are exempt from rankings
      .sort((a, b) => b.points - a.points);
    
    // Assign ranks (1-based)
    sortedUsers.forEach((user, index) => {
      // Handle ties (same points)
      if (index > 0 && user.points === sortedUsers[index - 1].points) {
        user.rank = sortedUsers[index - 1].rank; // Same rank for tied users
      } else {
        user.rank = index + 1;
      }
      
      this.users.set(user.id, user);
    });
  }
}

import { Pool } from '@neondatabase/serverless';
import { db } from './db';
import { eq, desc, asc, and, or, inArray, isNotNull, sql } from 'drizzle-orm';
import session from 'express-session';
import connectPg from 'connect-pg-simple';
import { pool } from './db';
import {
  users,
  threads,
  replies,
  polls,
  pollOptions,
  pollVotes,
  threadMedia,
  replyMedia,
  threadReactions,
  replyReactions,
  follows,
  notifications,
  mmaEvents,
  fighters,
  fights
} from '@shared/schema';

export class DatabaseStorage implements IStorage {
  sessionStore: any; // Using any for session store type
  
  constructor() {
    const PostgresSessionStore = connectPg(session);
    this.sessionStore = new PostgresSessionStore({ 
      pool,
      createTableIfMissing: true
    });
  }
  
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        updatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date()
        }
      })
      .returning();
    
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({
        ...userData,
        ...(userData.points !== undefined && { 
          status: this.calculateUserStatus(userData.points) 
        })
      })
      .where(eq(users.id, id))
      .returning();
    
    if (userData.points !== undefined) {
      await this.recalculateRankings();
    }
    
    return updatedUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    await db.delete(users).where(eq(users.id, id));
    return true;
  }

  async getTopUsers(limit: number): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.points)).limit(limit);
  }
  
  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }
  
  // Thread methods
  async getThread(id: number): Promise<Thread | undefined> {
    const [thread] = await db.select().from(threads).where(eq(threads.id, id));
    return thread;
  }

  async getThreadsByCategory(
    categoryId: string,
    sort: string = "recent",
    limit: number = 10,
    offset: number = 0
  ): Promise<Thread[]> {
    let query = db.select().from(threads);
    
    if (categoryId !== "all") {
      query = query.where(eq(threads.categoryId, categoryId));
    }
    
    // Sort threads
    switch (sort) {
      case "recent":
        query = query.orderBy(desc(threads.lastActivityAt));
        break;
      case "popular":
        query = query.orderBy(desc(threads.likesCount));
        break;
      case "new":
        query = query.orderBy(desc(threads.createdAt));
        break;
      default:
        query = query.orderBy(desc(threads.lastActivityAt));
    }
    
    // Get pinned threads first, then others
    const pinnedThreads = await db
      .select()
      .from(threads)
      .where(and(
        categoryId !== "all" ? eq(threads.categoryId, categoryId) : undefined,
        eq(threads.isPinned, true)
      ))
      .limit(limit);
    
    const normalThreads = await query
      .where(and(
        categoryId !== "all" ? eq(threads.categoryId, categoryId) : undefined,
        eq(threads.isPinned, false)
      ))
      .limit(limit - pinnedThreads.length)
      .offset(offset);
    
    return [...pinnedThreads, ...normalThreads];
  }

  async createThread(threadData: InsertThread): Promise<Thread> {
    const now = new Date();
    const [thread] = await db
      .insert(threads)
      .values({
        ...threadData,
        createdAt: now,
        updatedAt: now,
        lastActivityAt: now,
        viewCount: 0,
        likesCount: 0,
        dislikesCount: 0,
        repliesCount: 0,
        isPotd: false
      })
      .returning();
    
    // Increment user post count
    if (thread) {
      const user = await this.getUser(thread.userId);
      if (user) {
        await this.updateUser(user.id, {
          postsCount: user.postsCount + 1,
          points: user.points + 5 // Award points for creating a thread
        });
      }
    }
    
    return thread;
  }

  async updateThread(id: number, threadData: Partial<Thread>): Promise<Thread | undefined> {
    const [updatedThread] = await db
      .update(threads)
      .set({
        ...threadData,
        updatedAt: new Date()
      })
      .where(eq(threads.id, id))
      .returning();
    
    return updatedThread;
  }

  async deleteThread(id: number): Promise<boolean> {
    // Delete associated replies
    await db.delete(replies).where(eq(replies.threadId, id));
    
    // Delete thread media
    await db.delete(threadMedia).where(eq(threadMedia.threadId, id));
    
    // Find poll associated with thread
    const [poll] = await db.select().from(polls).where(eq(polls.threadId, id));
    
    if (poll) {
      // Delete poll options and votes
      await db.delete(pollOptions).where(eq(pollOptions.pollId, poll.id));
      await db.delete(pollVotes).where(eq(pollVotes.pollId, poll.id));
      
      // Delete the poll
      await db.delete(polls).where(eq(polls.id, poll.id));
    }
    
    // Delete thread reactions
    await db.delete(threadReactions).where(eq(threadReactions.threadId, id));
    
    // Delete the thread
    await db.delete(threads).where(eq(threads.id, id));
    
    return true;
  }

  async incrementThreadView(id: number): Promise<boolean> {
    await db
      .update(threads)
      .set({
        viewCount: sql`${threads.viewCount} + 1`
      })
      .where(eq(threads.id, id));
    
    return true;
  }
  
  // Reply methods
  async getReply(id: number): Promise<Reply | undefined> {
    const [reply] = await db.select().from(replies).where(eq(replies.id, id));
    return reply;
  }

  async getRepliesByThread(threadId: number): Promise<Reply[]> {
    // First, get all parent replies (no parentReplyId)
    const parentReplies = await db
      .select()
      .from(replies)
      .where(and(
        eq(replies.threadId, threadId),
        sql`${replies.parentReplyId} IS NULL`
      ))
      .orderBy(asc(replies.createdAt));
    
    // Then, get all child replies with parentReplyId
    const childReplies = await db
      .select()
      .from(replies)
      .where(and(
        eq(replies.threadId, threadId),
        sql`${replies.parentReplyId} IS NOT NULL`
      ))
      .orderBy(asc(replies.createdAt));
    
    // Sort them in a parent-child order
    const allReplies = [...parentReplies];
    
    for (const parent of parentReplies) {
      const children = childReplies.filter(child => child.parentReplyId === parent.id);
      allReplies.push(...children);
    }
    
    return allReplies;
  }

  async createReply(replyData: InsertReply): Promise<Reply> {
    const now = new Date();
    const [reply] = await db
      .insert(replies)
      .values({
        ...replyData,
        createdAt: now,
        updatedAt: now,
        likesCount: 0,
        dislikesCount: 0
      })
      .returning();
    
    // Update thread last activity and reply count
    if (reply) {
      const thread = await this.getThread(reply.threadId);
      if (thread) {
        await this.updateThread(thread.id, {
          lastActivityAt: now,
          repliesCount: thread.repliesCount + 1
        });
        
        // Create notification for thread author if it's not the same user
        if (thread.userId !== reply.userId) {
          await this.createNotification({
            userId: thread.userId,
            type: "REPLY",
            relatedUserId: reply.userId,
            threadId: thread.id,
            replyId: reply.id,
            message: "replied to your post"
          });
        }
        
        // If this is a reply to another reply, notify that user
        if (reply.parentReplyId) {
          const parentReply = await this.getReply(reply.parentReplyId);
          if (parentReply && parentReply.userId !== reply.userId) {
            await this.createNotification({
              userId: parentReply.userId,
              type: "REPLY",
              relatedUserId: reply.userId,
              threadId: thread.id,
              replyId: reply.id,
              message: "replied to your comment"
            });
          }
        }
      }
      
      // Increment user post count
      const user = await this.getUser(reply.userId);
      if (user) {
        await this.updateUser(user.id, {
          postsCount: user.postsCount + 1,
          points: user.points + 2 // Award points for creating a reply
        });
      }
    }
    
    return reply;
  }

  async updateReply(id: number, replyData: Partial<Reply>): Promise<Reply | undefined> {
    const [updatedReply] = await db
      .update(replies)
      .set({
        ...replyData,
        updatedAt: new Date()
      })
      .where(eq(replies.id, id))
      .returning();
    
    return updatedReply;
  }

  async deleteReply(id: number): Promise<boolean> {
    // Delete child replies
    await db.delete(replies).where(eq(replies.parentReplyId, id));
    
    // Delete reply media
    await db.delete(replyMedia).where(eq(replyMedia.replyId, id));
    
    // Delete reply reactions
    await db.delete(replyReactions).where(eq(replyReactions.replyId, id));
    
    // Delete the reply
    await db.delete(replies).where(eq(replies.id, id));
    
    return true;
  }
  
  // Poll methods
  async getPoll(id: number): Promise<Poll | undefined> {
    const [poll] = await db.select().from(polls).where(eq(polls.id, id));
    return poll;
  }

  async getPollByThread(threadId: number): Promise<Poll | undefined> {
    const [poll] = await db.select().from(polls).where(eq(polls.threadId, threadId));
    return poll;
  }

  async createPoll(pollData: InsertPoll, optionTexts: string[]): Promise<Poll> {
    const [poll] = await db
      .insert(polls)
      .values({
        ...pollData,
        createdAt: new Date(),
        votesCount: 0
      })
      .returning();
    
    // Create poll options
    for (const optionText of optionTexts) {
      await db
        .insert(pollOptions)
        .values({
          pollId: poll.id,
          text: optionText,
          votesCount: 0
        });
    }
    
    return poll;
  }

  async votePoll(pollId: number, optionId: number, userId: number): Promise<boolean> {
    // Check if user has already voted
    const [existingVote] = await db
      .select()
      .from(pollVotes)
      .where(and(
        eq(pollVotes.pollId, pollId),
        eq(pollVotes.userId, userId)
      ));
    
    if (existingVote) {
      // User has already voted, handle appropriately (e.g., error or update)
      return false;
    }
    
    // Record the vote
    await db
      .insert(pollVotes)
      .values({
        pollId,
        pollOptionId: optionId,
        userId,
        createdAt: new Date()
      });
    
    // Increment option votes count
    await db
      .update(pollOptions)
      .set({
        votesCount: sql`${pollOptions.votesCount} + 1`
      })
      .where(eq(pollOptions.id, optionId));
    
    // Increment poll votes count
    await db
      .update(polls)
      .set({
        votesCount: sql`${polls.votesCount} + 1`
      })
      .where(eq(polls.id, pollId));
    
    return true;
  }
  
  // Media methods
  async getMedia(id: number): Promise<Media | undefined> {
    const [media] = await db.select().from(threadMedia).where(eq(threadMedia.id, id));
    return media;
  }

  async getMediaByThread(threadId: number): Promise<Media[]> {
    return db.select().from(threadMedia).where(eq(threadMedia.threadId, threadId));
  }

  async getMediaByReply(replyId: number): Promise<Media[]> {
    return db.select().from(replyMedia).where(eq(replyMedia.replyId, replyId));
  }

  async createThreadMedia(mediaData: InsertMedia): Promise<Media> {
    const [media] = await db
      .insert(threadMedia)
      .values({
        ...mediaData,
        createdAt: new Date()
      })
      .returning();
    
    return media;
  }
  
  // Reaction methods
  async likeThread(threadId: number, userId: number): Promise<boolean> {
    // Check for existing reaction
    const [existingReaction] = await db
      .select()
      .from(threadReactions)
      .where(and(
        eq(threadReactions.threadId, threadId),
        eq(threadReactions.userId, userId)
      ));
    
    if (existingReaction) {
      if (existingReaction.type === "LIKE") {
        // Already liked, remove the like
        await this.removeThreadReaction(threadId, userId, "LIKE");
        return false;
      } else {
        // Has another reaction, update it
        await db
          .update(threadReactions)
          .set({
            type: "LIKE",
            createdAt: new Date()
          })
          .where(eq(threadReactions.id, existingReaction.id));
        
        // Update thread counts
        const thread = await this.getThread(threadId);
        if (thread) {
          await this.updateThread(threadId, {
            likesCount: thread.likesCount + 1,
            dislikesCount: existingReaction.type === "DISLIKE" ? thread.dislikesCount - 1 : thread.dislikesCount
          });
          
          // Update user likes count
          const user = await this.getUser(thread.userId);
          if (user) {
            await this.updateUser(user.id, {
              likesCount: user.likesCount + 1,
              points: user.points + 1 // Award point for getting a like
            });
          }
          
          // Create notification
          if (thread.userId !== userId) {
            await this.createNotification({
              userId: thread.userId,
              type: "LIKE",
              relatedUserId: userId,
              threadId,
              message: "liked your post"
            });
          }
        }
        
        return true;
      }
    } else {
      // No existing reaction, create like
      await db
        .insert(threadReactions)
        .values({
          threadId,
          userId,
          type: "LIKE",
          createdAt: new Date()
        });
      
      // Update thread like count
      const thread = await this.getThread(threadId);
      if (thread) {
        await this.updateThread(threadId, {
          likesCount: thread.likesCount + 1
        });
        
        // Update user likes count
        const user = await this.getUser(thread.userId);
        if (user) {
          await this.updateUser(user.id, {
            likesCount: user.likesCount + 1,
            points: user.points + 1 // Award point for getting a like
          });
        }
        
        // Create notification
        if (thread.userId !== userId) {
          await this.createNotification({
            userId: thread.userId,
            type: "LIKE",
            relatedUserId: userId,
            threadId,
            message: "liked your post"
          });
        }
      }
      
      return true;
    }
  }

  async dislikeThread(threadId: number, userId: number): Promise<boolean> {
    // Check for existing reaction
    const [existingReaction] = await db
      .select()
      .from(threadReactions)
      .where(and(
        eq(threadReactions.threadId, threadId),
        eq(threadReactions.userId, userId)
      ));
    
    if (existingReaction) {
      if (existingReaction.type === "DISLIKE") {
        // Already disliked, remove the dislike
        await this.removeThreadReaction(threadId, userId, "DISLIKE");
        return false;
      } else {
        // Has another reaction, update it
        await db
          .update(threadReactions)
          .set({
            type: "DISLIKE",
            createdAt: new Date()
          })
          .where(eq(threadReactions.id, existingReaction.id));
        
        // Update thread counts
        const thread = await this.getThread(threadId);
        if (thread) {
          await this.updateThread(threadId, {
            dislikesCount: thread.dislikesCount + 1,
            likesCount: existingReaction.type === "LIKE" ? thread.likesCount - 1 : thread.likesCount
          });
          
          // Update user likes count if needed
          if (existingReaction.type === "LIKE") {
            const user = await this.getUser(thread.userId);
            if (user) {
              await this.updateUser(user.id, {
                likesCount: user.likesCount - 1,
                points: user.points - 1 // Remove point for lost like
              });
            }
          }
        }
        
        return true;
      }
    } else {
      // No existing reaction, create dislike
      await db
        .insert(threadReactions)
        .values({
          threadId,
          userId,
          type: "DISLIKE",
          createdAt: new Date()
        });
      
      // Update thread dislike count
      const thread = await this.getThread(threadId);
      if (thread) {
        await this.updateThread(threadId, {
          dislikesCount: thread.dislikesCount + 1
        });
      }
      
      return true;
    }
  }

  async potdThread(threadId: number, userId: number): Promise<boolean> {
    // Check if user is ADMIN or MODERATOR
    const user = await this.getUser(userId);
    if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) {
      return false;
    }
    
    // Check for existing POTD
    const [existingPotd] = await db
      .select()
      .from(threadReactions)
      .where(and(
        eq(threadReactions.type, "POTD"),
        eq(threadReactions.userId, userId)
      ));
    
    if (existingPotd) {
      if (existingPotd.threadId === threadId) {
        // Already POTD, remove it
        await this.removeThreadReaction(threadId, userId, "POTD");
        
        // Update thread POTD status
        await this.updateThread(threadId, {
          isPotd: false
        });
        
        return false;
      } else {
        // Remove POTD from old thread
        await this.removeThreadReaction(existingPotd.threadId, userId, "POTD");
        
        // Update old thread POTD status
        await this.updateThread(existingPotd.threadId, {
          isPotd: false
        });
      }
    }
    
    // Create POTD reaction
    await db
      .insert(threadReactions)
      .values({
        threadId,
        userId,
        type: "POTD",
        createdAt: new Date()
      });
    
    // Update thread POTD status
    await this.updateThread(threadId, {
      isPotd: true
    });
    
    // Award points to thread creator
    const thread = await this.getThread(threadId);
    if (thread) {
      const threadUser = await this.getUser(thread.userId);
      if (threadUser) {
        await this.updateUser(threadUser.id, {
          potdCount: threadUser.potdCount + 1,
          points: threadUser.points + 20 // Award points for POTD
        });
        
        // Create notification
        if (thread.userId !== userId) {
          await this.createNotification({
            userId: thread.userId,
            type: "POTD",
            relatedUserId: userId,
            threadId,
            message: "selected your post as Post of the Day!"
          });
        }
      }
    }
    
    return true;
  }

  async likeReply(replyId: number, userId: number): Promise<boolean> {
    // Check for existing reaction
    const [existingReaction] = await db
      .select()
      .from(replyReactions)
      .where(and(
        eq(replyReactions.replyId, replyId),
        eq(replyReactions.userId, userId)
      ));
    
    if (existingReaction) {
      if (existingReaction.type === "LIKE") {
        // Already liked, remove the like
        await this.removeReplyReaction(replyId, userId, "LIKE");
        return false;
      } else {
        // Has another reaction, update it
        await db
          .update(replyReactions)
          .set({
            type: "LIKE",
            createdAt: new Date()
          })
          .where(eq(replyReactions.id, existingReaction.id));
        
        // Update reply counts
        const reply = await this.getReply(replyId);
        if (reply) {
          await this.updateReply(replyId, {
            likesCount: reply.likesCount + 1,
            dislikesCount: reply.dislikesCount - 1
          });
          
          // Update user points
          const user = await this.getUser(reply.userId);
          if (user) {
            await this.updateUser(user.id, {
              points: user.points + 1 // Award point for getting a like
            });
          }
          
          // Create notification
          if (reply.userId !== userId) {
            const thread = await this.getThread(reply.threadId);
            if (thread) {
              await this.createNotification({
                userId: reply.userId,
                type: "LIKE",
                relatedUserId: userId,
                threadId: reply.threadId,
                replyId,
                message: "liked your reply"
              });
            }
          }
        }
        
        return true;
      }
    } else {
      // No existing reaction, create like
      await db
        .insert(replyReactions)
        .values({
          replyId,
          userId,
          type: "LIKE",
          createdAt: new Date()
        });
      
      // Update reply like count
      const reply = await this.getReply(replyId);
      if (reply) {
        await this.updateReply(replyId, {
          likesCount: reply.likesCount + 1
        });
        
        // Update user points
        const user = await this.getUser(reply.userId);
        if (user) {
          await this.updateUser(user.id, {
            points: user.points + 1 // Award point for getting a like
          });
        }
        
        // Create notification
        if (reply.userId !== userId) {
          const thread = await this.getThread(reply.threadId);
          if (thread) {
            await this.createNotification({
              userId: reply.userId,
              type: "LIKE",
              relatedUserId: userId,
              threadId: reply.threadId,
              replyId,
              message: "liked your reply"
            });
          }
        }
      }
      
      return true;
    }
  }

  async dislikeReply(replyId: number, userId: number): Promise<boolean> {
    // Similar implementation to dislikeThread
    // Check for existing reaction
    const [existingReaction] = await db
      .select()
      .from(replyReactions)
      .where(and(
        eq(replyReactions.replyId, replyId),
        eq(replyReactions.userId, userId)
      ));
    
    if (existingReaction) {
      if (existingReaction.type === "DISLIKE") {
        // Already disliked, remove the dislike
        await this.removeReplyReaction(replyId, userId, "DISLIKE");
        return false;
      } else {
        // Has another reaction, update it
        await db
          .update(replyReactions)
          .set({
            type: "DISLIKE",
            createdAt: new Date()
          })
          .where(eq(replyReactions.id, existingReaction.id));
        
        // Update reply counts
        const reply = await this.getReply(replyId);
        if (reply) {
          await this.updateReply(replyId, {
            dislikesCount: reply.dislikesCount + 1,
            likesCount: reply.likesCount - 1
          });
          
          // Update user points if needed
          if (existingReaction.type === "LIKE") {
            const user = await this.getUser(reply.userId);
            if (user) {
              await this.updateUser(user.id, {
                points: user.points - 1 // Remove point for lost like
              });
            }
          }
        }
        
        return true;
      }
    } else {
      // No existing reaction, create dislike
      await db
        .insert(replyReactions)
        .values({
          replyId,
          userId,
          type: "DISLIKE",
          createdAt: new Date()
        });
      
      // Update reply dislike count
      const reply = await this.getReply(replyId);
      if (reply) {
        await this.updateReply(replyId, {
          dislikesCount: reply.dislikesCount + 1
        });
      }
      
      return true;
    }
  }

  async removeThreadReaction(threadId: number, userId: number, type: string): Promise<boolean> {
    await db
      .delete(threadReactions)
      .where(and(
        eq(threadReactions.threadId, threadId),
        eq(threadReactions.userId, userId),
        eq(threadReactions.type, type)
      ));
    
    // Update thread counts
    const thread = await this.getThread(threadId);
    if (thread) {
      if (type === "LIKE") {
        await this.updateThread(threadId, {
          likesCount: Math.max(0, thread.likesCount - 1)
        });
        
        // Update user likes count
        const user = await this.getUser(thread.userId);
        if (user) {
          await this.updateUser(user.id, {
            likesCount: Math.max(0, user.likesCount - 1),
            points: Math.max(0, user.points - 1) // Remove point for lost like
          });
        }
      } else if (type === "DISLIKE") {
        await this.updateThread(threadId, {
          dislikesCount: Math.max(0, thread.dislikesCount - 1)
        });
      } else if (type === "POTD") {
        await this.updateThread(threadId, {
          isPotd: false
        });
        
        // Update user POTD count
        const user = await this.getUser(thread.userId);
        if (user) {
          await this.updateUser(user.id, {
            potdCount: Math.max(0, user.potdCount - 1),
            points: Math.max(0, user.points - 20) // Remove points for lost POTD
          });
        }
      }
    }
    
    return true;
  }

  async removeReplyReaction(replyId: number, userId: number, type: string): Promise<boolean> {
    await db
      .delete(replyReactions)
      .where(and(
        eq(replyReactions.replyId, replyId),
        eq(replyReactions.userId, userId),
        eq(replyReactions.type, type)
      ));
    
    // Update reply counts
    const reply = await this.getReply(replyId);
    if (reply) {
      if (type === "LIKE") {
        await this.updateReply(replyId, {
          likesCount: Math.max(0, reply.likesCount - 1)
        });
        
        // Update user points
        const user = await this.getUser(reply.userId);
        if (user) {
          await this.updateUser(user.id, {
            points: Math.max(0, user.points - 1) // Remove point for lost like
          });
        }
      } else if (type === "DISLIKE") {
        await this.updateReply(replyId, {
          dislikesCount: Math.max(0, reply.dislikesCount - 1)
        });
      }
    }
    
    return true;
  }
  
  // Follow methods
  async followUser(followerId: number, followingId: number): Promise<boolean> {
    // Check if already following
    const [existingFollow] = await db
      .select()
      .from(follows)
      .where(and(
        eq(follows.followerId, followerId),
        eq(follows.followingId, followingId)
      ));
    
    if (existingFollow) {
      return false; // Already following
    }
    
    // Create follow relationship
    await db
      .insert(follows)
      .values({
        followerId,
        followingId,
        createdAt: new Date()
      });
    
    // Update follower counts
    const follower = await this.getUser(followerId);
    const following = await this.getUser(followingId);
    
    if (follower) {
      await this.updateUser(followerId, {
        followingCount: follower.followingCount + 1
      });
    }
    
    if (following) {
      await this.updateUser(followingId, {
        followersCount: following.followersCount + 1
      });
      
      // Create notification
      await this.createNotification({
        userId: followingId,
        type: "FOLLOW",
        relatedUserId: followerId,
        message: "started following you"
      });
    }
    
    return true;
  }

  async unfollowUser(followerId: number, followingId: number): Promise<boolean> {
    // Check if following
    const [existingFollow] = await db
      .select()
      .from(follows)
      .where(and(
        eq(follows.followerId, followerId),
        eq(follows.followingId, followingId)
      ));
    
    if (!existingFollow) {
      return false; // Not following
    }
    
    // Remove follow relationship
    await db
      .delete(follows)
      .where(and(
        eq(follows.followerId, followerId),
        eq(follows.followingId, followingId)
      ));
    
    // Update follower counts
    const follower = await this.getUser(followerId);
    const following = await this.getUser(followingId);
    
    if (follower) {
      await this.updateUser(followerId, {
        followingCount: Math.max(0, follower.followingCount - 1)
      });
    }
    
    if (following) {
      await this.updateUser(followingId, {
        followersCount: Math.max(0, following.followersCount - 1)
      });
    }
    
    return true;
  }

  async getFollowers(userId: number): Promise<User[]> {
    const followers = await db
      .select({
        follower: users
      })
      .from(follows)
      .innerJoin(users, eq(follows.followerId, users.id))
      .where(eq(follows.followingId, userId));
    
    return followers.map(f => f.follower);
  }

  async getFollowing(userId: number): Promise<User[]> {
    const following = await db
      .select({
        following: users
      })
      .from(follows)
      .innerJoin(users, eq(follows.followingId, users.id))
      .where(eq(follows.followerId, userId));
    
    return following.map(f => f.following);
  }
  
  // Notification methods
  async getNotifications(userId: number): Promise<Notification[]> {
    return db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values({
        ...notificationData,
        isRead: false,
        createdAt: new Date()
      })
      .returning();
    
    return notification;
  }

  async markNotificationAsRead(id: number): Promise<boolean> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
    
    return true;
  }

  async markAllNotificationsAsRead(userId: number): Promise<boolean> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
    
    return true;
  }
  
  // MMA Schedule methods
  async getMMAEvents(limit: number = 10, offset: number = 0): Promise<MMAEvent[]> {
    return db
      .select()
      .from(mmaEvents)
      .orderBy(asc(mmaEvents.date))
      .limit(limit)
      .offset(offset);
  }

  async getMMAEvent(id: string): Promise<MMAEvent | undefined> {
    const [event] = await db.select().from(mmaEvents).where(eq(mmaEvents.id, id));
    return event;
  }

  async getFights(eventId: string): Promise<Fight[]> {
    const fightsData = await db
      .select({
        fight: fights,
        fighter1: fighters,
        fighter2: fighters
      })
      .from(fights)
      .innerJoin(fighters.as('fighter1'), eq(fights.fighter1Id, fighters.as('fighter1').id))
      .innerJoin(fighters.as('fighter2'), eq(fights.fighter2Id, fighters.as('fighter2').id))
      .where(eq(fights.eventId, eventId))
      .orderBy(asc(fights.order));
    
    return fightsData.map(f => ({
      ...f.fight,
      fighter1: f.fighter1,
      fighter2: f.fighter2
    }));
  }

  async saveMMAEvent(eventData: any): Promise<MMAEvent> {
    const [event] = await db
      .insert(mmaEvents)
      .values({
        id: eventData.id,
        name: eventData.name,
        shortName: eventData.shortName,
        date: new Date(eventData.date),
        organization: eventData.organization,
        venue: eventData.venue,
        location: eventData.location,
        imageUrl: eventData.imageUrl,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: mmaEvents.id,
        set: {
          name: eventData.name,
          shortName: eventData.shortName,
          date: new Date(eventData.date),
          organization: eventData.organization,
          venue: eventData.venue,
          location: eventData.location,
          imageUrl: eventData.imageUrl,
          updatedAt: new Date()
        }
      })
      .returning();
    
    return event;
  }

  async saveFighter(fighterData: any): Promise<Fighter> {
    const [fighter] = await db
      .insert(fighters)
      .values({
        id: fighterData.id,
        name: fighterData.name,
        nickname: fighterData.nickname || null,
        record: fighterData.record || null,
        imageUrl: fighterData.imageUrl || null,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: fighters.id,
        set: {
          name: fighterData.name,
          nickname: fighterData.nickname || null,
          record: fighterData.record || null,
          imageUrl: fighterData.imageUrl || null,
          updatedAt: new Date()
        }
      })
      .returning();
    
    return fighter;
  }

  async saveFight(fightData: any): Promise<Fight> {
    const [fight] = await db
      .insert(fights)
      .values({
        id: fightData.id,
        eventId: fightData.eventId,
        fighter1Id: fightData.fighter1Id,
        fighter2Id: fightData.fighter2Id,
        weightClass: fightData.weightClass,
        isTitleFight: fightData.isTitleFight || false,
        isMainCard: fightData.isMainCard || false,
        order: fightData.order,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: fights.id,
        set: {
          eventId: fightData.eventId,
          fighter1Id: fightData.fighter1Id,
          fighter2Id: fightData.fighter2Id,
          weightClass: fightData.weightClass,
          isTitleFight: fightData.isTitleFight || false,
          isMainCard: fightData.isMainCard || false,
          order: fightData.order,
          updatedAt: new Date()
        }
      })
      .returning();
    
    return fight;
  }
  
  // Helper methods
  private calculateUserStatus(points: number): string {
    if (points >= 10000) return "HALL OF FAMER";
    if (points >= 5000) return "CHAMPION";
    if (points >= 1000) return "CONTENDER";
    if (points >= 500) return "RANKED_POSTER";
    if (points >= 100) return "COMPETITOR";
    if (points >= 50) return "REGIONAL_POSTER";
    return "AMATEUR";
  }

  private async recalculateRankings(): Promise<void> {
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
  }
}

// Use database storage implementation
export const storage = new DatabaseStorage();
