import { MapPin, Calendar } from "lucide-react";
import { COMMIT_STATUS_LABELS } from "../../data/farmerDemand";

const STATUS_STYLES = {
  pending: {
    dot: "bg-amber-500",
    pill: "text-amber-700 bg-amber-100",
  },
  partial: {
    dot: "bg-forest-500",
    pill: "text-forest-700 bg-forest-800/[0.08]",
  },
  fulfilled: {
    dot: "bg-forest-800",
    pill: "text-canvas bg-forest-800",
  },
};

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * A single row in the "Committed Demands" list.
 * Shows product, how much the farmer committed, the total consumer demand,
 * location, required date, and status.
 */
export default function CommittedDemandRow({ commitment }) {
  const style = STATUS_STYLES[commitment.status] ?? STATUS_STYLES.pending;
  const coveragePct =
    commitment.totalDemand > 0
      ? Math.min(Math.round((commitment.committedQty / commitment.totalDemand) * 100), 100)
      : 0;

  return (
    <li className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-5 py-4 rounded-xl border border-forest-800/[0.08] bg-canvas-raised hover:border-forest-800/20 transition-colors">
      {/* Status dot + product */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className={`shrink-0 h-2.5 w-2.5 rounded-full ${style.dot}`} aria-hidden="true" />
        <div className="min-w-0">
          <p className="font-display text-base text-forest-950 truncate">{commitment.name}</p>
          <p className="text-xs text-ink-faint font-mono mt-0.5">{commitment.category}</p>
        </div>
      </div>

      {/* Quantities */}
      <div className="flex items-center gap-4 sm:gap-5 text-sm shrink-0">
        <div className="font-mono">
          <p className="text-[11px] text-ink-faint uppercase tracking-wide">Committed</p>
          <p className="text-forest-950 font-semibold">
            {commitment.committedQty} {commitment.unit}
          </p>
        </div>
        <div className="font-mono">
          <p className="text-[11px] text-ink-faint uppercase tracking-wide">Total demand</p>
          <p className="text-ink-soft font-semibold">
            {commitment.totalDemand} {commitment.unit}
          </p>
        </div>
        <div className="font-mono">
          <p className="text-[11px] text-ink-faint uppercase tracking-wide">Your share</p>
          <p className="text-forest-700 font-semibold">{coveragePct}%</p>
        </div>
      </div>

      {/* Meta: location + date */}
      <div className="flex items-center gap-3 text-xs text-ink-faint font-mono shrink-0">
        <span className="flex items-center gap-1">
          <MapPin size={12} strokeWidth={2} aria-hidden="true" />
          {commitment.location}
        </span>
        <span className="flex items-center gap-1">
          <Calendar size={12} strokeWidth={2} aria-hidden="true" />
          {formatDate(commitment.requiredDate)}
        </span>
      </div>

      {/* Status pill */}
      <span
        className={`shrink-0 font-mono text-[11px] font-semibold rounded-full px-2.5 py-1 ${style.pill}`}
      >
        {COMMIT_STATUS_LABELS[commitment.status] ?? commitment.status}
      </span>
    </li>
  );
}
