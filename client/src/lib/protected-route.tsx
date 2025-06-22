import React, { useMemo } from "react";
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

      // If not authenticated, redirect to login
      window.scrollTo(0, 0);
      setLocation("/auth", { replace: true });
      return null;
    };
  }, [Component, isLoaded, userId, setLocation]);

  return (
    <Route
      {...rest}
      component={ProtectedComponent}
    />
  );
}
