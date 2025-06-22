import { useQuery } from "@tanstack/react-query";
import { ForumThread } from "@/lib/types";
import { fetchThreadById } from "../../../queries/thread";

interface UseThreadBasicDataOptions {
  threadId: string;
  userId?: string;
}

export function useThreadBasicData({ threadId, userId }: UseThreadBasicDataOptions) {
  // Fetch thread data
  const {
    data: thread,
    isLoading,
    error,
  } = useQuery<ForumThread>({
    queryKey: [`/api/threads/id/${threadId}`, userId],
    queryFn: () => fetchThreadById(threadId, userId).then(data => {
      console.log("Thread data received in hook:", data, "userId:", userId);
      return data;
    }),
    enabled: !!threadId,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: 2 * 60 * 1000, // 2 minutes - threads can change frequently
  });

  return {
    thread,
    isLoading,
    error,
  };
} 