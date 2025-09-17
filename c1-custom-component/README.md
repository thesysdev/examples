# C1 Custom Components — Flight Booking Demo

This example shows how to build a complete generative UI flow using Thesys C1 with custom React components. The assistant guides a user through booking a flight and renders interactive UI (flight list, seat selector, booking summary) streamed from the C1 API and rendered by the Thesys GenUI SDK.

[![Built with Thesys](https://thesys.dev/built-with-thesys-badge.svg)](https://thesys.dev)

## What this demonstrates

- Using custom components with Thesys C1 API and GenUI SDK

## Project layout (key files)

- `src/app/api/chat/route.ts`: Server route that calls C1, streams the response, sets metadata, and seeds a lean system prompt
- `src/app/api/chat/tools.ts`: A mocked `search_flights` tool
- `src/app/components.tsx`: Custom components (`FlightList`, `SeatSelector`, `BookingSummary`)
- `src/app/api/chat/messageStore.ts`: Minimal message store for thread continuity
- `src/app/page.tsx`: Renders `<C1Chat />`

## Run locally

1) Create an API key in the [Thesys Console](https://chat.thesys.dev/console/keys) and export it:

```bash
export THESYS_API_KEY=YOUR_KEY_HERE
```

2) Install and start:

```bash
npm i
npm run dev
```

3) Open `http://localhost:3000` and try a prompt like:

```
book a flight from jfk to lax on sept 18 2025
```

## Defining custom components for C1

The server passes JSON Schema for your custom components to C1 via `metadata`. We author schemas using Zod for strong typing and convert to JSON Schema:

```ts
// src/app/api/chat/route.ts (excerpt)
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

const flightSchema = z.object({
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
}).describe("Represents a single flight option including schedule, price, and stops.");

const FlightListSchema = z.object({
  flights: z.array(flightSchema),
}).describe("Displays a list of available flights with a Select action for each.");

// ...SeatSelectorSchema, BookingSummarySchema

const CUSTOM_COMPONENT_SCHEMAS = {
  FlightList: zodToJsonSchema(FlightListSchema),
  SeatSelector: zodToJsonSchema(SeatSelectorSchema),
  BookingSummary: zodToJsonSchema(BookingSummarySchema),
};
```

Those schemas are attached to the request like this:

```ts
const llmStream = client.chat.completions.runTools({
  model: "c1/anthropic/claude-sonnet-4/v-20250915",
  messages: messageStore.getOpenAICompatibleMessageList(),
  tools,
  stream: true,
  metadata: {
    thesys: JSON.stringify({
      c1_custom_components: CUSTOM_COMPONENT_SCHEMAS,
    }),
  },
});
```

## The custom React components

All custom UI lives in `src/app/components.tsx` and is regular React. The GenUI SDK handles wiring (`onAction`, state, etc.).

- `FlightList`: Rich cards with airline, route, times, price, and a “Select” button
- `SeatSelector`: Small cabin grid (occupied/selected/available), running total, confirm button
- `BookingSummary`: Review details and open a payment modal

Registering the custom components in the GenUI SDK:

```tsx
import { C1Chat } from "@thesysai/genui-sdk";
import { FlightList, SeatSelector, BookingSummary } from "./components";

<C1Chat
  apiUrl="/api/chat"
  customizeC1={{
    customComponents: { FlightList, SeatSelector, BookingSummary },
  }}
/>
```

For state management, we use the `useC1State` hook from the GenUI SDK.

```tsx
import { useC1State } from "@thesysai/genui-sdk";

const { getValue, setValue } = useC1State("selectedSeats");
const selectedSeats: string[] = getValue() || [];
const toggleSeat = (seatNumber: string) => {
const newSelectedSeats = selectedSeats.includes(seatNumber)
    ? selectedSeats.filter((s) => s !== seatNumber)
    : [...selectedSeats, seatNumber];
    setValue(newSelectedSeats);
};
```

To trigger new assistant responses on user interaction with the custom components, SDK provides the `useOnAction` hook.

```tsx
import { useOnAction } from "@thesysai/genui-sdk";

const onAction = useOnAction();

const onClick = () => {
    // humanFriendlyMessage: "Select Flight" will be visible in the C1 Chat UI
    // llmFriendlyMessage: "User selected flight 123" is to provide more context to the assistant about the user's action
    onAction("Select Flight", "User selected flight 123"); 
};
```

## Troubleshooting

- Blank UI: check `THESYS_API_KEY` is set and valid
- Schema errors: ensure Zod → JSON Schema conversion returns an object and the property names match the props your React component expects

## Learn more

- Docs: `https://docs.thesys.dev`
- GenUI React reference: `https://docs.thesys.dev/react-reference/c1-chat`
- Examples: `https://github.com/thesysdev/examples`
