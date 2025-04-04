import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { MMAEvent } from "@/lib/types";
import { formatEventDate } from "@/lib/utils";
import { MMA_ORGANIZATIONS } from "@/lib/constants";

export default function EventsSidebar() {
  // Fetch upcoming MMA events
  const { data: events, isLoading, error } = useQuery<MMAEvent[]>({
    queryKey: ['/api/events'],
    // In a real app, we would fetch from the API
  });

  // For demo purposes, create mock events if none are returned from the API
  const displayEvents = events?.length ? events : generateMockEvents();

  return (
    <div className="bg-dark-gray rounded-lg overflow-hidden">
      <div className="bg-ufc-black p-4 border-b border-gray-800">
        <h2 className="font-heading text-lg font-bold text-white">Upcoming Events</h2>
      </div>
      
      <div className="p-4">
        {isLoading ? (
          <div className="py-4 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-ufc-red mx-auto"></div>
            <p className="mt-2 text-gray-400 text-sm">Loading events...</p>
          </div>
        ) : error ? (
          <div className="py-4 text-center">
            <p className="text-red-500">Error loading events</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {displayEvents.slice(0, 3).map((event, index) => (
              <li key={event.id} className={`${index < displayEvents.length - 1 ? "border-b border-gray-800 pb-4" : "last:border-0 last:pb-0"}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`${MMA_ORGANIZATIONS[event.organization as keyof typeof MMA_ORGANIZATIONS]?.textClass || "text-white"} ${MMA_ORGANIZATIONS[event.organization as keyof typeof MMA_ORGANIZATIONS]?.fontClass || ""} font-bold`}>
                    {event.name.split(':')[0]}
                  </span>
                  <span className="text-gray-400 text-sm">{formatEventDate(event.date)}</span>
                </div>
                <h3 className="text-white font-medium mb-1">{event.name.includes(':') ? event.name.split(':')[1].trim() : event.shortName}</h3>
                <p className="text-gray-400 text-sm">{event.venue} • {event.location}</p>
              </li>
            ))}
          </ul>
        )}
        
        <Link href="/schedule" className="block text-center text-ufc-red font-medium text-sm mt-4 hover:underline">
          View Full Schedule →
        </Link>
      </div>
    </div>
  );
}

// Helper function to generate mock events for demonstration
function generateMockEvents(): MMAEvent[] {
  return [
    {
      id: "1",
      name: "UFC 299: O'Malley vs. Dvalishvili",
      shortName: "O'Malley vs. Dvalishvili",
      organization: "UFC",
      date: new Date(2024, 2, 9), // March 9, 2024
      venue: "Miami-Dade Arena",
      location: "Miami, FL",
      imageUrl: null
    },
    {
      id: "2",
      name: "UFC FIGHT NIGHT: Allen vs. Curtis",
      shortName: "Allen vs. Curtis",
      organization: "UFC",
      date: new Date(2024, 2, 16), // March 16, 2024
      venue: "UFC APEX",
      location: "Las Vegas, NV",
      imageUrl: null
    },
    {
      id: "3",
      name: "BELLATOR: Bellator 301",
      shortName: "Bellator 301",
      organization: "BELLATOR",
      date: new Date(2024, 2, 22), // March 22, 2024
      venue: "Wintrust Arena",
      location: "Chicago, IL",
      imageUrl: null
    },
  ];
}
