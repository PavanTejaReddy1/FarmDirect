import SectionHeading from "../ui/SectionHeading";
import MetricCard from "../ui/MetricCard";
import { impactMetrics } from "../../data/impact";

export default function Impact() {
  return (
    <section id="impact" className="px-5 sm:px-8 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="What this changes"
          title="What combined demand makes possible"
          description="These are the outcomes FarmDirect is built to create — not measured claims, but the value it's designed around."
        />

        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {impactMetrics.map((metric) => (
            <MetricCard key={metric.id} title={metric.title} description={metric.description} />
          ))}
        </div>
      </div>
    </section>
  );
}
