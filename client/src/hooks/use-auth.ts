import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-react';
import { useState, useEffect } from 'react';

// This custom hook wraps Clerk's auth functionality
// It allows us to maintain compatibility with our app's existing code
// while using Clerk for authentication
export function useAuth() {
  const { isSignedIn, isLoaded, signOut } = useClerkAuth();
  const { user, isLoaded: isUserLoaded } = useUser();
  const [isLoading, setIsLoading] = useState(true);

  // Format the user object to match our app's expected structure
  const currentUser = user ? {
    id: user.id,
    username: user.username || `user_${user.id.substring(0, 8)}`,
    firstName: user.firstName,
    lastName: user.lastName,
    avatar: user.imageUrl,
    email: user.emailAddresses[0]?.emailAddress,
    // You can add more properties here as needed from your database
    role: 'USER', // Default role, should be fetched from your database
    status: 'AMATEUR', // Default status, should be fetched from your database
    isOnline: true,
  } : null;

  // Update loading state when Clerk auth is loaded
  useEffect(() => {
    if (isLoaded && isUserLoaded) {
      setIsLoading(false);
    }
  }, [isLoaded, isUserLoaded]);

  // These functions were in the original auth implementation
  // They now use Clerk's functionality
  const login = async () => {
    // This is now handled by Clerk's SignIn component
    console.warn('Login is now handled by Clerk components');
  };

  const register = async () => {
    // This is now handled by Clerk's SignUp component
    console.warn('Registration is now handled by Clerk components');
  };

  const logout = async () => {
    return signOut();
  };

  const refetchUser = async () => {
    // In the future, you might want to fetch additional user data from your database here
    return currentUser;
  };

  return {
    user: currentUser,
    currentUser,
    isLoading,
    login,
    register,
    logout,
    refetchUser,
  };
} 