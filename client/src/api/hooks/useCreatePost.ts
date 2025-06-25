import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import { useMemoizedUser } from "@/hooks/useMemoizedUser";
import {
  createThread,
  uploadImages,
  CreateThreadParams,
} from "../queries/thread";
import { useToast } from "@/hooks/use-toast";

interface UseCreatePostOptions {
  onSuccess?: () => void;
  onUpgradeRequired?: () => void;
  categoryId: string;
}

export function useCreatePost({
  onSuccess,
  onUpgradeRequired,
  categoryId,
}: UseCreatePostOptions) {
  const { toast } = useToast();
  const { user } = useMemoizedUser();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  // Upload images state
  const [uploadingImages, setUploadingImages] = useState(false);

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async ({
      title,
      content,
      categoryId,
      poll,
      selectedImages = [],
    }: {
      title: string;
      content: string;
      categoryId: string;
      poll?: {
        question: string;
        options: string[];
      };
      selectedImages?: File[];
    }) => {
      if (!user) {
        throw new Error("You must be logged in to create a post");
      }

      // Upload images first if any are selected
      let mediaUrls: string[] = [];
      if (selectedImages.length > 0) {
        setUploadingImages(true);
        try {
          mediaUrls = await uploadImages(selectedImages, getToken);
        } finally {
          setUploadingImages(false);
        }
      }

      // Create media objects for the post
      const media = mediaUrls.map((url) => ({
        type: "IMAGE",
        url: url,
      }));

      // Prepare params for thread creation
      const params: CreateThreadParams = {
        title,
        content,
        categoryId,
        userId: user.id,
        poll: poll,
        media: media.length > 0 ? media : undefined,
      };

      return createThread(params);
    },
    onSuccess: () => {
      // Invalidate the specific thread queries to refetch the thread list
      // Invalidate pinned threads query
      queryClient.invalidateQueries({
        queryKey: [`/api/threads/${categoryId}`, "pinned"],
      });

      // Invalidate regular threads queries for this category - all filter options
      queryClient.invalidateQueries({
        queryKey: [`/api/threads/${categoryId}`],
      });

      toast({
        title: "Success!",
        description: "Your post has been created.",
        variant: "default",
      });

      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: any) => {
      console.log("Error from create post:", error);
      // Direct check for UPGRADE_REQUIRED error object
      if (error && error.error === "UPGRADE_REQUIRED") {
        if (onUpgradeRequired) {
          onUpgradeRequired();
        }
        return;
      }

      // Show a regular error toast for other errors
      toast({
        title: "Error",
        description:
          error.message || "Failed to create post. Please try again.",
        variant: "destructive",
      });
    },
  });

  return {
    createPost: createPostMutation.mutate,
    isPending: createPostMutation.isPending,
    uploadingImages,
    isUploading: uploadingImages,
  };
}
