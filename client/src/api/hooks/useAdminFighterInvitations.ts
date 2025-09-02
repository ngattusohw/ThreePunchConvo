import { useQuery } from "@tanstack/react-query";
import {
  AdminFighterInvitationsResponse,
  AdminFighterInvitationsFilters,
} from "@/lib/types";
import { fetchFighterInvitations } from "../queries/admin";
import { useMemoizedUser } from "@/hooks/useMemoizedUser";
import { useState } from "react";

export function useAdminFighterInvitations() {
  const { user, isSignedIn } = useMemoizedUser();

  const [filters, setFilters] = useState<AdminFighterInvitationsFilters>({
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
  } = useQuery<AdminFighterInvitationsResponse>({
    queryKey: ["admin", "fighter-invitations", filters],
    queryFn: () => fetchFighterInvitations(filters),
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    enabled: isSignedIn && !!user,
  });

  const updateFilters = (
    newFilters: Partial<AdminFighterInvitationsFilters>,
  ) => {
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
    invitations: response?.invitations || [],
    pagination: response?.pagination,
    isLoading,
    error,
    filters,
    goToPage,
    updateSearch,
    updateSort,
    updateFilters,
  };
}
