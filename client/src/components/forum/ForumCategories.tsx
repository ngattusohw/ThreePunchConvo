import { Link, useLocation } from "wouter";
import { FORUM_CATEGORIES } from "@/lib/constants";

export default function ForumCategories() {
  const [location] = useLocation();
  const currentCategory = location.startsWith("/forum/") 
    ? location.split("/")[2] 
    : "general";

  return (
    <aside className="hidden md:block w-64 flex-shrink-0">
      <div className="bg-dark-gray rounded-lg p-4 sticky top-20">
        <h2 className="font-heading text-lg font-bold mb-4 text-white">Categories</h2>
        <ul className="space-y-1">
          {FORUM_CATEGORIES.map((category) => (
            <li key={category.id}>
              <Link 
                href={`/forum/${category.id}`}
                className={`flex items-center justify-between px-3 py-2 rounded-md 
                  ${category.id === currentCategory 
                    ? 'bg-ufc-blue bg-opacity-10 text-black' 
                    : 'hover:bg-gray-800 text-gray-300'} font-medium`}
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
