import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Loader2, AlertCircle, CheckCircle2, ShieldAlert, Clock, ArrowRight } from "lucide-react";
import { fetchDemandIntelligence } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import Button from "./Button";

const OUTLOOK_STYLES = {
  LOW_RISK: {
    label: "Low Risk",
    badge: "text-forest-700 bg-forest-800/[0.08] border-forest-800/15",
    icon: CheckCircle2,
  },
  MODERATE_RISK: {
    label: "Moderate Risk",
    badge: "text-amber-700 bg-amber-100 border-amber-200",
    icon: AlertCircle,
  },
  HIGH_RISK: {
    label: "High Risk",
    badge: "text-rose-700 bg-rose-100 border-rose-200",
    icon: ShieldAlert,
  },
};

const URGENCY_STYLES = {
  LOW: "text-forest-700 bg-forest-800/[0.06]",
  MEDIUM: "text-amber-700 bg-amber-50",
  HIGH: "text-rose-700 bg-rose-50 font-bold",
};

export default function DemandIntelligence({ demandId, role = "CONSUMER" }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleAnalyze() {
    if (!demandId) return;
    if (!user) {
      setError("Not authenticated. Please log in.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetchDemandIntelligence(demandId);
      setData(res);
    } catch (err) {
      setError(err.message || "Demand intelligence is temporarily unavailable.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-forest-800/12 bg-canvas p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-lg bg-forest-800/[0.08] flex items-center justify-center text-forest-700">
            <Sparkles size={13} strokeWidth={2} />
          </div>
          <span className="font-mono text-xs uppercase tracking-[0.1em] text-forest-900 font-semibold">
            Demand Intelligence
          </span>
        </div>
        <span className="text-[10px] font-mono text-ink-faint bg-forest-800/[0.04] rounded-md px-2 py-0.5">
          AI Analysis
        </span>
      </div>

      {/* Trigger button when not yet analyzed */}
      {!data && !loading && !error && (
        <div className="flex flex-col items-start gap-2 pt-1">
          <p className="text-xs text-ink-soft leading-relaxed">
            {role === "FARMER"
              ? "Analyze market demand signals, fulfillment risk, and suggested actions for this crop."
              : "Get AI-assisted demand outlook and risk assessment based on live supply data."}
          </p>
          <button
            type="button"
            onClick={handleAnalyze}
            className="inline-flex items-center gap-2 rounded-xl bg-forest-800 text-canvas px-3.5 py-2 text-xs font-medium font-mono hover:bg-forest-900 transition-colors shadow-sm"
          >
            <Sparkles size={13} />
            Analyze Demand
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center gap-3 py-3 px-2 text-ink-faint">
          <Loader2 size={16} className="animate-spin text-forest-700" />
          <span className="text-xs font-mono">Analyzing demand & supply signals…</span>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="rounded-xl bg-amber-50/80 border border-amber-200/60 p-3 flex flex-col gap-2 text-xs">
          <div className="flex items-center gap-2 text-amber-800 font-medium">
            <AlertCircle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
          {error.includes("Not authenticated") ? (
            <Button 
              variant="primary" 
              size="md" 
              onClick={() => navigate("/login")}
              className="w-full"
            >
              Log in to continue
            </Button>
          ) : (
            <button
              type="button"
              onClick={handleAnalyze}
              className="self-start text-[11px] font-mono text-amber-900 underline underline-offset-2 hover:text-amber-700"
            >
              Try again
            </button>
          )}
        </div>
      )}

      {/* Analysis results */}
      {data && !loading && (
        <div className="flex flex-col gap-3 pt-1">
          {/* Outlook & Urgency pills */}
          <div className="flex items-center justify-between gap-2">
            {(() => {
              const style = OUTLOOK_STYLES[data.outlook] ?? OUTLOOK_STYLES.MODERATE_RISK;
              const Icon = style.icon;
              return (
                <span
                  className={`inline-flex items-center gap-1.5 font-mono text-xs font-semibold rounded-full border px-2.5 py-1 ${style.badge}`}
                >
                  <Icon size={12} strokeWidth={2.2} />
                  {style.label}
                </span>
              );
            })()}

            {data.urgency && (
              <span
                className={`inline-flex items-center gap-1 font-mono text-[11px] rounded-full px-2.5 py-0.5 ${
                  URGENCY_STYLES[data.urgency] ?? URGENCY_STYLES.MEDIUM
                }`}
              >
                <Clock size={11} />
                Urgency: {data.urgency}
              </span>
            )}
          </div>

          {/* Summary */}
          {data.summary && (
            <p className="text-xs text-forest-950 font-medium leading-relaxed bg-forest-800/[0.04] p-2.5 rounded-xl border border-forest-800/[0.06]">
              "{data.summary}"
            </p>
          )}

          {/* Key factors */}
          {data.keyFactors && data.keyFactors.length > 0 && (
            <div className="flex flex-col gap-1">
              <p className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">Key factors</p>
              <ul className="flex flex-col gap-1">
                {data.keyFactors.map((factor, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-ink-soft">
                    <span className="text-forest-600 font-bold mt-0.5">•</span>
                    <span>{factor}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendation */}
          {data.recommendation && (
            <div className="rounded-xl bg-forest-800/[0.06] p-3 flex flex-col gap-1">
              <p className="font-mono text-[10px] uppercase tracking-wider text-forest-700 font-semibold flex items-center gap-1">
                <ArrowRight size={10} />
                Recommendation
              </p>
              <p className="text-xs text-forest-950 leading-relaxed font-sans">
                {data.recommendation}
              </p>
            </div>
          )}

          {/* Re-analyze link */}
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={handleAnalyze}
              className="text-[11px] font-mono text-ink-faint hover:text-forest-800 transition-colors underline underline-offset-2"
            >
              Refresh analysis
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

