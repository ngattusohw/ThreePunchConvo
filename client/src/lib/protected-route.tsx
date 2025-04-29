import { useAuth } from "@/hooks/use-auth";
import { Redirect, Route, RouteComponentProps } from "wouter";
import { Loader2 } from "lucide-react";

type ComponentWithParams = React.ComponentType<any>;

interface ProtectedRouteProps {
  path: string;
  component: ComponentWithParams;
}

export function ProtectedRoute({
  path,
  component: Component,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  return (
    <Route path={path}>
      {(params) => {
        if (loading) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-ufc-red" />
            </div>
          );
        }
        
        if (!user) {
          return <Redirect to="/auth" />;
        }
        
        return <Component params={params} />;
      }}
    </Route>
  );
}