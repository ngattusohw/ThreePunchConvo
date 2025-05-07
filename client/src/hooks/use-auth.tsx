import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User } from "@shared/schema";
import { getQueryFn, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  login: () => void;
  logout: () => void;
  currentUser: User | null;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: user,
    error,
    isLoading,
    refetch
  } = useQuery<User | null, Error>({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
  
  // Function to redirect to login page with Replit Auth
  const login = () => {
    // Production environment: Use Replit Auth
    if (import.meta.env.PROD) {
      window.location.href = "/api/login";
    } else {
      // In development, we can't use Replit Auth, so we'll redirect to auth page
      // for local credentials
      window.location.href = "/auth";
    }
  };

  // Function to logout 
  const logout = () => {
    // Use appropriate logout endpoint
    if (import.meta.env.PROD) {
      window.location.href = "/api/logout";
    } else {
      // In development, use the development logout endpoint
      fetch("/api/dev/logout", { 
        method: "POST",
        headers: { 'Content-Type': 'application/json' }
      })
      .then(() => {
        // Force refresh the auth query
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        // Redirect to auth page
        window.location.href = "/auth";
      })
      .catch(err => {
        console.error("Logout error:", err);
        // Fallback to auth page
        window.location.href = "/auth";
      });
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
        logout
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