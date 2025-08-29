// Augment Express namespace (no export needed)
declare global {
  namespace Express {
    // Extending the User interface to include our User type
    interface User {
      id: string;
      username: string;
      email?: string | null;
      avatar?: string | null;
      role?: string;
      status?: string;
    }

    // Extend the Request interface to include localUser
    interface Request {
      localUser?: {
        id: string;
        username: string;
        email?: string | null;
        password?: string | null;
        externalId?: string | null;
        stripeId?: string | null;
        planType?: string;
        avatar?: string | null;
        firstName?: string | null;
        lastName?: string | null;
        bio?: string | null;
        profileImageUrl?: string | null;
        updatedAt?: Date;
        role?: string;
        status?: string;
        createdAt?: Date;
        isOnline?: boolean;
        lastActive?: Date;
        points?: number;
        rank?: number;
        postsCount?: number;
        likesCount?: number;
        pinnedByUserCount?: number;
        pinnedCount?: number;
        potdCount?: number;
        repliesCount?: number;
        followersCount?: number;
        followingCount?: number;
        socialLinks?: Record<string, string>;
        disabled?: boolean;
        disabledAt?: Date;
        metadata?: Record<string, string>;
      };
      auth?: {
        userId?: string;
        sessionId?: string;
      };
    }
  }
}

// Add these email-related types
export interface EmailTemplateParams {
  name: string;
  email: string;
  link: string;
  [key: string]: unknown;
}

export interface FighterInvitationTemplateParams extends EmailTemplateParams {
  fighterName?: string;
  adminName?: string;
  message?: string;
  platformName?: string;
  expirationDays?: number;
}

export interface EmailResponse {
  status: number;
  text: string;
}
