import React from "react";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { FORUM_CATEGORIES } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { useUser, useAuth } from "@clerk/clerk-react";

interface CreatePostModalProps {
  onClose: () => void;
  categoryId: string;
}

export default function CreatePostModal({
  onClose,
  categoryId,
}: CreatePostModalProps) {
  const { toast } = useToast();
  const { user } = useUser();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState(categoryId);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Image attachment state
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Upload images to Volume and return URLs
  const uploadImages = async (files: File[]): Promise<string[]> => {
    const uploadPromises = files.map(async (file) => {
      const formData = new FormData();
      formData.append('image', file);
      
      // Get Clerk token for authentication
      const token = await getToken();
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Failed to upload ${file.name}`);
      }
      
      const data = await response.json();
      return data.url;
    });
    
    return Promise.all(uploadPromises);
  };

  // Simple poll state
  const [includePoll, setIncludePoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);

  // Create new post mutation
  const createPostMutation = useMutation({
    mutationFn: async ({
      title,
      content,
      categoryId,
      poll,
    }: {
      title: string;
      content: string;
      categoryId: string;
      poll?: {
        question: string;
        options: string[];
      };
    }) => {
      if (!user) {
        throw new Error("You must be logged in to create a post");
      }

      // Upload images first if any are selected
      let mediaUrls: string[] = [];
      if (selectedImages.length > 0) {
        setUploadingImages(true);
        try {
          mediaUrls = await uploadImages(selectedImages);
        } finally {
          setUploadingImages(false);
        }
      }

      // Create media objects for the post
      const media = mediaUrls.map(url => ({
        type: 'IMAGE',
        url: url
      }));

      const response = await apiRequest("POST", "/api/threads", {
        title,
        content,
        categoryId,
        userId: user.id,
        poll: includePoll ? poll : undefined,
        media: media.length > 0 ? media : undefined,
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.error === "UPGRADE_REQUIRED") {
          throw errorData; // Throw the complete error object
        }
        throw new Error(errorData.message || "Failed to create post");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate the threads query to refetch the thread list
      queryClient.invalidateQueries({ queryKey: [`/api/threads/${category}`] });

      toast({
        title: "Success!",
        description: "Your post has been created.",
        variant: "default",
      });
      onClose();
    },
    onError: (error: any) => {
      // Direct check for UPGRADE_REQUIRED error object
      if (error && error.error === "UPGRADE_REQUIRED") {
        // Show the upgrade modal
        setShowUpgradeModal(true);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a title for your post.",
        variant: "destructive",
      });
      return;
    }

    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Please enter some content for your post.",
        variant: "destructive",
      });
      return;
    }

    if (includePoll) {
      if (!pollQuestion.trim()) {
        toast({
          title: "Error",
          description: "Please enter a question for your poll.",
          variant: "destructive",
        });
        return;
      }

      const validOptions = pollOptions.filter((option) => option.trim());
      if (validOptions.length < 2) {
        toast({
          title: "Error",
          description: "Please enter at least two options for your poll.",
          variant: "destructive",
        });
        return;
      }

      createPostMutation.mutate({
        title,
        content,
        categoryId: category,
        poll: {
          question: pollQuestion,
          options: validOptions,
        },
      });
    } else {
      createPostMutation.mutate({
        title,
        content,
        categoryId: category,
      });
    }
  };

  const handleAddPollOption = () => {
    setPollOptions([...pollOptions, ""]);
  };

  const handlePollOptionChange = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const handleRemovePollOption = (index: number) => {
    if (pollOptions.length <= 2) return;
    const newOptions = [...pollOptions];
    newOptions.splice(index, 1);
    setPollOptions(newOptions);
  };

  const handleUpgrade = () => {
    // Keep the modal open until we navigate to avoid 404 flash
    // Use setTimeout to let the current event loop complete before navigation
    setTimeout(() => {
      window.location.href = "/checkout";
    }, 100);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      {showUpgradeModal ? (
        <div className="bg-dark-gray mx-4 w-full max-w-md rounded-lg p-6">
          <div className="mb-6 text-center">
            <div className="bg-ufc-blue mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-black"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-xl font-bold text-white">
              Upgrade Required
            </h3>
            <p className="text-gray-300">
              Creating new posts is only available for paid members. Upgrade
              your plan to start sharing content!
            </p>
          </div>

          <div className="flex flex-col space-y-3">
            <button
              onClick={handleUpgrade}
              className="bg-ufc-blue hover:bg-ufc-blue-dark w-full rounded-lg py-2 font-medium text-black transition"
            >
              Upgrade Now
            </button>
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="w-full rounded-lg border border-gray-600 bg-transparent py-2 font-medium text-white transition hover:bg-gray-800"
            >
              Maybe Later
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-dark-gray mx-4 w-full max-w-2xl overflow-hidden rounded-lg shadow-xl">
          <div className="bg-ufc-black flex items-center justify-between border-b border-gray-800 p-4">
            <h3 className="text-lg font-bold text-white">Create New Post</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="p-4">
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label
                  htmlFor="post-title"
                  className="mb-2 block font-medium text-gray-300"
                >
                  Title
                </label>
                <input
                  type="text"
                  id="post-title"
                  placeholder="What's your topic about?"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="focus:ring-ufc-blue w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:outline-none focus:ring-1"
                />
              </div>

              <div className="mb-4">
                <label
                  htmlFor="post-category"
                  className="mb-2 block font-medium text-gray-300"
                >
                  Category
                </label>
                <select
                  id="post-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="focus:ring-ufc-blue w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:outline-none focus:ring-1"
                >
                  {FORUM_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label
                  htmlFor="post-content"
                  className="mb-2 block font-medium text-gray-300"
                >
                  Content
                </label>
                <textarea
                  id="post-content"
                  rows={6}
                  placeholder="Share your thoughts..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="focus:ring-ufc-blue w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:outline-none focus:ring-1"
                />
              </div>

              {/* Image Preview Section */}
              {selectedImages.length > 0 && (
                <div className="mb-4">
                  <label className="mb-2 block font-medium text-gray-300">
                    Selected Images ({selectedImages.length}/5)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {selectedImages.map((file, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Upload ${index + 1}`}
                          className="h-20 w-20 rounded-lg object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedImages(prev => prev.filter((_, i) => i !== index));
                          }}
                          className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                        >
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {includePoll && (
                <div className="mb-4 rounded-lg bg-gray-800 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <label
                      htmlFor="poll-question"
                      className="block font-medium text-gray-300"
                    >
                      Poll Question
                    </label>
                    <button
                      type="button"
                      onClick={() => setIncludePoll(false)}
                      className="text-gray-400 hover:text-white"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="mb-3">
                    <input
                      type="text"
                      id="poll-question"
                      placeholder="Ask a question..."
                      value={pollQuestion}
                      onChange={(e) => setPollQuestion(e.target.value)}
                      className="focus:ring-ufc-blue w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-white focus:outline-none focus:ring-1"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="mb-1 block font-medium text-gray-300">
                      Options
                    </label>
                    {pollOptions.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          placeholder={`Option ${index + 1}`}
                          value={option}
                          onChange={(e) =>
                            handlePollOptionChange(index, e.target.value)
                          }
                          className="focus:ring-ufc-blue flex-grow rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-white focus:outline-none focus:ring-1"
                        />
                        {pollOptions.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemovePollOption(index)}
                            className="hover:bg-ufc-blue-dark text-gray-400"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={handleAddPollOption}
                      className="text-ufc-blue mt-2 flex items-center text-sm font-medium hover:text-white"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="mr-1 h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Add Option
                    </button>
                  </div>
                </div>
              )}

              <div className="mb-4">
                <div className="flex space-x-4">
                  <button 
                    type="button" 
                    onClick={() => document.getElementById('image-upload')?.click()}
                    className="flex items-center text-gray-300 hover:text-white"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Add Image ({selectedImages.length})
                  </button>

                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setSelectedImages(prev => [...prev, ...files].slice(0, 5)); // Max 5 images
                    }}
                  />

                  {/* <button type="button" className="flex items-center text-gray-300 hover:text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Add Emoji
                  </button> */}

                  <button
                    type="button"
                    onClick={() => setIncludePoll(!includePoll)}
                    className={`flex items-center ${includePoll ? "text-ufc-blue" : "text-gray-300 hover:text-white"}`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="mr-1 h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                      />
                    </svg>
                    {includePoll ? "Remove Poll" : "Create Poll"}
                  </button>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg bg-gray-700 px-4 py-2 text-sm text-white transition hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createPostMutation.isPending || uploadingImages}
                  className={`bg-ufc-blue hover:bg-ufc-blue-dark rounded-lg px-4 py-2 text-sm text-black transition ${createPostMutation.isPending || uploadingImages ? "cursor-not-allowed opacity-70" : ""}`}
                >
                  {uploadingImages ? (
                    <span className="flex items-center">
                      <svg
                        className="-ml-1 mr-2 h-4 w-4 animate-spin text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Uploading Images...
                    </span>
                  ) : createPostMutation.isPending ? (
                    <span className="flex items-center">
                      <svg
                        className="-ml-1 mr-2 h-4 w-4 animate-spin text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Creating...
                    </span>
                  ) : (
                    "Create Post"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
