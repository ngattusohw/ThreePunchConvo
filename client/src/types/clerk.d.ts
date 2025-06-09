import { UserRole } from "@/lib/types";

declare module "@clerk/clerk-react" {
  interface UserResource {
    publicMetadata: {
      role?: UserRole;
      planType?: string;
    };
  }
} 