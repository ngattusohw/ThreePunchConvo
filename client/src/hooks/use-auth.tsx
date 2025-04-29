import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch user data from server
  const { data: user, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/auth/user'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/auth/user', {
          credentials: 'include'
        });
        
        if (!res.ok) {
          if (res.status === 401) {
            // Not authenticated, but this is expected
            return null;
          }
          throw new Error('Failed to fetch user data');
        }
        
        return res.json();
      } catch (error) {
        console.error('Error fetching user data:', error);
        return null;
      }
    },
    retry: false,
    refetchOnWindowFocus: false
  });

  useEffect(() => {
    setLoading(isLoading);
    
    if (error) {
      console.error('Auth error:', error);
      toast({
        title: 'Authentication Error',
        description: 'There was a problem fetching user data.',
        variant: 'destructive'
      });
    }
  }, [isLoading, error, toast]);

  // Login with Replit Auth
  const login = () => {
    window.location.href = '/api/login';
  };

  // Logout
  const logout = () => {
    window.location.href = '/api/logout';
  };

  const value = {
    user,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}