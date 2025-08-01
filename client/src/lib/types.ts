import { NOTIFICATION_TYPES } from './constants';

// User related types
export type UserRole =
  | "ADMIN"
  | "MODERATOR"
  | "USER"
  | "PREMIUM_USER"
  | "FIGHTER"
  | "INDUSTRY_PROFESSIONAL";

export type UserStatus =
  | "HALL OF FAMER"
  | "CHAMPION"
  | "CONTENDER"
  | "RANKED POSTER"
  | "COMPETITOR"
  | "REGIONAL POSTER"
  | "AMATEUR"
  | "GOAT";

export interface AuthUser {
  id: string;
  externalId: string;
  username: string;
  avatar?: string;
  firstName?: string | null;
  lastName?: string | null;
  status: UserStatus;
  isOnline: boolean;
  postsCount: number;
  likesCount: number;
  planType: string;
  pinnedByUserCount: number;
  pinnedCount: number;
  rank: number;
  followersCount: number;
  followingCount: number;
  role: UserRole;
  socialLinks?: SocialLinks;
  stripeId?: string;
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
  id: string;
  title: string;
  content: string;
  userId: string;
  user: AuthUser;
  categoryId: string;
  isPinned: boolean;
  isLocked: boolean;
  edited: boolean;
  editedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  lastActivityAt: Date;
  viewCount: number;
  likesCount: number;
  dislikesCount: number;
  repliesCount: number;
  potdCount: number;
  hasPotd?: boolean;
  media?: ThreadMedia[];
  poll?: Poll;
  hasLiked?: boolean;
}

export interface ThreadMedia {
  id: string;
  threadId: string;
  type: "IMAGE" | "GIF";
  url: string;
}

export interface Poll {
  id: string;
  threadId: string;
  question: string;
  options: PollOption[];
  expiresAt: Date;
  votesCount: number;
}

export interface PollOption {
  id: string;
  pollId: string;
  text: string;
  votesCount: number;
}

export interface ThreadReply {
  id: string;
  threadId: string;
  userId: string;
  user: AuthUser;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  parentReplyId?: string;
  likesCount: number;
  dislikesCount: number;
  media?: ThreadMedia[];
  level?: number;
  parentUsername?: string;
  hasLiked?: boolean;
}

export type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES];

// Notification types
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  relatedUserId?: string;
  relatedUser?: AuthUser;
  threadId?: string;
  threadTitle?: string;
  replyId?: string;
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
  position: number;
  isTied: boolean;
  points: number;
  user: {
    id: string;
    username: string;
    avatar: string | null;
    profileImageUrl: string;
    role: UserRole;
    status: UserStatus;
    dailyFighterCred: number;
    totalFighterCred: number;
    rank: number;
    points: number;
    postsCount: number;
    likesCount: number;
    pinnedByUserCount: number;
    pinnedCount: number;
    potdCount: number;
    repliesCount: number;
  };
  rank: number;
}
