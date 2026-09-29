"use client";

interface ResizeDividerProps {
  isDragging: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
}

export function ResizeDivider({ isDragging, onMouseDown }: ResizeDividerProps) {
  return (
    <div
      onMouseDown={onMouseDown}
      className={`w-1 bg-zinc-800 hover:bg-blue-500 cursor-col-resize flex-shrink-0 relative group transition-colors ${
        isDragging ? "bg-blue-500" : ""
      }`}
    >
      {/* Wider hit area */}
      <div className="absolute inset-y-0 -left-1 -right-1" />
      {/* Visual grip indicator */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-1 h-1 rounded-full bg-zinc-400" />
        <div className="w-1 h-1 rounded-full bg-zinc-400" />
        <div className="w-1 h-1 rounded-full bg-zinc-400" />
      </div>
    </div>
  );
}

