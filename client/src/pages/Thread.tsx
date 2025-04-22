import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ForumThread, ThreadReply } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import UserAvatar from "@/components/ui/user-avatar";
import StatusBadge from "@/components/ui/status-badge";

export default function Thread() {
  const { threadId } = useParams<{ threadId: string }>();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [replyContent, setReplyContent] = useState("");
  const [replyingTo, setReplyingTo] = useState<{ id: number, username: string } | null>(null);
  
  // Fetch thread data
  const { data: thread, isLoading: isThreadLoading, error: threadError } = useQuery<ForumThread>({
    queryKey: [`/api/threads/id/${threadId}`],
    // In a real app, we would fetch from the API
  });
  
  // Fetch thread replies
  const { data: replies, isLoading: isRepliesLoading, error: repliesError } = useQuery<ThreadReply[]>({
    queryKey: [`/api/threads/${threadId}/replies`],
    enabled: !!threadId,
    // In a real app, we would fetch from the API
  });
  
  // For demo purposes, create mock thread if none is returned from the API
  const displayThread = thread || generateMockThread(parseInt(threadId || "1"));
  
  // For demo purposes, create mock replies if none are returned from the API
  const displayReplies = replies?.length ? replies : generateMockReplies(parseInt(threadId || "1"));
  
  // Handle liking a thread
  const likeThreadMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser) throw new Error("You must be logged in to like posts");
      
      return apiRequest("POST", `/api/threads/${threadId}/like`, {
        userId: currentUser.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/threads/id/${threadId}`] });
      toast({
        title: "Success",
        description: "You liked this post",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to like post",
        variant: "destructive"
      });
    }
  });
  
  // Handle disliking a thread
  const dislikeThreadMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser) throw new Error("You must be logged in to dislike posts");
      
      return apiRequest("POST", `/api/threads/${threadId}/dislike`, {
        userId: currentUser.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/threads/id/${threadId}`] });
      toast({
        title: "Success",
        description: "You disliked this post",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to dislike post",
        variant: "destructive"
      });
    }
  });
  
  // Handle post of the day
  const potdThreadMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser) throw new Error("You must be logged in to vote for POTD");
      
      return apiRequest("POST", `/api/threads/${threadId}/potd`, {
        userId: currentUser.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/threads/id/${threadId}`] });
      toast({
        title: "Success",
        description: "You've selected this post as Post of the Day!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to select post as POTD",
        variant: "destructive"
      });
    }
  });
  
  // Handle submitting a reply
  const submitReplyMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser) throw new Error("You must be logged in to reply");
      if (!replyContent.trim()) throw new Error("Reply cannot be empty");
      
      return apiRequest("POST", `/api/threads/${threadId}/replies`, {
        userId: currentUser.id,
        content: replyContent,
        parentReplyId: replyingTo?.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/threads/${threadId}/replies`] });
      setReplyContent("");
      setReplyingTo(null);
      toast({
        title: "Success",
        description: "Your reply has been posted",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to post reply",
        variant: "destructive"
      });
    }
  });
  
  // Handle liking a reply
  const likeReplyMutation = useMutation({
    mutationFn: async (replyId: number) => {
      if (!currentUser) throw new Error("You must be logged in to like replies");
      
      return apiRequest("POST", `/api/replies/${replyId}/like`, {
        userId: currentUser.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/threads/${threadId}/replies`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to like reply",
        variant: "destructive"
      });
    }
  });
  
  // Handle disliking a reply
  const dislikeReplyMutation = useMutation({
    mutationFn: async (replyId: number) => {
      if (!currentUser) throw new Error("You must be logged in to dislike replies");
      
      return apiRequest("POST", `/api/replies/${replyId}/dislike`, {
        userId: currentUser.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/threads/${threadId}/replies`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to dislike reply",
        variant: "destructive"
      });
    }
  });
  
  // Handle quoting a reply
  const handleQuoteReply = (reply: ThreadReply) => {
    setReplyingTo({ id: reply.id, username: reply.user.username });
    setReplyContent(`> ${reply.user.username} said: ${reply.content.substring(0, 100)}${reply.content.length > 100 ? '...' : ''}\n\n`);
    
    // Scroll to reply form
    document.getElementById('reply-form')?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Handle poll vote
  const submitPollVoteMutation = useMutation({
    mutationFn: async (optionId: number) => {
      if (!currentUser) throw new Error("You must be logged in to vote");
      if (!displayThread.poll) throw new Error("No poll found");
      
      return apiRequest("POST", `/api/threads/${threadId}/poll/${optionId}/vote`, {
        userId: currentUser.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/threads/id/${threadId}`] });
      toast({
        title: "Success",
        description: "Your vote has been recorded",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to record vote",
        variant: "destructive"
      });
    }
  });
  
  // Loading state
  if (isThreadLoading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-ufc-red"></div>
      </div>
    );
  }
  
  // Error state
  if (threadError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-900 bg-opacity-20 border border-red-500 rounded-lg p-4 text-center">
          <p className="text-red-500">Error loading thread. Please try again later.</p>
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
            <Link href="/forum" className="text-gray-400 hover:text-white transition">Forum</Link>
            <span className="mx-2 text-gray-600">/</span>
            <Link href={`/forum/${displayThread.categoryId}`} className="text-gray-400 hover:text-white transition">
              {getCategoryName(displayThread.categoryId)}
            </Link>
            <span className="mx-2 text-gray-600">/</span>
            <span className="text-white truncate">{displayThread.title.length > 30 ? displayThread.title.substring(0, 30) + '...' : displayThread.title}</span>
          </div>
          
          {/* Thread Card */}
          <div className={`bg-dark-gray ${displayThread.isPotd ? 'border-l-4 border-ufc-red' : ''} rounded-lg overflow-hidden shadow-lg mb-6`}>
            <div className="p-5">
              {/* Thread Header */}
              <div className="flex items-start">
                <div className="mr-4 flex-shrink-0">
                  <UserAvatar user={displayThread.user} size="lg" />
                </div>
                
                <div className="flex-grow">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {displayThread.isPinned && (
                      <span className="bg-gray-800 text-ufc-gold text-xs px-2 py-0.5 rounded font-medium">
                        PINNED
                      </span>
                    )}
                    
                    {displayThread.isPotd && (
                      <span className="bg-ufc-red text-white text-xs px-2 py-0.5 rounded font-bold">
                        POTD
                      </span>
                    )}
                    
                    <StatusBadge status={displayThread.user.status} />
                    
                    {displayThread.user.role === "PRO" && (
                      <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full font-bold flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        VERIFIED
                      </span>
                    )}
                    
                    {displayThread.user.role === "ADMIN" && (
                      <span className="bg-ufc-gold text-ufc-black text-xs px-2 py-0.5 rounded font-bold">
                        ADMIN
                      </span>
                    )}
                    
                    {displayThread.user.role === "MODERATOR" && (
                      <span className="bg-green-600 text-white text-xs px-2 py-0.5 rounded font-bold">
                        MOD
                      </span>
                    )}
                    
                    <Link href={`/user/${displayThread.user.username}`} className="text-white font-medium hover:text-ufc-red transition">
                      {displayThread.user.username}
                    </Link>
                    
                    <span className="text-gray-400 text-sm">
                      {formatDate(displayThread.createdAt)}
                    </span>
                  </div>
                  
                  <h1 className="text-2xl font-bold text-white mb-4">{displayThread.title}</h1>
                  
                  <div className="text-gray-300 mb-6 whitespace-pre-line">
                    {displayThread.content}
                  </div>
                  
                  {/* Thread Media */}
                  {displayThread.media && displayThread.media.length > 0 && (
                    <div className="mb-6">
                      <img 
                        src={displayThread.media[0].url} 
                        alt={`Media for ${displayThread.title}`} 
                        className="rounded-lg max-h-96 w-auto"
                      />
                    </div>
                  )}
                  
                  {/* Thread Poll */}
                  {displayThread.poll && (
                    <div className="bg-gray-800 rounded-lg p-4 mb-6">
                      <h3 className="text-white font-medium mb-4">{displayThread.poll.question}</h3>
                      <div className="space-y-3">
                        {displayThread.poll.options.map((option) => {
                          const percentage = displayThread.poll?.votesCount 
                            ? Math.round((option.votesCount / displayThread.poll.votesCount) * 100) 
                            : 0;
                          
                          return (
                            <div key={option.id} className="relative">
                              <button
                                onClick={() => submitPollVoteMutation.mutate(option.id)}
                                disabled={!currentUser || submitPollVoteMutation.isPending}
                                className="w-full"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm text-gray-300">{option.text}</span>
                                  <span className="text-sm text-gray-300">{percentage}%</span>
                                </div>
                                <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-700">
                                  <div 
                                    style={{ width: `${percentage}%` }} 
                                    className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${option.id % 2 === 0 ? 'bg-blue-500' : 'bg-red-500'}`}
                                  />
                                </div>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                      
                      <p className="text-gray-400 text-xs mt-4">
                        {displayThread.poll.votesCount} votes • 
                        {new Date() > displayThread.poll.expiresAt 
                          ? ' Poll ended' 
                          : ` ${Math.ceil((displayThread.poll.expiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left`}
                      </p>
                      
                      {!currentUser && (
                        <p className="text-gray-500 text-xs mt-2">You must be logged in to vote</p>
                      )}
                    </div>
                  )}
                  
                  {/* Thread Actions */}
                  <div className="border-t border-gray-800 pt-4 mt-4 flex items-center flex-wrap gap-4">
                    <button 
                      onClick={() => likeThreadMutation.mutate()}
                      disabled={!currentUser || likeThreadMutation.isPending}
                      className="flex items-center text-gray-400 hover:text-green-500 transition"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                      </svg>
                      <span className="font-medium">{displayThread.likesCount}</span>
                    </button>
                    
                    <button 
                      onClick={() => dislikeThreadMutation.mutate()}
                      disabled={!currentUser || dislikeThreadMutation.isPending}
                      className="flex items-center text-gray-400 hover:text-red-500 transition"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2" />
                      </svg>
                      <span className="font-medium">{displayThread.dislikesCount}</span>
                    </button>
                    
                    <button 
                      onClick={() => potdThreadMutation.mutate()}
                      disabled={!currentUser || potdThreadMutation.isPending || displayThread.isPotd}
                      className={`flex items-center ${displayThread.isPotd ? 'text-ufc-red' : 'text-gray-400 hover:text-ufc-red'} transition`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                      <span className="font-medium">POTD</span>
                    </button>
                    
                    <button
                      onClick={() => document.getElementById('reply-form')?.scrollIntoView({ behavior: 'smooth' })} 
                      className="flex items-center text-gray-400 hover:text-white transition ml-auto"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                      <span className="font-medium">Reply</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Thread Replies */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white mb-4">Replies ({displayReplies.length})</h2>
            
            {isRepliesLoading ? (
              <div className="py-12 text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-ufc-red mx-auto"></div>
                <p className="mt-4 text-gray-400">Loading replies...</p>
              </div>
            ) : repliesError ? (
              <div className="bg-red-900 bg-opacity-20 border border-red-500 rounded-lg p-4 text-center">
                <p className="text-red-500">Error loading replies. Please try again later.</p>
              </div>
            ) : displayReplies.length === 0 ? (
              <div className="bg-dark-gray rounded-lg p-8 text-center">
                <p className="text-gray-400">No replies yet. Be the first to reply!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {displayReplies.map(reply => (
                  <ReplyCard 
                    key={reply.id} 
                    reply={reply} 
                    onQuote={handleQuoteReply}
                    onLike={() => likeReplyMutation.mutate(reply.id)}
                    onDislike={() => dislikeReplyMutation.mutate(reply.id)}
                  />
                ))}
              </div>
            )}
          </div>
          
          {/* Reply Form */}
          <div id="reply-form" className="bg-dark-gray rounded-lg p-5">
            <h3 className="text-lg font-bold text-white mb-4">
              {replyingTo ? `Reply to ${replyingTo.username}` : "Add Your Reply"}
            </h3>
            
            {!currentUser ? (
              <div className="bg-gray-800 p-4 rounded-lg text-center">
                <p className="text-gray-300 mb-3">You need to be logged in to reply</p>
                <Link href="/login" className="inline-block bg-ufc-red hover:bg-red-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition">
                  Log In
                </Link>
              </div>
            ) : (
              <form onSubmit={(e) => {
                e.preventDefault();
                submitReplyMutation.mutate();
              }}>
                {replyingTo && (
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-400">
                      Replying to <span className="text-ufc-red">{replyingTo.username}</span>
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
                
                <textarea 
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write your reply here..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-gray-300 min-h-[150px] focus:outline-none focus:ring-1 focus:ring-ufc-red"
                  required
                />
                
                <div className="flex justify-between items-center mt-4">
                  <div className="flex space-x-3">
                    <button type="button" className="text-gray-400 hover:text-white flex items-center">
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
                    </button>
                  </div>
                  
                  <button 
                    type="submit"
                    disabled={submitReplyMutation.isPending || !replyContent.trim()}
                    className={`bg-ufc-red hover:bg-red-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition ${
                      submitReplyMutation.isPending || !replyContent.trim() ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {submitReplyMutation.isPending ? 'Posting...' : 'Post Reply'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
        
        {/* Right Sidebar */}
        <div className="hidden lg:block w-80 flex-shrink-0 mt-16">
          <div className="bg-dark-gray rounded-lg p-4 sticky top-20">
            <h3 className="text-lg font-bold text-white mb-4">Thread Info</h3>
            
            <div className="mb-4">
              <p className="text-gray-400 text-sm mb-1">Posted by</p>
              <div className="flex items-center">
                <UserAvatar user={displayThread.user} size="sm" className="mr-2" />
                <Link href={`/user/${displayThread.user.username}`} className="text-white hover:text-ufc-red transition">
                  {displayThread.user.username}
                </Link>
              </div>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-400 text-sm mb-1">Category</p>
              <Link href={`/forum/${displayThread.categoryId}`} className="text-ufc-red hover:underline">
                {getCategoryName(displayThread.categoryId)}
              </Link>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-400 text-sm mb-1">Created</p>
              <p className="text-white">{formatDate(displayThread.createdAt)}</p>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-400 text-sm mb-1">Stats</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-800 p-2 rounded-lg text-center">
                  <span className="block text-ufc-red font-bold">{displayThread.viewCount}</span>
                  <span className="text-gray-400 text-xs">Views</span>
                </div>
                <div className="bg-gray-800 p-2 rounded-lg text-center">
                  <span className="block text-ufc-red font-bold">{displayThread.repliesCount}</span>
                  <span className="text-gray-400 text-xs">Replies</span>
                </div>
              </div>
            </div>
            
            {displayThread.isPotd && (
              <div className="bg-gray-800 p-3 rounded-lg mb-4">
                <div className="flex items-center text-ufc-red mb-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  <span className="font-bold">Post of the Day</span>
                </div>
                <p className="text-gray-300 text-sm">This post has been selected as Post of the Day by the community!</p>
              </div>
            )}
            
            {(currentUser?.role === "ADMIN" || currentUser?.role === "MODERATOR") && (
              <div className="border-t border-gray-800 pt-4 mt-4">
                <h3 className="text-lg font-bold text-white mb-2">Moderation</h3>
                <div className="space-y-2">
                  <button className="w-full bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-sm transition flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {displayThread.isLocked ? 'Unlock Thread' : 'Lock Thread'}
                  </button>
                  <button className="w-full bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-sm transition flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                    </svg>
                    {displayThread.isPinned ? 'Unpin Thread' : 'Pin Thread'}
                  </button>
                  <button className="w-full bg-red-900 hover:bg-red-800 text-white px-3 py-2 rounded-lg text-sm transition flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
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

interface ReplyCardProps {
  reply: ThreadReply;
  onQuote: (reply: ThreadReply) => void;
  onLike: () => void;
  onDislike: () => void;
}

function ReplyCard({ reply, onQuote, onLike, onDislike }: ReplyCardProps) {
  const { currentUser } = useAuth();
  
  // Calculate indentation level based on nested replies
  const indentationLevel = reply.parentReplyId ? 1 : 0;
  const indentationClass = indentationLevel > 0 ? 'ml-8 border-l-2 border-gray-800 pl-4' : '';
  
  return (
    <div className={`bg-dark-gray rounded-lg overflow-hidden shadow-lg ${indentationClass}`}>
      <div className="p-4">
        <div className="flex items-start">
          <div className="mr-3 flex-shrink-0">
            <UserAvatar user={reply.user} size="md" />
          </div>
          
          <div className="flex-grow">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <StatusBadge status={reply.user.status} />
              
              {reply.user.role === "PRO" && (
                <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full font-bold flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  VERIFIED
                </span>
              )}
              
              {reply.user.role === "ADMIN" && (
                <span className="bg-ufc-gold text-ufc-black text-xs px-2 py-0.5 rounded font-bold">
                  ADMIN
                </span>
              )}
              
              {reply.user.role === "MODERATOR" && (
                <span className="bg-green-600 text-white text-xs px-2 py-0.5 rounded font-bold">
                  MOD
                </span>
              )}
              
              <Link href={`/user/${reply.user.username}`} className="text-white font-medium hover:text-ufc-red transition">
                {reply.user.username}
              </Link>
              
              <span className="text-gray-400 text-sm">
                {formatDate(reply.createdAt)}
              </span>
            </div>
            
            <div className="text-gray-300 mb-4 whitespace-pre-line">
              {reply.content}
            </div>
            
            {/* Reply Media */}
            {reply.media && reply.media.length > 0 && (
              <div className="mb-4">
                <img 
                  src={reply.media[0].url} 
                  alt={`Media for reply`} 
                  className="rounded-lg max-h-72 w-auto"
                />
              </div>
            )}
            
            {/* Reply Actions */}
            <div className="flex items-center flex-wrap gap-4">
              <button 
                onClick={onLike}
                disabled={!currentUser}
                className="flex items-center text-gray-400 hover:text-green-500 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
                <span className="font-medium">{reply.likesCount}</span>
              </button>
              
              <button 
                onClick={onDislike}
                disabled={!currentUser}
                className="flex items-center text-gray-400 hover:text-red-500 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2" />
                </svg>
                <span className="font-medium">{reply.dislikesCount}</span>
              </button>
              
              <button 
                onClick={() => onQuote(reply)}
                disabled={!currentUser}
                className="flex items-center text-gray-400 hover:text-white transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <span className="font-medium">Quote</span>
              </button>
              
              <button 
                onClick={() => {
                  document.getElementById('reply-form')?.scrollIntoView({ behavior: 'smooth' });
                  onQuote(reply);
                }}
                disabled={!currentUser}
                className="flex items-center text-gray-400 hover:text-white transition ml-auto"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                <span className="font-medium">Reply</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to get category name
function getCategoryName(categoryId: string): string {
  const categories: Record<string, string> = {
    'general': 'General Discussion',
    'ufc': 'UFC',
    'bellator': 'Bellator',
    'one': 'ONE Championship',
    'pfl': 'PFL',
    'boxing': 'Boxing',
    'techniques': 'Fight Techniques',
    'offtopic': 'Off Topic',
  };
  
  return categories[categoryId] || 'Unknown Category';
}

// Helper function to generate a mock thread for demonstration
function generateMockThread(threadId: number): ForumThread {
  if (threadId === 2) {
    // Jones vs Aspinall thread from design reference
    return {
      id: 2,
      title: "Jones vs Aspinall: Who would win and why?",
      content: "With Aspinall taking the interim title, a unification bout with Jones seems inevitable. Let's break down who would win this dream matchup and why. Personally, I think Aspinall's speed gives Jones problems but Jon's experience edge is significant.",
      userId: 2,
      user: {
        id: 2,
        username: "KnockoutKing",
        avatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=144&h=144&q=80",
        status: "CHAMPION",
        isOnline: true,
        postsCount: 94,
        likesCount: 1203,
        potdCount: 8,
        rank: 2,
        followersCount: 215,
        followingCount: 44,
        role: "USER",
      },
      categoryId: "ufc",
      isPinned: false,
      isLocked: false,
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      lastActivityAt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
      viewCount: 1800,
      likesCount: 324,
      dislikesCount: 42,
      repliesCount: 86,
      isPotd: true,
      poll: {
        id: 1,
        threadId: 2,
        question: "Who wins this matchup?",
        options: [
          { id: 1, pollId: 1, text: "Jon Jones", votesCount: 156 },
          { id: 2, pollId: 1, text: "Tom Aspinall", votesCount: 87 },
        ],
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day from now
        votesCount: 243,
      },
    };
  } else {
    // Default thread
    return {
      id: threadId,
      title: "Welcome to 3 Punch Convo - Rules & Guidelines",
      content: "Welcome to our community! Please read our rules before posting. We aim to keep discussions respectful and on-topic. Any violation may result in post removal or account suspension.\n\n1. Be respectful to fellow community members\n2. No hate speech or personal attacks\n3. Keep discussions relevant to MMA and combat sports\n4. No spam or excessive self-promotion\n5. No illegal streams or pirated content\n\nThank you for joining our community. Let's make this the best place for MMA fans to discuss the sport we all love!",
      userId: 1,
      user: {
        id: 1,
        username: "OctagonInsider",
        avatar: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=144&h=144&q=80",
        status: "HALL OF FAMER",
        isOnline: true,
        postsCount: 157,
        likesCount: 3200,
        potdCount: 12,
        rank: 1,
        followersCount: 420,
        followingCount: 63,
        role: "ADMIN",
      },
      categoryId: "general",
      isPinned: true,
      isLocked: false,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      lastActivityAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      viewCount: 3200,
      likesCount: 147,
      dislikesCount: 0,
      repliesCount: 24,
      isPotd: false,
    };
  }
}

// Helper function to generate mock replies for demonstration
function generateMockReplies(threadId: number): ThreadReply[] {
  if (threadId === 2) {
    // Jones vs Aspinall thread replies
    return [
      {
        id: 1,
        threadId: 2,
        userId: 4,
        user: {
          id: 4,
          username: "MMAHistorian",
          avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=144&h=144&q=80",
          status: "RANKED POSTER",
          isOnline: true,
          postsCount: 152,
          likesCount: 2700,
          potdCount: 6,
          rank: 5,
          followersCount: 87,
          followingCount: 113,
          role: "USER",
        },
        content: "I disagree. Aspinall's ground game is underrated, but Jones has been taking down Olympic wrestlers his entire career. Jon would take him down at will and control him for 5 rounds. His fight IQ is just too high.",
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
        updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
        likesCount: 82,
        dislikesCount: 17,
      },
      {
        id: 2,
        threadId: 2,
        userId: 5,
        user: {
          id: 5,
          username: "StrikingQueen",
          avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=144&h=144&q=80",
          status: "CONTENDER",
          isOnline: true,
          postsCount: 217,
          likesCount: 3800,
          potdCount: 12,
          rank: 3,
          followersCount: 148,
          followingCount: 76,
          role: "USER",
        },
        content: "This is a tough one. Jones has the experience and fight IQ, but Aspinall has youth, speed, and legitimate KO power. I think it comes down to whether Tom can keep it standing. If he can, I give him a good chance. If Jones gets him to the ground, it's Jon's fight to lose.",
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        likesCount: 65,
        dislikesCount: 3,
      },
      {
        id: 3,
        threadId: 2,
        userId: 3,
        user: {
          id: 3,
          username: "DustinPoirier",
          avatar: "https://images.unsplash.com/photo-1614632537197-38a17061c2bd?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=144&h=144&q=80",
          status: "HALL OF FAMER",
          isOnline: true,
          postsCount: 73,
          likesCount: 4120,
          potdCount: 14,
          rank: 1,
          followersCount: 1200,
          followingCount: 23,
          role: "PRO",
        },
        content: "Speaking from experience, Jones is the most difficult fighter to game plan for. His reach and creativity make him unpredictable. But Aspinall has incredible speed for a heavyweight. I'd give a slight edge to Jones, but wouldn't be shocked if Aspinall caught him.",
        createdAt: new Date(Date.now() - 90 * 60 * 1000), // 90 minutes ago
        updatedAt: new Date(Date.now() - 90 * 60 * 1000),
        likesCount: 241,
        dislikesCount: 2,
      },
      {
        id: 4,
        threadId: 2,
        userId: 2,
        parentReplyId: 3,
        user: {
          id: 2,
          username: "KnockoutKing",
          avatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=144&h=144&q=80",
          status: "CHAMPION",
          isOnline: true,
          postsCount: 94,
          likesCount: 1203,
          potdCount: 8,
          rank: 2,
          followersCount: 215,
          followingCount: 44,
          role: "USER",
        },
        content: "Thanks for weighing in, Dustin! Great to get a pro's perspective. Do you think the layoff might have affected Jones in any way?",
        createdAt: new Date(Date.now() - 60 * 60 * 1000), // 60 minutes ago
        updatedAt: new Date(Date.now() - 60 * 60 * 1000),
        likesCount: 48,
        dislikesCount: 0,
      },
      {
        id: 5,
        threadId: 2,
        userId: 3,
        parentReplyId: 4,
        user: {
          id: 3,
          username: "DustinPoirier",
          avatar: "https://images.unsplash.com/photo-1614632537197-38a17061c2bd?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=144&h=144&q=80",
          status: "HALL OF FAMER",
          isOnline: true,
          postsCount: 73,
          likesCount: 4120,
          potdCount: 14,
          rank: 1,
          followersCount: 1200,
          followingCount: 23,
          role: "PRO",
        },
        content: "The layoff is definitely a factor. Sometimes it can be good to let your body recover, but timing and reaction speed can suffer. That said, Jones has always been a student of the game. I'm sure he's been studying and preparing even when not actively fighting.",
        createdAt: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
        updatedAt: new Date(Date.now() - 45 * 60 * 1000),
        likesCount: 92,
        dislikesCount: 1,
      },
      {
        id: 6,
        threadId: 2,
        userId: 6,
        user: {
          id: 6,
          username: "FighterFan84",
          avatar: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=144&h=144&q=80",
          status: "CONTENDER",
          isOnline: true,
          postsCount: 157,
          likesCount: 1203,
          potdCount: 5,
          rank: 17,
          followersCount: 42,
          followingCount: 63,
          role: "USER",
        },
        content: "I think we're overlooking one big factor here - Jon hasn't really faced anyone with the combination of size, speed, and technique that Aspinall brings. Every heavyweight he's faced so far has been lacking in at least one of those areas.\n\nAspinall is legitimately as fast as a light heavyweight but with actual heavyweight power. I believe he presents problems Jon hasn't had to solve yet.",
        createdAt: new Date(Date.now() - 20 * 60 * 1000), // 20 minutes ago
        updatedAt: new Date(Date.now() - 20 * 60 * 1000),
        likesCount: 37,
        dislikesCount: 12,
      },
    ];
  } else {
    // Default thread replies
    return [
      {
        id: 1,
        threadId: 1,
        userId: 2,
        user: {
          id: 2,
          username: "KnockoutKing",
          avatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=144&h=144&q=80",
          status: "CHAMPION",
          isOnline: true,
          postsCount: 94,
          likesCount: 1203,
          potdCount: 8,
          rank: 2,
          followersCount: 215,
          followingCount: 44,
          role: "USER",
        },
        content: "Great rules! Thanks for creating this community. Looking forward to some awesome MMA discussions!",
        createdAt: new Date(Date.now() - 110 * 60 * 1000), // 110 minutes ago
        updatedAt: new Date(Date.now() - 110 * 60 * 1000),
        likesCount: 32,
        dislikesCount: 0,
      },
      {
        id: 2,
        threadId: 1,
        userId: 4,
        user: {
          id: 4,
          username: "GrappleGuru",
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=144&h=144&q=80",
          status: "RANKED POSTER",
          isOnline: true,
          postsCount: 178,
          likesCount: 3100,
          potdCount: 9,
          rank: 4,
          followersCount: 103,
          followingCount: 89,
          role: "USER",
        },
        content: "Question about rule #3 - does this mean we can't discuss boxing or other combat sports at all? Or just that we should keep it in the relevant sections?",
        createdAt: new Date(Date.now() - 90 * 60 * 1000), // 90 minutes ago
        updatedAt: new Date(Date.now() - 90 * 60 * 1000),
        likesCount: 15,
        dislikesCount: 0,
      },
      {
        id: 3,
        threadId: 1,
        userId: 1,
        parentReplyId: 2,
        user: {
          id: 1,
          username: "OctagonInsider",
          avatar: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=144&h=144&q=80",
          status: "HALL OF FAMER",
          isOnline: true,
          postsCount: 157,
          likesCount: 3200,
          potdCount: 12,
          rank: 1,
          followersCount: 420,
          followingCount: 63,
          role: "ADMIN",
        },
        content: "Great question! Boxing and other combat sports are definitely welcome, but please use the appropriate categories. We have a dedicated boxing section, and if there's enough interest, we can add more specific categories for other combat sports.",
        createdAt: new Date(Date.now() - 80 * 60 * 1000), // 80 minutes ago
        updatedAt: new Date(Date.now() - 80 * 60 * 1000),
        likesCount: 28,
        dislikesCount: 0,
      },
      {
        id: 4,
        threadId: 1,
        userId: 5,
        user: {
          id: 5,
          username: "StrikingQueen",
          avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=144&h=144&q=80",
          status: "CONTENDER",
          isOnline: true,
          postsCount: 217,
          likesCount: 3800,
          potdCount: 12,
          rank: 3,
          followersCount: 148,
          followingCount: 76,
          role: "USER",
        },
        content: "Will there be any kind of verified status for fighters or industry professionals who join the community?",
        createdAt: new Date(Date.now() - 60 * 60 * 1000), // 60 minutes ago
        updatedAt: new Date(Date.now() - 60 * 60 * 1000),
        likesCount: 41,
        dislikesCount: 0,
      },
      {
        id: 5,
        threadId: 1,
        userId: 1,
        parentReplyId: 4,
        user: {
          id: 1,
          username: "OctagonInsider",
          avatar: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=144&h=144&q=80",
          status: "HALL OF FAMER",
          isOnline: true,
          postsCount: 157,
          likesCount: 3200,
          potdCount: 12,
          rank: 1,
          followersCount: 420,
          followingCount: 63,
          role: "ADMIN",
        },
        content: "Yes, absolutely! We're implementing a verification process for fighters, coaches, journalists, and other industry professionals. They'll receive a verified badge and will be exempt from the normal ranking system.",
        createdAt: new Date(Date.now() - 50 * 60 * 1000), // 50 minutes ago
        updatedAt: new Date(Date.now() - 50 * 60 * 1000),
        likesCount: 38,
        dislikesCount: 0,
      },
    ];
  }
}
