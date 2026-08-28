import { useState, useEffect, useMemo } from "react";
import {
  Sprout,
  Plus,
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
  Layers,
  PackageCheck,
  TrendingUp,
  Inbox,
  AlertCircle,
  Loader2,
} from "lucide-react";

import Button from "../components/ui/Button";
import DashboardStat from "../components/ui/DashboardStat";
import EmptyState from "../components/ui/EmptyState";
import DemandOpportunityCard from "../components/ui/DemandOpportunityCard";
import DemandDetailModal from "../components/ui/DemandDetailModal";
import AddSupplyModal from "../components/ui/AddSupplyModal";
import MySupplyRow from "../components/ui/MySupplyRow";
import CommittedDemandRow from "../components/ui/CommittedDemandRow";

import {
  fetchMyOpportunities,
  fetchSupplies,
  fetchCommitments,
  createSupply as apiCreateSupply,
  createCommitment as apiCreateCommitment,
} from "../utils/api";

import { useAuth } from "../context/AuthContext";
import {
  FARMER_CATEGORIES,
  FARMER_LOCATIONS,
} from "../data/farmerDemand";

// ─── Normalisers ─────────────────────────────────────────────────────────────

// Maps a backend /my-opportunities item → DemandOpportunityCard shape
function normaliseOpportunity(item) {
  const doc    = item.demand;
  const statusMap = {
    OPEN: "open",
    PARTIALLY_FULFILLED: "filling",
    FULFILLED: "matched",
  };
  
  // Generate default prices if not available (for existing data without prices)
  const defaultPrices = {
    "Vine Tomatoes": { direct: 34, market: 52 },
    "Mixed Leafy Greens": { direct: 28, market: 45 },
    "Yelakki Bananas": { direct: 42, market: 60 },
    "Toor Dal": { direct: 110, market: 145 },
    "Fresh Coriander": { direct: 8, market: 15 },
    "Country Eggs": { direct: 185, market: 240 },
    "Raw Mango": { direct: 55, market: 80 },
    "Sona Masoori Rice": { direct: 58, market: 75 },
  };
  
  const priceDefaults = defaultPrices[doc.productName] || { direct: 50, market: 70 };
  
  return {
    id:          doc.id ?? doc._id,
    _id:         doc.id ?? doc._id,
    name:        doc.productName,
    category:    doc.category,
    unit:        doc.unit,
    totalDemand: doc.quantity,
    matched:     doc.fulfilledQuantity,
    remaining:   doc.remaining ?? Math.max(doc.quantity - doc.fulfilledQuantity, 0),
    consumers:   doc.consumerCount ?? 1,
    targetDate:  doc.deliveryDate
      ? new Date(doc.deliveryDate).toISOString().slice(0, 10)
      : null,
    location:    doc.location,
    directPrice: doc.directPrice ?? priceDefaults.direct,
    marketPrice: doc.marketPrice ?? priceDefaults.market,
    status:      statusMap[doc.status] ?? "open",
    distanceKm:  item.distanceKm ?? null,
    description: doc.note || "",
    // matching engine data
    matchScore:       item.matchScore ?? 0,
    scoreBreakdown:   item.scoreBreakdown ?? null,
    reasons:          item.reasons ?? [],
    warnings:         item.warnings ?? [],
    bestSupplyId:     item.bestSupplyId ?? null,
    suggestedCommitment: item.suggestedCommitment ?? 0,
    hasMatchingSupply:   item.hasMatchingSupply ?? false,
  };
}

// Maps a backend Supply document → MySupplyRow shape
function normaliseSupply(doc) {
  const statusMap = {
    AVAILABLE: "available",
    PARTIALLY_COMMITTED: "partial",
    FULLY_COMMITTED: "committed",
  };
  return {
    id: doc._id,
    _id: doc._id,
    name: doc.productName,
    category: doc.category,
    availableQty: doc.quantity,
    committedQty: doc.committedQuantity ?? 0,
    unit: doc.unit,
    availableFrom: doc.availableFrom
      ? new Date(doc.availableFrom).toISOString().slice(0, 10)
      : null,
    availableUntil: doc.availableUntil
      ? new Date(doc.availableUntil).toISOString().slice(0, 10)
      : null,
    location: doc.location,
    notes: doc.note || "",
    status: statusMap[doc.status] ?? "available",
  };
}

// Maps a backend Commitment document (populated) → CommittedDemandRow shape
function normaliseCommitment(doc) {
  const statusMap = {
    PENDING: "pending",
    PARTIALLY_FULFILLED: "partial",
    FULFILLED: "fulfilled",
  };
  const demand = doc.demand ?? {};
  return {
    id: doc._id,
    _id: doc._id,
    demandId: demand._id ?? doc.demand,
    name: demand.productName ?? "—",
    category: demand.category ?? "—",
    unit: demand.unit ?? "kg",
    committedQty: doc.quantity,
    totalDemand: demand.quantity ?? 0,
    location: demand.location ?? "—",
    requiredDate: demand.deliveryDate
      ? new Date(demand.deliveryDate).toISOString().slice(0, 10)
      : null,
    status: statusMap[doc.status] ?? "pending",
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function chipClass(active) {
  return [
    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium font-mono transition-colors cursor-pointer select-none",
    active
      ? "border-forest-800 bg-forest-800 text-canvas"
      : "border-forest-800/15 text-ink-soft hover:bg-forest-800/[0.06]",
  ].join(" ");
}

const SORT_OPTIONS = [
  { value: "match", label: "Best match" },
  { value: "remaining", label: "Most remaining" },
  { value: "date", label: "Earliest deadline" },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function FarmerDashboard() {
  // ── auth ──
  const { user } = useAuth();
  // ── server state ──
  const [opportunities, setOpportunities] = useState([]);
  const [mySupply, setMySupply] = useState([]);
  const [committedDemands, setCommittedDemands] = useState([]);

  const [loadingOpps, setLoadingOpps] = useState(true);
  const [loadingSupply, setLoadingSupply] = useState(true);
  const [loadingCommits, setLoadingCommits] = useState(true);
  const [oppsError, setOppsError] = useState(null);
  const [supplyError, setSupplyError] = useState(null);

  // ── modals ──
  const [detailTarget, setDetailTarget] = useState(null);
  const [addSupplyOpen, setAddSupplyOpen] = useState(false);

  // ── tabs ──
  const [tab, setTab] = useState("opportunities");

  // ── search & filters ──
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeLocation, setActiveLocation] = useState("All");
  const [sortBy, setSortBy] = useState("match");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // ─── Data loaders ────────────────────────────────────────────────────────

  async function loadOpportunities() {
    try {
      setLoadingOpps(true);
      setOppsError(null);
      // Use the matching engine endpoint — returns opportunities pre-scored
      const data = await fetchMyOpportunities();
      setOpportunities(data.map(normaliseOpportunity));
    } catch (err) {
      setOppsError(err.message);
    } finally {
      setLoadingOpps(false);
    }
  }

  async function loadSupply() {
    try {
      setLoadingSupply(true);
      setSupplyError(null);
      // No farmerName filter needed — backend scopes to req.user automatically
      const data = await fetchSupplies();
      setMySupply(data.map(normaliseSupply));
    } catch (err) {
      setSupplyError(err.message);
    } finally {
      setLoadingSupply(false);
    }
  }

  async function loadCommitments() {
    try {
      setLoadingCommits(true);
      const data = await fetchCommitments();
      setCommittedDemands(data.map(normaliseCommitment));
    } catch {
      // non-critical — silently keep empty
    } finally {
      setLoadingCommits(false);
    }
  }

  useEffect(() => {
    loadOpportunities();
    loadSupply();
    loadCommitments();
  }, []);

  // ─── Pre-compute match scores ────────────────────────────────────────────
  // Scores now come from the backend matching engine — no local calculation needed.
  const withScores = opportunities; // alias kept so filtered useMemo below stays unchanged

  // ─── Derived stats ───────────────────────────────────────────────────────
  const openOpportunities = withScores.filter(
    (o) => o.status === "open" || o.status === "filling"
  ).length;
  const totalAvailableQty = mySupply.reduce(
    (acc, s) => acc + (s.availableQty - s.committedQty),
    0
  );
  const totalCommittedQty = mySupply.reduce((acc, s) => acc + s.committedQty, 0);
  const fulfilledCount = committedDemands.filter((c) => c.status === "fulfilled").length;

  // ─── Filtered + sorted opportunities ────────────────────────────────────
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = withScores.filter((o) => {
      const matchesQuery =
        !q ||
        o.name.toLowerCase().includes(q) ||
        o.category.toLowerCase().includes(q);
      const matchesCategory =
        activeCategory === "All" || o.category === activeCategory;
      const matchesLocation =
        activeLocation === "All" || o.location === activeLocation;
      return matchesQuery && matchesCategory && matchesLocation;
    });

    if (sortBy === "match") list = [...list].sort((a, b) => b.matchScore - a.matchScore);
    else if (sortBy === "remaining") list = [...list].sort((a, b) => b.remaining - a.remaining);
    else if (sortBy === "date")
      list = [...list].sort((a, b) => new Date(a.targetDate) - new Date(b.targetDate));

    return list;
  }, [withScores, query, activeCategory, activeLocation, sortBy]);

  const hasActiveFilters = activeCategory !== "All" || activeLocation !== "All";

  function clearFilters() {
    setActiveCategory("All");
    setActiveLocation("All");
    setQuery("");
  }

  // ─── Handlers ────────────────────────────────────────────────────────────

  async function handleAddSupply(formData) {
    try {
      const body = {
        // farmerName and farmer ObjectId come from req.user on the backend
        productName: formData.name,
        category: formData.category,
        quantity: formData.availableQty,
        unit: formData.unit,
        location: formData.location || user?.location,
        availableFrom: formData.availableFrom || undefined,
        availableUntil: formData.availableUntil || undefined,
        note: formData.notes || "",
      };
      const created = await apiCreateSupply(body);
      setMySupply((prev) => [normaliseSupply(created), ...prev]);
    } catch (err) {
      alert(`Could not add supply: ${err.message}`);
    }
  }

  async function handleCommit(demand, qty) {
    // Find matching supply to use as the supplyId
    const matchingSupply = mySupply.find(
      (s) =>
        s.name.toLowerCase() === demand.name.toLowerCase() ||
        s.category === demand.category
    );

    if (!matchingSupply) {
      alert(
        "No matching supply found in your declared inventory. Add your supply first, then commit."
      );
      setDetailTarget(null);
      setAddSupplyOpen(true);
      return;
    }

    try {
      const commitDoc = await apiCreateCommitment({
        demandId: demand._id,
        supplyId: matchingSupply._id,
        quantity: qty,
      });

      // Update local opportunity state from the populated demand in the response
      if (commitDoc.demand) {
        setOpportunities((prev) =>
          prev.map((o) =>
            o._id === demand._id ? normaliseOpportunity(commitDoc.demand) : o
          )
        );
      }

      // Update local supply state from the populated supply in the response
      if (commitDoc.supply) {
        setMySupply((prev) =>
          prev.map((s) =>
            s._id === matchingSupply._id ? normaliseSupply(commitDoc.supply) : s
          )
        );
      }

      // Add commitment to committed list
      setCommittedDemands((prev) => [normaliseCommitment(commitDoc), ...prev]);

      setDetailTarget(null);
    } catch (err) {
      alert(`Could not commit supply: ${err.message}`);
      setDetailTarget(null);
    }
  }

  // Supply best-matching the currently open detail modal
  const supplyForDetail = useMemo(() => {
    if (!detailTarget) return null;
    // Prefer bestSupplyId from the matching engine if available
    if (detailTarget.bestSupplyId) {
      const byId = mySupply.find((s) => s._id === detailTarget.bestSupplyId);
      if (byId) return byId;
    }
    return (
      mySupply.find(
        (s) =>
          s.name.toLowerCase() === detailTarget.name.toLowerCase() ||
          s.category === detailTarget.category
      ) ?? null
    );
  }, [detailTarget, mySupply]);

  // matchData for the detail modal — extracted from the opportunity itself
  const matchDataForDetail = useMemo(() => {
    if (!detailTarget) return null;
    if (!detailTarget.scoreBreakdown) return null;
    return {
      score:               detailTarget.matchScore,
      scoreBreakdown:      detailTarget.scoreBreakdown,
      reasons:             detailTarget.reasons,
      warnings:            detailTarget.warnings,
      suggestedCommitment: detailTarget.suggestedCommitment,
      distanceKm:          detailTarget.distanceKm,
    };
  }, [detailTarget]);

  // ─── Render ──────────────────────────────────────────────────────────────

  const loadingAny = loadingOpps || loadingSupply || loadingCommits;

  return (
    <>
      <div className="px-5 sm:px-8 py-10 sm:py-14">
        <div className="mx-auto max-w-6xl flex flex-col gap-8">

          {/* ── HEADER ── */}
          <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <span className="font-mono text-xs uppercase tracking-[0.12em] text-forest-600">
                Farmer dashboard
              </span>
              <h1 className="font-display text-3xl sm:text-4xl text-forest-950 mt-1.5">
                Good morning, {user?.name?.split(" ")[0] ?? "there"}
              </h1>
              <p className="flex items-center gap-1.5 text-sm text-ink-faint font-mono mt-1.5">
                <Sprout size={13} strokeWidth={2} aria-hidden="true" />
                {user?.location ?? "—"}
              </p>
            </div>
            <Button
              variant="amber"
              size="md"
              onClick={() => setAddSupplyOpen(true)}
              className="sm:w-auto w-full shrink-0"
            >
              <Plus size={16} strokeWidth={2.2} />
              Add Supply
            </Button>
          </header>

          {/* ── STAT TILES ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <DashboardStat
              icon={TrendingUp}
              label="Open opportunities"
              value={loadingOpps ? "—" : openOpportunities}
              note="demands near you"
            />
            <DashboardStat
              icon={Layers}
              label="Supply available"
              value={loadingSupply ? "—" : `${totalAvailableQty} kg`}
              note="uncommitted stock"
            />
            <DashboardStat
              icon={PackageCheck}
              label="Supply committed"
              value={loadingSupply ? "—" : `${totalCommittedQty} kg`}
              note="toward active demands"
            />
            <DashboardStat
              icon={Inbox}
              label="Demands fulfilled"
              value={loadingCommits ? "—" : fulfilledCount}
              note="completed this season"
            />
          </div>

          {/* ── TABS ── */}
          <div className="flex items-center gap-1 border-b border-forest-800/10 -mb-4">
            {[
              { id: "opportunities", label: "Demand Opportunities" },
              {
                id: "supply",
                label: `My Supply${mySupply.length > 0 ? ` (${mySupply.length})` : ""}`,
              },
              {
                id: "committed",
                label: `Committed${committedDemands.length > 0 ? ` (${committedDemands.length})` : ""}`,
              },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={[
                  "px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors -mb-px border-b-2",
                  tab === t.id
                    ? "border-forest-800 text-forest-900 bg-forest-800/[0.04]"
                    : "border-transparent text-ink-faint hover:text-forest-800",
                ].join(" ")}
                aria-current={tab === t.id ? "page" : undefined}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* ── DEMAND OPPORTUNITIES TAB ── */}
          {tab === "opportunities" && (
            <section aria-label="Demand opportunities">
              <div className="flex flex-col gap-3 mb-6">
                <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                  {/* Search */}
                  <div className="relative flex-1 min-w-0">
                    <Search size={16} strokeWidth={2} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" aria-hidden="true" />
                    <input
                      type="search"
                      placeholder="Search by product or category…"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="w-full rounded-full border border-forest-800/12 bg-canvas-raised pl-10 pr-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus-visible:outline-2 focus-visible:outline-forest-600"
                      aria-label="Search demand opportunities"
                    />
                    {query && (
                      <button type="button" onClick={() => setQuery("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-faint hover:text-forest-900 transition-colors" aria-label="Clear search">
                        <X size={14} strokeWidth={2} />
                      </button>
                    )}
                  </div>

                  {/* Sort */}
                  <div className="relative shrink-0">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="appearance-none rounded-full border border-forest-800/15 bg-canvas-raised pl-4 pr-8 py-2.5 text-sm font-medium text-ink-soft focus-visible:outline-2 focus-visible:outline-forest-600 cursor-pointer"
                      aria-label="Sort opportunities"
                    >
                      {SORT_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <ChevronDown size={13} strokeWidth={2} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint" aria-hidden="true" />
                  </div>

                  {/* Filter toggle */}
                  <button
                    type="button"
                    onClick={() => setFiltersOpen((v) => !v)}
                    className={[
                      "flex items-center gap-1.5 rounded-full border px-4 py-2.5 text-sm font-medium transition-colors shrink-0",
                      filtersOpen || hasActiveFilters
                        ? "border-forest-800 bg-forest-800 text-canvas"
                        : "border-forest-800/15 text-ink-soft hover:bg-forest-800/[0.06]",
                    ].join(" ")}
                    aria-expanded={filtersOpen}
                    aria-controls="farmer-filter-panel"
                  >
                    <SlidersHorizontal size={14} strokeWidth={2} aria-hidden="true" />
                    Filters
                    {hasActiveFilters && (
                      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-forest-950 text-[10px] font-bold">
                        {[activeCategory !== "All", activeLocation !== "All"].filter(Boolean).length}
                      </span>
                    )}
                    <ChevronDown size={13} strokeWidth={2} className={`transition-transform ${filtersOpen ? "rotate-180" : ""}`} aria-hidden="true" />
                  </button>
                </div>

                {filtersOpen && (
                  <div id="farmer-filter-panel" className="rounded-2xl border border-forest-800/10 bg-canvas-raised p-4 flex flex-col gap-4 animate-reveal">
                    <div>
                      <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-faint mb-2">Category</p>
                      <div className="flex flex-wrap gap-2">
                        {FARMER_CATEGORIES.map((cat) => (
                          <button key={cat} type="button" onClick={() => setActiveCategory(cat)} className={chipClass(activeCategory === cat)}>{cat}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-faint mb-2">Location</p>
                      <div className="flex flex-wrap gap-2">
                        {FARMER_LOCATIONS.map((loc) => (
                          <button key={loc} type="button" onClick={() => setActiveLocation(loc)} className={chipClass(activeLocation === loc)}>{loc}</button>
                        ))}
                      </div>
                    </div>
                    {hasActiveFilters && (
                      <button type="button" onClick={clearFilters} className="self-start text-xs font-medium text-amber-700 hover:text-amber-600 transition-colors underline underline-offset-2">Clear all filters</button>
                    )}
                  </div>
                )}

                {!filtersOpen && hasActiveFilters && (
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-xs text-ink-faint font-mono">Filtered by:</span>
                    {activeCategory !== "All" && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-forest-700 bg-forest-800/[0.08] rounded-full px-3 py-1">
                        {activeCategory}
                        <button type="button" onClick={() => setActiveCategory("All")} aria-label={`Remove ${activeCategory} filter`}><X size={11} strokeWidth={2.5} /></button>
                      </span>
                    )}
                    {activeLocation !== "All" && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-forest-700 bg-forest-800/[0.08] rounded-full px-3 py-1">
                        {activeLocation}
                        <button type="button" onClick={() => setActiveLocation("All")} aria-label={`Remove ${activeLocation} filter`}><X size={11} strokeWidth={2.5} /></button>
                      </span>
                    )}
                    <button type="button" onClick={clearFilters} className="text-xs text-ink-faint hover:text-amber-700 transition-colors underline underline-offset-2">Clear all</button>
                  </div>
                )}

                {(query || hasActiveFilters) && !loadingOpps && filtered.length > 0 && (
                  <p className="text-xs text-ink-faint font-mono">
                    {filtered.length} opportunit{filtered.length !== 1 ? "ies" : "y"} found
                  </p>
                )}
              </div>

              {/* Loading */}
              {loadingOpps && (
                <div className="flex items-center justify-center gap-3 py-20 text-ink-faint">
                  <Loader2 size={20} strokeWidth={2} className="animate-spin" aria-hidden="true" />
                  <span className="text-sm font-mono">Loading demand opportunities…</span>
                </div>
              )}

              {/* Error */}
              {!loadingOpps && oppsError && (
                <div className="flex flex-col items-center gap-4 py-16 text-center">
                  <div className="h-12 w-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700">
                    <AlertCircle size={22} strokeWidth={1.8} />
                  </div>
                  <div>
                    <p className="font-display text-lg text-forest-950">Could not load opportunities</p>
                    <p className="text-sm text-ink-faint mt-1">{oppsError}</p>
                  </div>
                  <Button variant="outline" size="md" onClick={loadOpportunities}>Try again</Button>
                </div>
              )}

              {/* Grid or empty */}
              {!loadingOpps && !oppsError && filtered.length === 0 && (query || hasActiveFilters) && (
                <EmptyState icon={Search} title="No opportunities match your search" description="Try adjusting your filters or searching for a different product." actionLabel="Clear filters" onAction={clearFilters} />
              )}
              {!loadingOpps && !oppsError && opportunities.length === 0 && !query && !hasActiveFilters && (
                <EmptyState icon={TrendingUp} title="No demand opportunities yet" description="Consumer demands matching your crop categories will appear here once posted." />
              )}
              {!loadingOpps && !oppsError && filtered.length > 0 && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filtered.map((opp) => (
                    <DemandOpportunityCard
                      key={opp.id}
                      opportunity={opp}
                      matchScore={opp.matchScore}
                      onView={setDetailTarget}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ── MY SUPPLY TAB ── */}
          {tab === "supply" && (
            <section aria-label="My supply">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-ink-soft">
                  {loadingSupply
                    ? "Loading…"
                    : mySupply.length > 0
                    ? `${mySupply.length} item${mySupply.length !== 1 ? "s" : ""} declared`
                    : "Nothing declared yet"}
                </p>
                <Button variant="outline" size="md" className="!px-4 !py-2 text-sm" onClick={() => setAddSupplyOpen(true)}>
                  <Plus size={14} strokeWidth={2.2} />
                  Add supply
                </Button>
              </div>

              {loadingSupply && (
                <div className="flex items-center justify-center gap-3 py-16 text-ink-faint">
                  <Loader2 size={18} strokeWidth={2} className="animate-spin" aria-hidden="true" />
                  <span className="text-sm font-mono">Loading supply…</span>
                </div>
              )}

              {!loadingSupply && supplyError && (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <AlertCircle size={22} className="text-amber-600" strokeWidth={1.8} />
                  <p className="text-sm text-ink-faint">{supplyError}</p>
                  <Button variant="outline" size="md" onClick={loadSupply}>Retry</Button>
                </div>
              )}

              {!loadingSupply && !supplyError && mySupply.length === 0 && (
                <EmptyState icon={Layers} title="No supply declared yet" description="Tell us what you have available so we can match your produce to active consumer demands." actionLabel="Declare your first supply" onAction={() => setAddSupplyOpen(true)} />
              )}

              {!loadingSupply && !supplyError && mySupply.length > 0 && (
                <ul className="flex flex-col gap-2.5" aria-label="My supply list">
                  {mySupply.map((s) => (
                    <MySupplyRow key={s.id} supply={s} />
                  ))}
                </ul>
              )}
            </section>
          )}

          {/* ── COMMITTED DEMANDS TAB ── */}
          {tab === "committed" && (
            <section aria-label="Committed demands">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-ink-soft">
                  {loadingCommits
                    ? "Loading…"
                    : committedDemands.length > 0
                    ? `${committedDemands.length} active commitment${committedDemands.length !== 1 ? "s" : ""}`
                    : "No commitments yet"}
                </p>
              </div>

              {loadingCommits && (
                <div className="flex items-center justify-center gap-3 py-16 text-ink-faint">
                  <Loader2 size={18} strokeWidth={2} className="animate-spin" aria-hidden="true" />
                  <span className="text-sm font-mono">Loading commitments…</span>
                </div>
              )}

              {!loadingCommits && committedDemands.length === 0 && (
                <EmptyState icon={PackageCheck} title="No supply committed yet" description="Browse demand opportunities and commit your supply to start fulfilling consumer demand directly." actionLabel="Browse opportunities" onAction={() => setTab("opportunities")} />
              )}

              {!loadingCommits && committedDemands.length > 0 && (
                <ul className="flex flex-col gap-2.5" aria-label="Committed demand list">
                  {committedDemands.map((c) => (
                    <CommittedDemandRow key={c.id} commitment={c} />
                  ))}
                </ul>
              )}
            </section>
          )}

          {/* ── FOOTER NOTE ── */}
          <p className="text-xs text-ink-faint font-mono border-t border-forest-800/[0.08] pt-6">
            Opportunity data is fetched live from the FarmDirect API. Delivery coordination,
            payment processing, and notifications will connect in the next phase.
          </p>
        </div>
      </div>

      <DemandDetailModal
        open={!!detailTarget}
        demand={detailTarget}
        supplyForDemand={supplyForDetail}
        matchData={matchDataForDetail}
        onClose={() => setDetailTarget(null)}
        onCommit={handleCommit}
      />

      <AddSupplyModal
        open={addSupplyOpen}
        onClose={() => setAddSupplyOpen(false)}
        onSubmit={handleAddSupply}
      />
    </>
  );
}
