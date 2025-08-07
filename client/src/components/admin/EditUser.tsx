import React from "react";
import { useAdminView } from "@/api/hooks/useAdminView";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function EditUsers() {
  const { users, isLoading, error } = useAdminView();

  if (isLoading) return <div className="text-white">Loading...</div>;
  if (error) return <div className="text-red-400">Error loading users</div>;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6 text-white">Edit Users</h1>
      
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-600">
              <TableHead className="text-gray-200 font-semibold">ID</TableHead>
              <TableHead className="text-gray-200 font-semibold">Username</TableHead>
              <TableHead className="text-gray-200 font-semibold">Email</TableHead>
              <TableHead className="text-gray-200 font-semibold">Name</TableHead>
              <TableHead className="text-gray-200 font-semibold">Role</TableHead>
              <TableHead className="text-gray-200 font-semibold">Status</TableHead>
              <TableHead className="text-gray-200 font-semibold">Online</TableHead>
              <TableHead className="text-gray-200 font-semibold">Points</TableHead>
              <TableHead className="text-gray-200 font-semibold">Rank</TableHead>
              <TableHead className="text-gray-200 font-semibold">Last Active</TableHead>
              <TableHead className="text-gray-200 font-semibold">Created</TableHead>
              <TableHead className="text-gray-200 font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map((user) => (
              <TableRow key={user.id} className="border-gray-600 hover:bg-gray-700">
                <TableCell className="font-mono text-sm text-gray-300">
                  {user.id}
                </TableCell>
                <TableCell className="font-medium text-white">
                  {user.username}
                </TableCell>
                <TableCell className="text-gray-300">
                  {user.email}
                </TableCell>
                <TableCell className="text-gray-300">
                  {user.firstName || user.lastName 
                    ? `${user.firstName || ''} ${user.lastName || ''}`.trim() 
                    : 'N/A'
                  }
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center rounded-md bg-blue-600 px-2 py-1 text-xs font-medium text-white ring-1 ring-inset ring-blue-500">
                    {user.role}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center rounded-md bg-green-600 px-2 py-1 text-xs font-medium text-white ring-1 ring-inset ring-green-500">
                    {user.status}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                    user.isOnline 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.isOnline ? 'Online' : 'Offline'}
                  </span>
                </TableCell>
                <TableCell className="text-gray-300 font-mono">
                  {user.points.toLocaleString()}
                </TableCell>
                <TableCell className="text-gray-300 font-mono">
                  #{user.rank}
                </TableCell>
                <TableCell className="text-gray-300 text-sm">
                  {formatDateTime(user.lastActive)}
                </TableCell>
                <TableCell className="text-gray-300 text-sm">
                  {formatDate(user.createdAt)}
                </TableCell>
                <TableCell>
                  <button className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                    Edit
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}