// Define User type that can be imported directly
export type User = {
  id: string;
  username: string;
  email?: string | null;
  avatar?: string | null;
  role?: string;
  status?: string;
  externalId?: string;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
};

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
      localUser?: User;
      auth?: {
        userId?: string;
        sessionId?: string;
      }
    }
  }
}