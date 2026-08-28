import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, TrendingUp, CheckCircle2, AlertCircle, Info, Loader2, Sprout } from "lucide-react";
import Button from "./Button";
import DemandIntelligence from "./DemandIntelligence";
import { fetchFulfillmentRecommendation } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function FulfillmentOutlookModal({ open, demand, onClose }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [outlook, setOutlook] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open && demand?._id) {
      if (!user) {
        setError("Not authenticated. Please log in.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      fetchFulfillmentRecommendation(demand._id)
        .then((data) => setOutlook(data))
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [open, demand, user]);

  if (!open || !demand) return null;

  const totalDemand = demand.totalDemand ?? demand.quantity ?? 0;
  const matched = demand.matched ?? demand.fulfilledQuantity ?? 0;
  const remaining = Math.max(totalDemand - matched, 0);

  const potSupply = outlook?.totalRecommendedQuantity ?? 0;
  const potPct = outlook?.fulfillmentPercentage ?? 0;
  const status = outlook?.fulfillmentStatus;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-forest-950/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="outlook-modal-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full sm:max-w-md bg-canvas-raised rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-reveal">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-forest-800/10">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-forest-800/[0.08] flex items-center justify-center text-forest-700">
              <TrendingUp size={17} strokeWidth={2} />
            </div>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-forest-600">
                Consumer Outlook
              </p>
              <h2 id="outlook-modal-title" className="font-display text-lg text-forest-950 leading-tight">
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

        <div className="px-6 py-5 flex flex-col gap-4 max-h-[75vh] overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center gap-3 py-12 text-ink-faint">
              <Loader2 size={18} strokeWidth={2} className="animate-spin" />
              <span className="text-sm font-mono">Analyzing potential farmer supply…</span>
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-amber-50 p-4 text-xs text-amber-800 flex flex-col gap-2">
              <div className="flex items-start gap-2">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>Could not load fulfillment outlook: {error}</span>
              </div>
              {error.includes("Not authenticated") && (
                <Button 
                  variant="primary" 
                  size="md" 
                  onClick={() => navigate("/login")}
                  className="w-full"
                >
                  Log in to continue
                </Button>
              )}
            </div>
          )}

          {!loading && !error && outlook && (
            <>
              {/* Summary cards grid */}
              <div className="grid grid-cols-2 gap-2.5 font-mono text-xs">
                <div className="rounded-xl bg-forest-800/[0.05] p-3">
                  <p className="text-[11px] text-ink-faint uppercase">Your demand</p>
                  <p className="text-forest-950 font-semibold text-sm mt-0.5">
                    {totalDemand} {demand.unit}
                  </p>
                </div>
                <div className="rounded-xl bg-forest-800/[0.05] p-3">
                  <p className="text-[11px] text-ink-faint uppercase">Currently matched</p>
                  <p className="text-forest-700 font-semibold text-sm mt-0.5">
                    {matched} {demand.unit}
                  </p>
                </div>
                <div className="rounded-xl bg-forest-800/[0.05] p-3">
                  <p className="text-[11px] text-ink-faint uppercase">Remaining needed</p>
                  <p className="text-amber-700 font-semibold text-sm mt-0.5">
                    {remaining} {demand.unit}
                  </p>
                </div>
                <div className="rounded-xl bg-forest-800/[0.05] p-3">
                  <p className="text-[11px] text-ink-faint uppercase">Potential supply found</p>
                  <p className="text-forest-900 font-semibold text-sm mt-0.5">
                    {potSupply} {demand.unit}
                  </p>
                </div>
              </div>

              {/* Status banner */}
              <div
                className={`rounded-xl p-4 flex items-start gap-3 text-xs ${
                  status === "FULLY_FULFILLED"
                    ? "bg-forest-800/[0.08] text-forest-900 border border-forest-800/15"
                    : status === "PARTIALLY_FULFILLED"
                    ? "bg-amber-100/70 text-amber-900 border border-amber-200"
                    : "bg-forest-800/[0.05] text-ink-soft border border-forest-800/10"
                }`}
              >
                {status === "FULLY_FULFILLED" ? (
                  <CheckCircle2 size={16} className="text-forest-700 shrink-0 mt-0.5" />
                ) : (
                  <Info size={16} className="text-amber-700 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-semibold text-sm font-display mb-0.5">
                    Potential fulfillment: {potPct}%
                  </p>
                  <p className="leading-relaxed">
                    {status === "FULLY_FULFILLED" &&
                      `Potential supply found! Farmers in your area have enough capacity to cover 100% of the remaining ${remaining} ${demand.unit}.`}
                    {status === "PARTIALLY_FULFILLED" &&
                      `Potential supply found for ${potSupply} ${demand.unit} (${Math.round((potSupply/remaining)*100)}% of remaining demand).`}
                    {status === "NOT_FULFILLABLE" &&
                      `No active farmer supply matches this demand currently. New farmer declarations are added daily.`}
                  </p>
                </div>
              </div>

              {/* Matched farmer breakdown if any */}
              {outlook.matches && outlook.matches.length > 0 && (
                <div className="border-t border-forest-800/[0.08] pt-3 flex flex-col gap-2">
                  <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-faint">
                    Available farmer supply breakdown
                  </p>
                  <ul className="flex flex-col gap-2 font-mono text-xs">
                    {outlook.matches.map((m, i) => (
                      <li
                        key={i}
                        className="flex items-center justify-between px-3 py-2 rounded-lg bg-canvas border border-forest-800/[0.06]"
                      >
                        <span className="flex items-center gap-2 text-forest-950 font-medium">
                          <Sprout size={13} className="text-forest-600" />
                          {m.farmerName}
                        </span>
                        <span className="text-ink-soft">
                          <strong className="text-forest-800">{m.allocatedQuantity} {demand.unit}</strong> allocated ({m.score}% match)
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="text-[11px] text-ink-faint italic border-t border-forest-800/[0.08] pt-3">
                * Note: Potential fulfillment is calculated dynamically from active farmer supply declarations in your region. Final fulfillment is confirmed when farmers commit to the pool.
              </p>

              {/* ── AI Demand Intelligence ── */}
              <DemandIntelligence demandId={demand._id || demand.id} role="CONSUMER" />
            </>
          )}

          <Button variant="outline" size="md" onClick={onClose} className="w-full mt-2">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

