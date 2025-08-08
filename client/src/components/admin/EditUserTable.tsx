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
import RoleBadge from "../ui/RoleBadge";
import EditUserModal from "./EditUserModal";

export default function EditUsers() {
  const { users, isLoading, error } = useAdminView();
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
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
              <TableHead className="text-gray-200 font-semibold w-24">ID</TableHead>
              <TableHead className="text-gray-200 font-semibold w-12">Username</TableHead>
              <TableHead className="text-gray-200 font-semibold w-32">Email</TableHead>
              <TableHead className="text-gray-200 font-semibold w-24">Name</TableHead>
              <TableHead className="text-gray-200 font-semibold w-24">Role</TableHead>
              <TableHead className="text-gray-200 font-semibold w-24">Status</TableHead>
              <TableHead className="text-gray-200 font-semibold w-16">Points</TableHead>
              <TableHead className="text-gray-200 font-semibold w-12">Rank</TableHead>
              <TableHead className="text-gray-200 font-semibold w-32">Last Active</TableHead>
              <TableHead className="text-gray-200 font-semibold w-24">Created</TableHead>
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
      <EditUserModal
        user={selectedUser || null}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}