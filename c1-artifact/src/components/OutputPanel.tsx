import { C1Component, ThemeProvider } from "@thesysai/genui-sdk";
type OutputPanelProps = {
  presentation: string;
  artifactType: "slides" | "report";
  onClear: () => void;
  isLoading: boolean;
};

export function OutputPanel({
  presentation,
  artifactType,
  onClear,
  isLoading,
}: OutputPanelProps) {
  return (
    <section className="relative rounded-2xl border border-white/10 bg-neutral-900/40 backdrop-blur p-4 shadow-2xl min-h-[244px]">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-neutral-400">{artifactType === "slides" ? "Slides" : "Report"} Output</div>
        <div className="flex items-center gap-2">
          <button
            onClick={onClear}
            disabled={!presentation}
            className="px-2 h-8 rounded-md border border-white/10 bg-white/5 text-xs disabled:opacity-40"
            title={`Clear ${artifactType === "slides" ? "Slides" : "Report"} output`}
          >
            Clear
          </button>
        </div>
      </div>
      {!presentation && (
        <div className="text-xs text-neutral-400 h-[170px] flex items-center justify-center">
          <span className="animate-pulse">
            {isLoading
              ? `Generating ${artifactType}...`
              : `No ${artifactType} generated yet.`}
          </span>
        </div>
      )}

      {presentation && (
        <ThemeProvider mode="dark">
          <C1Component c1Response={presentation} isStreaming={isLoading} />
        </ThemeProvider>
      )}
    </section>
  );
}
