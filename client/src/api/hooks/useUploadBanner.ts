import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import { useToast } from "@/hooks/use-toast";

interface UseUploadBannerOptions {
  onSuccess?: (url: string) => void;
  onError?: (error: Error) => void;
}

export function useUploadBanner(options: UseUploadBannerOptions = {}) {
  const { getToken } = useAuth();
  const { toast } = useToast();

  const uploadBannerMutation = useMutation({
    mutationFn: async (file: File) => {
      // Validate file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        throw new Error("File size must be less than 50MB");
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        throw new Error("Please select a valid image file");
      }

      const formData = new FormData();
      formData.append("image", file);

      const token = await getToken();
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to upload ${file.name}`);
      }

      const data = await response.json();
      return data.url;
    },
    onSuccess: (url: string) => {
      toast({
        title: "Banner Uploaded",
        description: "Your banner has been successfully uploaded.",
      });

      options.onSuccess?.(url);
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description:
          error.message || "Failed to upload banner. Please try again.",
        variant: "destructive",
      });

      options.onError?.(error);
    },
  });

  return {
    uploadBanner: uploadBannerMutation.mutate,
    uploadBannerAsync: uploadBannerMutation.mutateAsync,
    isUploading: uploadBannerMutation.isPending,
    error: uploadBannerMutation.error,
    reset: uploadBannerMutation.reset,
  };
}
