import React from "react";
import { useState, useEffect, useRef } from "react";
import { FORUM_CATEGORIES } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@clerk/clerk-react";
import ImageUpload from "@/components/ui/image-upload";
import { useCreatePost } from "@/api";

// Global temporary file storage that persists across component remounts
const globalFileStorage = new Map<string, File>();
const TEMP_FILE_KEY = 'createPost_tempFile';

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
  
  // Track if the modal is being intentionally closed vs just remounting
  const intentionalCloseRef = useRef(false);
  
  // Persistent form state that survives component remounts
  const [title, setTitle] = useState(() => {
    try {
      return sessionStorage.getItem('createPost_title') || "";
    } catch {
      return "";
    }
  });
  
  const [content, setContent] = useState(() => {
    try {
      return sessionStorage.getItem('createPost_content') || "";
    } catch {
      return "";
    }
  });
  
  const [category, setCategory] = useState(() => {
    try {
      return sessionStorage.getItem('createPost_category') || categoryId;
    } catch {
      return categoryId;
    }
  });
  
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Image attachment state
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  
  // Simple poll state with persistence
  const [includePoll, setIncludePoll] = useState(() => {
    try {
      return sessionStorage.getItem('createPost_includePoll') === 'true';
    } catch {
      return false;
    }
  });
  
  const [pollQuestion, setPollQuestion] = useState(() => {
    try {
      return sessionStorage.getItem('createPost_pollQuestion') || "";
    } catch {
      return "";
    }
  });
  
  const [pollOptions, setPollOptions] = useState<string[]>(() => {
    try {
      const saved = sessionStorage.getItem('createPost_pollOptions');
      return saved ? JSON.parse(saved) : ["", ""];
    } catch {
      return ["", ""];
    }
  });

  // Save form state to sessionStorage whenever it changes
  useEffect(() => {
    try {
      sessionStorage.setItem('createPost_title', title);
    } catch (error) {
      console.warn('Failed to save title to sessionStorage:', error);
    }
  }, [title]);

  useEffect(() => {
    try {
      sessionStorage.setItem('createPost_content', content);
    } catch (error) {
      console.warn('Failed to save content to sessionStorage:', error);
    }
  }, [content]);

  useEffect(() => {
    try {
      sessionStorage.setItem('createPost_category', category);
    } catch (error) {
      console.warn('Failed to save category to sessionStorage:', error);
    }
  }, [category]);

  useEffect(() => {
    try {
      sessionStorage.setItem('createPost_includePoll', includePoll.toString());
    } catch (error) {
      console.warn('Failed to save includePoll to sessionStorage:', error);
    }
  }, [includePoll]);

  useEffect(() => {
    try {
      sessionStorage.setItem('createPost_pollQuestion', pollQuestion);
    } catch (error) {
      console.warn('Failed to save pollQuestion to sessionStorage:', error);
    }
  }, [pollQuestion]);

  useEffect(() => {
    try {
      sessionStorage.setItem('createPost_pollOptions', JSON.stringify(pollOptions));
    } catch (error) {
      console.warn('Failed to save pollOptions to sessionStorage:', error);
    }
  }, [pollOptions]);

  // Clear form data when modal is intentionally closed
  const clearFormData = () => {
    try {
      // Clear global file storage
      globalFileStorage.delete(TEMP_FILE_KEY);
      
      // Clear sessionStorage
      sessionStorage.removeItem('createPost_title');
      sessionStorage.removeItem('createPost_content');
      sessionStorage.removeItem('createPost_category');
      sessionStorage.removeItem('createPost_includePoll');
      sessionStorage.removeItem('createPost_pollQuestion');
      sessionStorage.removeItem('createPost_pollOptions');
      console.log('Form data cleared from all storage');
    } catch (error) {
      console.warn('Failed to clear form data from storage:', error);
    }
  };

  // Consistent close handler that always clears data
  const handleClose = () => {
    console.log('Modal closing - clearing all persistent data');
    intentionalCloseRef.current = true; // Mark as intentional close
    clearFormData();
    onClose();
  };

  // Essential: Restore images and handle cleanup on component lifecycle
  useEffect(() => {
    // Try to restore image from global storage
    const globalFile = globalFileStorage.get(TEMP_FILE_KEY);
    if (globalFile) {
      setSelectedImages([globalFile]);
    }

    return () => {
      // Only clear storage if this was an intentional close
      if (intentionalCloseRef.current) {
        clearFormData();
      }
    };
  }, []);

  // Use the new custom hook
  const { 
    createPost, 
    isPending, 
    isUploading 
  } = useCreatePost({
    onSuccess: () => {
      // Mark as intentional close and clear all persistent data on successful post creation
      intentionalCloseRef.current = true;
      clearFormData();
      console.log('Post created successfully, cleared all persistent data');
      onClose();
    },
    onUpgradeRequired: () => {
      setShowUpgradeModal(true);
    },
    categoryId: category
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

      createPost({
        title,
        content,
        categoryId: category,
        poll: {
          question: pollQuestion,
          options: validOptions,
        },
        selectedImages,
      });
    } else {
      createPost({
        title,
        content,
        categoryId: category,
        selectedImages,
      });
    }
  };

  const handleAddPollOption = () => {
    if (pollOptions.length < 6) {
      setPollOptions([...pollOptions, ""]);
    }
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

  const handleImageSelection = (validatedFiles: File[]) => {
    console.log('handleImageSelection called with:', validatedFiles.length, 'files');
    
    try {
      // Replace existing image with new one (since limit is now 1)
      setSelectedImages(validatedFiles);
      console.log('selectedImages updated, modal should remain open');
      
      // Store in global Map immediately (synchronous, survives component remounts)
      if (validatedFiles.length > 0) {
        const file = validatedFiles[0];
        globalFileStorage.set(TEMP_FILE_KEY, file);
        console.log('Saved file to global storage:', file.name);
      } else {
        // Clear global storage when no files are selected
        globalFileStorage.delete(TEMP_FILE_KEY);
        console.log('Cleared image from global storage');
      }
      
    } catch (error) {
      console.error('Error in handleImageSelection:', error);
    }
  };

  // Handle modal backdrop click to prevent accidental closure
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    console.log('Backdrop clicked');
    // Only close if clicking on the backdrop itself, not on child elements
    if (e.target === e.currentTarget) {
      console.log('Closing modal via backdrop click');
      // Mark as intentional close and clear persistent data
      intentionalCloseRef.current = true;
      clearFormData();
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={handleBackdropClick}
    >
      {showUpgradeModal ? (
        <div className="bg-dark-gray w-full max-w-md rounded-lg p-6">
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
        <div className="bg-dark-gray w-full max-w-2xl flex flex-col max-h-[90vh] rounded-lg shadow-xl overflow-hidden">
          <div className="bg-ufc-black flex items-center justify-between border-b border-gray-800 p-4 flex-shrink-0">
            <h3 className="text-lg font-bold text-white">Create New Post</h3>
            <button
              onClick={handleClose}
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

          <div className="flex-1 overflow-y-auto p-4">
            <form id="create-post-form" onSubmit={handleSubmit} className="space-y-4">
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

              {/* Image Upload Section */}
              <div className="mb-4">
                <label className="mb-2 block font-medium text-gray-300">
                  Image (Optional)
                </label>
                <ImageUpload
                  onFilesSelected={handleImageSelection}
                  multiple={false}
                  variant="default"
                  className="w-full"
                />
              </div>

              {/* Image Preview Section */}
              {selectedImages.length > 0 && (
                <div className="mb-4">
                  <label className="mb-2 block font-medium text-gray-300">
                    Selected Image
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
                            setSelectedImages([]);
                            // Also clear from global storage immediately
                            globalFileStorage.delete(TEMP_FILE_KEY);
                            console.log('Removed image from global storage via button');
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
                      Options <span className="ml-1 text-sm text-gray-400">({pollOptions.length}/6)</span>
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
                      className={`text-ufc-blue mt-2 flex items-center text-sm font-medium ${pollOptions.length >= 6 ? 'opacity-50 cursor-not-allowed' : 'hover:text-white'}`}
                      disabled={pollOptions.length >= 6}
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
                      Add Option {pollOptions.length >= 6 ? "(Max Reached)" : ""}
                    </button>
                  </div>
                </div>
              )}

              <div>
                <div className="flex space-x-4">
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
            </form>
          </div>

          {/* Action buttons - always visible at bottom */}
          <div className="border-t border-gray-800 p-4 flex-shrink-0">
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg bg-gray-700 px-4 py-2 text-sm text-white transition hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="create-post-form"
                disabled={isPending || isUploading}
                className={`bg-ufc-blue hover:bg-ufc-blue-dark rounded-lg px-4 py-2 text-sm text-black transition ${isPending || isUploading ? "cursor-not-allowed opacity-70" : ""}`}
              >
                {isUploading ? (
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
                ) : isPending ? (
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
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Creating...
                  </span>
                ) : (
                  "Create Post"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
