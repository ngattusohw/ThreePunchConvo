// User Status Options
export const USER_STATUSES = {
  HALL_OF_FAMER: {
    label: "HALL OF FAMER",
    className: "status-hof",
    minPoints: 10000,
  },
  CHAMPION: {
    label: "CHAMPION",
    className: "status-champion",
    minPoints: 5000,
  },
  CONTENDER: {
    label: "CONTENDER",
    className: "status-contender",
    minPoints: 1000,
  },
  RANKED_POSTER: {
    label: "RANKED POSTER",
    className: "status-ranked",
    minPoints: 500,
  },
  COMPETITOR: {
    label: "COMPETITOR",
    className: "status-competitor",
    minPoints: 100,
  },
  REGIONAL_POSTER: {
    label: "REGIONAL POSTER",
    className: "status-regional",
    minPoints: 50,
  },
  AMATEUR: {
    label: "AMATEUR",
    className: "status-amateur",
    minPoints: 0,
  },
};

// User Roles
export const USER_ROLES = {
  ADMIN: "ADMIN",
  MODERATOR: "MODERATOR",
  FIGHTER: "FIGHTER", // Verified pro fighter
  USER: "USER", // Regular user
};

// Forum Categories
export const FORUM_CATEGORIES = [
  {
    id: "general",
    name: "General MMA Discussion",
    description: "The place for all things MMA that don't fit elsewhere",
    count: 24,
  },
  {
    id: "mma_takes_podcast_companion",
    name: "MMA Takes Podcast Companion",
    description: "Discussion about the MMA Takes Podcast",
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
