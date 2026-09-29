export interface SSEEvent {
  type: string;
  content: string;
}

export interface ParseResult {
  events: SSEEvent[];
  remaining: string;
}

export function parseSSEEvents(buffer: string): ParseResult {
  const events: SSEEvent[] = [];
  const lines = buffer.split("\n");
  let currentEvent: { type: string; data: string } | null = null;
  let remaining = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if this might be an incomplete event at the end
    if (i === lines.length - 1 && line !== "") {
      remaining = line;
      break;
    }

    if (line.startsWith("event: ")) {
      currentEvent = { type: line.slice(7), data: "" };
    } else if (line.startsWith("data: ") && currentEvent) {
      currentEvent.data = line.slice(6);
    } else if (line === "" && currentEvent && currentEvent.data) {
      try {
        const parsed = JSON.parse(currentEvent.data);
        events.push({ type: currentEvent.type, content: parsed.content });
      } catch {
        // Skip malformed events
      }
      currentEvent = null;
    }
  }

  // If we have an incomplete event, add it to remaining
  if (currentEvent) {
    remaining = currentEvent.data
      ? `event: ${currentEvent.type}\ndata: ${currentEvent.data}`
      : `event: ${currentEvent.type}`;
  }

  return { events, remaining };
}

export function processEvents(
  events: SSEEvent[],
  accumulated: { text: string; artifact: string }
): { text: string; artifact: string } {
  let { text, artifact } = accumulated;

  for (const event of events) {
    if (event.type === "text") {
      text += event.content;
    } else if (event.type === "artifact") {
      artifact += event.content;
    }
  }

  return { text, artifact };
}
