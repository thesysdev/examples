import type { RunnableToolFunctionWithParse } from "openai/lib/RunnableFunction.mjs";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import type { JSONSchema } from "openai/lib/jsonschema.mjs";

export const tools: RunnableToolFunctionWithParse<any>[] = [
  {
    type: "function",
    function: {
      name: "search_flights",
      description: "Search for flights based on departure, arrival, and dates",
      parse: (input) => {
        return JSON.parse(input) as {
          departure: string;
          arrival: string;
          departureDate: string;
          returnDate?: string;
        };
      },
      parameters: zodToJsonSchema(
        z.object({
          departure: z
            .string()
            .describe("The departure airport code (e.g., SFO)"),
          arrival: z.string().describe("The arrival airport code (e.g., JFK)"),
          departureDate: z
            .string()
            .describe("The departure date in YYYY-MM-DD format"),
          returnDate: z
            .string()
            .optional()
            .describe("The return date in YYYY-MM-DD format"),
        }),
      ) as JSONSchema,
      function: async () => {
        const mockFlights = [
          {
            flightNumber: "UA-245",
            airline: "United Airlines",
            departure: "San Francisco (SFO)",
            arrival: "New York (JFK)",
            departureTime: "08:00 AM",
            arrivalTime: "04:30 PM",
            duration: "5h 30m",
            price: 350,
            stops: 0,
          },
          {
            flightNumber: "DL-421",
            airline: "Delta",
            departure: "San Francisco (SFO)",
            arrival: "New York (JFK)",
            departureTime: "10:15 AM",
            arrivalTime: "07:00 PM",
            duration: "5h 45m",
            price: 420,
            stops: 0,
          },
          {
            flightNumber: "AA-112",
            airline: "American Airlines",
            departure: "San Francisco (SFO)",
            arrival: "New York (JFK)",
            departureTime: "01:00 PM",
            arrivalTime: "11:30 PM",
            duration: "7h 30m",
            price: 290,
            stops: 1,
            layover: "Chicago (ORD)",
          },
        ];
        return JSON.stringify(mockFlights);
      },
      strict: true,
    },
  },
];
