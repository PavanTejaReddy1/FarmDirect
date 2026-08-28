import { Sprout } from "lucide-react";
import SectionHeading from "../ui/SectionHeading";
import FarmerCard from "../ui/FarmerCard";
import { nearbyDemand } from "../../data/farmerDemand";

export default function FarmerPreview() {
  return (
    <section id="for-farmers" className="px-5 sm:px-8 py-16 sm:py-24 bg-forest-100/50">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <SectionHeading
            eyebrow="For Farmers"
            title="Demand near you, before you commit supply"
            description="See combined household demand in your area, matched against what you can grow — with a clear, direct price."
          />
          <div className="flex items-center gap-1.5 text-sm text-ink-faint font-mono shrink-0">
            <Sprout size={14} strokeWidth={2} />
            Shankarpally, Telangana
          </div>
        </div>

        <div className="mt-9 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {nearbyDemand.map((item) => (
            <FarmerCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
