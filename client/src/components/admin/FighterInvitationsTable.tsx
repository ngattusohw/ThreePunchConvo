import React, { useState, useEffect } from "react";
import { useAdminFighterInvitations } from "@/api/hooks/useAdminFighterInvitations";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { ChevronUpIcon, ChevronDownIcon, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const getStatusBadge = (status: string) => {
  switch (status) {
    case "PENDING":
      return (
        <span className='inline-flex items-center rounded-md bg-yellow-600 px-1 py-0.5 text-xs font-medium text-white ring-1 ring-inset ring-yellow-500'>
          PENDING
        </span>
      );
    case "ACCEPTED":
      return (
        <span className='inline-flex items-center rounded-md bg-green-600 px-1 py-0.5 text-xs font-medium text-white ring-1 ring-inset ring-green-500'>
          ACCEPTED
        </span>
      );
    case "EXPIRED":
      return (
        <span className='inline-flex items-center rounded-md bg-red-600 px-1 py-0.5 text-xs font-medium text-white ring-1 ring-inset ring-red-500'>
          EXPIRED
        </span>
      );
    default:
      return (
        <span className='inline-flex items-center rounded-md bg-gray-600 px-1 py-0.5 text-xs font-medium text-white ring-1 ring-inset ring-gray-500'>
          {status}
        </span>
      );
  }
};

const isExpired = (expiresAt: Date | string) => {
  return new Date(expiresAt) < new Date();
};

export default function FighterInvitationsTable() {
  const {
    invitations,
    pagination,
    isLoading,
    error,
    filters,
    goToPage,
    updateSearch,
    updateSort,
    updateFilters,
  } = useAdminFighterInvitations();

  const [searchInput, setSearchInput] = useState(filters.search || "");
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);

  // Debounced search effect - only search when the term actually changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Only update search if the search term has actually changed
      if (searchInput !== filters.search) {
        updateSearch(searchInput);
      }
    }, 300); // 300ms delay

    return () => clearTimeout(timeoutId);
  }, [searchInput, updateSearch, filters.search]);

  // Sync searchInput with filters.search when filters change externally
  useEffect(() => {
    setSearchInput(filters.search || "");
  }, [filters.search]);

  if (error)
    return (
      <div className='text-red-400'>Error loading fighter invitations</div>
    );

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString();
  };

  const copyInviteLink = async (
    invitationToken: string,
    invitationId: string,
  ) => {
    try {
      const inviteLink = `${window.location.origin}/fighter-signup?token=${invitationToken}`;
      await navigator.clipboard.writeText(inviteLink);

      setCopiedInviteId(invitationId);
      setTimeout(() => setCopiedInviteId(null), 2000);

      toast({
        title: "Success",
        description: "Invitation link copied to clipboard!",
      });
    } catch (error) {
      console.error("Failed to copy invitation link:", error);
      toast({
        title: "Error",
        description: "Failed to copy invitation link. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSort = (column: string) => {
    const newOrder =
      filters.sortBy === column && filters.sortOrder === "asc" ? "desc" : "asc";
    updateSort(column, newOrder);
  };

  const getSortIcon = (column: string) => {
    if (filters.sortBy !== column) return null;
    return filters.sortOrder === "asc" ? (
      <ChevronUpIcon className='ml-1 h-4 w-4' />
    ) : (
      <ChevronDownIcon className='ml-1 h-4 w-4' />
    );
  };

  const renderPagination = () => {
    // Don't show pagination while loading or if no pagination data
    if (isLoading || !pagination || pagination.totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    const { currentPage, totalPages } = pagination;

    // Calculate start and end page numbers
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <Pagination className='mt-6'>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() =>
                !isLoading &&
                pagination.hasPrevious &&
                goToPage(currentPage - 1)
              }
              className={cn(
                "border-gray-600 text-white hover:bg-gray-700 hover:text-white",
                !pagination.hasPrevious || isLoading
                  ? "cursor-not-allowed opacity-50"
                  : "cursor-pointer",
              )}
            />
          </PaginationItem>

          {pages.map((page) => (
            <PaginationItem key={page}>
              <PaginationLink
                onClick={() => !isLoading && goToPage(page)}
                isActive={page === currentPage}
                className={cn(
                  "border-gray-600 text-white hover:bg-gray-700 hover:text-white",
                  isLoading
                    ? "cursor-not-allowed opacity-50"
                    : "cursor-pointer",
                  page === currentPage
                    ? "border-gray-500 bg-gray-700 text-white"
                    : "hover:bg-gray-700",
                )}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          ))}

          <PaginationItem>
            <PaginationNext
              onClick={() =>
                !isLoading && pagination.hasNext && goToPage(currentPage + 1)
              }
              className={cn(
                "border-gray-600 text-white hover:bg-gray-700 hover:text-white",
                !pagination.hasNext || isLoading
                  ? "cursor-not-allowed opacity-50"
                  : "cursor-pointer",
              )}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  return (
    <div className='container mx-auto py-6'>
      {/* Search and Filter Controls */}
      <div className='mb-6 flex items-center justify-between gap-4'>
        <div className='flex gap-2'>
          <Input
            placeholder='Search invitations...'
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className='w-64'
          />
        </div>

        <div className='flex items-center gap-3'>
          <div className='flex items-center gap-2'>
            <span className='text-sm text-gray-400'>Per page:</span>
            <select
              value={filters.limit}
              onChange={(e) =>
                updateFilters({ limit: parseInt(e.target.value), page: 1 })
              }
              className='rounded border border-gray-600 bg-gray-800 px-2 py-1 text-white'
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Info */}
      {!isLoading && pagination && (
        <div className='mb-4 text-sm text-gray-400'>
          Showing {(pagination.currentPage - 1) * filters.limit + 1} to{" "}
          {Math.min(pagination.currentPage * filters.limit, pagination.total)}{" "}
          of {pagination.total} invitations
        </div>
      )}

      <div className='overflow-hidden rounded-lg bg-gray-800'>
        <Table>
          <TableHeader>
            <TableRow className='border-gray-600'>
              <TableHead
                className={cn(
                  "cursor-pointer select-none font-semibold text-gray-200 hover:text-white",
                  "flex items-center",
                )}
                onClick={() => handleSort("email")}
              >
                Email
                {getSortIcon("email")}
              </TableHead>
              <TableHead
                className={cn(
                  "cursor-pointer select-none font-semibold text-gray-200 hover:text-white",
                )}
                onClick={() => handleSort("fighterName")}
              >
                Fighter Name
                {getSortIcon("fighterName")}
              </TableHead>
              <TableHead
                className={cn(
                  "cursor-pointer select-none font-semibold text-gray-200 hover:text-white",
                )}
                onClick={() => handleSort("status")}
              >
                Status
                {getSortIcon("status")}
              </TableHead>
              <TableHead className='font-semibold text-gray-200'>
                Invited By
              </TableHead>
              <TableHead
                className={cn(
                  "cursor-pointer select-none font-semibold text-gray-200 hover:text-white",
                )}
                onClick={() => handleSort("createdAt")}
              >
                Created
                {getSortIcon("createdAt")}
              </TableHead>
              <TableHead
                className={cn(
                  "cursor-pointer select-none font-semibold text-gray-200 hover:text-white",
                )}
                onClick={() => handleSort("expiresAt")}
              >
                Expires
                {getSortIcon("expiresAt")}
              </TableHead>
              <TableHead className='font-semibold text-gray-200'>
                Invite Link
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className='py-8 text-center text-white'>
                  Loading...
                </TableCell>
              </TableRow>
            ) : !invitations || invitations.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className='py-8 text-center text-gray-400'
                >
                  No fighter invitations found
                </TableCell>
              </TableRow>
            ) : (
              invitations.map((invitation) => (
                <TableRow
                  key={invitation.id}
                  className='border-gray-600 hover:bg-gray-700'
                >
                  <TableCell className='w-48 break-words text-gray-300'>
                    {invitation.email}
                  </TableCell>
                  <TableCell className='w-32 break-words font-medium text-white'>
                    {invitation.fighterName || "N/A"}
                  </TableCell>
                  <TableCell className='w-24'>
                    {getStatusBadge(invitation.status)}
                  </TableCell>
                  <TableCell className='w-32 text-gray-300'>
                    {invitation.invitedByAdmin?.username || "Unknown"}
                  </TableCell>
                  <TableCell className='w-24 font-mono text-xs text-gray-300'>
                    {formatDate(invitation.createdAt)}
                  </TableCell>
                  <TableCell className='w-24 font-mono text-xs'>
                    <span
                      className={cn(
                        isExpired(invitation.expiresAt)
                          ? "text-red-400"
                          : "text-gray-300",
                      )}
                    >
                      {formatDate(invitation.expiresAt)}
                      {isExpired(invitation.expiresAt) && " (Expired)"}
                    </span>
                  </TableCell>
                  <TableCell className='w-32'>
                    <div className='flex gap-2'>
                      <button
                        className='flex items-center gap-1 rounded-lg bg-blue-600 px-2 py-1 text-sm font-medium text-white hover:bg-blue-700'
                        onClick={() =>
                          copyInviteLink(
                            invitation.invitationToken,
                            invitation.id,
                          )
                        }
                      >
                        {copiedInviteId === invitation.id ? (
                          <>
                            <Check className='h-3 w-3' />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className='h-3 w-3' />
                            Copy Link
                          </>
                        )}
                      </button>
                      {invitation.status === "PENDING" &&
                        !isExpired(invitation.expiresAt) && (
                          <button
                            className='rounded-lg bg-green-600 px-2 py-1 text-sm font-medium text-white hover:bg-green-700'
                            onClick={() => {
                              // TODO: Implement resend invitation
                              console.log("Resend invitation:", invitation.id);
                            }}
                          >
                            Resend
                          </button>
                        )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {renderPagination()}
    </div>
  );
}
