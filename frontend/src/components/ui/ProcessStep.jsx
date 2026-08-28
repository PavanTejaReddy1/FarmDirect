import { ArrowDown, ArrowRight } from "lucide-react";

/**
 * One node in the demand → aggregation → match → fulfillment flow.
 * `showConnector` renders the arrow to the next step (horizontal on
 * desktop, vertical on mobile) — omit it for the last item.
 */
export default function ProcessStep({ step, index, showConnector }) {
  return (
    <div className="flex md:flex-col items-center md:items-stretch gap-4 md:gap-0 flex-1">
      <div className="flex-1 rounded-2xl border border-forest-800/10 bg-canvas-raised p-6 relative">
        <span className="font-mono text-xs text-amber-600 font-semibold tracking-wide">
          {String(index + 1).padStart(2, "0")}
        </span>
        <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-forest-500 mt-3 mb-2">
          {step.label}
        </p>
        <h3 className="font-display text-lg text-forest-950 mb-1.5 leading-snug">{step.title}</h3>
        <p className="text-sm text-ink-soft leading-relaxed">{step.description}</p>
      </div>

      {showConnector && (
        <div
          className="flex items-center justify-center text-forest-500/50 shrink-0 md:my-3"
          aria-hidden="true"
        >
          <ArrowRight className="hidden md:block" size={20} strokeWidth={1.5} />
          <ArrowDown className="md:hidden" size={20} strokeWidth={1.5} />
        </div>
      )}
    </div>
  );
}
