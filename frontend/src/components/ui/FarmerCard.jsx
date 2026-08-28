import { MapPin, Users } from "lucide-react";
import Button from "./Button";

/**
 * Shows one nearby demand item from the farmer's side: what's required,
 * what they could supply toward it, and how many households are behind
 * the number — the case for fulfilling it directly.
 */
export default function FarmerCard({ item }) {
  const coveragePercent = Math.min(
    Math.round((item.supplyAvailable / item.required) * 100),
    100
  );

  return (
    <div className="rounded-2xl bg-canvas-raised border border-forest-800/10 p-5 sm:p-6 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg text-forest-950">{item.name}</h3>
          <p className="text-xs text-ink-faint mt-0.5 flex items-center gap-1">
            <MapPin size={12} strokeWidth={2} /> {item.distanceKm} km away
          </p>
        </div>
        <span className="shrink-0 font-mono text-xs font-semibold text-amber-700 bg-amber-100 rounded-full px-2.5 py-1">
          ₹{item.expectedPrice}/{item.unit}
        </span>
      </div>

      <dl className="grid grid-cols-2 gap-3 font-mono text-sm">
        <div className="rounded-xl bg-forest-800/[0.05] px-3 py-2.5">
          <dt className="text-[11px] text-ink-faint uppercase tracking-wide">Required</dt>
          <dd className="text-forest-950 font-semibold mt-0.5">
            {item.required} {item.unit}
          </dd>
        </div>
        <div className="rounded-xl bg-forest-800/[0.05] px-3 py-2.5">
          <dt className="text-[11px] text-ink-faint uppercase tracking-wide">You can supply</dt>
          <dd className="text-forest-950 font-semibold mt-0.5">
            {item.supplyAvailable} {item.unit}
          </dd>
        </div>
      </dl>

      <div
        className="h-2 w-full rounded-full bg-forest-800/[0.08] overflow-hidden"
        role="progressbar"
        aria-valuenow={coveragePercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${item.name} coverage from your supply`}
      >
        <div
          className="h-full rounded-full bg-amber-500 transition-[width] duration-700"
          style={{ width: `${coveragePercent}%` }}
        />
      </div>

      <div className="flex items-center justify-between pt-1">
        <p className="text-xs text-ink-faint flex items-center gap-1.5">
          <Users size={13} strokeWidth={2} />
          {item.potentialBuyers} households behind this
        </p>
        <Button variant="outline" size="md" className="!px-4 !py-2 text-sm">
          View Demand
        </Button>
      </div>
    </div>
  );
}
