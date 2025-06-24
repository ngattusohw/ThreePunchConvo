import { useParams } from "wouter";
import { useState, useEffect } from "react";
import ForumCategories from "@/components/forum/ForumCategories";
import ForumContent from "@/components/forum/ForumContent";
import TopUsersSidebar from "@/components/sidebar/TopUsersSidebar";
import CreatePostModal from "@/components/forum/CreatePostModal";
import { FORUM_CATEGORIES } from "@/lib/constants";
import { useUserProfile } from "@/api/hooks/useUserProfile";
import { useMemoizedUser } from "@/hooks/useMemoizedUser";
import UpgradeModal from "@/components/forum/UpgradeModal";

export default function Forum() {
  const { user: currentUser } = useMemoizedUser();

  const { hasPaidPlan } = useUserProfile(currentUser?.username);

  // Get the category ID from URL params - test
  const params = useParams<{ categoryId?: string }>();
  const categoryId = params.categoryId || "general";

  // Validate the category exists, default to general if not found
  const isValidCategory = FORUM_CATEGORIES.some((cat) => cat.id === categoryId);
  const validCategoryId = isValidCategory ? categoryId : "general";

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Persistent modal state that survives component re-renders
  const [createPostModalOpen, setCreatePostModalOpen] = useState(() => {
    // Initialize from sessionStorage to persist across re-renders
    try {
      return sessionStorage.getItem("createPostModalOpen") === "true";
    } catch {
      return false;
    }
  });

  // Persist modal state to sessionStorage whenever it changes
  useEffect(() => {
    try {
      sessionStorage.setItem(
        "createPostModalOpen",
        createPostModalOpen.toString(),
      );
    } catch (error) {
      console.warn("Failed to save modal state to sessionStorage:", error);
    }
  }, [createPostModalOpen]);

  // Clear modal state on page unload to prevent stale state
  useEffect(() => {
    const handleBeforeUnload = () => {
      try {
        sessionStorage.removeItem("createPostModalOpen");
      } catch (error) {
        console.warn("Failed to clear modal state from sessionStorage:", error);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const openModal = () => {
    console.log("Opening modal from Forum page");
    if (!hasPaidPlan) {
      console.log("Showing upgrade modal from Forum page");
      setShowUpgradeModal(true);
    } else {
      setCreatePostModalOpen(true);
    }
  };

  const closeModal = () => {
    console.log("Closing modal from Forum page");
    setCreatePostModalOpen(false);
  };

  console.log(
    "Forum page rendered, category:",
    validCategoryId,
    "modal open:",
    createPostModalOpen,
  );

  // Debug: Track what's causing Forum re-renders
  useEffect(() => {
    console.log("Forum component mounted or categoryId changed:", categoryId);
  }, [categoryId]);

  useEffect(() => {
    console.log("Forum params changed:", params);
  }, [params]);

  return (
    <div className='container mx-auto px-4 py-6'>
      <div className='flex flex-col md:flex-row md:space-x-6'>
        {/* Left Sidebar - Categories */}
        <ForumCategories />
        {/* Center - Forum Content */}
        <ForumContent
          category={validCategoryId}
          onOpenModal={openModal}
          modalOpen={createPostModalOpen}
        />

        {/* Right Sidebar - Schedule and Rankings */}
        <aside className='hidden w-80 flex-shrink-0 space-y-6 xl:block'>
          {/* Upcoming Events */}
          {/* <EventsSidebar /> */}

          {/* Top Users */}
          <TopUsersSidebar />
        </aside>
      </div>

      {/* Modal at page level */}
      {createPostModalOpen && (
        <CreatePostModal onClose={closeModal} categoryId={validCategoryId} />
      )}
      {showUpgradeModal && (
        <UpgradeModal setShowUpgradeModal={setShowUpgradeModal} />
      )}
    </div>
  );
}
