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
  PRO: "PRO", // Verified pro fighter
  USER: "USER", // Regular user
};

// Forum Categories
export const FORUM_CATEGORIES = [
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
export const ESPN_API_BASE_URL = "https://site.api.espn.com/apis/site/v2/sports/mma";

export const SUBSCRIPTION_STATUS = {
  prod_SOMN2freGOFOzm: "BASIC",
  TODO: "PRO",
};
