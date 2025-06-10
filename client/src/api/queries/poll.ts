import { apiRequest } from "@/lib/queryClient";

/**
 * Check if a user has voted in a poll
 */
export async function checkPollVote(threadId: string, userId?: string) {
  if (!userId) return { hasVoted: false, votedOptionId: null };
  
  const response = await apiRequest(
    "GET",
    `/api/threads/${threadId}/poll/check-vote?userId=${userId}`,
    null
  );
  
  if (!response.ok) {
    throw new Error("Failed to check vote status");
  }
  
  return response.json();
}

/**
 * Submit a vote for a poll option
 */
export async function submitPollVote({ 
  threadId, 
  optionId, 
  currentUser 
}: { 
  threadId: string; 
  optionId: string; 
  currentUser: any;
}) {
  if (!currentUser) throw new Error("You must be logged in to vote");

  try {
    // First, ensure the user exists in the backend database
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

      try {
        const errorData = JSON.parse(responseText);
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
} 