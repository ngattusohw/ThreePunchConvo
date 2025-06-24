import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ForumThread, ThreadReply } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import {
  fetchThreadById,
  fetchThreadReplies,
  likeThread,
  dislikeThread,
  toggleThreadPin,
  submitThreadReply,
  likeReply,
  dislikeReply,
  deleteThread,
  deleteReply,
} from "../queries/thread";

interface UseThreadOptions {
  threadId: string;
  userId?: string;
}

export function useThread({ threadId, userId }: UseThreadOptions) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [replyContent, setReplyContent] = useState("");
  const [replyingTo, setReplyingTo] = useState<{
    id: string;
    username: string;
  } | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [displayReplies, setDisplayReplies] = useState<ThreadReply[]>([]);

  // Fetch thread data
  const {
    data: thread,
    isLoading: isThreadLoading,
    error: threadError,
  } = useQuery<ForumThread>({
    queryKey: [`/api/threads/id/${threadId}`, userId],
    queryFn: () => fetchThreadById(threadId, userId),
    enabled: !!threadId,
  });

  // Fetch thread replies
  const {
    data: replies,
    isLoading: isRepliesLoading,
    error: repliesError,
  } = useQuery<ThreadReply[]>({
    queryKey: [`/api/threads/${threadId}/replies`],
    queryFn: () => fetchThreadReplies(threadId),
    enabled: !!threadId,
  });

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
    mutationFn: () => {
      if (!userId) throw new Error("You must be logged in to like posts");
      return likeThread(threadId, userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/threads/id/${threadId}`],
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
    mutationFn: () => {
      if (!userId) throw new Error("You must be logged in to dislike posts");
      return dislikeThread(threadId, userId);
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
  const pinnedByUserThreadMutation = useMutation({
    mutationFn: () => {
      if (!userId) throw new Error("You must be logged in to pin posts");
      return toggleThreadPin(threadId, userId);
    },
    onSuccess: () => {
      // Invalidate queries to refetch thread and related data
      queryClient.invalidateQueries({
        queryKey: [`/api/threads/id/${threadId}`],
      });
      toast({
        title: "Success!",
        description: "Thread pin status updated.",
        variant: "success",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to pin post",
        variant: "destructive",
      });
    },
  });

  // Handle submitting a reply
  const submitReplyMutation = useMutation({
    mutationFn: () => {
      if (!userId) throw new Error("You must be logged in to reply");
      if (!replyContent.trim()) throw new Error("Reply cannot be empty");

      return submitThreadReply(
        threadId,
        userId,
        replyContent,
        replyingTo?.id || null,
      );
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
    mutationFn: (replyId: string) => {
      if (!userId) throw new Error("You must be logged in to like replies");
      return likeReply(replyId, userId);
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
    mutationFn: (replyId: string) => {
      if (!userId) throw new Error("You must be logged in to dislike replies");
      return dislikeReply(replyId, userId);
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
  };

  // Add delete thread mutation
  const deleteThreadMutation = useMutation({
    mutationFn: () => {
      if (!userId)
        throw new Error("You must be logged in to delete this thread");
      return deleteThread(threadId, userId);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Thread deleted successfully",
      });
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
    mutationFn: (replyId: string) => {
      if (!userId)
        throw new Error("You must be logged in to delete this reply");
      return deleteReply(replyId, userId, thread?.user?.role);
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
    submitReplyMutation.mutate();
  };

  return {
    thread,
    isThreadLoading,
    threadError,
    displayReplies,
    isRepliesLoading,
    repliesError,
    replyContent,
    setReplyContent,
    replyingTo,
    setReplyingTo,
    showUpgradeModal,
    setShowUpgradeModal,
    likeThreadMutation,
    dislikeThreadMutation,
    pinnedByUserThreadMutation,
    submitReplyMutation,
    likeReplyMutation,
    dislikeReplyMutation,
    handleQuoteReply,
    deleteThreadMutation,
    deleteReplyMutation,
    handleReplySubmit,
  };
}
