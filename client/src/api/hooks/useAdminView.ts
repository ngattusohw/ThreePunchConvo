import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminViewUser } from "@/lib/types";
import { fetchUsers, updateUserRole } from "../queries/admin";
import { useMemoizedUser } from "@/hooks/useMemoizedUser";

export function useAdminView() {
  const { user, isSignedIn } = useMemoizedUser();
  const queryClient = useQueryClient();

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

  const { mutate: updateUserRole } = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) => updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });

  return {
    users,
    isLoading,
    error,
    updateUserRole,
  };
}
