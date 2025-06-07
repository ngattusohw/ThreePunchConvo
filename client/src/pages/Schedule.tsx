// import { useState } from "react";
// import { useQuery } from "@tanstack/react-query";
// import { MMAEvent } from "@/lib/types";
// import { MMA_ORGANIZATIONS } from "@/lib/constants";
// import { formatEventDate } from "@/lib/utils";

// export default function Schedule() {
//   const [organization, setOrganization] = useState<string>("all");

//   // Fetch MMA events
//   const {
//     data: events,
//     isLoading,
//     error,
//   } = useQuery<MMAEvent[]>({
//     queryKey: ["/api/events"],
//     // In a real app, we would fetch from the API
//   });

//   // For demo purposes, create mock events if none are returned from the API
//   const allEvents = events?.length ? events : generateMockEvents();

//   // Filter events by organization if needed
//   const filteredEvents =
//     organization === "all"
//       ? allEvents
//       : allEvents.filter(
//           (event) => event.organization === organization.toUpperCase(),
//         );

//   return (
//     <div className="container mx-auto px-4 py-6">
//       <div className="mb-6">
//         <h1 className="font-heading mb-2 text-2xl font-bold text-white">
//           MMA Schedule
//         </h1>
//         <p className="text-gray-400">
//           Upcoming events from major MMA organizations
//         </p>
//       </div>

//       {/* Filter Options */}
//       <div className="mb-6 flex flex-wrap gap-2">
//         <button
//           onClick={() => setOrganization("all")}
//           className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
//             organization === "all"
//               ? "bg-ufc-blue text-black"
//               : "bg-dark-gray text-gray-300 hover:bg-gray-800"
//           }`}
//         >
//           All Organizations
//         </button>
//         <button
//           onClick={() => setOrganization("ufc")}
//           className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
//             organization === "ufc"
//               ? "bg-ufc-gold text-ufc-black"
//               : "bg-dark-gray text-gray-300 hover:bg-gray-800"
//           }`}
//         >
//           UFC
//         </button>
//         <button
//           onClick={() => setOrganization("bellator")}
//           className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
//             organization === "bellator"
//               ? "bg-blue-500 text-black"
//               : "bg-dark-gray text-gray-300 hover:bg-gray-800"
//           }`}
//         >
//           Bellator
//         </button>
//         <button
//           onClick={() => setOrganization("one")}
//           className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
//             organization === "one"
//               ? "bg-blue-500 text-black"
//               : "bg-dark-gray text-gray-300 hover:bg-gray-800"
//           }`}
//         >
//           ONE
//         </button>
//         <button
//           onClick={() => setOrganization("pfl")}
//           className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
//             organization === "pfl"
//               ? "bg-green-500 text-black"
//               : "bg-dark-gray text-gray-300 hover:bg-gray-800"
//           }`}
//         >
//           PFL
//         </button>
//       </div>

//       {/* Loading State */}
//       {isLoading && (
//         <div className="py-20 text-center">
//           <div className="border-ufc-blue mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-t-2"></div>
//           <p className="mt-4 text-gray-400">Loading MMA schedule...</p>
//         </div>
//       )}

//       {/* Error State */}
//       {error && (
//         <div className="my-8 rounded-lg border border-red-500 bg-red-900 bg-opacity-20 p-4 text-center">
//           <p className="text-red-500">
//             Error loading schedule. Please try again later.
//           </p>
//         </div>
//       )}

//       {/* Event List */}
//       {!isLoading && !error && (
//         <div className="space-y-8">
//           {filteredEvents.length === 0 ? (
//             <div className="bg-dark-gray rounded-lg py-12 text-center">
//               <p className="text-gray-400">
//                 No upcoming events found for this organization.
//               </p>
//             </div>
//           ) : (
//             filteredEvents.map((event) => (
//               <EventCard key={event.id} event={event} />
//             ))
//           )}
//         </div>
//       )}
//     </div>
//   );
// }

// interface EventCardProps {
//   event: MMAEvent;
// }

// function EventCard({ event }: EventCardProps) {
//   const orgConfig = MMA_ORGANIZATIONS[
//     event.organization as keyof typeof MMA_ORGANIZATIONS
//   ] || {
//     name: event.organization,
//     textClass: "text-white",
//     fontClass: "font-accent",
//   };

//   return (
//     <div className="bg-dark-gray overflow-hidden rounded-lg shadow-lg transition hover:shadow-xl">
//       <div className="p-5">
//         <div className="flex items-start justify-between">
//           <div>
//             <div className="mb-2 flex items-center">
//               <span
//                 className={`${orgConfig.textClass} ${orgConfig.fontClass} mr-3 text-lg font-bold`}
//               >
//                 {event.organization}
//               </span>
//               <span className="text-sm text-gray-400">
//                 {formatEventDate(event.date)}
//               </span>
//             </div>
//             <h2 className="mb-2 text-xl font-bold text-white">{event.name}</h2>
//             <p className="mb-4 text-gray-300">
//               {event.venue} • {event.location}
//             </p>
//           </div>
//         </div>

//         {/* Fight Card */}
//         <div className="mt-4">
//           <h3 className="text-ufc-blue mb-3 font-medium">Main Card</h3>
//           <div className="space-y-4">
//             {event.mainCard && event.mainCard.length > 0 ? (
//               event.mainCard.map((fight, index) => (
//                 <div
//                   key={`${event.id}-main-${index}`}
//                   className="rounded-lg bg-gray-800 bg-opacity-50 p-3"
//                 >
//                   <div className="mb-2 flex items-center justify-between">
//                     <div className="flex-1 pr-3 text-right">
//                       <span className="font-medium text-white">
//                         {fight.fighter1?.name}
//                       </span>
//                       {fight.fighter1?.record && (
//                         <span className="block text-sm text-gray-400">
//                           {fight.fighter1.record}
//                         </span>
//                       )}
//                     </div>
//                     <span className="font-bold text-gray-300">vs</span>
//                     <div className="flex-1 pl-3">
//                       <span className="font-medium text-white">
//                         {fight.fighter2?.name}
//                       </span>
//                       {fight.fighter2?.record && (
//                         <span className="block text-sm text-gray-400">
//                           {fight.fighter2.record}
//                         </span>
//                       )}
//                     </div>
//                   </div>
//                   <div className="flex justify-center">
//                     <span
//                       className={`rounded px-2 py-1 text-xs ${fight.isTitleFight ? "bg-ufc-gold text-ufc-black" : "bg-gray-700 text-gray-300"}`}
//                     >
//                       {fight.weightClass} {fight.isTitleFight ? "Title" : ""}
//                     </span>
//                   </div>
//                 </div>
//               ))
//             ) : (
//               <div className="rounded-lg bg-gray-800 bg-opacity-30 p-4 text-center">
//                 <p className="text-sm text-gray-400">
//                   Fight card not announced yet
//                 </p>
//               </div>
//             )}
//           </div>

//           {/* Prelims */}
//           {event.prelimCard && event.prelimCard.length > 0 && (
//             <div className="mt-6">
//               <h3 className="mb-3 font-medium text-gray-300">
//                 Preliminary Card
//               </h3>
//               <div className="space-y-3">
//                 {event.prelimCard.map((fight, index) => (
//                   <div
//                     key={`${event.id}-prelim-${index}`}
//                     className="rounded-lg bg-gray-800 bg-opacity-30 p-3"
//                   >
//                     <div className="mb-2 flex items-center justify-between">
//                       <div className="flex-1 pr-3 text-right">
//                         <span className="text-white">
//                           {fight.fighter1?.name}
//                         </span>
//                       </div>
//                       <span className="font-bold text-gray-400">vs</span>
//                       <div className="flex-1 pl-3">
//                         <span className="text-white">
//                           {fight.fighter2?.name}
//                         </span>
//                       </div>
//                     </div>
//                     <div className="flex justify-center">
//                       <span className="rounded bg-gray-700 px-2 py-1 text-xs text-gray-300">
//                         {fight.weightClass}
//                       </span>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// // Helper function to generate mock events for demonstration
// function generateMockEvents(): MMAEvent[] {
//   return [
//     {
//       id: "1",
//       name: "UFC 299: O'Malley vs. Dvalishvili",
//       shortName: "O'Malley vs. Dvalishvili",
//       organization: "UFC",
//       date: new Date(2024, 2, 9), // March 9, 2024
//       venue: "Miami-Dade Arena",
//       location: "Miami, FL",
//       mainCard: [
//         {
//           id: "1-1",
//           weightClass: "Bantamweight",
//           isTitleFight: true,
//           fighter1: { id: "f1", name: "Sean O'Malley", record: "17-1-0" },
//           fighter2: { id: "f2", name: "Merab Dvalishvili", record: "16-4-0" },
//         },
//         {
//           id: "1-2",
//           weightClass: "Welterweight",
//           isTitleFight: false,
//           fighter1: { id: "f9", name: "Gilbert Burns", record: "22-6-0" },
//           fighter2: {
//             id: "f10",
//             name: "Jack Della Maddalena",
//             record: "15-2-0",
//           },
//         },
//         {
//           id: "1-3",
//           weightClass: "Lightweight",
//           isTitleFight: false,
//           fighter1: { id: "f11", name: "Dustin Poirier", record: "29-8-0" },
//           fighter2: { id: "f12", name: "Benoit Saint Denis", record: "12-1-0" },
//         },
//       ],
//       prelimCard: [
//         {
//           id: "1-4",
//           weightClass: "Featherweight",
//           isTitleFight: false,
//           fighter1: { id: "f13", name: "Josh Emmett", record: "18-4-0" },
//           fighter2: { id: "f14", name: "Bryce Mitchell", record: "16-1-0" },
//         },
//         {
//           id: "1-5",
//           weightClass: "Women's Strawweight",
//           isTitleFight: false,
//           fighter1: { id: "f15", name: "Kayla Harrison", record: "16-1-0" },
//           fighter2: { id: "f16", name: "Holly Holm", record: "15-6-0" },
//         },
//       ],
//     },
//     {
//       id: "2",
//       name: "UFC FIGHT NIGHT: Allen vs. Curtis",
//       shortName: "Allen vs. Curtis",
//       organization: "UFC",
//       date: new Date(2024, 2, 16), // March 16, 2024
//       venue: "UFC APEX",
//       location: "Las Vegas, NV",
//       mainCard: [
//         {
//           id: "2-1",
//           weightClass: "Middleweight",
//           isTitleFight: false,
//           fighter1: { id: "f3", name: "Brendan Allen", record: "22-5-0" },
//           fighter2: { id: "f4", name: "Chris Curtis", record: "30-10-0" },
//         },
//         {
//           id: "2-2",
//           weightClass: "Welterweight",
//           isTitleFight: false,
//           fighter1: { id: "f17", name: "Alex Morono", record: "23-8-0" },
//           fighter2: { id: "f18", name: "Joaquin Buckley", record: "17-6-0" },
//         },
//       ],
//     },
//     {
//       id: "3",
//       name: "BELLATOR: Bellator 301",
//       shortName: "Bellator 301",
//       organization: "BELLATOR",
//       date: new Date(2024, 2, 22), // March 22, 2024
//       venue: "Wintrust Arena",
//       location: "Chicago, IL",
//       mainCard: [
//         {
//           id: "3-1",
//           weightClass: "Bantamweight",
//           isTitleFight: true,
//           fighter1: { id: "f5", name: "Patchy Mix", record: "17-1-0" },
//           fighter2: { id: "f6", name: "Magomed Magomedov", record: "15-2-0" },
//         },
//         {
//           id: "3-2",
//           weightClass: "Welterweight",
//           isTitleFight: true,
//           fighter1: { id: "f19", name: "Jason Jackson", record: "17-4-0" },
//           fighter2: { id: "f20", name: "Yaroslav Amosov", record: "27-0-0" },
//         },
//       ],
//     },
//     {
//       id: "4",
//       name: "ONE Championship: ONE 167",
//       shortName: "ONE 167",
//       organization: "ONE",
//       date: new Date(2024, 3, 8), // April 8, 2024
//       venue: "Impact Arena",
//       location: "Bangkok, Thailand",
//       mainCard: [
//         {
//           id: "4-1",
//           weightClass: "Flyweight",
//           isTitleFight: true,
//           fighter1: { id: "f21", name: "Demetrious Johnson", record: "25-4-1" },
//           fighter2: { id: "f22", name: "Adriano Moraes", record: "20-4-0" },
//         },
//       ],
//     },
//     {
//       id: "5",
//       name: "PFL: 2024 Regular Season",
//       shortName: "PFL Regular Season",
//       organization: "PFL",
//       date: new Date(2024, 3, 19), // April 19, 2024
//       venue: "The Anthem",
//       location: "Washington, DC",
//       mainCard: [
//         {
//           id: "5-1",
//           weightClass: "Lightweight",
//           isTitleFight: false,
//           fighter1: {
//             id: "f23",
//             name: "Olivier Aubin-Mercier",
//             record: "17-5-0",
//           },
//           fighter2: { id: "f24", name: "Clay Collard", record: "24-10-0" },
//         },
//       ],
//     },
//   ] as any;
// }
