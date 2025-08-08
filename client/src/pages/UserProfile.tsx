import { useState } from "react";
import { useParams } from "wouter";
import UserAvatar from "@/components/ui/user-avatar";
import StatusBadge from "@/components/ui/status-badge";
import FCBadge from "@/components/ui/fc-badge";
import ThreadCard from "@/components/forum/ThreadCard";
import { useUserProfile } from "@/api";
import { USER_ROLES } from "@/lib/constants";
import UserRoleBadge from "@/components/ui/UserBadge";
import { checkIsNormalUser } from "@/lib/utils";
import { useMemoizedUser } from "@/hooks/useMemoizedUser";
import ProfileEditModal from "@/components/user/ProfileEditModal";
import { useQueryClient } from "@tanstack/react-query";

export default function UserProfile() {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser } = useMemoizedUser();
  const [activeTab, setActiveTab] = useState<"posts" | "about">("posts");
  const [showEditModal, setShowEditModal] = useState(false);
  const [coverPhotoLoading, setCoverPhotoLoading] = useState(true);
  const [coverPhotoError, setCoverPhotoError] = useState(false);
  const queryClient = useQueryClient();

  const {
    user,
    isUserLoading,
    userError,
    userPosts,
    isPostsLoading,
    postsError,
  } = useUserProfile(username);
  const isNormalUser = checkIsNormalUser(user?.role);

  // Use actual posts data or empty array if no posts
  const displayPosts = userPosts || [];

  const handleEditProfile = () => {
    setShowEditModal(true);
  };

  const handleProfileUpdateSuccess = () => {
    // Force refresh of user profile data as backup
    queryClient.invalidateQueries({
      queryKey: [`/api/users/username/${username}`],
    });
    queryClient.invalidateQueries({
      queryKey: [`/api/users/${user?.id}/posts`],
    });
    queryClient.invalidateQueries({
      queryKey: [`/api/users/${user?.id}/plan`],
    });
    setShowEditModal(false);
  };

  const handleCoverPhotoLoad = () => {
    setCoverPhotoLoading(false);
    setCoverPhotoError(false);
  };

  const handleCoverPhotoError = () => {
    setCoverPhotoLoading(false);
    setCoverPhotoError(true);
    console.error("Failed to load cover photo:", user?.coverPhoto);
  };

  // Loading state
  if (isUserLoading) {
    return (
      <div className='container mx-auto flex justify-center px-4 py-12'>
        <div className='border-ufc-blue h-12 w-12 animate-spin rounded-full border-b-2 border-t-2'></div>
      </div>
    );
  }

  // Error state
  if (userError) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <div className='rounded-lg border border-red-500 bg-red-900 bg-opacity-20 p-4 text-center'>
          <p className='text-red-500'>
            Error loading user profile. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto px-4 py-6'>
      <div className='bg-dark-gray overflow-hidden rounded-lg shadow-lg'>
        {/* Banner and Avatar */}
        <div
          className={`from-ufc-black to-ufc-blue relative bg-gradient-to-r ${user?.coverPhoto ? "aspect-[4/1]" : "h-24"}`}
        >
          {user?.coverPhoto && (
            <div className='absolute inset-0'>
              {coverPhotoLoading && (
                <div className='absolute inset-0 z-10 flex items-center justify-center'>
                  <div className='h-6 w-6 animate-spin rounded-full border-b-2 border-blue-500'></div>
                </div>
              )}
              {coverPhotoError && (
                <div className='absolute inset-0 z-10 flex items-center justify-center bg-gray-800'>
                  <div className='text-center text-gray-400'>
                    <svg
                      className='mx-auto mb-1 h-6 w-6'
                      fill='none'
                      viewBox='0 0 24 24'
                      stroke='currentColor'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z'
                      />
                    </svg>
                    <p className='text-xs'>Failed to load cover</p>
                  </div>
                </div>
              )}
              <img
                src={user.coverPhoto}
                alt='Cover photo'
                className={`h-full w-full object-cover ${coverPhotoLoading ? "opacity-0" : "opacity-100"} ${coverPhotoError ? "hidden" : ""}`}
                onLoad={handleCoverPhotoLoad}
                onError={handleCoverPhotoError}
              />
              <div className='absolute inset-0 bg-black bg-opacity-30'></div>
            </div>
          )}
          <div className='absolute -bottom-12 left-4 md:left-8'>
            <UserAvatar user={user} size='xl' />
          </div>
        </div>

        {/* User Info and Actions */}
        <div className='flex flex-col px-4 pb-6 pt-16 md:flex-row md:items-center md:justify-between md:px-8'>
          <div>
            <div className='mb-1 flex flex-wrap items-center gap-2'>
              <h1 className='text-xl font-bold text-white md:text-2xl'>
                {user.username}
              </h1>

              {isNormalUser && <FCBadge rank={user.points} />}

              <UserRoleBadge role={user.role} />

              {isNormalUser && <StatusBadge status={user.status} />}
            </div>

            {/* Display first and last name for fighters and industry professionals */}
            {(user.role === USER_ROLES.FIGHTER ||
              user.role === USER_ROLES.INDUSTRY_PROFESSIONAL) &&
              user.firstName &&
              user.lastName && (
                <div className='mb-2 text-sm text-gray-300 md:text-base'>
                  {user.firstName} {user.lastName}
                </div>
              )}

            {/* Bio Section */}
            {user.bio && (
              <div className='mb-3 max-w-2xl'>
                <p className='mt-4 whitespace-pre-wrap text-lg italic text-gray-300'>
                  <span className='font-bold'>Bio:</span> {user.bio}
                </p>
              </div>
            )}

            {/* Social Media Links */}
            {user.socialLinks && Object.keys(user.socialLinks).length > 0 && (
              <div className='mb-3 flex flex-wrap gap-2'>
                {user.socialLinks.twitter && (
                  <a
                    href={user.socialLinks.twitter}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='flex items-center space-x-1 rounded-lg bg-gray-800 px-2 py-1 text-xs text-gray-400 transition hover:bg-gray-700 hover:text-white'
                  >
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      className='h-3 w-3'
                      fill='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path d='M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' />
                    </svg>
                    <span className='text-xs'>X</span>
                  </a>
                )}
                {user.socialLinks.instagram && (
                  <a
                    href={user.socialLinks.instagram}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='flex items-center space-x-1 rounded-lg bg-gray-800 px-2 py-1 text-xs text-gray-400 transition hover:bg-gray-700 hover:text-white'
                  >
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      className='h-3 w-3'
                      fill='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path d='M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z' />
                    </svg>
                    <span className='text-xs'>Instagram</span>
                  </a>
                )}
                {user.socialLinks.youtube && (
                  <a
                    href={user.socialLinks.youtube}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='flex items-center space-x-1 rounded-lg bg-gray-800 px-2 py-1 text-xs text-gray-400 transition hover:bg-gray-700 hover:text-white'
                  >
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      className='h-3 w-3'
                      fill='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path d='M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z' />
                    </svg>
                    <span className='text-xs'>YouTube</span>
                  </a>
                )}
                {user.socialLinks.facebook && (
                  <a
                    href={user.socialLinks.facebook}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='flex items-center space-x-1 rounded-lg bg-gray-800 px-2 py-1 text-xs text-gray-400 transition hover:bg-gray-700 hover:text-white'
                  >
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      className='h-3 w-3'
                      fill='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path d='M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z' />
                    </svg>
                    <span className='text-xs'>Facebook</span>
                  </a>
                )}
              </div>
            )}

            <div className='mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-400'>
              <div className='flex items-center'>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  className='mr-1 h-4 w-4'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z'
                  />
                </svg>
                {user.postsCount} posts
              </div>
              <div className='flex items-center'>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  className='mr-1 h-4 w-4 text-green-500'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5'
                  />
                </svg>
                {user.likesCount} likes
              </div>
              <div className='flex items-center'>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  className='text-ufc-gold mr-1 h-4 w-4'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z'
                  />
                </svg>
                {user.potdCount} POTD
              </div>
              <div className='flex items-center'>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  className='text-ufc-blue mr-1 h-4 w-4'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M16 12V4h1V2H7v2h1v8l-2 2v2h5v6h2v-6h5v-2l-2-2z'
                  />
                </svg>
                {user.pinnedByUserCount} PINNED
              </div>
              <div className='flex items-center'>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  className='mr-1 h-3 w-3'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6'
                  />
                </svg>
                {user.repliesCount} REPLIES
              </div>
            </div>
          </div>

          <div className='mt-4 flex space-x-3 md:mt-0'>
            {/* Edit Profile */}
            {currentUser && currentUser.id === user.externalId && (
              <button
                onClick={handleEditProfile}
                className='flex flex-shrink-0 items-center whitespace-nowrap rounded-lg border border-gray-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800'
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  className='mr-1 h-4 w-4'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                  />
                </svg>
                Edit Bio
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className='mt-6 border-b border-gray-800'>
        <div className='flex space-x-8'>
          <button
            onClick={() => setActiveTab("posts")}
            className={`pb-4 text-sm font-medium transition ${
              activeTab === "posts"
                ? "border-ufc-blue border-b-2 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Posts
          </button>
          <button
            onClick={() => setActiveTab("about")}
            className={`pb-4 text-sm font-medium transition ${
              activeTab === "about"
                ? "border-ufc-blue border-b-2 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            About
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className='mt-6'>
        {activeTab === "posts" && (
          <>
            {isPostsLoading ? (
              <div className='py-12 text-center'>
                <div className='border-ufc-blue mx-auto h-10 w-10 animate-spin rounded-full border-b-2 border-t-2'></div>
                <p className='mt-4 text-gray-400'>Loading posts...</p>
              </div>
            ) : postsError ? (
              <div className='rounded-lg border border-red-500 bg-red-900 bg-opacity-20 p-4 text-center'>
                <p className='text-red-500'>
                  Error loading posts. Please try again later.
                </p>
              </div>
            ) : displayPosts.length === 0 ? (
              <div className='bg-dark-gray rounded-lg py-12 text-center'>
                <p className='text-gray-400'>
                  This user hasn't posted anything yet.
                </p>
              </div>
            ) : (
              <div className='space-y-4'>
                {displayPosts.map((post) => (
                  <ThreadCard key={post.id} thread={post} />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "about" && (
          <div className='bg-dark-gray rounded-lg p-6'>
            <h2 className='mb-4 text-lg font-bold text-white'>
              About {user.username}
            </h2>

            {/* Rank & Status */}
            {isNormalUser && (
              <div className='mb-6'>
                <h3 className='mb-2 font-medium text-gray-400'>
                  Rank & Status
                </h3>
                <div className='mb-2 flex items-center space-x-4'>
                  <div className='rounded-lg bg-gray-800 px-3 py-2'>
                    <span className='block text-xl font-bold text-white'>
                      #{user.rank}
                    </span>
                    <span className='text-xs text-gray-400'>
                      Community Rank
                    </span>
                    <div>
                      <div className='rounded-lg bg-gray-800 px-3 py-2'>
                        <FCBadge rank={user.points} />
                        <span className='mt-1 block text-xs text-gray-400'>
                          Fighter Cred
                        </span>
                      </div>
                      <div className='rounded-lg bg-gray-800 px-3 py-2'>
                        <div className='mb-1 block'>
                          <StatusBadge status={user.status} />
                        </div>
                        <span className='text-xs text-gray-400'>
                          Current Status
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Activity Stats */}
            <div className='mb-6'>
              <h3 className='mb-2 font-medium text-gray-400'>Activity Stats</h3>
              <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
                <div className='rounded-lg bg-gray-800 p-3 text-center'>
                  <span className='text-ufc-blue block text-xl font-bold'>
                    {user.postsCount}
                  </span>
                  <span className='text-sm text-gray-400'>Posts</span>
                </div>
                <div className='rounded-lg bg-gray-800 p-3 text-center'>
                  <span className='text-ufc-blue block text-xl font-bold'>
                    {user.likesCount}
                  </span>
                  <span className='text-sm text-gray-400'>Likes Received</span>
                </div>
                <div className='rounded-lg bg-gray-800 p-3 text-center'>
                  <span className='text-ufc-blue block text-xl font-bold'>
                    {user.potdCount}
                  </span>
                  <span className='text-sm text-gray-400'>POTD Count</span>
                </div>
                <div className='rounded-lg bg-gray-800 p-3 text-center'>
                  <span className='text-ufc-blue block text-xl font-bold'>
                    {user.pinnedByUserCount}
                  </span>
                  <span className='text-sm text-gray-400'>Post Pins</span>
                </div>
                <div className='rounded-lg bg-gray-800 p-3 text-center'>
                  <span className='text-ufc-blue block text-xl font-bold'>
                    {user.repliesCount}
                  </span>
                  <span className='text-sm text-gray-400'>
                    Replies Received
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {showEditModal && (
        <ProfileEditModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleProfileUpdateSuccess}
          user={user}
        />
      )}
    </div>
  );
}
