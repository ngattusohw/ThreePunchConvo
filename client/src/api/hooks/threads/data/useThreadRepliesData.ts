import { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { ThreadReply } from "@/lib/types";
import { fetchThreadReplies } from "../../../queries/thread";

interface UseThreadRepliesDataOptions {
  threadId: string;
  userId?: string;
  pageSize?: number;
}

export function useThreadRepliesData({
  threadId,
  userId,
  pageSize,
}: UseThreadRepliesDataOptions) {
  const [displayReplies, setDisplayReplies] = useState<ThreadReply[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [allReplies, setAllReplies] = useState<ThreadReply[]>([]);
  const scrollPositionRef = useRef<number>(0);

  // Fetch thread replies with pagination
  const {
    data: replies,
    isLoading,
    error,
    refetch,
  } = useQuery<ThreadReply[]>({
    queryKey: [
      `/api/threads/${threadId}/replies`,
      userId,
      currentPage,
      pageSize,
    ],
    queryFn: () =>
      fetchThreadReplies(threadId, userId, pageSize, currentPage * pageSize),
    enabled: !!threadId,
  });

  // Process replies to create a proper threaded structure
  useEffect(() => {
    console.log(
      "Processing replies:",
      replies?.length,
      "currentPage:",
      currentPage,
    );
    if (!replies) return;

    // For subsequent pages, append the new replies to the existing ones
    if (currentPage === 0) {
      // First page: start fresh
      console.log("Setting allReplies to first page replies:", replies.length);
      setAllReplies(replies);
    } else {
      // Subsequent pages: append new replies, avoiding duplicates
      setAllReplies((prev) => {
        const existingIds = new Set(prev.map((reply) => reply.id));
        const newReplies = replies.filter(
          (reply) => !existingIds.has(reply.id),
        );
        console.log(
          "Appending new replies:",
          newReplies.length,
          "to existing:",
          prev.length,
        );
        return [...prev, ...newReplies];
      });
    }

    // Check if we have more replies to load
    const hasMoreReplies = replies.length >= (pageSize || 10);
    setHasMore(hasMoreReplies);
  }, [replies, currentPage, pageSize]);

  // Build the threaded structure whenever allReplies changes
  useEffect(() => {
    console.log(
      "Building threaded structure with allReplies:",
      allReplies.length,
    );

    if (allReplies.length === 0) {
      setDisplayReplies([]);
      return;
    }

    // Create a map of parent IDs to their child replies
    const replyMap = new Map<string | null, ThreadReply[]>();

    // Create a map of reply IDs to usernames for showing parent info
    const replyUserMap = new Map<string, string>();

    // Initialize all possible parent IDs with empty arrays
    replyMap.set(null, []); // Top-level replies have null parentReplyId

    // Group replies by their parent ID and build username map
    allReplies.forEach((reply) => {
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
    console.log("Processed replies:", processedReplies.length);
    setDisplayReplies(processedReplies);

    // Restore scroll position after state update for pagination
    if (scrollPositionRef.current > 0) {
      setTimeout(() => {
        window.scrollTo(0, scrollPositionRef.current);
      }, 0);
    }
  }, [allReplies]);

  // Function to load more replies
  const loadMore = () => {
    if (hasMore && !isLoading) {
      // Save current scroll position before loading more
      scrollPositionRef.current = window.scrollY;
      setCurrentPage((prev) => prev + 1);
    }
  };

  // Function to reset pagination
  const resetPagination = () => {
    setCurrentPage(0);
    setAllReplies([]);
    setDisplayReplies([]);
    setHasMore(true);
    scrollPositionRef.current = 0;
    refetch();
  };

  return {
    replies: allReplies,
    displayReplies,
    isLoading,
    error,
    hasMore,
    loadMore,
    resetPagination,
    currentPage,
  };
}
