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
  // Insert default categories
  for (const category of FORUM_CATEGORIES) {
    await db.insert(categories).values(category).onConflictDoNothing();
  }
}

export async function down(db: any) {
  // Remove default categories
  await db.delete(categories).where(sql`1=1`);
} 