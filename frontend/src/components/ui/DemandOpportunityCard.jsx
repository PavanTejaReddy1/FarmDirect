import { MapPin, Users, Calendar, Zap } from "lucide-react";
import Button from "./Button";
import ProgressBar from "./ProgressBar";

const STATUS_STYLES = {
  open: "text-forest-700 bg-forest-800/[0.08]",
  filling: "text-amber-700 bg-amber-100",
  matched: "text-canvas bg-forest-700",
  closed: "text-ink-faint bg-forest-800/[0.06]",
};

const STATUS_LABELS = {
  open: "Open",
  filling: "Filling fast",
  matched: "Matched",
  closed: "Closed",
};

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function matchColor(score) {
  if (score >= 80) return "text-forest-700 bg-forest-800/[0.08]";
  if (score >= 55) return "text-amber-700 bg-amber-100";
  return "text-ink-faint bg-forest-800/[0.06]";
}

/**
 * Demand-first opportunity card for the farmer dashboard.
 * Shows consumer demand context first, then the farmer's angle:
 * remaining quantity to fill, match score, price, and a View CTA.
 */
export default function DemandOpportunityCard({ opportunity, matchScore = 0, onView }) {
  const percent = Math.min(
    Math.round((opportunity.matched / opportunity.totalDemand) * 100),
    100
  );
  const progressColor =
    opportunity.status === "matched" ? "full" : percent >= 60 ? "amber" : "green";
  
  const savingsPercent = opportunity.directPrice && opportunity.marketPrice 
    ? Math.round(((opportunity.marketPrice - opportunity.directPrice) / opportunity.marketPrice) * 100)
    : 0;

  return (
    <article className="rounded-2xl bg-canvas-raised border border-forest-800/10 p-5 sm:p-6 flex flex-col gap-4 transition-shadow duration-300 hover:shadow-[0_8px_24px_rgba(22,38,28,0.08)]">
      {/* Top: product name + status badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-lg text-forest-950 leading-snug">
            {opportunity.name}
          </h3>
          <p className="text-xs text-ink-faint mt-0.5 font-mono">{opportunity.category}</p>
        </div>
        <span
          className={`shrink-0 font-mono text-[11px] font-semibold rounded-full px-2.5 py-1 ${
            STATUS_STYLES[opportunity.status] ?? STATUS_STYLES.open
          }`}
        >
          {STATUS_LABELS[opportunity.status] ?? opportunity.status}
        </span>
      </div>

      {/* Demand progress */}
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between font-mono text-xs text-ink-faint">
          <span>
            Filled{" "}
            <strong className="text-forest-800 font-semibold">
              {opportunity.matched} {opportunity.unit}
            </strong>
          </span>
          <span>{opportunity.totalDemand} {opportunity.unit} needed</span>
        </div>
        <ProgressBar
          value={percent}
          color={progressColor}
          label={`${opportunity.name} demand fill progress`}
        />
      </div>

      {/* Key numbers */}
      <dl className="grid grid-cols-2 gap-2.5 font-mono">
        <div className="rounded-xl bg-forest-800/[0.05] px-3 py-2.5">
          <dt className="text-[11px] text-ink-faint uppercase tracking-wide">Still needed</dt>
          <dd className="text-forest-950 font-semibold mt-0.5 text-sm">
            {opportunity.remaining} {opportunity.unit}
          </dd>
        </div>
        <div className="rounded-xl bg-forest-800/[0.05] px-3 py-2.5">
          <dt className="text-[11px] text-ink-faint uppercase tracking-wide">Consumers</dt>
          <dd className="text-forest-950 font-semibold mt-0.5 text-sm flex items-center gap-1">
            <Users size={12} strokeWidth={2} aria-hidden="true" />
            {opportunity.consumers}
          </dd>
        </div>
      </dl>

      {/* Meta row */}
      <dl className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-ink-faint">
        <div className="flex items-center gap-1">
          <MapPin size={11} strokeWidth={2} aria-hidden="true" />
          <dt className="sr-only">Location</dt>
          <dd>{opportunity.location}</dd>
        </div>
        <div className="flex items-center gap-1">
          <Calendar size={11} strokeWidth={2} aria-hidden="true" />
          <dt className="sr-only">Required by</dt>
          <dd>By {formatDate(opportunity.targetDate)}</dd>
        </div>
        <div className="flex items-center gap-1">
          <MapPin size={11} strokeWidth={2} aria-hidden="true" />
          <dt className="sr-only">Distance</dt>
          <dd>{opportunity.distanceKm} km away</dd>
        </div>
      </dl>

      {/* Footer: price + match score + CTA */}
      <div className="flex items-center justify-between pt-1 border-t border-forest-800/[0.07] gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="font-mono">
            {opportunity.directPrice ? (
              <>
                <span className="text-base font-semibold text-forest-950">
                  ₹{opportunity.directPrice}
                </span>
                <span className="text-xs text-ink-faint">/{opportunity.unit}</span>
                {opportunity.marketPrice && (
                  <>
                    <span className="ml-2 text-xs text-ink-faint line-through">₹{opportunity.marketPrice}</span>
                    <span className="ml-1.5 text-[11px] font-semibold text-forest-600">
                      ({savingsPercent}% off)
                    </span>
                  </>
                )}
              </>
            ) : (
              <span className="text-base font-semibold text-ink-faint">Price not set</span>
            )}
          </div>
          <span
            className={`inline-flex items-center gap-1 font-mono text-[11px] font-semibold rounded-full px-2.5 py-1 ${matchColor(matchScore)}`}
            title="Deterministic match score based on crop category, distance, supply coverage and date"
          >
            <Zap size={10} strokeWidth={2.5} aria-hidden="true" />
            {matchScore}% match
          </span>
        </div>

        <Button
          variant="outline"
          size="md"
          className="!px-4 !py-2 text-sm shrink-0"
          onClick={() => onView(opportunity)}
          disabled={opportunity.status === "matched" || opportunity.status === "closed"}
        >
          View Demand
        </Button>
      </div>
    </article>
  );
}
