// User Status Options
export const USER_STATUSES = {
  GOAT: {
    label: "GOAT",
    className: "status-goat",
  },
  P4P: {
    label: "P4P",
    className: "status-p4p",
  },
  HALL_OF_FAMER: {
    label: "HALL OF FAMER",
    className: "status-hof",
  },
  CHAMPION: {
    label: "CHAMPION",
    className: "status-champion",
  },
  CONTENDER: {
    label: "CONTENDER",
    className: "status-contender",
  },
  RANKED_POSTER: {
    label: "RANKED",
    className: "status-ranked",
  },
  COMPETITOR: {
    label: "COMPETITOR",
    className: "status-competitor",
  },
  REGIONAL_POSTER: {
    label: "REGIONAL",
    className: "status-regional",
  },
  AMATEUR: {
    label: "AMATEUR",
    className: "status-amateur",
  },
};

// User Roles
export const USER_ROLES = {
  ADMIN: "ADMIN",
  MODERATOR: "MODERATOR",
  FIGHTER: "FIGHTER", // Verified pro fighter
  USER: "USER", // Regular user
  INDUSTRY_PROFESSIONAL: "INDUSTRY_PROFESSIONAL", // Industry professional
};

export const USER_ROLE_CONFIG = {
  [USER_ROLES.FIGHTER]: {
    label: "PRO FIGHTER",
    color: "bg-ufc-red",
    textColor: "text-white",
    icon: true,
  },
  [USER_ROLES.INDUSTRY_PROFESSIONAL]: {
    label: "MMA INDUSTRY",
    color: "bg-ufc-red",
    textColor: "text-white",
    icon: true,
  },
  [USER_ROLES.ADMIN]: {
    label: "ADMIN",
    color: "bg-ufc-admin-yellow",
    textColor: "text-ufc-black",
    icon: false,
  },
  [USER_ROLES.MODERATOR]: {
    label: "MOD",
    color: "bg-green-600",
    textColor: "text-white",
    icon: false,
  },
} as const;

// Forum Categories
export const FORUM_CATEGORIES = [
  {
    id: "general",
    name: "General MMA Discussion",
    description: "Wide-ranging conversations on all things MMA",
    count: 24,
  },
  {
    id: "mma_takes_podcast_companion",
    name: "The Capper’s Cave by MMA Takes Podcast",
    description: "Discussion about MMA gambling",
    count: 2,
  },
  {
    id: "fighters_only",
    name: "Fighters Only",
    description: "Discussion for the Fighters Only",
    count: 2,
  },
  {
    id: "member_feedback",
    name: "Member Feedback",
    description: "Talk about Member Feedback",
    count: 2,
  },
];

// MMA Organizations
export const MMA_ORGANIZATIONS = {
  UFC: {
    name: "UFC",
    textClass: "text-ufc-gold",
    fontClass: "font-accent",
  },
  BELLATOR: {
    name: "BELLATOR",
    textClass: "text-blue-400",
    fontClass: "font-accent",
  },
  ONE: {
    name: "ONE",
    textClass: "text-red-400",
    fontClass: "font-accent",
  },
  PFL: {
    name: "PFL",
    textClass: "text-green-400",
    fontClass: "font-accent",
  },
};

// ESPN API endpoint for MMA events (would normally be hidden in .env)
export const ESPN_API_BASE_URL =
  "https://site.api.espn.com/apis/site/v2/sports/mma";

export const SUBSCRIPTION_STATUS = {
  prod_SOMN2freGOFOzm: "BASIC",
  TODO: "PRO",
};

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
  ADMIN_MESSAGE: "ADMIN_MESSAGE",
} as const;
