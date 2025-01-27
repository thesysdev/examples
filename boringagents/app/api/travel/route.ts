import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import OpenAI from "openai";

const formatMessage = (message: { role: string; content: string }) => {
  return `${message.role}: ${message.content}`;
};

const TEMPLATE = `You are an experienced travel advisor who helps people plan their perfect trips. Your goal is to create personalized travel itineraries and recommendations.

Please gather the following essential information if not already provided:
- Destination preferences
- Travel dates or season
- Budget range
- Number of travelers
- Trip duration
- Interests (e.g., culture, adventure, relaxation, food, etc.)
- Accommodation preferences
- Must-see attractions or experiences

Guidelines:
1. If any essential information is missing, ask for it politely
2. When appropriate, use the tools to provide specific flight and hotel information
3. Provide specific recommendations based on the user's preferences
4. Consider practical aspects like weather, peak seasons, and local events
5. Break down budget suggestions for accommodation, activities, and transportation
6. Offer alternative options when relevant
7. Include insider tips and local recommendations

Current conversation:
{chat_history}

User: {input}
AI:`;

// Define Zod schemas
const FlightDetailsSchema = z.object({
  from: z.string().describe("Departure city or airport code"),
  to: z.string().describe("Destination city or airport code"),
  date: z.string().describe("Date of travel in YYYY-MM-DD format"),
  passengers: z.number().describe("Number of passengers"),
});

const HotelSearchSchema = z.object({
  location: z.string().describe("City or area to search for hotels"),
  checkIn: z.string().describe("Check-in date in YYYY-MM-DD format"),
  checkOut: z.string().describe("Check-out date in YYYY-MM-DD format"),
  guests: z.number().describe("Number of guests"),
});

// Type inference from Zod schemas
type FlightDetails = z.infer<typeof FlightDetailsSchema>;
type HotelSearch = z.infer<typeof HotelSearchSchema>;

// Tool functions with type safety
async function checkFlights(params: FlightDetails) {
  // Implement flight search logic here
  // This is a placeholder that you would replace with actual API calls
  return {
    available: true,
    flights: [
      {
        airline: "Sample Airline",
        price: "$500",
        departure: "10:00 AM",
        arrival: "2:00 PM",
      },
    ],
  };
}

async function searchHotels(params: HotelSearch) {
  // Implement hotel search logic here
  // This is a placeholder that you would replace with actual API calls
  return {
    available: true,
    hotels: [
      {
        name: "Sample Hotel",
        price: "$200/night",
        rating: 4.5,
        amenities: ["WiFi", "Pool", "Breakfast"],
      },
    ],
  };
}

/**
 * This handler initializes and calls a simple chain with a prompt,
 * chat model, and output parser. See the docs for more information:
 *
 * https://js.langchain.com/docs/guides/expression_language/cookbook#prompttemplate--llm--outputparser
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages = body.messages ?? [];

    const client = new OpenAI();

    // @ts-ignore
    const runner = client.beta.chat.completions.runTools({
      model: "gpt-4o-mini",
      messages: messages,
      tools: [
        {
          type: "function",
          function: {
            function: checkFlights,
            description: "Search for available flights between destinations",
            parameters: zodToJsonSchema(FlightDetailsSchema),
          },
        },
        {
          type: "function",
          function: {
            function: searchHotels,
            description: "Search for available hotels in a location",
            parameters: zodToJsonSchema(HotelSearchSchema),
          },
        },
      ],
    });
    const response = await runner.finalContent();
    return new NextResponse(response);
  } catch (e: any) {
    console.error("Error:", e);
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}
