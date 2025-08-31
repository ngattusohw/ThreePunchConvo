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
import { inviteFighter, generateFighterInviteLink } from "@/api/queries/admin";
import type { FighterInvitationFormData } from "@/lib/types";
import { Copy, Check } from "lucide-react";

interface InviteFighterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InviteFighterModal({ isOpen, onClose }: InviteFighterModalProps) {
  const [isCopied, setIsCopied] = React.useState(false);
  
  const form = useForm<FighterInvitationFormData>({
    defaultValues: {
      email: "",
      fighterName: "",
    },
  });

  const { mutate: sendInvitation, isPending: isSending } = useMutation({
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
          description: error.message || "Failed to send invitation. Please try again.", 
          variant: "destructive" 
        });
        console.error("Error sending fighter invitation:", error);
      },
  });

  const { mutate: generateLink, isPending: isGenerating } = useMutation({
    mutationFn: generateFighterInviteLink,
    onSuccess: async (data) => {
      try {
        await navigator.clipboard.writeText(data.url);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
        
        toast({ 
          title: "Success", 
          description: data.invitation.isExisting 
            ? "Existing invitation link copied to clipboard!" 
            : "New invitation link generated and copied to clipboard!" 
        });
        form.reset();
        onClose();
      } catch (clipboardError) {
        console.error("Failed to copy to clipboard:", clipboardError);
        toast({ 
          title: "Link Generated", 
          description: `Invitation link: ${data.url}`,
          variant: "default"
        });
      }
    },
    onError: (error) => {
        toast({ 
          title: "Error", 
          description: error.message || "Failed to generate invitation link. Please try again.", 
          variant: "destructive" 
        });
        console.error("Error generating fighter invitation link:", error);
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

  const handleGenerateLink = () => {
    const formData = form.getValues();
    const payload = {
      email: formData.email,
      ...(formData.fighterName.trim() && { fighterName: formData.fighterName.trim() }),
    };
    
    generateLink(payload);
  };

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      form.reset({ email: "", fighterName: "" });
      setIsCopied(false);
    }
  }, [isOpen, form]);

  const isPending = isSending || isGenerating;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Fighter</DialogTitle>
          <DialogDescription>
            Send an invitation email or generate a link to invite a fighter to join the platform with verified fighter status.
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
        
        <DialogFooter className="flex flex-col gap-3 sm:flex-row sm:gap-3 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            disabled={isPending}
            className="h-11 w-full sm:w-auto"
          >
            Cancel
          </Button>
          
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-2 w-full sm:w-auto">
            <Button 
              onClick={() => {
                const isValid = form.trigger();
                if (isValid) {
                  handleGenerateLink();
                }
              }}
              disabled={isPending || !form.watch("email")}
              variant="outline"
              className="h-11 border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold px-4 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] w-full sm:w-auto"
            >
              {isGenerating ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                  Generating...
                </>
              ) : (
                <>
                  {isCopied ? (
                    <Check className="mr-2 h-4 w-4" />
                  ) : (
                    <Copy className="mr-2 h-4 w-4" />
                  )}
                  Generate Link
                </>
              )}
            </Button>
            
            <Button 
              onClick={form.handleSubmit(handleSubmit)}
              disabled={isPending}
              className="h-11 bg-red-600 hover:bg-red-700 text-white font-semibold px-4 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] w-full sm:w-auto"
            >
              {isSending ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Sending...
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
                  Send Email
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 