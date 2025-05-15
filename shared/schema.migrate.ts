import { pgTable, text, serial, integer, boolean, timestamp, json, varchar, jsonb, index } from "drizzle-orm/pg-core";

// First, create tables without foreign key constraints
export const users = pgTable("users", {
  id: text("id").primaryKey().notNull(),
  username: text("username").unique().notNull(),
  password: text("password"),
  email: text("email").unique(),
  avatar: text("avatar"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  bio: text("bio"),
  profileImageUrl: text("profile_image_url"),
  updatedAt: timestamp("updated_at").defaultNow(),
  role: text("role").notNull().default("USER"),
  status: text("status").notNull().default("AMATEUR"),
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

export const categories = pgTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  count: integer("count").notNull().default(0),
});

export const threads = pgTable("threads", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  userId: text("user_id").notNull(),
  categoryId: text("category_id").notNull(),
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

export const replies = pgTable("replies", {
  id: text("id").primaryKey(),
  threadId: text("thread_id").notNull(),
  userId: text("user_id").notNull(),
  content: text("content").notNull(),
  parentReplyId: text("parent_reply_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  likesCount: integer("likes_count").notNull().default(0),
  dislikesCount: integer("dislikes_count").notNull().default(0),
});

export const notifications = pgTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  type: text("type").notNull(),
  relatedUserId: text("related_user_id"),
  threadId: text("thread_id"),
  replyId: text("reply_id"),
  message: text("message"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}); 