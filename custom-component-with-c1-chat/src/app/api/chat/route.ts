import { NextRequest } from "next/server";
import OpenAI from "openai";
import {
  addMessages,
  getLLMThreadMessages,
} from "@/src/services/threadService";
import { transformStream } from "@crayonai/stream";
import { tools } from "./tools";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions.mjs";
import { metadata } from "../../layout";

type ThreadId = string;

const CUSTOM_COMPONENT_SCHEMAS = {
  FlightList: {
    type: 'object',
    description: 'Displays a list of available flights.',
    properties: {
      flights: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            flightNumber: { type: 'string' },
            airline: { type: 'string' },
            departure: { type: 'string' },
            arrival: { type: 'string' },
            departureTime: { type: 'string' },
            arrivalTime: { type: 'string' },
            duration: { type: 'string' },
            price: { type: 'number' },
            stops: { type: 'number' },
            layover: { type: 'string' },
          },
          required: ['flightNumber', 'airline', 'departure', 'arrival', 'departureTime', 'arrivalTime', 'duration', 'price', 'stops'],
        },
      },
    },
    required: ['flights'],
  },
  SeatSelector: {
    type: 'object',
    description: 'An interactive component for selecting airplane seats.',
    properties: {
      price: { type: 'number' },
      seatPrice: { type: 'number' },
    },
    required: ['price', 'seatPrice'],
  },
  BookingSummary: {
    type: 'object',
    description: 'Displays a summary of the flight booking details for review.',
    properties: {
      flight: { type: 'object' },
      seats: { type: 'array', items: { type: 'string' } },
      passengers: { type: 'array', items: { type: 'object', properties: {
        name: { type: 'string' },
        gender: { type: 'string' },
        dateOfBirth: { type: 'string' },
        seat: { type: 'string' },
      } } },
      price: { type: 'number' },
    },
    required: ['flight', 'seats', 'passengers', 'price'],
  },
  BookingConfirmation: {
    type: 'object',
    description: 'Displays a confirmation of a successful booking.',
    properties: {
      bookingNumber: { type: 'string' },
      flight: { type: 'object' },
    },
    required: ['bookingNumber', 'flight'],
  },
}


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

  const client = new OpenAI({
    baseURL: "https://api.thesys.dev/v1/embed",
    apiKey: process.env.THESYS_API_KEY,
  });

  const runToolsResponse = client.chat.completions.runTools({
    model: "c1/anthropic/claude-3.5-sonnet/v-20250617", // available models: https://docs.thesys.dev/guides/models-pricing#model-table
    messages: [
      {
        role: 'system',
        content: `You are an expert flight booking assistant. Follow these steps precisely to guide the user through booking a flight.

        1.  **Greeting and Information Gathering**:
            *   When the user expresses intent to book a flight (e.g., "book a flight", "I need a ticket to JFK"), respond by asking for their travel details.
            *   You MUST use the default C1 'Form' component to ask for: Departure airport, Arrival airport, Departure Date, and Return Date (optional).
            *   Do NOT call any tools yet. Wait for the user to submit the form.

        2.  **Searching for Flights**:
            *   When the user submits the flight search form, you will receive an 'onAction' event.
            *   Use the data from the form to call the 'search_flights' tool.

        3.  **Displaying Flight Options**:
            *   After the 'search_flights' tool returns a list of flights, you MUST display them to the user.
            *   Use the custom 'FlightList' component to render the flight options.

        4.  **Handling Flight Selection**:
            *   The user will select a flight from the list, triggering an 'onAction' event.
            *   You MUST then present the 'SeatSelector' component to the user.
            *   Pass the 'price' of the selected flight and a base price for seats into the component (e.g., seatPrice: 50).

        5.  **Seat Confirmation and Passenger Details**:
            *   The user will select their seats and confirm, triggering another 'onAction'. The user's message will state how many seats were selected.
            *   You MUST now ask for passenger details for each seat selected.
            *   Use the default C1 EditableTable component to ask for all the passengers details according to the number of seats selected.

        6.  **Review and Payment**:
            *   Once the user submits the passenger details, display a summary of the booking.
            *   Use the 'BookingSummary' custom component to show all the details gathered so far (flight, seats, passengers, total price).
            *   The user will click a button within this component to open a payment modal and submit payment.

        7.  **Final Confirmation**:
            *   After the user submits payment via the 'Pay Now' action from the modal, the process is complete.
            *   You MUST display the 'BookingConfirmation' component.
            *   Generate a random alphanumeric booking number (e.g., "AB12CD34").
            *   Show the final confirmation to the user.`,
      },
      ...(await getLLMThreadMessages(threadId)),
      {
        role: "user",
        content: prompt.content!,
      },
    ],
    max_completion_tokens: 8000,
    stream: true,
    tools,
    metadata: {
      thesys: JSON.stringify({
        c1_custom_components: CUSTOM_COMPONENT_SCHEMAS,
        c1_included_components: ['EditableTable'],
      }),
    }
  });

  const allRunToolsMessages: ChatCompletionMessageParam[] = [];
  let isError = false;

  runToolsResponse.on("error", () => {
    isError = true;
  });

  runToolsResponse.on("message", (message) => {
    allRunToolsMessages.push(message);
  });

  runToolsResponse.on("end", async () => {
    // store messages on end only if there is no error
    if (isError) {
      return;
    }

    const runToolsMessagesWithId = allRunToolsMessages.map((m, index) => {
      const id =
        allRunToolsMessages.length - 1 === index // for last message (the response shown to user), use the responseId as provided by the UI
          ? responseId
          : crypto.randomUUID();

      return {
        ...m,
        id,
      };
    });

    const messagesToStore = [prompt, ...runToolsMessagesWithId];

    await addMessages(threadId, ...messagesToStore);
  });

  const llmStream = await runToolsResponse;

  llmStream.on("finalChatCompletion", (message) => {
    console.log("final_chat_completion", JSON.stringify(message, null, 2));
  });

  const responseStream = transformStream(llmStream, (chunk) => {
    return chunk.choices[0]?.delta?.content;
  });

  return new Response(responseStream as ReadableStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
