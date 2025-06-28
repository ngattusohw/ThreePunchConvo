import { useMemo } from "react";
import { useUser, useAuth } from "@clerk/clerk-react";
import { EmailAddressResource } from "@clerk/types";

export type MemoizedUser = {
  id: string;
  username: string;
  emailAddresses: EmailAddressResource[];
  firstName: string;
  lastName: string;
  imageUrl: string;
  emailAddress: string;
  fullName: string;
  createdAt: Date;
  updatedAt: Date;
  planType: string | undefined;
  publicMetadata: any;
};

/**
 * Custom hook that provides memoized user data to prevent unnecessary re-renders
 * when Clerk refreshes user data. This helps prevent form resets and other
 * unwanted re-renders throughout the app.
 *
 * @returns Memoized user data and auth state
 */
export function useMemoizedUser() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { isSignedIn, userId } = useAuth();

  // Memoize user data to prevent unnecessary re-renders
  const memoizedUser = useMemo(() => {
    if (!user) return null;

    return {
      id: user.id,
      username: user.username,
      emailAddresses: user.emailAddresses,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl,
      // Add any other user properties you commonly use
      emailAddress: user.emailAddresses?.[0]?.emailAddress,
      fullName: user.fullName,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      planType: user.publicMetadata?.planType,
      // Add publicMetadata to the memoized user
      publicMetadata: user.publicMetadata,
    };
  }, [
    user?.id,
    user?.username,
    user?.emailAddresses,
    user?.firstName,
    user?.lastName,
    user?.imageUrl,
    user?.fullName,
    user?.createdAt,
    user?.updatedAt,
    user?.publicMetadata,
    user?.publicMetadata?.planType,
  ]);

  return {
    user: memoizedUser as MemoizedUser,
    isSignedIn,
    isLoaded: isUserLoaded,
    userId,
    // Provide the original user object for cases where you need all properties
    originalUser: user,
  };
}
