import { Link, useLocation } from "wouter";
import { FORUM_CATEGORIES } from "@/lib/constants";

export default function ForumCategories() {
  const [location] = useLocation();
  const currentCategory = location.startsWith("/forum/")
    ? location.split("/")[2]
    : "general";

  return (
    <aside className="hidden w-64 flex-shrink-0 md:block">
      <div className="bg-dark-gray sticky top-20 rounded-lg p-4">
        <h2 className="font-heading mb-4 text-lg font-bold text-white">
          Categories
        </h2>
        <ul className="space-y-1">
          {FORUM_CATEGORIES.map((category) => (
            <li key={category.id}>
              <Link
                href={`/forum/${category.id}`}
                className={`flex items-center justify-between rounded-md px-3 py-2 ${
                  category.id === currentCategory
                    ? "bg-ufc-blue bg-opacity-10 text-black"
                    : "text-gray-300 hover:bg-gray-800"
                } font-medium`}
              >
                <span>{category.name}</span>
                {/* TODO category count - maybe notification here */}
                {/* <span className={`${category.id === currentCategory 
                  ? 'bg-ufc-blue text-black' 
                  : 'bg-gray-700 text-gray-300'} text-xs rounded-full px-2 py-0.5`}
                >
                  {category.count}
                </span> */}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
