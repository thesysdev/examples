import { useThreadActions, useThreadState } from "@crayonai/react-core";
import { Button } from "@crayonai/react-ui";
import { CircleX, SendIcon } from "lucide-react";
import { useState } from "react";

export const CustomComposer = () => {
  const [message, setMessage] = useState("");
  const { isRunning } = useThreadState();
  const { onCancel, processMessage } = useThreadActions();

  const handleMessageButton = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isRunning) {
      onCancel();
      return;
    }

    if (!message) return;

    processMessage({ role: "user", type: "prompt", message });
    setMessage("");
  };

  return (
    <div className="bg-opacity-5 bg-white rounded-2xl p-4 w-7/12 mx-auto">
      <form onSubmit={handleMessageButton} className="w-full flex items-center">
        <input
          className="w-full h-full bg-transparent outline-none"
          placeholder="Type your message here..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <Button
          variant="primary"
          iconRight={isRunning ? <CircleX /> : <SendIcon />}
          type="submit"
        />
      </form>
    </div>
  );
};
