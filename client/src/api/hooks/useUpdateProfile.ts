import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@clerk/clerk-react";

interface UpdateProfileData {
  userId: string;
  bio?: string;
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    youtube?: string;
    facebook?: string;
  };
  coverPhotoUrl?: string;
}

interface UseUpdateProfileOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useUpdateProfile(options: UseUpdateProfileOptions = {}) {
  const { toast } = useToast();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: UpdateProfileData) => {
      if (!profileData.userId) {
        throw new Error("You must be logged in to update your profile");
      }

      const token = await getToken();

      const response = await fetch(`/api/users/${profileData.userId}/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update profile");
      }

      return response.json();
    },
    onSuccess: (_, profileData) => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });

      // Invalidate all user-related queries
      queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey;
          const shouldInvalidate = queryKey.some(
            (key) => typeof key === "string" && key.includes("/api/users/"),
          );
          if (shouldInvalidate) {
            console.log("Invalidating query:", queryKey);
          }
          return shouldInvalidate;
        },
      });

      options.onSuccess?.();
    },
    onError: (error: Error) => {
      console.error("Error updating profile:", error);
      toast({
        title: "Update Failed",
        description:
          error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });

      options.onError?.(error);
    },
  });

  return {
    updateProfile: updateProfileMutation.mutate,
    updateProfileAsync: updateProfileMutation.mutateAsync,
    isUpdating: updateProfileMutation.isPending,
    error: updateProfileMutation.error,
    reset: updateProfileMutation.reset,
  };
}
