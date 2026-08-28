import { Calendar } from "lucide-react";
import { SUPPLY_STATUS_LABELS } from "../../data/farmerDemand";

const STATUS_STYLES = {
  available: {
    dot: "bg-forest-500",
    pill: "text-forest-700 bg-forest-800/[0.08]",
  },
  partial: {
    dot: "bg-amber-500",
    pill: "text-amber-700 bg-amber-100",
  },
  committed: {
    dot: "bg-forest-800",
    pill: "text-canvas bg-forest-800",
  },
};

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

/**
 * A single row in the "My Supply" list.
 * Shows product, available/committed/remaining quantities, availability
 * window, and a status pill.
 */
export default function MySupplyRow({ supply }) {
  const style = STATUS_STYLES[supply.status] ?? STATUS_STYLES.available;
  const remaining = Math.max(supply.availableQty - supply.committedQty, 0);
  const committedPct =
    supply.availableQty > 0
      ? Math.min(Math.round((supply.committedQty / supply.availableQty) * 100), 100)
      : 0;

  return (
    <li className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-5 py-4 rounded-xl border border-forest-800/[0.08] bg-canvas-raised hover:border-forest-800/20 transition-colors">
      {/* Status dot + product name */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className={`shrink-0 h-2.5 w-2.5 rounded-full ${style.dot}`} aria-hidden="true" />
        <div className="min-w-0">
          <p className="font-display text-base text-forest-950 truncate">{supply.name}</p>
          <p className="text-xs text-ink-faint font-mono mt-0.5">{supply.category}</p>
        </div>
      </div>

      {/* Quantity breakdown */}
      <div className="flex items-center gap-4 sm:gap-5 text-sm shrink-0">
        <div className="font-mono">
          <p className="text-[11px] text-ink-faint uppercase tracking-wide">Available</p>
          <p className="text-forest-950 font-semibold">
            {supply.availableQty} {supply.unit}
          </p>
        </div>
        <div className="font-mono">
          <p className="text-[11px] text-ink-faint uppercase tracking-wide">Committed</p>
          <p className={`font-semibold ${committedPct > 0 ? "text-amber-700" : "text-ink-soft"}`}>
            {supply.committedQty} {supply.unit}
          </p>
        </div>
        <div className="font-mono">
          <p className="text-[11px] text-ink-faint uppercase tracking-wide">Remaining</p>
          <p className={`font-semibold ${remaining > 0 ? "text-forest-700" : "text-ink-faint"}`}>
            {remaining} {supply.unit}
          </p>
        </div>
      </div>

      {/* Availability window */}
      <div className="flex items-center gap-1.5 text-xs text-ink-faint font-mono shrink-0">
        <Calendar size={12} strokeWidth={2} aria-hidden="true" />
        <span>
          {formatDate(supply.availableFrom)} – {formatDate(supply.availableUntil)}
        </span>
      </div>

      {/* Status pill */}
      <span
        className={`shrink-0 font-mono text-[11px] font-semibold rounded-full px-2.5 py-1 ${style.pill}`}
      >
        {SUPPLY_STATUS_LABELS[supply.status] ?? supply.status}
      </span>
    </li>
  );
}
