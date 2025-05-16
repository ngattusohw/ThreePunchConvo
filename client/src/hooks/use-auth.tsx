import React, { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import type { AuthUser } from "../lib/types";
import { getQueryFn, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: AuthUser | null;
  isLoading: boolean;
  error: Error | null;
  login: (username?: string, password?: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  currentUser: AuthUser | null;
  refetchUser: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: user,
    error,
    isLoading,
    refetch
  } = useQuery<AuthUser | null, Error>({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    gcTime: 1000 * 60 * 30, // Keep data in cache for 30 minutes
  });
  
  // Function to refetch user data
  const refetchUser = async () => {
    await refetch();
  };
  
  // Function to handle registration
  const register = async (username: string, password: string) => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        credentials: "include",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Registration failed');
      }
      
      // Get the user data from the response
      const userData = await response.json();
      
      // Update the user data in the cache
      queryClient.setQueryData(["/api/auth/user"], userData);
      
      // Redirect to home page
      window.location.href = "/";
    } catch (err) {
      console.error("Registration error:", err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to register. Please try again.",
        variant: "destructive"
      });
      throw err;
    }
  };
  
  // Function to handle login
  const login = async (username?: string, password?: string) => {
    try {
      // Production environment: Use Replit Auth
      if (process.env.NODE_ENV === 'production') {
        window.location.href = "/api/login";
        return;
      }
      
      // Development environment: Use local auth
      if (!username || !password) {
        window.location.href = "/auth";
        return;
      }
      
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Login failed');
      }
      
      // Refetch user data after successful login
      await refetchUser();
      
      // Redirect to home page
      window.location.href = "/";
    } catch (err) {
      console.error("Login error:", err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to login. Please try again.",
        variant: "destructive"
      });
      throw err;
    }
  };

  // Function to logout 
  const logout = async () => {
    try {
      // Use appropriate logout endpoint
      if (process.env.NODE_ENV === 'production') {
        window.location.href = "/api/logout";
        return;
      }
      
      const response = await fetch("/api/auth/logout", { 
        method: "POST",
        credentials: "include",
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Logout failed');
      }
      
      // Clear all queries from the cache
      queryClient.clear();
      
      // Set user to null immediately
      queryClient.setQueryData(["/api/auth/user"], null);
      
      // Redirect to auth page
      window.location.href = "/auth";
    } catch (err) {
      console.error("Logout error:", err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to logout. Please try again.",
        variant: "destructive"
      });
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        currentUser: user || null,
        isLoading,
        error,
        login,
        register,
        logout,
        refetchUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}