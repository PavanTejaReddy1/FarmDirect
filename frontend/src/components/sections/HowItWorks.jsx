import SectionHeading from "../ui/SectionHeading";
import { howItWorksSteps } from "../../data/process";

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="px-5 sm:px-8 py-16 sm:py-24 bg-forest-950 text-canvas">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="How it works"
          title="Four steps from a need to a delivery"
          dark
        />

        <ol className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-6">
          {howItWorksSteps.map((step) => (
            <li key={step.id} className="relative pl-0">
              <span className="font-display text-4xl text-amber-400/90">{step.id}</span>
              <h3 className="font-display text-lg mt-4 mb-2 leading-snug">{step.title}</h3>
              <p className="text-sm text-forest-200/75 leading-relaxed">{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
