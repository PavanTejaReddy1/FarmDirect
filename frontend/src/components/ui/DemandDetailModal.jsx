import { useState, useEffect, useRef } from "react";
import { X, Users, MapPin, Calendar, CheckCircle2, Sprout, Zap, Info } from "lucide-react";
import Button from "./Button";
import ProgressBar from "./ProgressBar";
import DemandIntelligence from "./DemandIntelligence";

const INPUT_CLS =
  "w-full rounded-xl border border-forest-800/12 bg-canvas px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus-visible:outline-2 focus-visible:outline-forest-600 transition-colors";

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Score bar row ────────────────────────────────────────────────────────────

function ScoreBar({ label, score, maxScore, na = false }) {
  const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  const color =
    pct >= 80 ? "bg-forest-600" : pct >= 50 ? "bg-amber-500" : "bg-forest-800/30";

  return (
    <div className="flex items-center gap-3">
      <span className="w-20 shrink-0 font-mono text-[11px] text-ink-faint">{label}</span>
      {na ? (
        <span className="text-xs text-ink-faint font-mono italic flex-1">N/A</span>
      ) : (
        <>
          <div className="flex-1 h-1.5 rounded-full bg-forest-800/[0.08] overflow-hidden">
            <div
              className={`h-full rounded-full transition-[width] duration-700 ${color}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="w-12 shrink-0 text-right font-mono text-xs text-forest-950 font-semibold">
            {score}/{maxScore}
          </span>
        </>
      )}
    </div>
  );
}

// ─── Match section ────────────────────────────────────────────────────────────

function MatchSection({ matchData }) {
  if (!matchData) return null;

  const { score, scoreBreakdown, reasons, warnings, suggestedCommitment, distanceKm } = matchData;
  const bd = scoreBreakdown ?? {};

  const matchColor =
    score >= 75
      ? "text-forest-700 bg-forest-800/[0.08]"
      : score >= 50
      ? "text-amber-700 bg-amber-100"
      : "text-ink-faint bg-forest-800/[0.06]";

  return (
    <div className="rounded-xl border border-forest-800/10 bg-canvas p-4 flex flex-col gap-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-faint">
          Match analysis
        </p>
        <span
          className={`inline-flex items-center gap-1 font-mono text-xs font-semibold rounded-full px-2.5 py-1 ${matchColor}`}
        >
          <Zap size={11} strokeWidth={2.5} aria-hidden="true" />
          {score}% match
        </span>
      </div>

      {/* Score breakdown bars */}
      <div className="flex flex-col gap-2.5 pt-1">
        <ScoreBar label="Product"  score={bd.product  ?? 0} maxScore={35} />
        <ScoreBar label="Quantity" score={bd.quantity ?? 0} maxScore={25} />
        <ScoreBar label="Location" score={bd.location ?? 0} maxScore={20} />
        <ScoreBar label="Date"     score={bd.date     ?? 0} maxScore={10} />
        <ScoreBar label="Price"    score={0}                maxScore={10} na={bd.price === null} />
      </div>

      {/* Reasons */}
      {reasons && reasons.length > 0 && (
        <ul className="flex flex-col gap-1 pt-1 border-t border-forest-800/[0.06]">
          {reasons.map((r, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-forest-700">
              <CheckCircle2 size={12} strokeWidth={2} className="shrink-0 mt-0.5" aria-hidden="true" />
              {r}
            </li>
          ))}
        </ul>
      )}

      {/* Warnings */}
      {warnings && warnings.filter(w => !w.includes("redistributed")).length > 0 && (
        <ul className="flex flex-col gap-1">
          {warnings
            .filter(w => !w.includes("redistributed"))
            .map((w, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-amber-700">
                <Info size={12} strokeWidth={2} className="shrink-0 mt-0.5" aria-hidden="true" />
                {w}
              </li>
            ))}
        </ul>
      )}

      {/* Suggested commitment */}
      {suggestedCommitment > 0 && (
        <div className="rounded-lg bg-forest-800/[0.05] px-3 py-2 flex items-center justify-between font-mono text-xs">
          <span className="text-ink-faint">Suggested contribution</span>
          <span className="text-forest-900 font-semibold">{suggestedCommitment} units</span>
        </div>
      )}
    </div>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

/**
 * Demand detail + fulfillment modal for the farmer.
 *
 * Props:
 *   open             boolean
 *   demand           demandOpportunity object | null
 *   supplyForDemand  matching supply item from mySupply | null
 *   matchData        result from /api/matching/demands/:id for this supply | null
 *   onClose          () => void
 *   onCommit         (demand, qty) => void
 */
export default function DemandDetailModal({
  open,
  demand,
  supplyForDemand,
  matchData,
  onClose,
  onCommit,
}) {
  const [qty, setQty] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState("detail"); // "detail" | "confirm" | "success"
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQty("");
      setError("");
      setStep("detail");
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !demand) return null;

  const remaining = demand.remaining ?? Math.max(demand.totalDemand - demand.matched, 0);
  const percent   = Math.min(Math.round((demand.matched / demand.totalDemand) * 100), 100);
  const progressColor = percent >= 90 ? "full" : percent >= 60 ? "amber" : "green";

  const maxSupply = supplyForDemand
    ? supplyForDemand.availableQty - supplyForDemand.committedQty
    : null;

  // Use matchData suggested commitment as default if available and no supply declared
  const defaultQty = matchData?.suggestedCommitment
    ? String(matchData.suggestedCommitment)
    : "";

  function validate() {
    const n = Number(qty);
    if (!qty || isNaN(n) || n <= 0) return "Enter a quantity greater than 0.";
    if (maxSupply !== null && n > maxSupply)
      return `You only have ${maxSupply} ${demand.unit} available to commit.`;
    if (n > remaining)
      return `Only ${remaining} ${demand.unit} is still needed in this pool.`;
    return "";
  }

  function handleProceed(e) {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    setStep("confirm");
  }

  function handleConfirm() {
    onCommit(demand, Number(qty));
    setStep("success");
  }

  const qtyNum = Number(qty) || 0;
  const fulfillPct = remaining > 0 ? Math.min(Math.round((qtyNum / remaining) * 100), 100) : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-forest-950/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dd-modal-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full sm:max-w-lg bg-canvas-raised rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-reveal">

        {/* ── SUCCESS ── */}
        {step === "success" && (
          <div className="px-6 py-12 flex flex-col items-center text-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-forest-800/[0.08] flex items-center justify-center text-forest-600">
              <CheckCircle2 size={32} strokeWidth={1.6} />
            </div>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-forest-600 mb-1">
                Supply committed
              </p>
              <h2 className="font-display text-2xl text-forest-950">You're in the pool</h2>
              <p className="mt-2 text-sm text-ink-soft max-w-xs">
                Your{" "}
                <strong className="text-forest-900 font-semibold">
                  {qty} {demand.unit}
                </strong>{" "}
                of {demand.name} has been committed toward this consumer demand. We'll
                coordinate delivery once the pool is filled.
              </p>
            </div>
            <Button variant="primary" size="md" className="mt-2 w-full" onClick={onClose}>
              Back to opportunities
            </Button>
          </div>
        )}

        {/* ── CONFIRM ── */}
        {step === "confirm" && (
          <>
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-forest-800/10">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-forest-600">
                  Confirm commitment
                </p>
                <h2 id="dd-modal-title" className="font-display text-lg text-forest-950">
                  Review before you confirm
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="h-8 w-8 flex items-center justify-center rounded-full text-ink-faint hover:text-forest-900 hover:bg-forest-800/[0.08] transition-colors"
                aria-label="Close"
              >
                <X size={17} strokeWidth={2} />
              </button>
            </div>

            <div className="px-6 py-5 flex flex-col gap-4">
              <div className="rounded-2xl border border-forest-800/10 bg-canvas p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-xl text-forest-950">{demand.name}</p>
                    <p className="text-xs text-ink-faint font-mono">{demand.location}</p>
                  </div>
                  {demand.directPrice && (
                    <span className="font-mono text-sm font-semibold text-forest-700 bg-forest-800/[0.08] rounded-full px-3 py-1">
                      ₹{demand.directPrice}/{demand.unit}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 font-mono text-sm">
                  <div className="rounded-xl bg-forest-800/[0.05] px-3 py-2.5">
                    <p className="text-[11px] text-ink-faint uppercase tracking-wide">You commit</p>
                    <p className="text-forest-950 font-semibold mt-0.5">{qty} {demand.unit}</p>
                  </div>
                  <div className="rounded-xl bg-forest-800/[0.05] px-3 py-2.5">
                    <p className="text-[11px] text-ink-faint uppercase tracking-wide">Fills demand</p>
                    <p className="text-forest-950 font-semibold mt-0.5">{fulfillPct}%</p>
                  </div>
                  <div className="rounded-xl bg-forest-800/[0.05] px-3 py-2.5">
                    <p className="text-[11px] text-ink-faint uppercase tracking-wide">Required by</p>
                    <p className="text-forest-950 font-semibold mt-0.5">{formatDate(demand.targetDate)}</p>
                  </div>
                  <div className="rounded-xl bg-forest-800/[0.05] px-3 py-2.5">
                    <p className="text-[11px] text-ink-faint uppercase tracking-wide">Consumers</p>
                    <p className="text-forest-950 font-semibold mt-0.5">{demand.consumers}</p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-ink-faint">
                Once confirmed, your supply will appear under Committed Demands and
                the demand pool progress will update accordingly.
              </p>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <Button variant="primary" size="md" className="flex-1" onClick={handleConfirm}>
                  Confirm commitment
                </Button>
                <Button variant="outline" size="md" className="flex-1" onClick={() => setStep("detail")}>
                  Go back
                </Button>
              </div>
            </div>
          </>
        )}

        {/* ── DETAIL ── */}
        {step === "detail" && (
          <>
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-forest-800/10">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-forest-800/[0.08] flex items-center justify-center text-forest-700" aria-hidden="true">
                  <Sprout size={17} strokeWidth={1.8} />
                </div>
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-forest-600">
                    Demand opportunity
                  </p>
                  <h2 id="dd-modal-title" className="font-display text-lg text-forest-950 leading-tight">
                    {demand.name}
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="h-8 w-8 flex items-center justify-center rounded-full text-ink-faint hover:text-forest-900 hover:bg-forest-800/[0.08] transition-colors"
                aria-label="Close"
              >
                <X size={17} strokeWidth={2} />
              </button>
            </div>

            <div className="px-6 py-5 flex flex-col gap-5 max-h-[75vh] overflow-y-auto">
              {demand.description && (
                <p className="text-sm text-ink-soft leading-relaxed">{demand.description}</p>
              )}

              {/* Consumer demand summary */}
              <div className="rounded-xl bg-forest-800/[0.05] p-4 flex flex-col gap-3">
                <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-faint">
                  Consumer demand
                </p>
                <div className="flex items-baseline justify-between font-mono text-xs text-ink-faint">
                  <span>
                    Filled{" "}
                    <strong className="text-forest-800 font-semibold">
                      {demand.matched} {demand.unit}
                    </strong>
                  </span>
                  <span>{demand.totalDemand} {demand.unit} total</span>
                </div>
                <ProgressBar
                  value={percent}
                  color={progressColor}
                  label={`${demand.name} fill progress`}
                />
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-faint font-mono">
                  <span className="font-semibold text-amber-600">
                    {remaining} {demand.unit} still needed
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={11} strokeWidth={2} /> {demand.consumers} consumers
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin size={11} strokeWidth={2} /> {demand.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={11} strokeWidth={2} /> By {formatDate(demand.targetDate)}
                  </span>
                </div>
              </div>

              {/* Price */}
              {(demand.directPrice || demand.marketPrice) && (
                <div className="flex items-center gap-4 rounded-xl border border-forest-800/10 bg-canvas-raised px-4 py-3">
                  <div className="flex-1">
                    <p className="text-xs text-ink-faint font-mono">Direct price</p>
                    <p className="font-display text-xl text-forest-950">
                      ₹{demand.directPrice}
                      <span className="text-sm text-ink-faint font-sans font-normal">/{demand.unit}</span>
                    </p>
                  </div>
                  {demand.marketPrice && (
                    <div className="text-right">
                      <p className="text-xs text-ink-faint font-mono">Market price</p>
                      <p className="text-sm text-ink-faint line-through">₹{demand.marketPrice}/{demand.unit}</p>
                    </div>
                  )}
                </div>
              )}

              {/* ── Match breakdown (from backend engine) ── */}
              <MatchSection matchData={matchData} />

              {/* ── Demand Intelligence (AI layer) ── */}
              <DemandIntelligence demandId={demand.id ?? demand._id} role="FARMER" />

              {/* Supply input */}
              <div className="border-t border-forest-800/[0.08] pt-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-forest-600 mb-3">
                  Your available supply
                </p>

                {supplyForDemand && (
                  <div className="mb-3 rounded-xl bg-forest-800/[0.05] px-4 py-3 font-mono text-xs text-ink-faint flex flex-wrap gap-x-4 gap-y-1">
                    <span>
                      Declared:{" "}
                      <strong className="text-forest-900">{supplyForDemand.availableQty} {demand.unit}</strong>
                    </span>
                    <span>
                      Committed:{" "}
                      <strong className="text-amber-700">{supplyForDemand.committedQty} {demand.unit}</strong>
                    </span>
                    <span>
                      Free to commit:{" "}
                      <strong className="text-forest-700">{maxSupply} {demand.unit}</strong>
                    </span>
                  </div>
                )}

                <form onSubmit={handleProceed} noValidate className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="dd-qty" className="text-sm font-medium text-ink-soft">
                      How much can you supply?
                      <span className="text-amber-600 ml-0.5" aria-hidden="true">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        ref={inputRef}
                        id="dd-qty"
                        type="number"
                        min="0.5"
                        step="0.5"
                        placeholder={defaultQty || `e.g. ${Math.round(remaining * 0.5)}`}
                        value={qty}
                        onChange={(e) => { setQty(e.target.value); if (error) setError(""); }}
                        className={INPUT_CLS}
                        aria-describedby={error ? "dd-qty-err" : "dd-qty-hint"}
                        aria-invalid={!!error}
                      />
                      <span className="flex items-center shrink-0 font-mono text-sm text-ink-faint px-3 rounded-xl border border-forest-800/12 bg-canvas">
                        {demand.unit}
                      </span>
                    </div>
                    {error ? (
                      <p id="dd-qty-err" className="text-xs text-amber-700" role="alert">{error}</p>
                    ) : qtyNum > 0 ? (
                      <p id="dd-qty-hint" className="text-xs text-forest-600 font-mono">
                        This covers <strong>{fulfillPct}%</strong> of the remaining demand
                        ({qtyNum} of {remaining} {demand.unit}).
                      </p>
                    ) : (
                      <p id="dd-qty-hint" className="text-xs text-ink-faint">
                        {remaining} {demand.unit} still open in this pool.
                        {maxSupply !== null && ` You can commit up to ${maxSupply} ${demand.unit}.`}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <Button type="submit" variant="primary" size="md" className="flex-1">
                      Review commitment
                    </Button>
                    <Button type="button" variant="outline" size="md" className="flex-1" onClick={onClose}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
