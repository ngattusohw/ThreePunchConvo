// User Roles
export const USER_ROLES = {
  ADMIN: "ADMIN",
  MODERATOR: "MODERATOR", 
  FIGHTER: "FIGHTER",
  USER: "USER",
  INDUSTRY_PROFESSIONAL: "INDUSTRY_PROFESSIONAL",
} as const;

// Roles that should receive notifications when fighters/industry professionals post
export const NOTIFICATION_EXCLUDED_ROLES = [
  USER_ROLES.FIGHTER,
  USER_ROLES.INDUSTRY_PROFESSIONAL,
] as const;

// Notification Types
export const NOTIFICATION_TYPES = {
  REPLY: "REPLY",
  MENTION: "MENTION", 
  LIKE: "LIKE",
  SYSTEM: "SYSTEM",
  FOLLOW: "FOLLOW",
  POTD: "POTD",
  THREAD_PINNED: "THREAD_PINNED",
  FIGHTER_POST: "FIGHTER_POST",
  INDUSTRY_PROFESSIONAL_POST: "INDUSTRY_PROFESSIONAL_POST",
} as const; 