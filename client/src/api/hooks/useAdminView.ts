import { useQuery } from "@tanstack/react-query";
import { AdminViewUser } from "@/lib/types";
import { fetchUsers } from "../queries/admin";
import { useMemoizedUser } from "@/hooks/useMemoizedUser";

export function useAdminView() {
  const { user, isSignedIn } = useMemoizedUser();

  const {
    data: users,
    isLoading,
    error,
  } = useQuery<AdminViewUser[]>({
    queryKey: ["admin", "users"],
    queryFn: fetchUsers,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    enabled: isSignedIn && !!user, // Only run query when user is authenticated
  });

  return {
    users,
    isLoading,
    error,
  };
}
