import React, { useMemo, useCallback, useEffect } from "react";
import { Route, useLocation } from "wouter";
import { useMemoizedUser } from "@/hooks/useMemoizedUser";

interface ProtectedRouteProps {
  component: React.ComponentType<any>;
  path: string;
  [key: string]: any;
}

export function ProtectedRoute({
  component: Component,
  ...rest
}: ProtectedRouteProps) {
  const { userId, isLoaded } = useMemoizedUser();
  const [, setLocation] = useLocation();

  // Handle redirect to auth when not authenticated
  const redirectToAuth = useCallback(() => {
    window.scrollTo(0, 0);
    setLocation("/auth", { replace: true });
  }, [setLocation]);

  useEffect(() => {
    if (isLoaded && !userId) {
      redirectToAuth();
    }
  }, [isLoaded, userId, redirectToAuth]);

  // Memoize the component function to prevent unnecessary remounts
  const ProtectedComponent = useMemo(() => {
    return (props: any) => {
      // If Clerk is still loading, show a loading state
      if (!isLoaded) {
        return (
          <div className="flex min-h-screen items-center justify-center">
            <div className="border-ufc-blue h-12 w-12 animate-spin rounded-full border-b-2 border-t-2"></div>
          </div>
        );
      }

      // If user is authenticated, render the component
      if (userId) {
        return <Component {...props} />;
      }

      // If not authenticated, show loading while redirecting
      return (
        <div className="flex min-h-screen items-center justify-center">
          <div className="border-ufc-blue h-12 w-12 animate-spin rounded-full border-b-2 border-t-2"></div>
        </div>
      );
    };
  }, [Component, isLoaded, userId]);

  return (
    <Route
      {...rest}
      component={ProtectedComponent}
    />
  );
}
