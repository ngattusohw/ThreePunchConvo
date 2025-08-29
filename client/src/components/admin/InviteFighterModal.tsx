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
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { inviteFighter } from "@/api/queries/admin";
import type { FighterInvitationFormData } from "@/lib/types";

interface InviteFighterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InviteFighterModal({ isOpen, onClose }: InviteFighterModalProps) {
  const form = useForm<FighterInvitationFormData>({
    defaultValues: {
      email: "",
      fighterName: "",
    },
  });

  const { mutate: sendInvitation, isPending } = useMutation({
    mutationFn: inviteFighter,
    onSuccess: (data) => {
      toast({ 
        title: "Success", 
        description: `Fighter invitation sent to ${data.invitation.email}!` 
      });
      form.reset();
      onClose();
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: "Failed to send invitation. Please try again.", 
        variant: "destructive" 
      });
      console.error("Error sending fighter invitation:", error);
    },
  });

  const handleSubmit = (data: FighterInvitationFormData) => {
    // Only send non-empty optional fields
    const payload = {
      email: data.email,
      ...(data.fighterName.trim() && { fighterName: data.fighterName.trim() }),
    };
    
    sendInvitation(payload);
  };

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      form.reset({ email: "", fighterName: "" });
    }
  }, [isOpen, form]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Fighter</DialogTitle>
          <DialogDescription>
            Send an invitation to a fighter to join the platform with verified fighter status.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              rules={{ 
                required: "Email address is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Please enter a valid email address"
                }
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address *</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="email" 
                      placeholder="fighter@email.com"
                      disabled={isPending}
                      className="h-11"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="fighterName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fighter Name (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="e.g., Conor McGregor"
                      disabled={isPending}
                      className="h-11"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        
        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            disabled={isPending}
            className="h-11"
          >
            Cancel
          </Button>
          <Button 
            onClick={form.handleSubmit(handleSubmit)}
            disabled={isPending}
            className="h-11 bg-red-600 hover:bg-red-700 text-white font-semibold px-8 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
          >
            {isPending ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Sending Invitation...
              </>
            ) : (
              <>
                <svg 
                  className="mr-2 h-4 w-4" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" 
                  />
                </svg>
                Send Fighter Invitation
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 