import { Calendar, MapPin } from "lucide-react";

const STATUS_STYLES = {
  open: {
    dot: "bg-forest-500",
    label: "text-forest-700 bg-forest-800/[0.08]",
    text: "Open",
  },
  matching: {
    dot: "bg-amber-500",
    label: "text-amber-700 bg-amber-100",
    text: "Matching",
  },
  matched: {
    dot: "bg-forest-700",
    label: "text-canvas bg-forest-700",
    text: "Matched",
  },
  fulfilled: {
    dot: "bg-forest-900",
    label: "text-canvas bg-forest-900",
    text: "Fulfilled",
  },
};

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * A single row in the "My Demands" list.
 * Shows product, quantity, matched amount, status pill, delivery date, and location.
 */
export default function MyDemandRow({ demand }) {
  const style = STATUS_STYLES[demand.status] ?? STATUS_STYLES.open;
  const matchedPercent = demand.quantity > 0
    ? Math.min(Math.round((demand.matched / demand.quantity) * 100), 100)
    : 0;

  return (
    <li className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-5 py-4 rounded-xl border border-forest-800/[0.08] bg-canvas-raised hover:border-forest-800/20 transition-colors">
      {/* Status dot + product */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span
          className={`shrink-0 h-2.5 w-2.5 rounded-full ${style.dot}`}
          aria-hidden="true"
        />
        <div className="min-w-0">
          <p className="font-display text-base text-forest-950 truncate">{demand.name}</p>
          <p className="text-xs text-ink-faint font-mono mt-0.5">{demand.category}</p>
        </div>
      </div>

      {/* Quantity / matched */}
      <div className="flex items-center gap-4 sm:gap-6 text-sm shrink-0">
        <div className="font-mono">
          <p className="text-[11px] text-ink-faint uppercase tracking-wide">Requested</p>
          <p className="text-forest-950 font-semibold">
            {demand.quantity} {demand.unit}
          </p>
        </div>
        <div className="font-mono">
          <p className="text-[11px] text-ink-faint uppercase tracking-wide">Matched</p>
          <p className={`font-semibold ${matchedPercent === 100 ? "text-forest-700" : "text-ink-soft"}`}>
            {demand.matched} {demand.unit}
          </p>
        </div>
      </div>

      {/* Meta: date + location */}
      <div className="flex items-center gap-3 text-xs text-ink-faint font-mono shrink-0">
        <span className="flex items-center gap-1">
          <Calendar size={12} strokeWidth={2} aria-hidden="true" />
          {formatDate(demand.deliveryDate)}
        </span>
        <span className="flex items-center gap-1">
          <MapPin size={12} strokeWidth={2} aria-hidden="true" />
          {demand.location}
        </span>
      </div>

      {/* Status pill */}
      <span
        className={`shrink-0 font-mono text-[11px] font-semibold rounded-full px-2.5 py-1 ${style.label}`}
      >
        {style.text}
      </span>
    </li>
  );
}
