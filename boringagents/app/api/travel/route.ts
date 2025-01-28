import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import OpenAI from "openai";

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
  console.log("checkFlights", params);
  return {
    available: true,
    flights: [
      {
        airline: "Sample Airline",
        price: "$500",
        departure: "10:00 AM",
        arrival: "2:00 PM",
      },
      {
        airline: "Budget Airways",
        price: "$425",
        departure: "7:30 AM",
        arrival: "11:45 AM",
      },
      {
        airline: "Premium Air",
        price: "$650",
        departure: "1:15 PM",
        arrival: "5:30 PM",
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
        name: "Luxury Grand Hotel",
        price: "$300/night",
        rating: 4.8,
        amenities: ["WiFi", "Pool", "Spa", "Fine Dining", "Gym"],
      },
      {
        name: "Comfort Inn & Suites",
        price: "$200/night",
        rating: 4.5,
        amenities: ["WiFi", "Pool", "Breakfast", "Parking"],
      },
      {
        name: "Budget Stay Express",
        price: "$120/night",
        rating: 4.0,
        amenities: ["WiFi", "Breakfast", "Parking"],
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

    const stream = new ReadableStream({
      async start(controller) {
        client.beta.chat.completions
          // @ts-ignore
          .runTools({
            model: "gpt-4o-mini",
            messages: messages,
            stream: true,
            tools: [
              {
                type: "function",
                function: {
                  function: checkFlights,
                  description:
                    "Search for available flights between destinations",
                  parameters: zodToJsonSchema(FlightDetailsSchema),
                  parse: (params: string) => {
                    return FlightDetailsSchema.parse(JSON.parse(params));
                  },
                },
              },
              {
                type: "function",
                function: {
                  function: searchHotels,
                  description: "Search for available hotels in a location",
                  parse: (params: string) => {
                    return HotelSearchSchema.parse(JSON.parse(params));
                  },
                  parameters: zodToJsonSchema(HotelSearchSchema),
                },
              },
            ],
          })
          .on("content", (delta) => {
            controller.enqueue(delta);
          })
          .on("end", () => {
            controller.close();
          });
      },
    });
    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/plain",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (e: any) {
    console.error("Error:", e);
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}
