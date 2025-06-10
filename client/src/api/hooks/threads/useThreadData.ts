import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ForumThread, ThreadReply } from "@/lib/types";
import { fetchThreadById, fetchThreadReplies } from "../../queries/thread";

interface UseThreadDataOptions {
  threadId: string;
  userId?: string;
}

export function useThreadData({ threadId, userId }: UseThreadDataOptions) {
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
    
    // Build the full reply tree starting from top-level replies (parentId = null)
    const processedReplies = buildReplyTree(null);
    setDisplayReplies(processedReplies);
  }, [replies]);

  return {
    thread,
    isThreadLoading,
    threadError,
    isRepliesLoading,
    repliesError,
    displayReplies,
  };
} 