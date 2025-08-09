import React, { useMemo } from "react";
import { Route, useLocation } from "wouter";
import { useMemoizedUser } from "@/hooks/useMemoizedUser";
import { useUserProfile } from "@/api/hooks/useUserProfile";
import { USER_ROLES } from "@/lib/constants";

interface AdminRouteProps {
  component: React.ComponentType<any>;
  path: string;
  [key: string]: any;
}

export function AdminRoute({
  component: Component,
  ...rest
}: AdminRouteProps) {
  const { userId, isLoaded, user } = useMemoizedUser();
  const { user: userInfo } = useUserProfile(user?.username || "");
  const [, setLocation] = useLocation();

  // Memoize the component function to prevent unnecessary remounts
  const AdminComponent = useMemo(() => {
    return (props: any) => {
      // If Clerk is still loading, show a loading state
      if (!isLoaded) {
        return (
          <div className='flex min-h-screen items-center justify-center'>
            <div className='border-ufc-blue h-12 w-12 animate-spin rounded-full border-b-2 border-t-2'></div>
          </div>
        );
      }

      // If user is authenticated, render the component
      if (userId && userInfo?.role === USER_ROLES.ADMIN) {
        return <Component {...props} />;
      }

      if (!userId) {
        window.scrollTo(0, 0);
        setLocation("/auth", { replace: true });
        return null;
      } else if (userInfo?.role !== USER_ROLES.ADMIN) {
        window.scrollTo(0, 0);
        setLocation("/forum", { replace: true });
        return null;
      }
    };
  }, [Component, isLoaded, userId, setLocation]);

  return <Route {...rest} component={AdminComponent} />;
}
