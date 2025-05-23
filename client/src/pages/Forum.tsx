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
  const isValidCategory = FORUM_CATEGORIES.some(cat => cat.id === categoryId);
  const validCategoryId = isValidCategory ? categoryId : "general";

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row md:space-x-6">
        {/* Left Sidebar - Categories */}
        <ForumCategories />

        {/* Center - Forum Content */}
        <ForumContent category={validCategoryId} />

        {/* Right Sidebar - Schedule and Rankings */}
        <aside className="hidden lg:block w-80 flex-shrink-0 space-y-6">
          {/* Upcoming Events */}
          {/* <EventsSidebar /> */}
          
          {/* Top Users */}
          <TopUsersSidebar />
          
          {/* Community Ad */}
          <div className="bg-dark-gray rounded-lg overflow-hidden">
            <div className="p-4">
              <h3 className="text-white font-bold mb-2">Join Our Discord</h3>
              <p className="text-gray-300 text-sm mb-3">Connect with other MMA fans in our community Discord server!</p>
              <a href="https://discord.gg/3punchconvo" target="_blank" rel="noopener noreferrer" className="block bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded text-center text-sm transition">
                Join Community
              </a>
              <p className="text-gray-500 text-xs mt-2 text-center">5,400+ members online now</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
