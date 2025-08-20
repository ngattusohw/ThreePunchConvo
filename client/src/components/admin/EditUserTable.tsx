import React, { useState } from "react";
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
    updateFilters
  } = useAdminView();
  
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  
  if (isLoading) return <div className="text-white">Loading...</div>;
  if (error) return <div className="text-red-400">Error loading users</div>;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handleSort = (column: string) => {
    const newOrder = filters.sortBy === column && filters.sortOrder === 'asc' ? 'desc' : 'asc';
    updateSort(column, newOrder);
  };

  const handleSearch = () => {
    updateSearch(searchInput);
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getSortIcon = (column: string) => {
    if (filters.sortBy !== column) return null;
    return filters.sortOrder === 'asc' ? 
      <ChevronUpIcon className="w-4 h-4 ml-1" /> : 
      <ChevronDownIcon className="w-4 h-4 ml-1" />;
  };

  const renderPagination = () => {
    if (!pagination || pagination.totalPages <= 1) return null;

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
      <Pagination className="mt-6">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              onClick={() => pagination.hasPrevious && goToPage(currentPage - 1)}
              className={cn(
                "text-white hover:bg-gray-700 hover:text-white border-gray-600",
                !pagination.hasPrevious ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
              )}
            />
          </PaginationItem>
          
          {pages.map((page) => (
            <PaginationItem key={page}>
              <PaginationLink
                onClick={() => goToPage(page)}
                isActive={page === currentPage}
                className={cn(
                  "cursor-pointer text-white hover:bg-gray-700 hover:text-white border-gray-600",
                  page === currentPage 
                    ? "bg-gray-700 text-white border-gray-500" 
                    : "hover:bg-gray-700"
                )}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          ))}
          
          <PaginationItem>
            <PaginationNext 
              onClick={() => pagination.hasNext && goToPage(currentPage + 1)}
              className={cn(
                "text-white hover:bg-gray-700 hover:text-white border-gray-600",
                !pagination.hasNext ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
              )}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  return (
    <div className="container mx-auto py-6">
      {/* Search and Filter Controls */}
      <div className="mb-6 flex gap-4 items-center">
        <div className="flex gap-2">
          <Input
            placeholder="Search users..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={handleSearchKeyPress}
            className="w-64"
          />
          <Button onClick={handleSearch} variant="outline">
            Search
          </Button>
        </div>
        
        <div className="flex gap-2 items-center">
          <span className="text-sm text-gray-400">Per page:</span>
          <select
            value={filters.limit}
            onChange={(e) => updateFilters({ limit: parseInt(e.target.value), page: 1 })}
            className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Results Info */}
      {pagination && (
        <div className="mb-4 text-sm text-gray-400">
          Showing {((pagination.currentPage - 1) * filters.limit) + 1} to{' '}
          {Math.min(pagination.currentPage * filters.limit, pagination.totalUsers)} of{' '}
          {pagination.totalUsers} users
        </div>
      )}

      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-600">
              <TableHead className="text-gray-200 font-semibold w-24">ID</TableHead>
              <TableHead 
                className="text-gray-200 font-semibold w-12 cursor-pointer hover:bg-gray-700"
                onClick={() => handleSort('username')}
              >
                <div className="flex items-center">
                  Username {getSortIcon('username')}
                </div>
              </TableHead>
              <TableHead 
                className="text-gray-200 font-semibold w-32 cursor-pointer hover:bg-gray-700"
                onClick={() => handleSort('email')}
              >
                <div className="flex items-center">
                  Email {getSortIcon('email')}
                </div>
              </TableHead>
              <TableHead className="text-gray-200 font-semibold w-24">Name</TableHead>
              <TableHead 
                className="text-gray-200 font-semibold w-24 cursor-pointer hover:bg-gray-700"
                onClick={() => handleSort('role')}
              >
                <div className="flex items-center">
                  Role {getSortIcon('role')}
                </div>
              </TableHead>
              <TableHead className="text-gray-200 font-semibold w-24">Status</TableHead>
              <TableHead 
                className="text-gray-200 font-semibold w-16 cursor-pointer hover:bg-gray-700"
                onClick={() => handleSort('points')}
              >
                <div className="flex items-center">
                  Points {getSortIcon('points')}
                </div>
              </TableHead>
              <TableHead 
                className="text-gray-200 font-semibold w-12 cursor-pointer hover:bg-gray-700"
                onClick={() => handleSort('rank')}
              >
                <div className="flex items-center">
                  Rank {getSortIcon('rank')}
                </div>
              </TableHead>
              <TableHead 
                className="text-gray-200 font-semibold w-32 cursor-pointer hover:bg-gray-700"
                onClick={() => handleSort('lastActive')}
              >
                <div className="flex items-center">
                  Last Active {getSortIcon('lastActive')}
                </div>
              </TableHead>
              <TableHead 
                className="text-gray-200 font-semibold w-24 cursor-pointer hover:bg-gray-700"
                onClick={() => handleSort('createdAt')}
              >
                <div className="flex items-center">
                  Created {getSortIcon('createdAt')}
                </div>
              </TableHead>
              <TableHead className="text-gray-200 font-semibold w-16">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map((user) => (
              <TableRow key={user.id} className="border-gray-600 hover:bg-gray-700">
                <TableCell className="font-mono text-xs text-gray-300 w-24 max-w-24 overflow-hidden">
                  {user.id}
                </TableCell>
                <TableCell className="font-medium text-white w-12 max-w-24 break-words">
                  {user.username}
                </TableCell>
                <TableCell className="text-gray-300 text-xs w-32 break-words">
                  {user.email}
                </TableCell>
                <TableCell className="text-gray-300 text-xs w-24 break-words">
                  {user.firstName || user.lastName 
                    ? `${user.firstName || ''} ${user.lastName || ''}`.trim() 
                    : 'N/A'
                  }
                </TableCell>
                <TableCell className="w-12 max-w-24 break-words">
                    <RoleBadge role={user.role} />
                </TableCell>
                <TableCell className="w-24">
                  <span className="inline-flex items-center rounded-md bg-green-600 px-1 py-0.5 text-xs font-medium text-white ring-1 ring-inset ring-green-500">
                    {user.status}
                  </span>
                </TableCell>
                <TableCell className="text-gray-300 font-mono text-xs w-16">
                  {user.points.toLocaleString()}
                </TableCell>
                <TableCell className="text-gray-300 font-mono text-xs w-12">
                  #{user.rank}
                </TableCell>
                <TableCell className="text-gray-300 text-xs w-32">
                  {formatDateTime(user.lastActive)}
                </TableCell>
                <TableCell className="text-gray-300 text-xs w-24">
                  {formatDate(user.createdAt)}
                </TableCell>
                <TableCell className="w-16">
                  <button className="text-black hover:bg-gray-100 text-md font-medium bg-white rounded-lg px-3 py-1"
                    onClick={() => {
                      setSelectedUser(user);
                      setIsModalOpen(true);
                    }}
                  >
                    Edit
                  </button>
                </TableCell>
              </TableRow>
            ))}
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
    </div>
  );
}