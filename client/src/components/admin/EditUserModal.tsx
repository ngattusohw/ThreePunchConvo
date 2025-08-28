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
import { Button } from "@/components/ui/button";
import { USER_ROLES as USER_ROLE_OPTIONS } from "@/lib/constants";
import { updateUserRole } from "@/api/queries/admin";

// Define the form data type
type EditUserFormData = {
  role: string;
};

interface EditUserModalProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditUserModal({
  user,
  isOpen,
  onClose,
}: EditUserModalProps) {
  const form = useForm<EditUserFormData>({
    defaultValues: {
      role: user?.role || "USER",
    },
  });

  const handleSaveUser = async (userData: EditUserFormData) => {
    try {
      // TODO: Implement API call to update user
      updateUserRole(user.id, userData.role);

      alert("User updated successfully! Reload the page to see the changes.");
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
      <DialogContent className='max-w-md border-gray-600 bg-gray-800 [&>button]:text-white [&>button]:hover:bg-gray-700 [&>button]:hover:text-white'>
        <DialogHeader>
          <DialogTitle className='text-white'>
            Edit User{" "}
            <span className='text-ufc-red font-bold'>{user?.username}</span>
          </DialogTitle>
          <DialogDescription className='text-gray-200'>
            Name:{" "}
            {user?.firstName || user?.lastName
              ? `${user?.firstName || ""} ${user?.lastName || ""}`.trim()
              : "N/A"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className='space-y-4'
          >
            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='role'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-gray-200'>Role</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className='border-gray-600 bg-gray-700 text-white'>
                          <SelectValue placeholder='Select role' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className='border-gray-600 bg-gray-700'>
                        {Object.values(USER_ROLE_OPTIONS)
                          .filter(
                            (role) => role !== "MODERATOR" && role !== "ADMIN",
                          )
                          .map((role) => (
                            <SelectItem
                              key={role}
                              value={role}
                              className='text-white hover:bg-gray-600'
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
            <DialogFooter className='gap-2'>
              <Button
                type='button'
                variant='outline'
                onClick={onClose}
                className='border-gray-600 text-black hover:bg-gray-300'
              >
                Cancel
              </Button>
              <Button
                type='submit'
                className='bg-blue-600 text-white hover:bg-blue-700'
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
