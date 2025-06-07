import fetch from "node-fetch";
import { MMAEvent, Fighter, Fight } from "@shared/schema";

// ESPN API endpoint for MMA events
export const ESPN_API_BASE_URL =
  process.env.ESPN_API_BASE_URL ||
  "https://site.api.espn.com/apis/site/v2/sports/mma";

interface ESPNEvent {
  id: string;
  uid: string;
  date: string;
  name: string;
  shortName: string;
  competitions: {
    id: string;
    venue: {
      fullName: string;
      address: {
        city: string;
        state?: string;
        country?: string;
      };
    };
    competitors: {
      id: string;
      athlete: {
        id: string;
        displayName: string;
        headshot?: { href: string };
      };
    }[];
  }[];
  links: {
    rel: string[];
    href: string;
  }[];
}

interface ESPNEventsResponse {
  events: ESPNEvent[];
}

// Fetch upcoming MMA events from ESPN
export async function fetchUpcomingEvents(): Promise<MMAEvent[]> {
  try {
    const url = `${ESPN_API_BASE_URL}/events`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`ESPN API responded with status: ${response.status}`);
    }

    const data = (await response.json()) as ESPNEventsResponse;

    if (!data.events || !Array.isArray(data.events)) {
      return [];
    }

    // Process and map ESPN events to our MMA event format
    const events = data.events.map(processESPNEvent);

    // Sort by date (ascending)
    return events.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
  } catch (error) {
    console.error("Error fetching ESPN events:", error);
    // Return mock events for development/fallback
    return generateMockEvents();
  }
}

// Process ESPN event data
function processESPNEvent(espnEvent: ESPNEvent): MMAEvent {
  // Determine organization from name (usually contains UFC, Bellator, etc.)
  let organization = "UFC";
  if (espnEvent.name.includes("Bellator")) {
    organization = "BELLATOR";
  } else if (espnEvent.name.includes("ONE")) {
    organization = "ONE";
  } else if (espnEvent.name.includes("PFL")) {
    organization = "PFL";
  }

  // Get venue and location
  const venue = espnEvent.competitions?.[0]?.venue?.fullName || "TBA";
  const city = espnEvent.competitions?.[0]?.venue?.address?.city || "";
  const state = espnEvent.competitions?.[0]?.venue?.address?.state || "";
  const country = espnEvent.competitions?.[0]?.venue?.address?.country || "";

  let location = city;
  if (state) location += state ? `, ${state}` : "";
  if (!state && country) location += country ? `, ${country}` : "";

  if (!location) location = "TBA";

  // Create main card fights
  const mainCard: any[] = [];
  const prelimCard: any[] = [];

  // In real implementation, we would fetch more detailed card info
  // For now we'll create a main event from the competitors if available
  if (espnEvent.competitions?.[0]?.competitors?.length >= 2) {
    const fighter1: Fighter = {
      id: espnEvent.competitions[0].competitors[0].athlete.id,
      name: espnEvent.competitions[0].competitors[0].athlete.displayName,
      imageUrl:
        espnEvent.competitions[0].competitors[0].athlete.headshot?.href || null,
      nickname: null,
      record: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const fighter2: Fighter = {
      id: espnEvent.competitions[0].competitors[1].athlete.id,
      name: espnEvent.competitions[0].competitors[1].athlete.displayName,
      imageUrl:
        espnEvent.competitions[0].competitors[1].athlete.headshot?.href || null,
      nickname: null,
      record: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Determine weight class from event name
    let weightClass = "Heavyweight";
    const weightClasses = [
      "Heavyweight",
      "Light Heavyweight",
      "Middleweight",
      "Welterweight",
      "Lightweight",
      "Featherweight",
      "Bantamweight",
      "Flyweight",
      "Women's Featherweight",
      "Women's Bantamweight",
      "Women's Flyweight",
      "Women's Strawweight",
    ];

    for (const wc of weightClasses) {
      if (espnEvent.name.includes(wc)) {
        weightClass = wc;
        break;
      }
    }

    // Determine if title fight
    const isTitleFight =
      espnEvent.name.includes("Championship") ||
      espnEvent.name.includes("Title") ||
      espnEvent.name.includes("Belt");

    const mainFight = {
      id: espnEvent.competitions[0].id,
      eventId: espnEvent.id,
      fighter1Id: fighter1.id,
      fighter2Id: fighter2.id,
      weightClass,
      isTitleFight,
      isMainCard: true,
      order: 1,
      fighter1,
      fighter2,
    };

    mainCard.push(mainFight);
  }

  // Create a proper event object that matches our schema
  const mmaEvent: MMAEvent = {
    id: espnEvent.id,
    name: espnEvent.name,
    shortName: espnEvent.shortName,
    date: new Date(espnEvent.date),
    organization,
    venue,
    location,
    imageUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return mmaEvent;
}

// Generate mock MMA events for development/fallback
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
      imageUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "2",
      name: "UFC FIGHT NIGHT: Allen vs. Curtis",
      shortName: "Allen vs. Curtis",
      organization: "UFC",
      date: new Date(2024, 2, 16), // March 16, 2024
      venue: "UFC APEX",
      location: "Las Vegas, NV",
      imageUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "3",
      name: "BELLATOR: Bellator 301",
      shortName: "Bellator 301",
      organization: "BELLATOR",
      date: new Date(2024, 2, 22), // March 22, 2024
      venue: "Wintrust Arena",
      location: "Chicago, IL",
      imageUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "4",
      name: "UFC 300",
      shortName: "UFC 300",
      organization: "UFC",
      date: new Date(2024, 3, 13), // April 13, 2024
      venue: "T-Mobile Arena",
      location: "Las Vegas, NV",
      imageUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
}
