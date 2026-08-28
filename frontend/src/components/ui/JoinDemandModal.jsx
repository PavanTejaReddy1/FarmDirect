import { useState, useEffect, useRef } from "react";
import { X, Users, CheckCircle2 } from "lucide-react";
import Button from "./Button";
import ProgressBar from "./ProgressBar";

const INPUT_CLS =
  "w-full rounded-xl border border-forest-800/12 bg-canvas px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus-visible:outline-2 focus-visible:outline-forest-600 transition-colors";

export default function JoinDemandModal({ open, demand, onClose, onJoin }) {
  const [qty, setQty] = useState("");
  const [error, setError] = useState("");
  const [joined, setJoined] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQty("");
      setError("");
      setJoined(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") handleClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open || !demand) return null;

  const remaining = Math.max(demand.totalDemand - demand.matched, 0);
  const percentMatched = Math.min(
    Math.round((demand.matched / demand.totalDemand) * 100),
    100
  );
  const progressColor = percentMatched >= 90 ? "full" : percentMatched >= 60 ? "amber" : "green";

  function handleClose() {
    if (joined) onJoin(demand, Number(qty));
    onClose();
  }

  function handleSubmit(e) {
    e.preventDefault();
    const n = Number(qty);
    if (!qty || isNaN(n) || n <= 0) {
      setError("Enter a quantity greater than 0.");
      return;
    }
    if (remaining > 0 && n > remaining) {
      setError(`Only ${remaining} ${demand.unit} remaining in this demand pool.`);
      return;
    }
    setError("");
    setJoined(true);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-forest-950/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="jd-modal-title"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="relative w-full sm:max-w-md bg-canvas-raised rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-reveal">

        {/* Success state */}
        {joined ? (
          <div className="px-6 py-10 flex flex-col items-center text-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-forest-800/[0.08] flex items-center justify-center text-forest-600">
              <CheckCircle2 size={32} strokeWidth={1.6} />
            </div>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-forest-600 mb-1">
                You're in
              </p>
              <h2 className="font-display text-2xl text-forest-950">
                Demand joined
              </h2>
              <p className="mt-2 text-sm text-ink-soft">
                You've added{" "}
                <strong className="text-forest-900 font-semibold">
                  {qty} {demand.unit}
                </strong>{" "}
                of {demand.name} to the collective pool. We'll notify you when
                a farmer is matched.
              </p>
            </div>
            <Button variant="primary" size="md" onClick={handleClose} className="mt-2 w-full">
              Back to demands
            </Button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-forest-800/10">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-forest-800/[0.08] flex items-center justify-center text-forest-700" aria-hidden="true">
                  <Users size={17} strokeWidth={1.8} />
                </div>
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-forest-600">
                    Join demand
                  </p>
                  <h2
                    id="jd-modal-title"
                    className="font-display text-lg text-forest-950 leading-tight"
                  >
                    {demand.name}
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="h-8 w-8 flex items-center justify-center rounded-full text-ink-faint hover:text-forest-900 hover:bg-forest-800/[0.08] transition-colors"
                aria-label="Close modal"
              >
                <X size={17} strokeWidth={2} />
              </button>
            </div>

            {/* Demand summary */}
            <div className="px-6 py-5 flex flex-col gap-4">
              <div className="rounded-xl bg-forest-800/[0.05] p-4 flex flex-col gap-3">
                <div className="flex items-baseline justify-between font-mono text-xs text-ink-faint">
                  <span>
                    Matched{" "}
                    <strong className="text-forest-800 font-semibold">
                      {demand.matched} {demand.unit}
                    </strong>
                  </span>
                  <span>Target {demand.totalDemand} {demand.unit}</span>
                </div>
                <ProgressBar
                  value={percentMatched}
                  color={progressColor}
                  label={`${demand.name} demand progress`}
                />
                <div className="flex items-center justify-between text-xs text-ink-faint">
                  <span className="font-semibold text-amber-600">
                    {remaining} {demand.unit} still needed
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={12} strokeWidth={2} />
                    {demand.consumers} joined
                  </span>
                </div>
              </div>

              {/* Price callout */}
              <div className="flex items-center gap-3 rounded-xl border border-forest-800/10 bg-canvas-raised px-4 py-3">
                <div className="flex-1">
                  <p className="text-xs text-ink-faint font-mono">Direct price</p>
                  <p className="font-display text-xl text-forest-950">
                    ₹{demand.directPrice}
                    <span className="text-sm text-ink-faint font-sans font-normal">/{demand.unit}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-ink-faint font-mono">Market price</p>
                  <p className="text-sm text-ink-faint line-through">₹{demand.marketPrice}/{demand.unit}</p>
                </div>
              </div>

              {/* Quantity form */}
              <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="jd-qty" className="text-sm font-medium text-ink-soft">
                    How much do you need?
                    <span className="text-amber-600 ml-0.5" aria-hidden="true">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      ref={inputRef}
                      id="jd-qty"
                      type="number"
                      min="0.5"
                      step="0.5"
                      placeholder={`e.g. 5 ${demand.unit}`}
                      value={qty}
                      onChange={(e) => {
                        setQty(e.target.value);
                        if (error) setError("");
                      }}
                      className={INPUT_CLS}
                      aria-describedby={error ? "jd-qty-err" : "jd-qty-hint"}
                      aria-invalid={!!error}
                    />
                    <span className="flex items-center shrink-0 font-mono text-sm text-ink-faint px-3 rounded-xl border border-forest-800/12 bg-canvas">
                      {demand.unit}
                    </span>
                  </div>
                  {error ? (
                    <p id="jd-qty-err" className="text-xs text-amber-700" role="alert">{error}</p>
                  ) : (
                    <p id="jd-qty-hint" className="text-xs text-ink-faint">
                      Up to {remaining} {demand.unit} available in this pool.
                    </p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                  <Button type="submit" variant="primary" size="md" className="flex-1">
                    Confirm &amp; Join
                  </Button>
                  <Button type="button" variant="outline" size="md" onClick={handleClose} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
