import { useParams } from "wouter";
import ForumCategories from "@/components/forum/ForumCategories";
import ForumContent from "@/components/forum/ForumContent";
import EventsSidebar from "@/components/sidebar/EventsSidebar";
import TopUsersSidebar from "@/components/sidebar/TopUsersSidebar";
import { FORUM_CATEGORIES } from "@/lib/constants";

export default function Forum() {
  // Get the category ID from URL params
  const params = useParams<{ categoryId?: string }>();
  const categoryId = params.categoryId || "general";

  // Validate the category exists, default to general if not found
  const isValidCategory = FORUM_CATEGORIES.some((cat) => cat.id === categoryId);
  const validCategoryId = isValidCategory ? categoryId : "general";

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row md:space-x-6">
        {/* Left Sidebar - Categories */}
        <ForumCategories />

        {/* Center - Forum Content */}
        <ForumContent category={validCategoryId} />

        {/* Right Sidebar - Schedule and Rankings */}
        <aside className="hidden w-80 flex-shrink-0 space-y-6 xl:block">
          {/* Upcoming Events */}
          {/* <EventsSidebar /> */}

          {/* Top Users */}
          <TopUsersSidebar />
        </aside>
      </div>
    </div>
  );
}
