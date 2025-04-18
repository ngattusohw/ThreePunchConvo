import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { User } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface AuthContextType {
  currentUser: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      
      if (user) {
        try {
          // Get ID token
          const idToken = await user.getIdToken();
          
          // Send token to backend to verify and get/create user
          const res = await apiRequest('POST', '/api/auth/google', null, {
            headers: {
              Authorization: `Bearer ${idToken}`
            }
          });
          
          if (res.ok) {
            const userData = await res.json();
            setCurrentUser(userData);
          } else {
            throw new Error('Failed to authenticate with server');
          }
        } catch (error) {
          console.error('Auth error:', error);
          toast({
            title: 'Authentication Error',
            description: 'There was a problem authenticating with the server.',
            variant: 'destructive'
          });
        }
      } else {
        setCurrentUser(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      
      toast({
        title: 'Welcome!',
        description: 'You have successfully signed in.',
      });
    } catch (error) {
      console.error('Google sign-in error:', error);
      toast({
        title: 'Sign-in Error',
        description: 'There was a problem signing in with Google.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    try {
      setLoading(true);
      await signOut(auth);
      
      // Call backend logout endpoint
      await apiRequest('POST', '/api/auth/logout');
      
      setCurrentUser(null);
      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out.',
      });
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: 'Logout Error',
        description: 'There was a problem logging out.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const value = {
    currentUser,
    firebaseUser,
    loading,
    signInWithGoogle,
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