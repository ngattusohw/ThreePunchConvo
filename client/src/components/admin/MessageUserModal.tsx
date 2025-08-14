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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sendMessageToUser } from "@/api/queries/admin";
import { toast } from "@/hooks/use-toast";

// Define the form data type
type MessageFormData = {
  message: string;
};

interface MessageUserModalProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function MessageUserModal({ user, isOpen, onClose }: MessageUserModalProps) {
  const queryClient = useQueryClient();
  
  const form = useForm<MessageFormData>({
    defaultValues: {
      message: "",
    },
  });

  const { mutate: sendMessage, isPending } = useMutation({
    mutationFn: ({ userId, message }: { userId: string; message: string }) => 
      sendMessageToUser(userId, message),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Message sent successfully to user.",
      });
      form.reset();
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
      console.error("Error sending message:", error);
    },
  });

  const handleSendMessage = async (formData: MessageFormData) => {
    if (!user?.id || !formData.message.trim()) {
      return;
    }

    sendMessage({
      userId: user.id,
      message: formData.message.trim(),
    });
  };

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      form.reset({ message: "" });
    }
  }, [isOpen, form]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Send Message to User</DialogTitle>
          <DialogDescription>
            Send a notification message to {user?.username || "this user"}.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSendMessage)} className="space-y-4">
            <FormField
              control={form.control}
              name="message"
              rules={{
                required: "Message is required",
                minLength: {
                  value: 1,
                  message: "Message cannot be empty",
                },
                maxLength: {
                  value: 500,
                  message: "Message cannot exceed 500 characters",
                },
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter your message to the user..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                  <div className="text-sm text-gray-500">
                    {field.value.length}/500 characters
                  </div>
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