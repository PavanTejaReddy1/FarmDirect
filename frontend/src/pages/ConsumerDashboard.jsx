import { useState, useEffect, useMemo } from "react";
import {
  MapPin,
  Search,
  Plus,
  ShoppingBasket,
  Users,
  TrendingUp,
  SlidersHorizontal,
  X,
  ChevronDown,
  AlertCircle,
  Loader2,
} from "lucide-react";

import Button from "../components/ui/Button";
import DashboardStat from "../components/ui/DashboardStat";
import EmptyState from "../components/ui/EmptyState";
import CollectiveDemandCard from "../components/ui/CollectiveDemandCard";
import MyDemandRow from "../components/ui/MyDemandRow";
import CreateDemandModal from "../components/ui/CreateDemandModal";
import JoinDemandModal from "../components/ui/JoinDemandModal";
import FulfillmentOutlookModal from "../components/ui/FulfillmentOutlookModal";

import {
  fetchDemands,
  createDemand as apiCreateDemand,
  joinDemand as apiJoinDemand,
} from "../utils/api";

import { useAuth } from "../context/AuthContext";
import { CATEGORIES, LOCATIONS, STATUS_LABELS } from "../data/demand";

// ─── Field normaliser ────────────────────────────────────────────────────────
// Maps a MongoDB Demand document → the shape the existing UI components expect.
// Backend uses: productName, quantity, fulfilledQuantity, consumerCount,
//               deliveryDate, status (OPEN / PARTIALLY_FULFILLED / FULFILLED)
// UI expects:   name, totalDemand, matched, consumers, targetDate,
//               status (open / filling / matched)

function normaliseDemand(doc) {
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
    id: doc._id,
    _id: doc._id,
    name: doc.productName,
    category: doc.category,
    unit: doc.unit,
    totalDemand: doc.quantity,
    matched: doc.fulfilledQuantity,
    consumers: doc.consumerCount,
    targetDate: doc.deliveryDate
      ? new Date(doc.deliveryDate).toISOString().slice(0, 10)
      : null,
    location: doc.location,
    directPrice: doc.directPrice ?? priceDefaults.direct,
    marketPrice: doc.marketPrice ?? priceDefaults.market,
    status: statusMap[doc.status] ?? "open",
    description: doc.note || "",
    // keep raw for join call
    rawStatus: doc.status,
  };
}

// ─── helpers ────────────────────────────────────────────────────────────────

function labelClass(active) {
  return [
    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium font-mono transition-colors cursor-pointer select-none",
    active
      ? "border-forest-800 bg-forest-800 text-canvas"
      : "border-forest-800/15 text-ink-soft hover:bg-forest-800/[0.06]",
  ].join(" ");
}

// ─── component ──────────────────────────────────────────────────────────────

export default function ConsumerDashboard() {
  // ── auth ──
  const { user } = useAuth();

  // ── server state ──
  const [demands, setDemands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── personal demands (kept local until per-user API endpoint exists) ──
  const [myDemands, setMyDemands] = useState([]);

  // ── joined demand IDs ──
  const [joinedIds, setJoinedIds] = useState(new Set([]));

  // ── modals ──
  const [createOpen, setCreateOpen] = useState(false);
  const [joinTarget, setJoinTarget] = useState(null);
  const [outlookTarget, setOutlookTarget] = useState(null);

  // ── search & filters ──
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeLocation, setActiveLocation] = useState("All");
  const [activeStatus, setActiveStatus] = useState("All");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // ── active tab ──
  const [tab, setTab] = useState("collective");

  // ─── Load demands from API on mount ─────────────────────────────────────
  async function loadDemands() {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchDemands();
      setDemands(data.map(normaliseDemand));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDemands();
  }, []);

  // ─── Derived stats ───────────────────────────────────────────────────────
  const activeDemandCount = demands.filter(
    (d) => d.status === "open" || d.status === "filling"
  ).length;
  const joinedCount = joinedIds.size;

  // ─── Filtering ───────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return demands.filter((d) => {
      const matchesQuery =
        !q ||
        d.name.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q);
      const matchesCategory =
        activeCategory === "All" || d.category === activeCategory;
      const matchesLocation =
        activeLocation === "All" || d.location === activeLocation;
      const matchesStatus =
        activeStatus === "All" ||
        (activeStatus === "open" &&
          (d.status === "open" || d.status === "filling")) ||
        d.status === activeStatus;
      return matchesQuery && matchesCategory && matchesLocation && matchesStatus;
    });
  }, [demands, query, activeCategory, activeLocation, activeStatus]);

  const hasActiveFilters =
    activeCategory !== "All" || activeLocation !== "All" || activeStatus !== "All";

  function clearFilters() {
    setActiveCategory("All");
    setActiveLocation("All");
    setActiveStatus("All");
    setQuery("");
  }

  // ─── Handlers ────────────────────────────────────────────────────────────

  async function handleCreateDemand(formData) {
    try {
      const body = {
        productName: formData.name,
        category: formData.category,
        quantity: formData.quantity,
        unit: formData.unit,
        location: formData.location,
        deliveryDate: formData.deliveryDate,
        note: formData.note || "",
        directPrice: formData.directPrice || null,
        marketPrice: formData.marketPrice || null,
      };
      const created = await apiCreateDemand(body);
      const normalised = normaliseDemand(created);

      // Add to collective demands list and to my demands
      setDemands((prev) => [normalised, ...prev]);
      setMyDemands((prev) => [
        {
          id: normalised.id,
          name: normalised.name,
          category: normalised.category,
          quantity: formData.quantity,
          unit: formData.unit,
          matched: 0,
          status: "open",
          deliveryDate: formData.deliveryDate,
          location: formData.location,
          note: formData.note || "",
          directPrice: formData.directPrice || null,
          marketPrice: formData.marketPrice || null,
          createdAt: new Date().toISOString().slice(0, 10),
        },
        ...prev,
      ]);
    } catch (err) {
      // Surface the error inline — modal stays open for the user to retry
      alert(`Could not create demand: ${err.message}`);
    }
  }

  async function handleJoinConfirm(demand, qty) {
    try {
      const updated = await apiJoinDemand(demand._id, qty);
      const normalised = normaliseDemand(updated);

      setJoinedIds((prev) => new Set([...prev, demand._id]));
      setDemands((prev) =>
        prev.map((d) => (d._id === demand._id ? normalised : d))
      );

      setMyDemands((prev) => [
        {
          id: `my-join-${demand._id}-${Date.now()}`,
          name: demand.name,
          category: demand.category,
          quantity: qty,
          unit: demand.unit,
          matched: qty,
          status: "matched",
          deliveryDate: demand.targetDate,
          location: demand.location,
          note: "",
          createdAt: new Date().toISOString().slice(0, 10),
        },
        ...prev,
      ]);
    } catch (err) {
      alert(`Could not join demand: ${err.message}`);
    } finally {
      setJoinTarget(null);
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <>
      <div className="px-5 sm:px-8 py-10 sm:py-14">
        <div className="mx-auto max-w-6xl flex flex-col gap-8">

          {/* ── HEADER ── */}
          <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <span className="font-mono text-xs uppercase tracking-[0.12em] text-forest-600">
                Consumer dashboard
              </span>
              <h1 className="font-display text-3xl sm:text-4xl text-forest-950 mt-1.5">
                Good morning, {user?.name?.split(" ")[0] ?? "there"}
              </h1>
              <p className="flex items-center gap-1.5 text-sm text-ink-faint font-mono mt-1.5">
                <MapPin size={13} strokeWidth={2} aria-hidden="true" />
                {user?.location ?? "—"}
              </p>
            </div>
            <Button
              variant="primary"
              size="md"
              onClick={() => setCreateOpen(true)}
              className="sm:w-auto w-full shrink-0"
            >
              <Plus size={16} strokeWidth={2.2} />
              New demand
            </Button>
          </header>

          {/* ── STAT TILES ── */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <DashboardStat
              icon={TrendingUp}
              label="Active demands"
              value={loading ? "—" : activeDemandCount}
              note="open in your area"
            />
            <DashboardStat
              icon={Users}
              label="You've joined"
              value={joinedCount}
              note={joinedCount === 1 ? "demand pool" : "demand pools"}
            />
            <div className="col-span-2 lg:col-span-1">
              <DashboardStat
                icon={ShoppingBasket}
                label="My demands"
                value={myDemands.length}
                note="total requests placed"
              />
            </div>
          </div>

          {/* ── TABS ── */}
          <div className="flex items-center gap-1 border-b border-forest-800/10 -mb-4">
            {[
              { id: "collective", label: "Collective Demands" },
              {
                id: "mine",
                label: `My Demands${myDemands.length > 0 ? ` (${myDemands.length})` : ""}`,
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

          {/* ── COLLECTIVE DEMANDS TAB ── */}
          {tab === "collective" && (
            <section aria-label="Collective demands">
              {/* Search + filter bar */}
              <div className="flex flex-col gap-3 mb-6">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search
                      size={16}
                      strokeWidth={2}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint"
                      aria-hidden="true"
                    />
                    <input
                      type="search"
                      placeholder="Search by product or category…"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="w-full rounded-full border border-forest-800/12 bg-canvas-raised pl-10 pr-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus-visible:outline-2 focus-visible:outline-forest-600"
                      aria-label="Search demands"
                    />
                    {query && (
                      <button
                        type="button"
                        onClick={() => setQuery("")}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-faint hover:text-forest-900 transition-colors"
                        aria-label="Clear search"
                      >
                        <X size={14} strokeWidth={2} />
                      </button>
                    )}
                  </div>
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
                    aria-controls="filter-panel"
                  >
                    <SlidersHorizontal size={14} strokeWidth={2} aria-hidden="true" />
                    Filters
                    {hasActiveFilters && (
                      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-forest-950 text-[10px] font-bold">
                        {[activeCategory !== "All", activeLocation !== "All", activeStatus !== "All"].filter(Boolean).length}
                      </span>
                    )}
                    <ChevronDown
                      size={13}
                      strokeWidth={2}
                      className={`transition-transform ${filtersOpen ? "rotate-180" : ""}`}
                      aria-hidden="true"
                    />
                  </button>
                </div>

                {filtersOpen && (
                  <div
                    id="filter-panel"
                    className="rounded-2xl border border-forest-800/10 bg-canvas-raised p-4 flex flex-col gap-4 animate-reveal"
                  >
                    <div>
                      <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-faint mb-2">Category</p>
                      <div className="flex flex-wrap gap-2">
                        {CATEGORIES.map((cat) => (
                          <button key={cat} type="button" onClick={() => setActiveCategory(cat)} className={labelClass(activeCategory === cat)}>{cat}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-faint mb-2">Location</p>
                      <div className="flex flex-wrap gap-2">
                        {LOCATIONS.map((loc) => (
                          <button key={loc} type="button" onClick={() => setActiveLocation(loc)} className={labelClass(activeLocation === loc)}>{loc}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-faint mb-2">Status</p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { value: "All", label: "All" },
                          { value: "open", label: "Open / Filling" },
                          { value: "matched", label: STATUS_LABELS.matched },
                          { value: "closed", label: STATUS_LABELS.closed },
                        ].map((s) => (
                          <button key={s.value} type="button" onClick={() => setActiveStatus(s.value)} className={labelClass(activeStatus === s.value)}>{s.label}</button>
                        ))}
                      </div>
                    </div>
                    {hasActiveFilters && (
                      <button type="button" onClick={clearFilters} className="self-start text-xs font-medium text-amber-700 hover:text-amber-600 transition-colors underline underline-offset-2">
                        Clear all filters
                      </button>
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
                    {activeStatus !== "All" && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-forest-700 bg-forest-800/[0.08] rounded-full px-3 py-1">
                        {activeStatus === "open" ? "Open / Filling" : STATUS_LABELS[activeStatus]}
                        <button type="button" onClick={() => setActiveStatus("All")} aria-label="Remove status filter"><X size={11} strokeWidth={2.5} /></button>
                      </span>
                    )}
                    <button type="button" onClick={clearFilters} className="text-xs text-ink-faint hover:text-amber-700 transition-colors underline underline-offset-2">Clear all</button>
                  </div>
                )}

                {(query || hasActiveFilters) && !loading && filtered.length > 0 && (
                  <p className="text-xs text-ink-faint font-mono">
                    {filtered.length} demand{filtered.length !== 1 ? "s" : ""} found
                  </p>
                )}
              </div>

              {/* Loading state */}
              {loading && (
                <div className="flex items-center justify-center gap-3 py-20 text-ink-faint">
                  <Loader2 size={20} strokeWidth={2} className="animate-spin" aria-hidden="true" />
                  <span className="text-sm font-mono">Loading demands…</span>
                </div>
              )}

              {/* Error state */}
              {!loading && error && (
                <div className="flex flex-col items-center gap-4 py-16 text-center">
                  <div className="h-12 w-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700">
                    <AlertCircle size={22} strokeWidth={1.8} />
                  </div>
                  <div>
                    <p className="font-display text-lg text-forest-950">Could not load demands</p>
                    <p className="text-sm text-ink-faint mt-1">{error}</p>
                  </div>
                  <Button variant="outline" size="md" onClick={loadDemands}>Try again</Button>
                </div>
              )}

              {/* Demand grid or empty states */}
              {!loading && !error && filtered.length === 0 && (query || hasActiveFilters) && (
                <EmptyState icon={Search} title="No demands match your search" description="Try adjusting your filters or searching for a different product." actionLabel="Clear filters" onAction={clearFilters} />
              )}
              {!loading && !error && demands.length === 0 && !query && !hasActiveFilters && (
                <EmptyState icon={ShoppingBasket} title="No active demands yet" description="Be the first to add a demand in your area and start the collective pool." actionLabel="Create a demand" onAction={() => setCreateOpen(true)} />
              )}
              {!loading && !error && filtered.length > 0 && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filtered.map((demand) => (
                    <CollectiveDemandCard
                      key={demand.id}
                      demand={demand}
                      joined={joinedIds.has(demand._id)}
                      onJoin={setJoinTarget}
                      onViewOutlook={setOutlookTarget}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ── MY DEMANDS TAB ── */}
          {tab === "mine" && (
            <section aria-label="My demands">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-ink-soft">
                  {myDemands.length > 0
                    ? `${myDemands.length} demand${myDemands.length !== 1 ? "s" : ""} placed`
                    : "No demands yet"}
                </p>
                <Button variant="outline" size="md" className="!px-4 !py-2 text-sm" onClick={() => setCreateOpen(true)}>
                  <Plus size={14} strokeWidth={2.2} />
                  Add demand
                </Button>
              </div>
              {myDemands.length === 0 ? (
                <EmptyState icon={ShoppingBasket} title="You haven't placed any demands" description="Start by creating a demand — it'll join the collective pool for your area." actionLabel="Create your first demand" onAction={() => setCreateOpen(true)} />
              ) : (
                <ul className="flex flex-col gap-2.5" aria-label="My demand list">
                  {myDemands.map((d) => (
                    <MyDemandRow key={d.id} demand={d} />
                  ))}
                </ul>
              )}
            </section>
          )}

          {/* ── FOOTER NOTE ── */}
          <p className="text-xs text-ink-faint font-mono border-t border-forest-800/[0.08] pt-6">
            Demand data is fetched live from the FarmDirect API. Farmer matching, delivery
            tracking, and per-user demand history will connect in the next phase.
          </p>
        </div>
      </div>

      <CreateDemandModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreateDemand}
      />
      <JoinDemandModal
        open={!!joinTarget}
        demand={joinTarget}
        onClose={() => setJoinTarget(null)}
        onJoin={handleJoinConfirm}
      />
      <FulfillmentOutlookModal
        open={!!outlookTarget}
        demand={outlookTarget}
        onClose={() => setOutlookTarget(null)}
      />
    </>
  );
}
