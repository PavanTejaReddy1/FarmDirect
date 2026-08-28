import SectionHeading from "../ui/SectionHeading";
import ProcessStep from "../ui/ProcessStep";
import { differentiatorSteps } from "../../data/process";

export default function Differentiator() {
  return (
    <section className="px-5 sm:px-8 py-16 sm:py-24 bg-forest-100/50">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Not another marketplace"
          title="From individual demand to collective buying"
          description="A typical platform stops at listing products. FarmDirect starts with what people actually need, combines it, and only then brings farmers in."
        />

        <div className="mt-12 flex flex-col md:flex-row gap-4 md:gap-3">
          {differentiatorSteps.map((step, i) => (
            <ProcessStep
              key={step.id}
              step={step}
              index={i}
              showConnector={i < differentiatorSteps.length - 1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
