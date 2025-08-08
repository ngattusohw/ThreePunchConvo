import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import RoleBadge from "../ui/RoleBadge";
import { USER_ROLES as USER_ROLE_OPTIONS } from "@/lib/constants";

// Define the form data type
type EditUserFormData = {
  role: string;
};

interface EditUserModalProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: (userData: EditUserFormData) => void;
}

export default function EditUserModal({ user, isOpen, onClose, onSave }: EditUserModalProps) {
  const form = useForm<EditUserFormData>({
    defaultValues: {
      role: user?.role || "USER",
    },
  });

  const handleSaveUser = async (userData: EditUserFormData) => {
    try {
      // TODO: Implement API call to update user
      console.log("Updating user:", user.id, userData);
      
      // For now, just log the data
      // In a real implementation, you'd call an API endpoint like:
      // await updateUser(selectedUser.id, userData);
      
      alert("User updated successfully!");
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Failed to update user");
    }
  };

  const handleSubmit = (data: EditUserFormData) => {
    handleSaveUser(data);
    onClose();
  };

  // Reset form when user changes
  useEffect(() => {
    if (user) {
      form.reset({
        role: user.role || "USER",
      });
    }
  }, [user, form]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-gray-800 border-gray-600">
        <DialogHeader>
          <DialogTitle className="text-white">
            Edit User <span className="text-ufc-red font-bold">{user?.username}</span>
          </DialogTitle>
          <DialogDescription className="text-gray-200">
            Name: {user?.firstName || user?.lastName 
                    ? `${user?.firstName || ''} ${user?.lastName || ''}`.trim() 
                    : 'N/A'
                  }
        </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-200">Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        {Object.values(USER_ROLE_OPTIONS).map((role) => (
                          <SelectItem
                            key={role}
                            value={role}
                            className="text-white hover:bg-gray-600"
                          >
                            {role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
        </div>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="border-gray-600 text-black hover:bg-gray-300"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
