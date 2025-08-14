import React from "react";
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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { USER_ROLES as USER_ROLE_OPTIONS } from "@/lib/constants";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { sendMessageToUsers } from "@/api/queries/admin";
import type { UserRole } from "@/lib/types";

// Define the form data type
type MessageUsersFormData = {
  targetRole: string; // "ALL" or one of UserRole
  message: string;
};

interface MessageUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ALL_VALUE = "ALL";

export default function MessageUsersModal({ isOpen, onClose }: MessageUsersModalProps) {
  const form = useForm<MessageUsersFormData>({
    defaultValues: {
      targetRole: ALL_VALUE,
      message: "",
    },
  });

  const { mutate: sendBulkMessage, isPending } = useMutation({
    mutationFn: ({ targetRole, message }: { targetRole: string; message: string }) =>
      sendMessageToUsers(targetRole === ALL_VALUE ? null : targetRole, message),
    onSuccess: (data: any) => {
      toast({
        title: "Success",
        description: data?.count ? `Message sent to ${data.count} user${data.count === 1 ? '' : 's'}.` : "Message sent.",
      });
      form.reset({ targetRole: ALL_VALUE, message: "" });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send messages. Please try again.",
        variant: "destructive",
      });
      console.error("Error sending bulk message:", error);
    },
  });

  const handleSend = (values: MessageUsersFormData) => {
    if (!values.message.trim()) return;
    sendBulkMessage({ targetRole: values.targetRole, message: values.message.trim() });
  };

  React.useEffect(() => {
    if (isOpen) {
      form.reset({ targetRole: ALL_VALUE, message: "" });
    }
  }, [isOpen, form]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Send Message to Users</DialogTitle>
          <DialogDescription>
            Send a notification to all users or users of a specific role.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSend)} className="space-y-4">
            <FormField
              control={form.control}
              name="targetRole"
              rules={{ required: true }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select target users" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL_VALUE}>All Users</SelectItem>
                        {Object.values(USER_ROLE_OPTIONS).map((role) => (
                          <SelectItem key={role} value={role}>{role.replace("_", " ")}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              rules={{
                required: "Message is required",
                minLength: { value: 1, message: "Message cannot be empty" },
                maxLength: { value: 500, message: "Message cannot exceed 500 characters" },
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter your message to users..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                  <div className="text-sm text-gray-500">{field.value.length}/500 characters</div>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Sending..." : "Send Message"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 