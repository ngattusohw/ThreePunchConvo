import { sql } from "drizzle-orm";
import { categories } from "@shared/schema";

const FORUM_CATEGORIES = [
  {
    id: "general",
    name: "General Discussion",
    description: "The place for all things MMA that don't fit elsewhere",
    count: 24,
  },
  {
    id: "ufc",
    name: "UFC",
    description: "Discussion about the Ultimate Fighting Championship",
    count: 136,
  },
  {
    id: "bellator",
    name: "Bellator",
    description: "Talk about Bellator MMA events and fighters",
    count: 41,
  },
  {
    id: "one",
    name: "ONE Championship",
    description: "Discussion about ONE Championship events and fighters",
    count: 28,
  },
  {
    id: "pfl",
    name: "PFL",
    description: "Professional Fighters League discussion",
    count: 15,
  },
  {
    id: "boxing",
    name: "Boxing",
    description: "Discussion about boxing events and fighters",
    count: 47,
  },
  {
    id: "techniques",
    name: "Fight Techniques",
    description: "Analysis and discussion of fighting techniques",
    count: 32,
  },
  {
    id: "offtopic",
    name: "Off Topic",
    description: "Non-MMA discussion for community members",
    count: 94,
  },
];

export async function up(db: any) {
  // Create categories table if it doesn't exist
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      count INTEGER NOT NULL DEFAULT 0
    )
  `);

  // Create users table if it doesn't exist
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT,
      email TEXT UNIQUE,
      external_id TEXT UNIQUE,
      stripe_id TEXT UNIQUE,
      plan_type TEXT NOT NULL DEFAULT 'FREE',
      avatar TEXT,
      first_name TEXT,
      last_name TEXT,
      bio TEXT,
      profile_image_url TEXT,
      updated_at TIMESTAMP DEFAULT NOW(),
      role TEXT NOT NULL DEFAULT 'USER',
      status TEXT NOT NULL DEFAULT 'AMATEUR',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      is_online BOOLEAN NOT NULL DEFAULT FALSE,
      last_active TIMESTAMP,
      points INTEGER NOT NULL DEFAULT 0,
      rank INTEGER,
      posts_count INTEGER NOT NULL DEFAULT 0,
      likes_count INTEGER NOT NULL DEFAULT 0,
      potd_count INTEGER NOT NULL DEFAULT 0,
      followers_count INTEGER NOT NULL DEFAULT 0,
      following_count INTEGER NOT NULL DEFAULT 0,
      social_links JSONB
    )
  `);

  // Create threads table if it doesn't exist
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS threads (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      user_id TEXT NOT NULL REFERENCES users(id),
      category_id TEXT NOT NULL REFERENCES categories(id),
      is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
      is_locked BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      last_activity_at TIMESTAMP NOT NULL DEFAULT NOW(),
      view_count INTEGER NOT NULL DEFAULT 0,
      likes_count INTEGER NOT NULL DEFAULT 0,
      dislikes_count INTEGER NOT NULL DEFAULT 0,
      replies_count INTEGER NOT NULL DEFAULT 0,
      is_potd BOOLEAN NOT NULL DEFAULT FALSE
    )
  `);

  // Create replies table if it doesn't exist
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS replies (
      id TEXT PRIMARY KEY,
      thread_id TEXT NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      parent_reply_id TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      likes_count INTEGER NOT NULL DEFAULT 0,
      dislikes_count INTEGER NOT NULL DEFAULT 0
    )
  `);

  // Add self-reference for parent_reply_id
  await db.execute(sql`
    ALTER TABLE replies 
    ADD CONSTRAINT replies_parent_reply_id_fkey 
    FOREIGN KEY (parent_reply_id) 
    REFERENCES replies(id) ON DELETE SET NULL
  `);

  // Insert default categories
  for (const category of FORUM_CATEGORIES) {
    await db.insert(categories).values(category).onConflictDoNothing();
  }
}

export async function down(db: any) {
  // Drop tables in reverse order
  await db.execute(sql`DROP TABLE IF EXISTS replies`);
  await db.execute(sql`DROP TABLE IF EXISTS threads`);
  await db.execute(sql`DROP TABLE IF EXISTS users`);
  await db.execute(sql`DROP TABLE IF EXISTS categories`);
}
