import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Search, Sparkles } from "lucide-react";
import SectionHeading from "../ui/SectionHeading";
import DemandCard from "../ui/DemandCard";
import Button from "../ui/Button";
import { demandItems, currentUserDemand } from "../../data/demand";
import { useAuth } from "../../context/AuthContext";

export default function ConsumerPreview() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [query, setQuery] = useState("");

  const handleAddToDemand = () => {
    if (!user) {
      navigate("/login");
    } else {
      navigate("/dashboard/consumer");
    }
  };

  return (
    <section id="for-consumers" className="px-5 sm:px-8 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <SectionHeading
            eyebrow="For Consumers"
            title="See what your neighborhood already needs"
            description="Add your own requirement, or add your quantity to demand that's already forming near you."
          />
          <div className="flex items-center gap-1.5 text-sm text-ink-faint font-mono shrink-0">
            <MapPin size={14} strokeWidth={2} />
            {currentUserDemand.location}
          </div>
        </div>

        {/* mock "what do you need" input — visual only, no backend yet */}
        <div className="mt-9 rounded-2xl border border-forest-800/10 bg-canvas-raised p-4 sm:p-5">
          <label htmlFor="demand-input" className="sr-only">
            What do you need?
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search
                size={17}
                strokeWidth={2}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint"
              />
              <input
                id="demand-input"
                type="text"
                placeholder="What do you need? Try “20 kg tomatoes”"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-full border border-forest-800/12 bg-canvas pl-11 pr-4 py-3 text-sm text-ink placeholder:text-ink-faint focus-visible:outline-2 focus-visible:outline-forest-600"
              />
            </div>
            <Button variant="primary" size="md" className="sm:w-auto w-full" onClick={handleAddToDemand}>
              <Sparkles size={15} strokeWidth={2} />
              Add to demand
            </Button>
          </div>
        </div>

        <div className="mt-6 flex items-baseline justify-between">
          <h3 className="font-mono text-xs uppercase tracking-[0.1em] text-forest-500">
            Current collective demand near you
          </h3>
        </div>

        <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {demandItems.map((item) => (
            <DemandCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
