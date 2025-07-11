import { useEffect, useRef, useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { Helmet } from "react-helmet";
import { checkIsNormalUser, formatDate } from "@/lib/utils";
import { useThreadData, useThreadReplies } from "@/api/hooks/threads";
import UserAvatar from "@/components/ui/user-avatar";
import { FORUM_CATEGORIES, USER_ROLES } from "@/lib/constants";
import UserThreadHeader from "@/components/ui/user-thread-header";
import ReplyForm from "@/components/thread/ReplyForm";
import { useMemoizedUser } from "@/hooks/useMemoizedUser";
import { useToast } from "@/hooks/use-toast";
import ThreadCard from "@/components/forum/ThreadCard";
import ReplyThread from "@/components/forum/ReplyThread";

// Separate component for metadata
function ThreadMetadata({ thread }: { thread: any }) {
  // Get image URL and ensure it's publicly accessible
  const imageUrl = thread?.media?.find((m) => m.type === "IMAGE")?.url;
  const fullImageUrl = imageUrl?.startsWith("http")
    ? imageUrl
    : imageUrl
      ? `https://www.3punchconvo.com${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`
      : undefined;

  // Debug logging
  console.log("Image URL:", fullImageUrl);

  // Ensure we have a valid URL
  const currentUrl =
    typeof window !== "undefined"
      ? window.location.href
      : "https://3punchconvo.com";

  // Ensure all values are strings and sanitized
  const title = thread?.title
    ? String(thread.title).trim()
    : "Thread - 3PunchConvo";
  const description = thread?.content
    ? String(thread.content).substring(0, 200).trim()
    : "Check out this thread on ThreePunchConvo";

  return (
    <Helmet>
      <title>{title}</title>
      <meta name='description' content={description} />
      <meta property='og:title' content={title} />
      <meta property='og:description' content={description} />
      <meta property='og:type' content='article' />
      <meta property='og:url' content={currentUrl} />
      {fullImageUrl && <meta property='og:image' content={fullImageUrl} />}
      <meta name='twitter:card' content='summary_large_image' />
      <meta name='twitter:site' content='@3PunchConvo' />
      <meta name='twitter:title' content={title} />
      <meta name='twitter:description' content={description} />
      {fullImageUrl && <meta name='twitter:image' content={fullImageUrl} />}
    </Helmet>
  );
}

export default function Thread() {
  const { threadId } = useParams<{ threadId: string }>();
  const { user: currentUser } = useMemoizedUser();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const hasScrolledToReply = useRef(false);

  // Extract replyId from URL query params once
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const replyId = urlParams.get("replyId");

  const {
    thread,
    isThreadLoading,
    threadError,
    isRepliesLoading,
    displayReplies,
  } = useThreadData({
    threadId: threadId || "",
    userId: currentUser?.id,
    pageSize: 100, //updated this to 100
  });

  // Scroll to specific reply if replyId is provided in URL query params (only on first load)
  useEffect(() => {
    console.log("Effect triggered - replyId:", replyId, "location:", location);

    if (
      replyId &&
      displayReplies.length > 0 &&
      !isRepliesLoading &&
      !hasScrolledToReply.current
    ) {
      // Function to attempt scrolling to the reply
      const attemptScrollToReply = () => {
        const replyElement = document.getElementById(`reply-${replyId}`);

        if (replyElement) {
          // Mark that we've scrolled so it doesn't happen again
          hasScrolledToReply.current = true;

          // Add a small delay to ensure the page is fully rendered
          setTimeout(() => {
            replyElement.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });

            // Add a temporary highlight effect
            replyElement.classList.add(
              "ring-2",
              "ring-ufc-blue",
              "ring-opacity-50",
            );
            setTimeout(() => {
              replyElement.classList.remove(
                "ring-2",
                "ring-ufc-blue",
                "ring-opacity-50",
              );
            }, 2000);
          }, 500);

          // Remove the replyId from the URL after successful scroll
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete("replyId");
          setLocation(newUrl.pathname + newUrl.search, { replace: true });

          return true; // Element found and scroll initiated
        }
        return false; // Element not found
      };

      // Try immediately first
      if (!attemptScrollToReply()) {
        // If element not found, retry with a small delay
        const retryInterval = setInterval(() => {
          if (attemptScrollToReply()) {
            clearInterval(retryInterval);
          }
        }, 100);

        // Stop retrying after 3 seconds to avoid infinite loops
        setTimeout(() => {
          clearInterval(retryInterval);
        }, 3000);
      }
    }
  }, [replyId, displayReplies.length, isRepliesLoading, setLocation]);

  // Reset the scroll flag when the threadId changes
  useEffect(() => {
    hasScrolledToReply.current = false;
    console.log("Reset scroll flag - threadId:", threadId);
  }, [threadId]);

  // Helper function to get category name
  function getCategoryName(categoryId: string): string {
    const category = FORUM_CATEGORIES.find((cat) => cat.id === categoryId);
    return category?.name || "Unknown Category";
  }

  const handleThreadDelete = () => {
    toast({
      title: "Thread deleted",
      description: "The thread has been deleted successfully",
      variant: "success",
    });
    // Redirect to forum
    window.location.href = "/forum";
  };

  // Loading state
  if (isThreadLoading) {
    return (
      <div className='container mx-auto flex justify-center px-4 py-12'>
        <div className='border-ufc-blue h-12 w-12 animate-spin rounded-full border-b-2 border-t-2'></div>
      </div>
    );
  }

  // Error state
  if (threadError) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <div className='rounded-lg border border-red-500 bg-red-900 bg-opacity-20 p-4 text-center'>
          <p className='text-red-500'>
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
      <div className='container mx-auto px-4 py-8'>
        <div className='rounded-lg border border-red-500 bg-red-900 bg-opacity-20 p-4 text-center'>
          <p className='text-red-500'>
            Thread not found. Please check the URL and try again.
          </p>
        </div>
      </div>
    );
  }

  // Only render metadata when we have thread data
  const metadata = <ThreadMetadata thread={thread} />;

  return (
    <div className='container mx-auto px-4 py-6'>
      {metadata}

      <div className='flex flex-col lg:flex-row lg:space-x-6'>
        {/* Main Content */}
        <div className='lg:flex-grow'>
          {/* Breadcrumbs */}
          <div className='mb-4 flex items-center text-sm'>
            <Link
              href='/forum'
              className='flex-shrink-0 text-gray-400 transition hover:text-white'
            >
              Forums
            </Link>
            <span className='mx-2 flex-shrink-0 text-gray-600'>/</span>
            <Link
              href={`/forum/${thread.categoryId}`}
              className='flex-shrink-0 text-gray-400 transition hover:text-white'
            >
              {getCategoryName(thread.categoryId)}
            </Link>
            <span className='mx-2 flex-shrink-0 text-gray-600'>/</span>
            <span className='truncate text-white'>
              {thread.title.length > 30
                ? thread.title.substring(0, 30) + "..."
                : thread.title}
            </span>
          </div>

          {/* Thread Card */}
          <ThreadCard
            thread={thread}
            onDelete={handleThreadDelete}
            mainThreadMode={true}
          />

          {/* Reply Thread */}
          <ReplyThread thread={thread} currentUser={currentUser} />
        </div>

        {/* Right Sidebar */}
        <div className='mt-9 hidden w-80 flex-shrink-0 lg:block'>
          <div className='bg-dark-gray sticky top-20 rounded-lg p-4'>
            <h3 className='mb-4 text-lg font-bold text-white'>Thread Info</h3>

            <div className='mb-4'>
              <p className='mb-1 text-sm text-gray-400'>Posted by</p>
              <div className='flex items-center'>
                <UserAvatar user={thread.user} size='sm' className='mr-2' />
                <Link
                  href={`/user/${thread.user.username}`}
                  className='hover:text-ufc-blue text-white transition'
                >
                  {thread.user.username}
                </Link>
              </div>
            </div>

            <div className='mb-4'>
              <p className='mb-1 text-sm text-gray-400'>Category</p>
              <Link
                href={`/forum/${thread.categoryId}`}
                className='text-ufc-blue hover:underline'
              >
                {getCategoryName(thread.categoryId)}
              </Link>
            </div>

            <div className='mb-4'>
              <p className='mb-1 text-sm text-gray-400'>Created</p>
              <p className='text-white'>{formatDate(thread.createdAt)}</p>
            </div>

            {thread.edited && thread.editedAt && (
              <div className='mb-4'>
                <p className='mb-1 text-sm text-gray-400'>Last edited</p>
                <p className='text-white'>{formatDate(thread.editedAt)}</p>
              </div>
            )}

            <div className='mb-4'>
              <p className='mb-1 text-sm text-gray-400'>Stats</p>
              <div className='grid grid-cols-2 gap-2'>
                <div className='rounded-lg bg-gray-800 p-2 text-center'>
                  <span className='text-ufc-blue block font-bold'>
                    {thread.likesCount}
                  </span>
                  <span className='text-xs text-gray-400'>Likes</span>
                </div>
                <div className='rounded-lg bg-gray-800 p-2 text-center'>
                  <span className='text-ufc-blue block font-bold'>
                    {thread.repliesCount}
                  </span>
                  <span className='text-xs text-gray-400'>Replies</span>
                </div>
              </div>
            </div>

            {thread.isPinned && (
              <div className='mb-4 rounded-lg bg-gray-800 p-3'>
                <div className='text-ufc-blue mb-1 flex items-center'>
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    className='mr-1 h-4 w-4'
                    fill='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path d='M16 12V4h1V2H7v2h1v8l-2 2v2h5v6h2v-6h5v-2l-2-2z' />
                  </svg>
                  <span className='font-medium'>PINNED</span>
                </div>
                <p className='text-sm text-gray-300'>
                  This post has been pinned by an administrator.
                </p>
              </div>
            )}

            {((currentUser?.publicMetadata?.role as string) === "ADMIN" ||
              (currentUser?.publicMetadata?.role as string) ===
                "MODERATOR") && (
              <div className='mt-4 border-t border-gray-800 pt-4'>
                <h3 className='mb-2 text-lg font-bold text-white'>
                  Moderation
                </h3>
                <div className='space-y-2'>
                  <button className='flex w-full items-center justify-center rounded-lg bg-gray-800 px-3 py-2 text-sm text-white transition hover:bg-gray-700'>
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      className='mr-1 h-4 w-4'
                      viewBox='0 0 20 20'
                      fill='currentColor'
                    >
                      <path
                        fillRule='evenodd'
                        d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z'
                        clipRule='evenodd'
                      />
                    </svg>
                    {thread.isLocked ? "Unlock Thread" : "Lock Thread"}
                  </button>
                  <button className='flex w-full items-center justify-center rounded-lg bg-gray-800 px-3 py-2 text-sm text-white transition hover:bg-gray-700'>
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      className='mr-1 h-4 w-4'
                      viewBox='0 0 20 20'
                      fill='currentColor'
                    >
                      <path
                        fillRule='evenodd'
                        d='M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z'
                        clipRule='evenodd'
                      />
                    </svg>
                    {thread.isPinned ? "Unpin Thread" : "Pin Thread"}
                  </button>
                  <button className='bg-ufc-blue hover:bg-ufc-blue-dark flex w-full items-center justify-center rounded-lg px-3 py-2 text-sm text-black transition'>
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      className='mr-1 h-4 w-4'
                      viewBox='0 0 20 20'
                      fill='currentColor'
                    >
                      <path
                        fillRule='evenodd'
                        d='M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z'
                        clipRule='evenodd'
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
    </div>
  );
}
