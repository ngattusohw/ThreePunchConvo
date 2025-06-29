import { Link } from "wouter";
import ReplyForm from "../thread/ReplyForm";
import ReplyCard from "./ReplyCard";
import { ForumThread, ThreadReply } from "@/lib/types";
import { useThreadData, useThreadReplies } from "@/api/hooks/threads";
import { MemoizedUser } from "@/hooks/useMemoizedUser";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";

interface ReplyThreadProps {
  currentUser: MemoizedUser | null;
  thread: ForumThread;
}

export default function ReplyThread({ currentUser, thread }: ReplyThreadProps) {
  const [, setLocation] = useLocation();
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const pageSize = 100;

  const {
    isThreadLoading,
    isRepliesLoading,
    repliesError,
    displayReplies: replies,
    loadMore,
    hasMore,
  } = useThreadData({
    threadId: thread.id,
    userId: currentUser?.id,
    pageSize: pageSize,
  });

  const {
    replyingTo,
    likeReplyMutation,
    showUpgradeModal,
    setShowUpgradeModal,
    dislikeReplyMutation,
    deleteReplyMutation,
    handleQuoteReply,
    setReplyingTo,
  } = useThreadReplies({
    threadId: thread.id,
    userId: currentUser?.id,
  });

  // Function to close modal and navigate to upgrade page
  const handleUpgrade = () => {
    setShowUpgradeModal(false);
    setLocation("/checkout");
  };

  const handleLoadMore = () => {
    setIsLoadingMore(true);
    loadMore();
    setIsLoadingMore(false);
  };

  const isLoading =
    replies.length === 0 && (isThreadLoading || isRepliesLoading);

  return (
    <>
      <div className='mb-6'>
        <h2 className='mb-4 text-xl font-bold text-white'>
          Replies ({replies.length})
        </h2>

        {isLoading ? (
          <div className='py-12 text-center'>
            <div className='border-ufc-blue mx-auto h-10 w-10 animate-spin rounded-full border-b-2 border-t-2'></div>
            <p className='mt-4 text-gray-400'>Loading replies...</p>
          </div>
        ) : repliesError ? (
          <div className='rounded-lg border border-red-500 bg-red-900 bg-opacity-20 p-4 text-center'>
            <p className='text-red-500'>
              Error loading replies. Please try again later.
            </p>
          </div>
        ) : replies.length === 0 ? (
          <div className='bg-dark-gray rounded-lg p-8 text-center'>
            <p className='text-gray-400'>
              No replies yet. Be the first to reply!
            </p>
          </div>
        ) : (
          <div className='space-y-4'>
            {replies
              .filter(
                (reply, index, self) =>
                  index === self.findIndex((r) => r.id === reply.id),
              )
              .map((reply) => (
                <ReplyCard
                  key={reply.id}
                  reply={reply}
                  onQuote={handleQuoteReply}
                  likeReplyMutation={likeReplyMutation}
                  onDislike={() =>
                    dislikeReplyMutation.mutate(reply.id.toString())
                  }
                  onDelete={() =>
                    deleteReplyMutation.mutate(reply.id.toString())
                  }
                />
              ))}
          </div>
        )}
      </div>

      {hasMore && (
        <button
          onClick={handleLoadMore}
          className='bg-ufc-blue hover:bg-ufc-blue-dark w-full rounded-lg px-4 py-2 text-sm font-medium text-black transition'
        >
          {isLoadingMore ? "Loading..." : "Load More"}
        </button>
      )}

      {/* Reply Form */}
      <div id='reply-form' className='bg-dark-gray rounded-lg p-5'>
        <h3 className='mb-4 text-lg font-bold text-white'>
          {replyingTo ? `Reply to ${replyingTo.username}` : "Add Your Reply"}
        </h3>

        {!currentUser ? (
          <div className='rounded-lg bg-gray-800 p-4 text-center'>
            <p className='mb-3 text-gray-300'>
              You need to be logged in to reply
            </p>
            <Link
              href='/login'
              className='bg-ufc-blue hover:bg-ufc-blue-dark inline-block rounded-lg px-4 py-2 text-sm font-medium text-white transition'
            >
              Log In
            </Link>
          </div>
        ) : (
          <ReplyForm
            threadId={thread.id}
            currentUser={currentUser}
            replyingTo={replyingTo}
            setReplyingTo={setReplyingTo}
            isLoading={isRepliesLoading}
          />
        )}
      </div>
      {/* Upgrade Plan Modal */}
      {showUpgradeModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75'>
          <div className='bg-dark-gray mx-4 w-full max-w-md rounded-lg p-6'>
            <h2 className='mb-4 text-xl font-bold text-white'>
              Upgrade Required
            </h2>
            <p className='mb-6 text-gray-300'>
              You need to upgrade your plan to access this feature.
            </p>
            <div className='space-y-3'>
              <button
                onClick={handleUpgrade}
                className='bg-ufc-blue hover:bg-ufc-blue-dark w-full rounded-lg py-2 font-medium text-black transition'
              >
                Upgrade Now
              </button>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className='w-full rounded-lg border border-gray-600 bg-transparent py-2 font-medium text-white transition hover:bg-gray-800'
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
