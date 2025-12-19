import { C1Component, ThemeProvider } from "@thesysai/genui-sdk";
import type { Version } from "../hooks/useArtifactStream";

type OutputPanelProps = {
  artifact: string;
  artifactType: "slides" | "report";
  onClear: () => void;
  isLoading: boolean;
  versions: Version[];
  currentVersionIndex: number;
  onSelectVersion: (index: number) => void;
};

export function OutputPanel({
  artifact,
  artifactType,
  onClear,
  isLoading,
  versions,
  currentVersionIndex,
  onSelectVersion,
}: OutputPanelProps) {
  return (
    <section className="relative rounded-2xl border border-white/10 bg-neutral-900/40 backdrop-blur p-4 shadow-2xl min-h-[244px]">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-neutral-400">{artifactType === "slides" ? "Slides" : "Report"} Output</div>
        <div className="flex items-center gap-2">
          {versions.length > 0 && (
            <select
              value={currentVersionIndex}
              onChange={(e) => onSelectVersion(parseInt(e.target.value, 10))}
              disabled={isLoading}
              className="px-2 h-8 rounded-md border border-white/10 bg-white/5 text-xs text-neutral-100 disabled:opacity-40 cursor-pointer appearance-none pr-6 bg-no-repeat bg-right"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23888' d='M3 4.5L6 7.5L9 4.5'/%3E%3C/svg%3E")`,
                backgroundPosition: "right 6px center",
              }}
            >
              {versions.map((version, index) => (
                <option key={version.id} value={index} className="bg-neutral-800">
                  Version {version.id}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={onClear}
            disabled={!artifact}
            className="px-2 h-8 rounded-md border border-white/10 bg-white/5 text-xs disabled:opacity-40"
            title={`Clear ${artifactType === "slides" ? "Slides" : "Report"} output`}
          >
            Clear
          </button>
        </div>
      </div>
      {!artifact && (
        <div className="text-xs text-neutral-400 h-[170px] flex items-center justify-center">
          <span className="animate-pulse">
            {isLoading
              ? `Generating ${artifactType}...`
              : `No ${artifactType} generated yet.`}
          </span>
        </div>
      )}

      {artifact && (
        <ThemeProvider mode="dark">
          <C1Component c1Response={artifact} isStreaming={isLoading} />
        </ThemeProvider>
      )}
    </section>
  );
}
