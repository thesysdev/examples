import type { Message } from "@crayonai/react-core";
import { CrayonChat } from "@crayonai/react-ui";
import "@crayonai/react-ui/styles/index.css";
import { RecipeTemplate } from "./templates/recipe";

const processMessage = async ({
  threadId,
  messages,
  abortController,
}: {
  threadId: string;
  messages: Message[];
  abortController: AbortController;
}) => {
  const response = await fetch("/api/chat", {
    method: "POST",
    body: JSON.stringify({ threadId, messages }),
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    signal: abortController.signal,
  });
  return response;
};

function App() {
  return (
    <div style={{ display: "flex", flexDirection: "row" }}>
      <div style={{ flexGrow: 1 }}>{/* Insert your existing UI here */}</div>
      <CrayonChat
        type="copilot"
        processMessage={processMessage}
        responseTemplates={[
          {
            name: "recipe",
            Component: RecipeTemplate,
          },
        ]}
      />
    </div>
  );
}

export default App;
