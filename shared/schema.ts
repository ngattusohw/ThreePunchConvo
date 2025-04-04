import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  avatar: text("avatar"),
  role: text("role").notNull().default("USER"), // USER, MODERATOR, ADMIN, PRO
  status: text("status").notNull().default("AMATEUR"), // AMATEUR, REGIONAL_POSTER, COMPETITOR, RANKED_POSTER, CONTENDER, CHAMPION, HALL_OF_FAMER
  createdAt: timestamp("created_at").notNull().defaultNow(),
  isOnline: boolean("is_online").notNull().default(false),
  lastActive: timestamp("last_active"),
  points: integer("points").notNull().default(0),
  rank: integer("rank"),
  postsCount: integer("posts_count").notNull().default(0),
  likesCount: integer("likes_count").notNull().default(0),
  potdCount: integer("potd_count").notNull().default(0),
  followersCount: integer("followers_count").notNull().default(0),
  followingCount: integer("following_count").notNull().default(0),
  socialLinks: json("social_links").$type<Record<string, string>>(),
});

// Forum Categories
export const categories = pgTable("categories", {
  id: text("id").primaryKey(), // e.g., "general", "ufc", etc.
  name: text("name").notNull(),
  description: text("description").notNull(),
  count: integer("count").notNull().default(0),
});

// Forum threads
export const threads = pgTable("threads", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  userId: integer("user_id").notNull().references(() => users.id),
  categoryId: text("category_id").notNull().references(() => categories.id),
  isPinned: boolean("is_pinned").notNull().default(false),
  isLocked: boolean("is_locked").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  lastActivityAt: timestamp("last_activity_at").notNull().defaultNow(),
  viewCount: integer("view_count").notNull().default(0),
  likesCount: integer("likes_count").notNull().default(0),
  dislikesCount: integer("dislikes_count").notNull().default(0),
  repliesCount: integer("replies_count").notNull().default(0),
  isPotd: boolean("is_potd").notNull().default(false),
});

// Thread media
export const threadMedia = pgTable("thread_media", {
  id: serial("id").primaryKey(),
  threadId: integer("thread_id").notNull().references(() => threads.id),
  type: text("type").notNull(), // IMAGE, GIF
  url: text("url").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Polls
export const polls = pgTable("polls", {
  id: serial("id").primaryKey(),
  threadId: integer("thread_id").notNull().references(() => threads.id),
  question: text("question").notNull(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  votesCount: integer("votes_count").notNull().default(0),
});

// Poll options
export const pollOptions = pgTable("poll_options", {
  id: serial("id").primaryKey(),
  pollId: integer("poll_id").notNull().references(() => polls.id),
  text: text("text").notNull(),
  votesCount: integer("votes_count").notNull().default(0),
});

// Poll votes
export const pollVotes = pgTable("poll_votes", {
  id: serial("id").primaryKey(),
  pollId: integer("poll_id").notNull().references(() => polls.id),
  pollOptionId: integer("poll_option_id").notNull().references(() => pollOptions.id),
  userId: integer("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Thread replies
export const replies = pgTable("replies", {
  id: serial("id").primaryKey(),
  threadId: integer("thread_id").notNull().references(() => threads.id),
  userId: integer("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  parentReplyId: integer("parent_reply_id").references(() => replies.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  likesCount: integer("likes_count").notNull().default(0),
  dislikesCount: integer("dislikes_count").notNull().default(0),
});

// Reply media
export const replyMedia = pgTable("reply_media", {
  id: serial("id").primaryKey(),
  replyId: integer("reply_id").notNull().references(() => replies.id),
  type: text("type").notNull(), // IMAGE, GIF
  url: text("url").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Thread reactions (likes, dislikes, POTD)
export const threadReactions = pgTable("thread_reactions", {
  id: serial("id").primaryKey(),
  threadId: integer("thread_id").notNull().references(() => threads.id),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // LIKE, DISLIKE, POTD
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Reply reactions (likes, dislikes)
export const replyReactions = pgTable("reply_reactions", {
  id: serial("id").primaryKey(),
  replyId: integer("reply_id").notNull().references(() => replies.id),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // LIKE, DISLIKE
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// User follows
export const follows = pgTable("follows", {
  id: serial("id").primaryKey(),
  followerId: integer("follower_id").notNull().references(() => users.id),
  followingId: integer("following_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Notifications
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // REPLY, MENTION, LIKE, SYSTEM, FOLLOW
  relatedUserId: integer("related_user_id").references(() => users.id),
  threadId: integer("thread_id").references(() => threads.id),
  replyId: integer("reply_id").references(() => replies.id),
  message: text("message"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// MMA Events
export const mmaEvents = pgTable("mma_events", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  shortName: text("short_name").notNull(),
  date: timestamp("date").notNull(),
  organization: text("organization").notNull(),
  venue: text("venue").notNull(),
  location: text("location").notNull(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// MMA Fighters
export const fighters = pgTable("fighters", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  nickname: text("nickname"),
  record: text("record"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// MMA Fights
export const fights = pgTable("fights", {
  id: text("id").primaryKey(),
  eventId: text("event_id").notNull().references(() => mmaEvents.id),
  fighter1Id: text("fighter1_id").notNull().references(() => fighters.id),
  fighter2Id: text("fighter2_id").notNull().references(() => fighters.id),
  weightClass: text("weight_class").notNull(),
  isTitleFight: boolean("is_title_fight").notNull().default(false),
  isMainCard: boolean("is_main_card").notNull().default(false),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  points: true,
  rank: true,
  postsCount: true,
  likesCount: true,
  potdCount: true,
  followersCount: true,
  followingCount: true,
});

export const insertThreadSchema = createInsertSchema(threads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastActivityAt: true,
  viewCount: true,
  likesCount: true,
  dislikesCount: true,
  repliesCount: true,
  isPotd: true,
});

export const insertReplySchema = createInsertSchema(replies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  likesCount: true,
  dislikesCount: true,
});

export const insertPollSchema = createInsertSchema(polls).omit({
  id: true,
  createdAt: true,
  votesCount: true,
});

export const insertPollOptionSchema = createInsertSchema(pollOptions).omit({
  id: true,
  votesCount: true,
});

export const insertMediaSchema = createInsertSchema(threadMedia).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  isRead: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Thread = typeof threads.$inferSelect;
export type InsertThread = z.infer<typeof insertThreadSchema>;

export type Reply = typeof replies.$inferSelect;
export type InsertReply = z.infer<typeof insertReplySchema>;

export type Poll = typeof polls.$inferSelect;
export type InsertPoll = z.infer<typeof insertPollSchema>;

export type PollOption = typeof pollOptions.$inferSelect;
export type InsertPollOption = z.infer<typeof insertPollOptionSchema>;

export type Media = typeof threadMedia.$inferSelect;
export type InsertMedia = z.infer<typeof insertMediaSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type MMAEvent = typeof mmaEvents.$inferSelect;
export type Fighter = typeof fighters.$inferSelect;
export type Fight = typeof fights.$inferSelect;
