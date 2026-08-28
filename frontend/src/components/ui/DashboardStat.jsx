/**
 * A compact stat tile used in the consumer dashboard header row.
 * Renders a label, a large value, and an optional supporting note.
 */
export default function DashboardStat({ label, value, note, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-forest-800/10 bg-canvas-raised px-5 py-4 flex items-center gap-4">
      {Icon && (
        <div
          className="shrink-0 h-10 w-10 rounded-xl bg-forest-800/[0.07] flex items-center justify-center text-forest-600"
          aria-hidden="true"
        >
          <Icon size={18} strokeWidth={1.8} />
        </div>
      )}
      <div className="min-w-0">
        <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-faint">{label}</p>
        <p className="font-display text-2xl text-forest-950 leading-tight mt-0.5">{value}</p>
        {note && <p className="text-xs text-ink-faint mt-0.5">{note}</p>}
      </div>
    </div>
  );
}
