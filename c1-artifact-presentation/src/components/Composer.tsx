type ComposerProps = {
  prompt: string;
  setPrompt: (v: string) => void;
  isLoading: boolean;
  onSend: () => void;
  onStop: () => void;
};

export function Composer({
  prompt,
  setPrompt,
  isLoading,
  onSend,
  onStop,
}: ComposerProps) {
  return (
    <section className="sticky bottom-6 w-full">
      <div className="rounded-2xl border border-white/10 bg-neutral-900/60 backdrop-blur p-2 shadow-2xl">
        <div className="flex items-end gap-2">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            placeholder="Ask anything… Shift+Enter for newline"
            rows={2}
            className="flex-1 resize-none rounded-xl border border-white/5 bg-neutral-950/60 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
          <div className="flex items-center gap-2">
            {isLoading ? (
              <button
                onClick={onStop}
                className="h-11 px-4 rounded-xl bg-amber-600 text-white text-sm"
              >
                Stop
              </button>
            ) : (
              <button
                onClick={onSend}
                disabled={!prompt.trim()}
                className="h-11 px-4 rounded-xl bg-blue-600 text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="mt-2 text-[11px] text-neutral-500">
        Tips: <br />
        1. Press Enter to send, Shift+Enter for newline. <br />
        2. You can prompt to regenerate presentation with some changes or start
        from scratch.
      </div>
    </section>
  );
}
