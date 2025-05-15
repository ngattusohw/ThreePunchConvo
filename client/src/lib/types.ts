// User related types
export type UserRole = "ADMIN" | "MODERATOR" | "PRO" | "USER";
export type UserStatus = "HALL OF FAMER" | "CHAMPION" | "CONTENDER" | "RANKED POSTER" | "COMPETITOR" | "REGIONAL POSTER" | "AMATEUR";

export interface AuthUser {
  id: string;
  username: string;
  avatar?: string;
  status: UserStatus;
  isOnline: boolean;
  postsCount: number;
  likesCount: number;
  potdCount: number;
  rank: number;
  followersCount: number;
  followingCount: number;
  role: UserRole;
  socialLinks?: SocialLinks;
}

export interface SocialLinks {
  twitter?: string;
  instagram?: string;
  youtube?: string;
  facebook?: string;
}

// Forum related types
export interface ForumCategory {
  id: string;
  name: string;
  description: string;
  count: number;
}

export interface ForumThread {
  id: number;
  title: string;
  content: string;
  userId: string;
  user: AuthUser;
  categoryId: string;
  isPinned: boolean;
  isLocked: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastActivityAt: Date;
  viewCount: number;
  likesCount: number;
  dislikesCount: number;
  repliesCount: number;
  isPotd: boolean;
  media?: ThreadMedia[];
  poll?: Poll;
}

export interface ThreadMedia {
  id: number;
  threadId: number;
  type: "IMAGE" | "GIF";
  url: string;
}

export interface Poll {
  id: number;
  threadId: number;
  question: string;
  options: PollOption[];
  expiresAt: Date;
  votesCount: number;
}

export interface PollOption {
  id: number;
  pollId: number;
  text: string;
  votesCount: number;
}

export interface ThreadReply {
  id: number;
  threadId: number;
  userId: string;
  user: AuthUser;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  parentReplyId?: number;
  likesCount: number;
  dislikesCount: number;
  media?: ThreadMedia[];
}

// Notification types
export interface Notification {
  id: number;
  userId: string;
  type: "REPLY" | "MENTION" | "LIKE" | "SYSTEM" | "FOLLOW";
  relatedUserId?: string;
  relatedUser?: AuthUser;
  threadId?: number;
  threadTitle?: string;
  replyId?: number;
  replyPreview?: string;
  message?: string;
  isRead: boolean;
  createdAt: Date;
}

// MMA Schedule types
export interface MMAEvent {
  id: string;
  name: string;
  shortName: string;
  date: Date;
  organization: string;
  venue: string;
  location: string;
  imageUrl: string | null;
  mainCard?: Fight[];
  prelimCard?: Fight[];
}

export interface Fighter {
  id: string;
  name: string;
  nickname?: string;
  record?: string;
  imageUrl?: string;
}

export interface Fight {
  id: string;
  title?: string;
  isTitleFight: boolean;
  weightClass: string;
  fighter1: Fighter;
  fighter2: Fighter;
}

// Ranking types
export interface RankedUser {
  user: AuthUser;
  points: number;
  position: number;
  isTied: boolean;
}
