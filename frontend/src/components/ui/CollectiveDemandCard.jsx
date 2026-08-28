import { MapPin, Users, Calendar, CheckCircle2 } from "lucide-react";
import Button from "./Button";
import ProgressBar from "./ProgressBar";
import { STATUS_LABELS } from "../../data/demand";

const STATUS_STYLES = {
  open: "text-forest-700 bg-forest-800/[0.08]",
  filling: "text-amber-700 bg-amber-100",
  matched: "text-canvas bg-forest-700",
  closed: "text-ink-faint bg-forest-800/[0.06]",
};

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

/**
 * Card showing one collective demand with progress, stats, and a
 * "Join Demand" CTA. Replaces the old DemandCard on the dashboard.
 * Passes through to onJoin(demand) when the CTA is clicked.
 */
export default function CollectiveDemandCard({ demand, joined = false, onJoin, onViewOutlook }) {
  const remaining = Math.max(demand.totalDemand - demand.matched, 0);
  const percent = Math.min(Math.round((demand.matched / demand.totalDemand) * 100), 100);
  const progressColor = demand.status === "matched" ? "full" : percent >= 60 ? "amber" : "green";
  const savingsPercent = demand.directPrice && demand.marketPrice 
    ? Math.round(((demand.marketPrice - demand.directPrice) / demand.marketPrice) * 100)
    : 0;

  return (
    <article className="rounded-2xl bg-canvas-raised border border-forest-800/10 p-5 sm:p-6 flex flex-col gap-4 transition-shadow duration-300 hover:shadow-[0_8px_24px_rgba(22,38,28,0.08)]">
      {/* Top row: name + status badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-lg text-forest-950 leading-snug">{demand.name}</h3>
          <p className="text-xs text-ink-faint mt-0.5 font-mono">{demand.category}</p>
        </div>
        <span
          className={`shrink-0 font-mono text-[11px] font-semibold rounded-full px-2.5 py-1 ${STATUS_STYLES[demand.status] ?? STATUS_STYLES.open}`}
        >
          {STATUS_LABELS[demand.status] ?? demand.status}
        </span>
      </div>

      {/* Progress block */}
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between font-mono text-xs text-ink-faint">
          <span>
            Matched{" "}
            <strong className="text-forest-800 font-semibold">
              {demand.matched} {demand.unit}
            </strong>
          </span>
          <span>{demand.totalDemand} {demand.unit} total</span>
        </div>
        <ProgressBar
          value={percent}
          color={progressColor}
          label={`${demand.name} demand progress`}
        />
        <p className="text-xs text-ink-faint">
          <span className="font-semibold text-amber-600">
            {remaining} {demand.unit} remaining
          </span>
          {" · "}
          {demand.consumers} consumers
        </p>
      </div>

      {/* Meta row */}
      <dl className="grid grid-cols-2 gap-2 font-mono text-xs text-ink-faint">
        <div className="flex items-center gap-1.5">
          <MapPin size={12} strokeWidth={2} aria-hidden="true" />
          <dt className="sr-only">Location</dt>
          <dd>{demand.location}</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <Calendar size={12} strokeWidth={2} aria-hidden="true" />
          <dt className="sr-only">Target date</dt>
          <dd>By {formatDate(demand.targetDate)}</dd>
        </div>
      </dl>

      {/* Footer: price + CTA */}
      <div className="flex items-center justify-between pt-1 border-t border-forest-800/[0.07]">
        <div className="font-mono">
          {demand.directPrice ? (
            <>
              <span className="text-lg font-semibold text-forest-950">
                ₹{demand.directPrice}
              </span>
              <span className="text-xs text-ink-faint">/{demand.unit}</span>
              {demand.marketPrice && (
                <>
                  <span className="ml-2 text-xs text-ink-faint line-through">
                    ₹{demand.marketPrice}
                  </span>
                  <span className="ml-1.5 text-[11px] font-semibold text-forest-600">
                    ({savingsPercent}% off)
                  </span>
                </>
              )}
            </>
          ) : (
            <span className="text-lg font-semibold text-ink-faint">Price not set</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onViewOutlook && (
            <button
              type="button"
              onClick={() => onViewOutlook(demand)}
              className="text-xs font-mono font-medium text-forest-700 hover:text-forest-900 bg-forest-800/[0.06] hover:bg-forest-800/[0.12] rounded-full px-3 py-1.5 transition-colors"
            >
              Fulfillment outlook
            </button>
          )}

          {joined || demand.status === "matched" ? (
            <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-forest-600 bg-forest-800/[0.08] rounded-full px-3 py-1.5">
              <CheckCircle2 size={13} strokeWidth={2.2} />
              Joined
            </span>
          ) : (
            <Button
              size="md"
              className="!px-4 !py-2 text-sm"
              onClick={() => onJoin(demand)}
              disabled={demand.status === "closed"}
            >
              Join Demand
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
