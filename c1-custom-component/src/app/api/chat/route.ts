import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { transformStream } from "@crayonai/stream";
import { tools } from "./tools";
import { DBMessage, getMessageStore } from "./messageStore";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

type ThreadId = string;

// Zod-based custom component schemas
const flightSchema = z
  .object({
    flightNumber: z.string(),
    airline: z.string(),
    departure: z.string(),
    arrival: z.string(),
    departureTime: z.string(),
    arrivalTime: z.string(),
    duration: z.string(),
    price: z.number(),
    stops: z.number(),
    layover: z.string().optional(),
  })
  .describe(
    "Represents a single flight option including schedule, price, and stops.",
  );

const FlightListSchema = z
  .object({
    flights: z.array(flightSchema),
  })
  .describe(
    "Displays a list of available flights. Render as rich cards with airline, route, times, stops, and price. Include a clear 'Select' action for each item.",
  );

const SeatSelectorSchema = z
  .object({
    price: z.number(),
    seatPrice: z.number(),
  })
  .describe(
    "Interactive seat map for the chosen flight. Show a compact cabin grid; some seats may be occupied. Allow toggling seats, compute total as price + (selectedSeats * seatPrice), and expose a primary 'Confirm Seats' action.",
  );

const PassengerSchema = z
  .object({
    name: z.string(),
    gender: z.string(),
    dateOfBirth: z.string(),
    seat: z.string(),
  })
  .describe("Passenger record captured after seat selection.");

const BookingSummarySchema = z
  .object({
    flight: flightSchema,
    seats: z.array(z.string()),
    passengers: z.array(PassengerSchema),
    price: z.number(),
  })
  .describe(
    "Summarizes the booking: chosen flight, seats, passenger details, and total. Provide a 'Proceed to Payment' button that opens a modal to complete payment.",
  );

// Let C1 render its base confirmation components; we omit a custom confirmation schema

const CUSTOM_COMPONENT_SCHEMAS = {
  FlightList: zodToJsonSchema(FlightListSchema),
  SeatSelector: zodToJsonSchema(SeatSelectorSchema),
  BookingSummary: zodToJsonSchema(BookingSummarySchema),
};

export async function POST(req: NextRequest) {
  const { prompt, threadId, responseId } = (await req.json()) as {
    prompt: {
      role: "user";
      content: string;
      id: string;
    };
    threadId: ThreadId;
    responseId: string;
  };
  const messageStore = getMessageStore(threadId);
  if (messageStore.getOpenAICompatibleMessageList().length === 0) {
    messageStore.addMessage({
      role: "system",
      content: `You are a flight booking assistant using Thesys C1.
- Gather trip details with a Form.
- Call tool 'search_flights' to fetch options, then render using custom FlightList.
- After selection, present custom SeatSelector and then custom BookingSummary.`,
    });
  }
  // store the user prompt in the message store
  messageStore.addMessage(prompt as DBMessage);

  const client = new OpenAI({
    baseURL: "https://api.thesys.dev/v1/embed/",
    apiKey: process.env.THESYS_API_KEY,
  });

  const llmStream = client.chat.completions.runTools({
    model: "c1/anthropic/claude-sonnet-4/v-20250915", // available models: https://docs.thesys.dev/guides/models-pricing#model-table
    messages: messageStore.getOpenAICompatibleMessageList(),
    stream: true,
    tools,
    max_completion_tokens: 8000,
    metadata: {
      thesys: JSON.stringify({
        c1_custom_components: CUSTOM_COMPONENT_SCHEMAS,
        c1_included_components: ["EditableTable"],
      }),
    },
  });

  const responseStream = transformStream(
    llmStream,
    (chunk) => {
      return chunk.choices?.[0]?.delta?.content;
    },
    {
      onEnd: ({ accumulated }) => {
        const message = accumulated.filter((m) => m).join("");
        messageStore.addMessage({
          role: "assistant",
          content: message,
          id: responseId,
        });
      },
    },
  ) as ReadableStream<string>;

  return new NextResponse(responseStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
