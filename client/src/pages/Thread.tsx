import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ForumThread, ThreadReply } from "@/lib/types";
import { useUser } from "@clerk/clerk-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import UserAvatar from "@/components/ui/user-avatar";
import StatusBadge from "@/components/ui/status-badge";
import { FORUM_CATEGORIES } from "@/lib/constants";

export default function Thread() {
  const { threadId } = useParams<{ threadId: string }>();
  const { user: currentUser } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [replyContent, setReplyContent] = useState("");
  const [replyingTo, setReplyingTo] = useState<{
    id: string;
    username: string;
  } | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Fetch thread data
  const {
    data: thread,
    isLoading: isThreadLoading,
    error: threadError,
  } = useQuery<ForumThread>({
    queryKey: [`/api/threads/id/${threadId}`, currentUser?.id],
    queryFn: async () => {
      const response = await fetch(
        `/api/threads/id/${threadId}${currentUser ? `?userId=${currentUser.id}` : ""}`,
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch thread: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!threadId,
  });

  // Fetch thread replies
  const {
    data: replies,
    isLoading: isRepliesLoading,
    error: repliesError,
  } = useQuery<ThreadReply[]>({
    queryKey: [`/api/threads/${threadId}/replies`],
    queryFn: async () => {
      const response = await fetch(`/api/threads/${threadId}/replies`);
      if (!response.ok) {
        throw new Error(`Failed to fetch replies: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!threadId,
  });

  // Use the actual data from the API
  const displayThread = thread;

  // Organize replies into a hierarchical structure
  const [displayReplies, setDisplayReplies] = useState<ThreadReply[]>([]);

  // Process replies to create a proper threaded structure
  useEffect(() => {
    if (!replies) return;

    // Create a map of parent IDs to their child replies
    const replyMap = new Map<string | null, ThreadReply[]>();

    // Create a map of reply IDs to usernames for showing parent info
    const replyUserMap = new Map<string, string>();

    // Initialize all possible parent IDs with empty arrays
    replyMap.set(null, []); // Top-level replies have null parentReplyId

    // Group replies by their parent ID and build username map
    replies.forEach((reply) => {
      const parentId = reply.parentReplyId || null;
      if (!replyMap.has(parentId)) {
        replyMap.set(parentId, []);
      }
      replyMap.get(parentId)!.push(reply);

      // Store the username for this reply ID
      replyUserMap.set(reply.id.toString(), reply.user.username);
    });

    // Function to recursively build the reply tree in the correct order
    const buildReplyTree = (
      parentId: string | null,
      level: number = 0,
    ): ThreadReply[] => {
      const children = replyMap.get(parentId) || [];

      // Sort replies by creation date (oldest first)
      const sortedChildren = [...children].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );

      // For each child, also include its descendants
      const result: ThreadReply[] = [];

      for (const child of sortedChildren) {
        // Add the child itself with its level and parent username if available
        const parentUsername = child.parentReplyId
          ? replyUserMap.get(child.parentReplyId)
          : undefined;
        const childWithMeta = {
          ...child,
          level,
          parentUsername,
        };
        result.push(childWithMeta);

        // Add all of the child's descendants
        const descendants = buildReplyTree(child.id.toString(), level + 1);
        result.push(...descendants);
      }

      return result;
    };

    // Build the complete threaded structure starting from top-level replies
    const threadedReplies = buildReplyTree(null);
    setDisplayReplies(threadedReplies);
  }, [replies]);

  // Handle liking a thread
  const likeThreadMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser) throw new Error("You must be logged in to like posts");

      const response = await apiRequest(
        "POST",
        `/api/threads/${threadId}/like`,
        {
          userId: currentUser.id,
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            `Error: ${response.status} ${response.statusText}`,
        );
      }

      return response.json();
    },
    onSuccess: () => {
      const wasLiked = displayThread?.hasLiked;
      queryClient.invalidateQueries({
        queryKey: [`/api/threads/id/${threadId}`],
      });
      toast({
        title: "Success",
        description: wasLiked ? "You unliked this post" : "You liked this post",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to like post",
        variant: "destructive",
      });
    },
  });

  // Handle disliking a thread
  const dislikeThreadMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser)
        throw new Error("You must be logged in to dislike posts");

      const response = await apiRequest(
        "POST",
        `/api/threads/${threadId}/dislike`,
        {
          userId: currentUser.id,
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            `Error: ${response.status} ${response.statusText}`,
        );
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/threads/id/${threadId}`],
      });
      toast({
        title: "Success",
        description: "You disliked this post",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to dislike post",
        variant: "destructive",
      });
    },
  });

  // Handle post of the day
  const potdThreadMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser)
        throw new Error("You must be logged in to vote for POTD");

      const response = await apiRequest(
        "POST",
        `/api/threads/${threadId}/potd`,
        {
          userId: currentUser.id,
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            `Error: ${response.status} ${response.statusText}`,
        );
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/threads/id/${threadId}`],
      });
      toast({
        title: "Success",
        description: "You've selected this post as Post of the Day!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to select post as POTD",
        variant: "destructive",
      });
    },
  });

  // Handle submitting a reply
  const submitReplyMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser) throw new Error("You must be logged in to reply");
      if (!replyContent.trim()) throw new Error("Reply cannot be empty");

      const response = await apiRequest(
        "POST",
        `/api/threads/${threadId}/replies`,
        {
          userId: currentUser.id,
          content: replyContent,
          parentReplyId: replyingTo?.id || null,
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Check for the special upgrade required error
        if (errorData.error === "UPGRADE_REQUIRED") {
          throw new Error("UPGRADE_REQUIRED");
        }

        throw new Error(
          errorData.message ||
            `Error: ${response.status} ${response.statusText}`,
        );
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/threads/${threadId}/replies`],
      });
      setReplyContent("");
      setReplyingTo(null);
      toast({
        title: "Success",
        description: "Your reply has been posted",
      });
    },
    onError: (error: Error) => {
      // Special handling for the upgrade required error
      if (error.message === "UPGRADE_REQUIRED") {
        setShowUpgradeModal(true);
        return;
      }

      toast({
        title: "Error",
        description: error.message || "Failed to post reply",
        variant: "destructive",
      });
    },
  });

  // Handle liking a reply
  const likeReplyMutation = useMutation({
    mutationFn: async (replyId: number) => {
      if (!currentUser)
        throw new Error("You must be logged in to like replies");

      const response = await apiRequest(
        "POST",
        `/api/replies/${replyId}/like`,
        {
          userId: currentUser.id,
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            `Error: ${response.status} ${response.statusText}`,
        );
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/threads/${threadId}/replies`],
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to like reply",
        variant: "destructive",
      });
    },
  });

  // Handle disliking a reply
  const dislikeReplyMutation = useMutation({
    mutationFn: async (replyId: number) => {
      if (!currentUser)
        throw new Error("You must be logged in to dislike replies");

      const response = await apiRequest(
        "POST",
        `/api/replies/${replyId}/dislike`,
        {
          userId: currentUser.id,
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            `Error: ${response.status} ${response.statusText}`,
        );
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/threads/${threadId}/replies`],
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to dislike reply",
        variant: "destructive",
      });
    },
  });

  // Handle quoting a reply
  const handleQuoteReply = (reply: ThreadReply) => {
    setReplyingTo({
      id: reply.id.toString(),
      username: reply.user.username,
    });

    // Scroll to reply form
    document
      .getElementById("reply-form")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  // Handle poll vote
  const submitPollVoteMutation = useMutation({
    mutationFn: async (optionId: number) => {
      if (!currentUser) throw new Error("You must be logged in to vote");
      if (!displayThread.poll) throw new Error("No poll found");

      // Log user information for debugging
      console.log("Current user ID:", currentUser.id);
      console.log("Voting on poll option ID:", optionId);

      try {
        // First, ensure the user exists in the backend database
        console.log("Checking if user exists in backend database");
        const userCheckResponse = await apiRequest(
          "POST",
          `/api/users/clerk/${currentUser.id}`,
          {
            firstName: currentUser.firstName,
            lastName: currentUser.lastName,
            email: currentUser.emailAddresses?.[0]?.emailAddress,
            profileImageUrl: currentUser.imageUrl,
            username: currentUser.username,
          },
        );

        if (!userCheckResponse.ok) {
          throw new Error("Failed to register user in backend system");
        }

        const userData = await userCheckResponse.json();
        console.log("User check result:", userData);

        // Now that we've ensured the user exists, we can proceed with voting
        const response = await apiRequest(
          "POST",
          `/api/threads/${threadId}/poll/${optionId}/vote`,
          {
            userId: currentUser.id,
          },
        );

        // If there's an error, try to get detailed error information
        if (!response.ok) {
          let errorMessage = `Error: ${response.status} ${response.statusText}`;
          const responseText = await response.text();
          console.error("Raw API error response:", responseText);

          try {
            const errorData = JSON.parse(responseText);
            console.error("Parsed API error response:", errorData);
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch (e) {
            console.error("Failed to parse error response as JSON");
          }

          throw new Error(errorMessage);
        }

        return response.json();
      } catch (error) {
        console.error("Error in poll vote:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/threads/id/${threadId}`],
      });
      toast({
        title: "Success",
        description: "Your vote has been recorded",
      });
    },
    onError: (error: Error) => {
      console.error("Vote error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to record vote",
        variant: "destructive",
      });
    },
  });

  // Add delete thread mutation
  const deleteThreadMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser)
        throw new Error("You must be logged in to delete this thread");

      const response = await apiRequest("DELETE", `/api/threads/${threadId}`, {
        userId: currentUser.id,
        role: currentUser.publicMetadata?.role,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            `Error: ${response.status} ${response.statusText}`,
        );
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Thread deleted successfully",
      });
      // Redirect to the forum category page
      setLocation(`/forum/${thread?.categoryId}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete thread",
        variant: "destructive",
      });
    },
  });

  // Add delete reply mutation
  const deleteReplyMutation = useMutation({
    mutationFn: async (replyId: string) => {
      if (!currentUser)
        throw new Error("You must be logged in to delete this reply");

      const response = await apiRequest("DELETE", `/api/replies/${replyId}`, {
        userId: currentUser.id,
        role: currentUser.publicMetadata?.role,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            `Error: ${response.status} ${response.statusText}`,
        );
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/threads/${threadId}/replies`],
      });
      toast({
        title: "Success",
        description: "Reply deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete reply",
        variant: "destructive",
      });
    },
  });

  // Handle replying to a thread
  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Don't check plan type locally, just try to submit
    // and let the server determine access
    submitReplyMutation.mutate();
  };

  // Function to close modal and navigate to upgrade page
  const handleUpgrade = () => {
    setShowUpgradeModal(false);
    setLocation("/checkout");
  };

  // Loading state
  if (isThreadLoading) {
    return (
      <div className="container mx-auto flex justify-center px-4 py-12">
        <div className="border-ufc-blue h-12 w-12 animate-spin rounded-full border-b-2 border-t-2"></div>
      </div>
    );
  }

  // Error state
  if (threadError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-lg border border-red-500 bg-red-900 bg-opacity-20 p-4 text-center">
          <p className="text-red-500">
            Error loading thread:{" "}
            {threadError instanceof Error
              ? threadError.message
              : "Please try again later."}
          </p>
        </div>
      </div>
    );
  }

  // If no thread data, show error
  if (!thread) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-lg border border-red-500 bg-red-900 bg-opacity-20 p-4 text-center">
          <p className="text-red-500">
            Thread not found. Please check the URL and try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col lg:flex-row lg:space-x-6">
        {/* Main Content */}
        <div className="lg:flex-grow">
          {/* Breadcrumbs */}
          <div className="mb-4 flex items-center text-sm">
            <Link
              href="/forum"
              className="text-gray-400 transition hover:text-white"
            >
              Forum
            </Link>
            <span className="mx-2 text-gray-600">/</span>
            <Link
              href={`/forum/${displayThread.categoryId}`}
              className="text-gray-400 transition hover:text-white"
            >
              {getCategoryName(displayThread.categoryId)}
            </Link>
            <span className="mx-2 text-gray-600">/</span>
            <span className="truncate text-white">
              {displayThread.title.length > 30
                ? displayThread.title.substring(0, 30) + "..."
                : displayThread.title}
            </span>
          </div>

          {/* Thread Card */}
          <div
            className={`bg-dark-gray ${displayThread.isPotd ? "border-ufc-blue border-l-4" : ""} mb-6 overflow-hidden rounded-lg shadow-lg`}
          >
            <div className="p-5">
              {/* Thread Header */}
              <div className="flex items-start">
                <div className="mr-4 flex-shrink-0">
                  <UserAvatar user={displayThread.user} size="lg" />
                </div>

                <div className="flex-grow">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    {displayThread.isPinned && (
                      <span className="text-ufc-gold rounded bg-gray-800 px-2 py-0.5 text-xs font-medium">
                        PINNED
                      </span>
                    )}

                    {displayThread.isPotd && (
                      <span className="bg-ufc-blue rounded px-2 py-0.5 text-xs font-bold text-black">
                        POTD
                      </span>
                    )}

                    <StatusBadge status={displayThread.user.status} />

                    {displayThread?.user?.role === "PRO" && (
                      <span className="flex items-center rounded-full bg-blue-500 px-2 py-0.5 text-xs font-bold text-white">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="mr-1 h-3 w-3"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        VERIFIED
                      </span>
                    )}

                    {displayThread?.user?.role === "ADMIN" && (
                      <span className="bg-ufc-gold text-ufc-black rounded px-2 py-0.5 text-xs font-bold">
                        ADMIN
                      </span>
                    )}

                    {displayThread?.user?.role === "MODERATOR" && (
                      <span className="rounded bg-green-600 px-2 py-0.5 text-xs font-bold text-white">
                        MOD
                      </span>
                    )}

                    <Link
                      href={`/user/${displayThread?.user?.username}`}
                      className="hover:text-ufc-blue font-medium text-white transition"
                    >
                      {displayThread?.user?.username}
                    </Link>

                    <span className="text-sm text-gray-400">
                      {formatDate(displayThread.createdAt)}
                    </span>
                  </div>

                  <h1 className="mb-4 text-2xl font-bold text-white">
                    {displayThread.title}
                  </h1>

                  <div className="mb-6 whitespace-pre-line text-gray-300">
                    {displayThread.content}
                  </div>

                  {/* Thread Media */}
                  {displayThread.media && displayThread.media.length > 0 && (
                    <div className="mb-6">
                      <img
                        src={displayThread.media[0].url}
                        alt={`Media for ${displayThread.title}`}
                        className="max-h-96 w-auto rounded-lg"
                      />
                    </div>
                  )}

                  {/* Thread Poll */}
                  {displayThread?.poll && (
                    <div className="mb-6 rounded-lg bg-gray-800 p-4">
                      <h3 className="mb-4 font-medium text-white">
                        {displayThread.poll.question}
                      </h3>
                      <div className="space-y-3">
                        {displayThread.poll.options.map((option) => {
                          const percentage = displayThread.poll?.votesCount
                            ? Math.round(
                                (option.votesCount /
                                  displayThread.poll.votesCount) *
                                  100,
                              )
                            : 0;

                          return (
                            <div key={option.id} className="relative">
                              <button
                                onClick={() =>
                                  submitPollVoteMutation.mutate(option.id)
                                }
                                disabled={
                                  !currentUser ||
                                  submitPollVoteMutation.isPending ||
                                  new Date() >
                                    new Date(displayThread.poll.expiresAt)
                                }
                                className="w-full"
                              >
                                <div className="mb-1 flex items-center justify-between">
                                  <span className="text-sm text-gray-300">
                                    {option.text}
                                  </span>
                                  <span className="text-sm text-gray-300">
                                    {percentage}%
                                  </span>
                                </div>
                                <div className="flex h-2 overflow-hidden rounded bg-gray-700 text-xs">
                                  <div
                                    style={{ width: `${percentage}%` }}
                                    className={`flex flex-col justify-center whitespace-nowrap text-center text-white shadow-none ${option.id % 2 === 0 ? "bg-blue-500" : "bg-red-500"}`}
                                  />
                                </div>
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      <p className="mt-4 text-xs text-gray-400">
                        {displayThread.poll.votesCount} votes •
                        {new Date() > new Date(displayThread.poll.expiresAt)
                          ? " Poll ended"
                          : ` ${Math.ceil((new Date(displayThread.poll.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left`}
                      </p>

                      {!currentUser && (
                        <p className="mt-2 text-xs text-gray-500">
                          You must be logged in to vote
                        </p>
                      )}
                    </div>
                  )}

                  {/* Thread Actions */}
                  <div className="mb-6 flex items-center space-x-4">
                    <button
                      onClick={() => likeThreadMutation.mutate()}
                      disabled={!currentUser}
                      className="flex items-center text-gray-400 transition hover:text-green-500"
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
                          d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                        />
                      </svg>
                      <span className="font-medium">
                        {displayThread?.likesCount}
                      </span>
                    </button>

                    {/* Hiding dislike button for now */}
                    {/* <button
                      onClick={() => dislikeThreadMutation.mutate()}
                      disabled={!currentUser}
                      className="flex items-center text-gray-400 hover:text-red-500 transition"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2" />
                      </svg>
                      <span className="font-medium">{displayThread?.dislikesCount}</span>
                    </button> */}

                    {currentUser &&
                      (
                        currentUser?.role === "ADMIN" ||
                        currentUser?.role === "MODERATOR") && (
                        <button
                          onClick={() => potdThreadMutation.mutate()}
                          disabled={!currentUser}
                          className="flex items-center text-gray-400 transition hover:text-yellow-500"
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
                              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                            />
                          </svg>
                          <span className="font-medium">
                            {displayThread?.potdCount}
                          </span>
                        </button>
                      )}

                    {/* Add delete button if user is author or has permission */}
                    {currentUser &&
                      (currentUser.id === displayThread?.userId ||
                        currentUser.role === "ADMIN" ||
                        currentUser.role === "MODERATOR") && (
                        <button
                          onClick={() => {
                            if (
                              window.confirm(
                                "Are you sure you want to delete this thread? This action cannot be undone.",
                              )
                            ) {
                              deleteThreadMutation.mutate();
                            }
                          }}
                          className="ml-auto flex items-center text-gray-400 transition hover:text-red-500"
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
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                          Delete Thread
                        </button>
                      )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Thread Replies */}
          <div className="mb-6">
            <h2 className="mb-4 text-xl font-bold text-white">
              Replies ({displayReplies.length})
            </h2>

            {isRepliesLoading ? (
              <div className="py-12 text-center">
                <div className="border-ufc-blue mx-auto h-10 w-10 animate-spin rounded-full border-b-2 border-t-2"></div>
                <p className="mt-4 text-gray-400">Loading replies...</p>
              </div>
            ) : repliesError ? (
              <div className="rounded-lg border border-red-500 bg-red-900 bg-opacity-20 p-4 text-center">
                <p className="text-red-500">
                  Error loading replies. Please try again later.
                </p>
              </div>
            ) : displayReplies.length === 0 ? (
              <div className="bg-dark-gray rounded-lg p-8 text-center">
                <p className="text-gray-400">
                  No replies yet. Be the first to reply!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {displayReplies.map((reply) => (
                  <ReplyCard
                    key={reply.id}
                    reply={reply}
                    onQuote={handleQuoteReply}
                    onLike={() => likeReplyMutation.mutate(reply.id)}
                    onDislike={() => dislikeReplyMutation.mutate(reply.id)}
                    onDelete={() =>
                      deleteReplyMutation.mutate(reply.id.toString())
                    }
                  />
                ))}
              </div>
            )}
          </div>

          {/* Reply Form */}
          <div id="reply-form" className="bg-dark-gray rounded-lg p-5">
            <h3 className="mb-4 text-lg font-bold text-white">
              {replyingTo
                ? `Reply to ${replyingTo.username}`
                : "Add Your Reply"}
            </h3>

            {!currentUser ? (
              <div className="rounded-lg bg-gray-800 p-4 text-center">
                <p className="mb-3 text-gray-300">
                  You need to be logged in to reply
                </p>
                <Link
                  href="/login"
                  className="bg-ufc-blue hover:bg-ufc-blue-dark inline-block rounded-lg px-4 py-2 text-sm font-medium text-white transition"
                >
                  Log In
                </Link>
              </div>
            ) : (
              <form onSubmit={handleReplySubmit}>
                {replyingTo && (
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm text-gray-400">
                      Replying to{" "}
                      <span className="text-ufc-blue">
                        {replyingTo.username}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setReplyingTo(null);
                        setReplyContent("");
                      }}
                      className="text-sm text-gray-400 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {/* Show upgrade warning for free users */}
                {currentUser?.publicMetadata?.planType === "FREE" && (
                  <div className="mb-3 rounded border-l-4 border-yellow-500 bg-gray-800 p-3">
                    <div className="flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="mr-2 h-5 w-5 text-yellow-500"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <p className="text-sm text-gray-300">
                        You're on a{" "}
                        <span className="font-bold text-yellow-500">
                          Free Plan
                        </span>
                        .
                        <span className="text-gray-400">
                          {" "}
                          Upgrade to post replies.
                        </span>
                      </p>
                    </div>
                  </div>
                )}

                <textarea
                  id="reply-input"
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write your reply here..."
                  className="focus:ring-ufc-blue min-h-[150px] w-full rounded-lg border border-gray-700 bg-gray-800 p-3 text-gray-300 focus:outline-none focus:ring-1"
                  required
                />

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex space-x-3">
                    {/* <button type="button" className="text-gray-400 hover:text-white flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Image
                    </button>
                    <button type="button" className="text-gray-400 hover:text-white flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Emoji
                    </button> */}
                  </div>

                  <button
                    type="submit"
                    disabled={
                      submitReplyMutation.isPending || !replyContent.trim()
                    }
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                      submitReplyMutation.isPending || !replyContent.trim()
                        ? "cursor-not-allowed bg-gray-700 text-white opacity-50"
                        : "bg-ufc-blue hover:bg-ufc-blue-dark text-black"
                    }`}
                  >
                    {submitReplyMutation.isPending
                      ? "Posting..."
                      : "Post reply"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="mt-9 hidden w-80 flex-shrink-0 lg:block">
          <div className="bg-dark-gray sticky top-20 rounded-lg p-4">
            <h3 className="mb-4 text-lg font-bold text-white">Thread Info</h3>

            <div className="mb-4">
              <p className="mb-1 text-sm text-gray-400">Posted by</p>
              <div className="flex items-center">
                <UserAvatar
                  user={displayThread.user}
                  size="sm"
                  className="mr-2"
                />
                <Link
                  href={`/user/${displayThread.user.username}`}
                  className="hover:text-ufc-blue text-white transition"
                >
                  {displayThread.user.username}
                </Link>
              </div>
            </div>

            <div className="mb-4">
              <p className="mb-1 text-sm text-gray-400">Category</p>
              <Link
                href={`/forum/${displayThread.categoryId}`}
                className="text-ufc-blue hover:underline"
              >
                {getCategoryName(displayThread.categoryId)}
              </Link>
            </div>

            <div className="mb-4">
              <p className="mb-1 text-sm text-gray-400">Created</p>
              <p className="text-white">
                {formatDate(displayThread.createdAt)}
              </p>
            </div>

            <div className="mb-4">
              <p className="mb-1 text-sm text-gray-400">Stats</p>
              <div className="grid grid-cols-2 gap-2">
                {/* <div className="bg-gray-800 p-2 rounded-lg text-center">
                  <span className="block text-ufc-blue font-bold">{displayThread.viewCount}</span>
                  <span className="text-gray-400 text-xs">Views</span>
                </div> */}
                <div className="rounded-lg bg-gray-800 p-2 text-center">
                  <span className="text-ufc-blue block font-bold">
                    {displayThread.repliesCount}
                  </span>
                  <span className="text-xs text-gray-400">Replies</span>
                </div>
              </div>
            </div>

            {displayThread.isPotd && (
              <div className="mb-4 rounded-lg bg-gray-800 p-3">
                <div className="text-ufc-blue mb-1 flex items-center">
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
                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                    />
                  </svg>
                  <span className="font-bold">Post of the Day</span>
                </div>
                <p className="text-sm text-gray-300">
                  This post has been selected as Post of the Day by the
                  community!
                </p>
              </div>
            )}

            {(currentUser?.role === "ADMIN" ||
              currentUser?.role === "MODERATOR") && (
              <div className="mt-4 border-t border-gray-800 pt-4">
                <h3 className="mb-2 text-lg font-bold text-white">
                  Moderation
                </h3>
                <div className="space-y-2">
                  <button className="flex w-full items-center justify-center rounded-lg bg-gray-800 px-3 py-2 text-sm text-white transition hover:bg-gray-700">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="mr-1 h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {displayThread.isLocked ? "Unlock Thread" : "Lock Thread"}
                  </button>
                  <button className="flex w-full items-center justify-center rounded-lg bg-gray-800 px-3 py-2 text-sm text-white transition hover:bg-gray-700">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="mr-1 h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {displayThread.isPinned ? "Unpin Thread" : "Pin Thread"}
                  </button>
                  <button className="bg-ufc-blue hover:bg-ufc-blue-dark flex w-full items-center justify-center rounded-lg px-3 py-2 text-sm text-black transition">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="mr-1 h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Delete Thread
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upgrade Plan Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
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
                Posting replies is only available for paid members. Upgrade your
                plan to join the conversation!
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
        </div>
      )}
    </div>
  );
}

interface ReplyCardProps {
  reply: ThreadReply & {
    level?: number;
    parentUsername?: string;
  };
  onQuote: (reply: ThreadReply) => void;
  onLike: () => void;
  onDislike: () => void;
  onDelete: () => void;
}

function ReplyCard({
  reply,
  onQuote,
  onLike,
  onDislike,
  onDelete,
}: ReplyCardProps) {
  const { user: currentUser } = useUser();

  // Calculate indentation based on the reply's level in the thread
  const level = reply.level || 0;

  // Use fixed indentation classes based on level
  let indentationClass = "";
  if (level === 1) indentationClass = "ml-4 border-l-2 border-gray-700 pl-4";
  else if (level === 2)
    indentationClass = "ml-8 border-l-2 border-gray-600 pl-4";
  else if (level === 3)
    indentationClass = "ml-12 border-l-2 border-gray-600 pl-4";
  else if (level >= 4)
    indentationClass = "ml-16 border-l-2 border-gray-600 pl-4";

  const canDeleteReply =
    currentUser &&
    (currentUser.id === reply.userId ||
      currentUser.role === "ADMIN" ||
      currentUser.role === "MODERATOR");

  return (
    <div
      className={`bg-dark-gray overflow-hidden rounded-lg shadow-lg ${indentationClass} ${level > 0 ? "mt-2" : "mt-4"}`}
    >
      {level > 0 && reply.parentUsername && (
        <div className="flex items-center bg-gray-800 px-4 py-1 text-xs text-gray-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="mr-1 h-3 w-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
            />
          </svg>
          Reply to{" "}
          <span className="text-ufc-blue ml-1 font-medium">
            {reply.parentUsername}
          </span>
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start">
          <div className="mr-3 flex-shrink-0">
            <UserAvatar user={reply.user} size="md" />
          </div>

          <div className="flex-grow">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <StatusBadge status={reply.user.status} />

              {reply.user.role === "PRO" && (
                <span className="flex items-center rounded-full bg-blue-500 px-2 py-0.5 text-xs font-bold text-white">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="mr-1 h-3 w-3"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  VERIFIED
                </span>
              )}

              {reply.user.role === "ADMIN" && (
                <span className="bg-ufc-gold text-ufc-black rounded px-2 py-0.5 text-xs font-bold">
                  ADMIN
                </span>
              )}

              {reply.user.role === "MODERATOR" && (
                <span className="rounded bg-green-600 px-2 py-0.5 text-xs font-bold text-white">
                  MOD
                </span>
              )}

              <Link
                href={`/user/${reply.user.username}`}
                className="hover:text-ufc-blue font-medium text-white transition"
              >
                {reply.user.username}
              </Link>

              <span className="text-sm text-gray-400">
                {formatDate(reply.createdAt)}
              </span>
            </div>

            <div className="mb-4 whitespace-pre-line text-gray-300">
              {reply.content}
            </div>

            {/* Reply Media */}
            {reply.media && reply.media.length > 0 && (
              <div className="mb-4">
                <img
                  src={reply.media[0].url}
                  alt={`Media for reply`}
                  className="max-h-72 w-auto rounded-lg"
                />
              </div>
            )}

            {/* Reply Actions */}
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={onLike}
                disabled={!currentUser}
                className="flex items-center text-gray-400 transition hover:text-green-500"
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
                    d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                  />
                </svg>
                <span className="font-medium">{reply.likesCount}</span>
              </button>

              {/* <button
                onClick={onDislike}
                disabled={!currentUser}
                className="flex items-center text-gray-400 hover:text-red-500 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2" />
                </svg>
                <span className="font-medium">{reply.dislikesCount}</span>
              </button> */}

              <button
                onClick={() => {
                  document
                    .getElementById("reply-form")
                    ?.scrollIntoView({ behavior: "smooth" });
                  onQuote(reply);
                }}
                disabled={!currentUser}
                className="ml-auto flex items-center text-gray-400 transition hover:text-white"
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
                    d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                  />
                </svg>
                <span className="font-medium">Reply</span>
              </button>
            </div>

            {canDeleteReply && (
              <button
                onClick={() => {
                  if (
                    window.confirm(
                      "Are you sure you want to delete this reply? This action cannot be undone.",
                    )
                  ) {
                    onDelete();
                  }
                }}
                className="flex items-center text-gray-400 transition hover:text-red-500"
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
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to get category name
function getCategoryName(categoryId: string): string {
  const category = FORUM_CATEGORIES.find((cat) => cat.id === categoryId);
  return category?.name || "Unknown Category";
}
