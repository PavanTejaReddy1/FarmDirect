import Button from "./Button";

/**
 * Shows one item's collective-demand progress: how much is needed in the
 * area, how much is already matched, and what's left — the core proof
 * that consumers are contributing to a shared order, not just browsing.
 */
export default function DemandCard({ item }) {
  const remaining = Math.max(item.collectiveDemand - item.matched, 0);
  const percentMatched = Math.min(
    Math.round((item.matched / item.collectiveDemand) * 100),
    100
  );
  const savingsPercent = Math.round(
    ((item.marketPrice - item.directPrice) / item.marketPrice) * 100
  );

  return (
    <div className="rounded-2xl bg-canvas-raised border border-forest-800/10 p-5 sm:p-6 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg text-forest-950">{item.name}</h3>
          <p className="text-xs text-ink-faint mt-0.5">{item.area}</p>
        </div>
        <span className="shrink-0 font-mono text-xs font-semibold text-forest-700 bg-forest-800/[0.08] rounded-full px-2.5 py-1">
          {savingsPercent}% direct
        </span>
      </div>

      <div>
        <div className="flex items-baseline justify-between mb-2 font-mono text-xs text-ink-faint">
          <span>
            Matched{" "}
            <strong className="text-forest-800 font-semibold">
              {item.matched} {item.unit}
            </strong>
          </span>
          <span>
            Needed {item.collectiveDemand} {item.unit}
          </span>
        </div>
        <div
          className="h-2 w-full rounded-full bg-forest-800/[0.08] overflow-hidden"
          role="progressbar"
          aria-valuenow={percentMatched}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${item.name} demand matched`}
        >
          <div
            className="h-full rounded-full bg-forest-600 transition-[width] duration-700"
            style={{ width: `${percentMatched}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-ink-faint">
          <span className="font-semibold text-amber-600">
            {remaining} {item.unit} remaining
          </span>{" "}
          · {item.households} households already in
        </p>
      </div>

      <div className="flex items-center justify-between pt-1">
        <div className="font-mono">
          <span className="text-lg font-semibold text-forest-950">₹{item.directPrice}</span>
          <span className="text-xs text-ink-faint">/{item.unit}</span>
          <span className="ml-2 text-xs text-ink-faint line-through">₹{item.marketPrice}</span>
        </div>
        <Button size="md" className="!px-4 !py-2 text-sm">
          Join Demand
        </Button>
      </div>
    </div>
  );
}
