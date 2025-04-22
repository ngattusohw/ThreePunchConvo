import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { FORUM_CATEGORIES } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

interface CreatePostModalProps {
  onClose: () => void;
  categoryId: string;
}

export default function CreatePostModal({ onClose, categoryId }: CreatePostModalProps) {
  const { toast } = useToast();
  const { currentUser: user } = useAuth(); // Get the currently authenticated user
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState(categoryId);
  
  // Simple poll state
  const [includePoll, setIncludePoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);

  // Create new post mutation
  const createPostMutation = useMutation({
    mutationFn: async ({ title, content, categoryId, poll }: {
      title: string;
      content: string;
      categoryId: string;
      poll?: {
        question: string;
        options: string[];
      }
    }) => {
      if (!user) {
        throw new Error("You must be logged in to create a post");
      }
      
      const response = await apiRequest("POST", "/api/threads", {
        title,
        content,
        categoryId,
        userId: user.id, // Add the user ID to the request
        poll: includePoll ? poll : undefined
      });
      return response.json();
    },
    onSuccess: () => {
      // Invalidate the threads query to refetch the thread list
      queryClient.invalidateQueries({ queryKey: [`/api/threads/${category}`] });
      
      toast({
        title: "Success!",
        description: "Your post has been created.",
        variant: "default"
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create post. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a title for your post.",
        variant: "destructive"
      });
      return;
    }
    
    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Please enter some content for your post.",
        variant: "destructive"
      });
      return;
    }
    
    if (includePoll) {
      if (!pollQuestion.trim()) {
        toast({
          title: "Error",
          description: "Please enter a question for your poll.",
          variant: "destructive"
        });
        return;
      }
      
      const validOptions = pollOptions.filter(option => option.trim());
      if (validOptions.length < 2) {
        toast({
          title: "Error",
          description: "Please enter at least two options for your poll.",
          variant: "destructive"
        });
        return;
      }
      
      createPostMutation.mutate({
        title,
        content,
        categoryId: category,
        poll: {
          question: pollQuestion,
          options: validOptions
        }
      });
    } else {
      createPostMutation.mutate({
        title,
        content,
        categoryId: category
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-dark-gray rounded-lg max-w-2xl w-full mx-4 overflow-hidden shadow-xl">
        <div className="bg-ufc-black p-4 flex justify-between items-center border-b border-gray-800">
          <h3 className="text-white font-bold text-lg">Create New Post</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-4">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="post-title" className="block text-gray-300 mb-2 font-medium">Title</label>
              <input 
                type="text" 
                id="post-title" 
                placeholder="What's your topic about?" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white w-full focus:outline-none focus:ring-1 focus:ring-ufc-red"
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="post-category" className="block text-gray-300 mb-2 font-medium">Category</label>
              <select 
                id="post-category" 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white w-full focus:outline-none focus:ring-1 focus:ring-ufc-red"
              >
                {FORUM_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            
            <div className="mb-4">
              <label htmlFor="post-content" className="block text-gray-300 mb-2 font-medium">Content</label>
              <textarea 
                id="post-content" 
                rows={6} 
                placeholder="Share your thoughts..." 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white w-full focus:outline-none focus:ring-1 focus:ring-ufc-red"
              />
            </div>
            
            {includePoll && (
              <div className="mb-4 bg-gray-800 p-4 rounded-lg">
                <div className="mb-3">
                  <label htmlFor="poll-question" className="block text-gray-300 mb-2 font-medium">Poll Question</label>
                  <input 
                    type="text" 
                    id="poll-question" 
                    placeholder="Ask a question..." 
                    value={pollQuestion}
                    onChange={(e) => setPollQuestion(e.target.value)}
                    className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white w-full focus:outline-none focus:ring-1 focus:ring-ufc-red"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-gray-300 mb-1 font-medium">Options</label>
                  {pollOptions.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input 
                        type="text" 
                        placeholder={`Option ${index + 1}`} 
                        value={option}
                        onChange={(e) => handlePollOptionChange(index, e.target.value)}
                        className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white flex-grow focus:outline-none focus:ring-1 focus:ring-ufc-red"
                      />
                      {pollOptions.length > 2 && (
                        <button 
                          type="button"
                          onClick={() => handleRemovePollOption(index)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                  
                  <button 
                    type="button"
                    onClick={handleAddPollOption}
                    className="flex items-center text-ufc-red hover:text-red-400 text-sm font-medium mt-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                    </svg>
                    Add Option
                  </button>
                </div>
              </div>
            )}
            
            <div className="mb-4">
              <div className="flex space-x-4">
                <button type="button" className="flex items-center text-gray-300 hover:text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Add Image
                </button>
                
                <button type="button" className="flex items-center text-gray-300 hover:text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Add Emoji
                </button>
                
                <button 
                  type="button" 
                  onClick={() => setIncludePoll(!includePoll)}
                  className={`flex items-center ${includePoll ? 'text-ufc-red' : 'text-gray-300 hover:text-white'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  {includePoll ? 'Remove Poll' : 'Create Poll'}
                </button>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button 
                type="button" 
                onClick={onClose}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={createPostMutation.isPending}
                className={`px-4 py-2 bg-ufc-red hover:bg-red-700 text-white rounded-lg text-sm transition ${createPostMutation.isPending ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {createPostMutation.isPending ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </span>
                ) : "Create Post"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
