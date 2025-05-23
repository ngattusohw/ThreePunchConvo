import React from 'react';
import { Route, useLocation } from 'wouter';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';

interface ProtectedRouteProps {
  component: React.ComponentType<any>;
  path: string;
  [key: string]: any;
}

export function ProtectedRoute({ component: Component, ...rest }: ProtectedRouteProps) {
  const { userId, isLoaded } = useClerkAuth();
  const [, setLocation] = useLocation();

  return (
    <Route
      {...rest}
      component={(props: any) => {
        // If Clerk is still loading, show a loading state
        if (!isLoaded) {
          return (
            <div className="min-h-screen flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-ufc-blue"></div>
            </div>
          );
        }

        // If user is authenticated, render the component
        if (userId) {
          return <Component {...props} />;
        }

        // If not authenticated, redirect to login
        setLocation('/auth');
        return null;
      }}
    />
  );
}