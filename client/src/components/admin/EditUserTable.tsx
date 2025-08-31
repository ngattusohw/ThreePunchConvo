import React, { useState, useEffect } from "react";
import { useAdminView } from "@/api/hooks/useAdminView";
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
import { Button } from "@/components/ui/button";
import { ChevronUpIcon, ChevronDownIcon } from "lucide-react";
import RoleBadge from "../ui/RoleBadge";
import EditUserModal from "./EditUserModal";
import MessageUserModal from "./MessageUserModal";
import MessageUsersModal from "./MessageUsersModal";
import { cn } from "@/lib/utils";

export default function EditUsers() {
  const {
    users,
    pagination,
    isLoading,
    error,
    filters,
    goToPage,
    updateSearch,
    updateSort,
    updateFilters,
  } = useAdminView();

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [messageUser, setMessageUser] = useState<any>(null);
  const [isBulkMessageOpen, setIsBulkMessageOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(filters.search || "");

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

  if (error) return <div className='text-red-400'>Error loading users</div>;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
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
            placeholder='Search users...'
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
          <Button
            onClick={() => setIsBulkMessageOpen(true)}
            className='bg-blue-600 text-white hover:bg-blue-700'
          >
            Message Users
          </Button>
        </div>
      </div>

      {/* Results Info */}
      {!isLoading && pagination && (
        <div className='mb-4 text-sm text-gray-400'>
          Showing {(pagination.currentPage - 1) * filters.limit + 1} to{" "}
          {Math.min(
            pagination.currentPage * filters.limit,
            pagination.totalUsers,
          )}{" "}
          of {pagination.totalUsers} users
        </div>
      )}

      <div className='overflow-hidden rounded-lg bg-gray-800'>
        <Table>
          <TableHeader>
            <TableRow className='border-gray-600'>
              <TableHead className='w-24 font-semibold text-gray-200'>
                ID
              </TableHead>
              <TableHead
                className='w-12 cursor-pointer font-semibold text-gray-200 hover:bg-gray-700'
                onClick={() => handleSort("username")}
              >
                <div className='flex items-center'>
                  Username {getSortIcon("username")}
                </div>
              </TableHead>
              <TableHead
                className='w-32 cursor-pointer font-semibold text-gray-200 hover:bg-gray-700'
                onClick={() => handleSort("email")}
              >
                <div className='flex items-center'>
                  Email {getSortIcon("email")}
                </div>
              </TableHead>
              <TableHead className='w-24 font-semibold text-gray-200'>
                Name
              </TableHead>
              <TableHead
                className='w-24 cursor-pointer font-semibold text-gray-200 hover:bg-gray-700'
                onClick={() => handleSort("role")}
              >
                <div className='flex items-center'>
                  Role {getSortIcon("role")}
                </div>
              </TableHead>
              <TableHead className='w-24 font-semibold text-gray-200'>
                Status
              </TableHead>
              <TableHead
                className='w-16 cursor-pointer font-semibold text-gray-200 hover:bg-gray-700'
                onClick={() => handleSort("points")}
              >
                <div className='flex items-center'>
                  FC {getSortIcon("points")}
                </div>
              </TableHead>
              <TableHead
                className='w-24 cursor-pointer font-semibold text-gray-200 hover:bg-gray-700'
                onClick={() => handleSort("createdAt")}
              >
                <div className='flex items-center'>
                  Created {getSortIcon("createdAt")}
                </div>
              </TableHead>
              <TableHead className='w-32 font-semibold text-gray-200'>
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className='py-8 text-center text-white'>
                  Loading...
                </TableCell>
              </TableRow>
            ) : (
              users?.map((user) => (
                <TableRow
                  key={user.id}
                  className='border-gray-600 hover:bg-gray-700'
                >
                  <TableCell className='w-24 max-w-24 overflow-hidden font-mono text-xs text-gray-300'>
                    {user.id}
                  </TableCell>
                  <TableCell className='w-12 max-w-24 break-words font-medium text-white'>
                    {user.username}
                  </TableCell>
                  <TableCell className='w-32 break-words text-xs text-gray-300'>
                    {user.email}
                  </TableCell>
                  <TableCell className='w-24 break-words text-xs text-gray-300'>
                    {user.firstName || user.lastName
                      ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                      : "N/A"}
                  </TableCell>
                  <TableCell className='w-12 max-w-24 break-words'>
                    <RoleBadge role={user.role} />
                  </TableCell>
                  <TableCell className='w-24'>
                    <span className='inline-flex items-center rounded-md bg-green-600 px-1 py-0.5 text-xs font-medium text-white ring-1 ring-inset ring-green-500'>
                      {user.status}
                    </span>
                  </TableCell>
                  <TableCell className='w-16 font-mono text-xs text-gray-300'>
                    {user.points.toLocaleString()}
                  </TableCell>
                  <TableCell className='w-24 text-xs text-gray-300'>
                    {formatDate(user.createdAt)}
                  </TableCell>
                  <TableCell className='w-32'>
                    <div className='flex gap-2'>
                      <button
                        className='rounded-lg bg-white px-2 py-1 text-sm font-medium text-black hover:bg-gray-100'
                        onClick={() => {
                          setSelectedUser(user);
                          setIsModalOpen(true);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className='rounded-lg bg-blue-500 px-2 py-1 text-sm font-medium text-white hover:bg-blue-600'
                        onClick={() => {
                          setMessageUser(user);
                          setIsMessageModalOpen(true);
                        }}
                      >
                        Message
                      </button>
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

      <EditUserModal
        user={selectedUser || null}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      <MessageUserModal
        user={messageUser || null}
        isOpen={isMessageModalOpen}
        onClose={() => setIsMessageModalOpen(false)}
      />

      <MessageUsersModal
        isOpen={isBulkMessageOpen}
        onClose={() => setIsBulkMessageOpen(false)}
      />
    </div>
  );
}
