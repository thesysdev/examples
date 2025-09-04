type SuggestionsProps = {
  items: string[];
  onSelect: (text: string) => void;
};

export function Suggestions({ items, onSelect }: SuggestionsProps) {
  return (
    <section className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {items.map((s) => (
        <button
          key={s}
          onClick={() => onSelect(s)}
          className="text-left rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs hover:bg-white/10 transition"
        >
          {s}
        </button>
      ))}
    </section>
  );
}
