import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminUsersResponse, AdminUsersFilters } from "@/lib/types";
import { fetchUsers } from "../queries/admin";
import { useMemoizedUser } from "@/hooks/useMemoizedUser";
import { useState } from "react";

export function useAdminView() {
  const { user, isSignedIn } = useMemoizedUser();
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState<AdminUsersFilters>({
    page: 1,
    limit: 10,
    search: "",
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const {
    data: response,
    isLoading,
    error,
  } = useQuery<AdminUsersResponse>({
    queryKey: ["admin", "users", filters],
    queryFn: () => fetchUsers(filters),
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    enabled: isSignedIn && !!user,
  });

  const { mutate: updateUserRole } = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });

  const updateFilters = (newFilters: Partial<AdminUsersFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const goToPage = (page: number) => {
    updateFilters({ page });
  };

  const updateSearch = (search: string) => {
    updateFilters({ search, page: 1 }); // Reset to page 1 when searching
  };

  const updateSort = (sortBy: string, sortOrder: "asc" | "desc") => {
    updateFilters({ sortBy, sortOrder, page: 1 }); // Reset to page 1 when sorting
  };

  return {
    users: response?.users || [],
    pagination: response?.pagination,
    isLoading,
    error,
    filters,
    updateUserRole,
    goToPage,
    updateSearch,
    updateSort,
    updateFilters,
  };
}
