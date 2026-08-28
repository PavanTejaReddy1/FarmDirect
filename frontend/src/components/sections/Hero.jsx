import { ArrowRight } from "lucide-react";
import Button from "../ui/Button";
import HeroVisual from "../ui/HeroVisual";

export default function Hero() {
  return (
    <section className="relative px-5 sm:px-8 pt-14 sm:pt-20 pb-16 sm:pb-24">
      <div className="mx-auto max-w-7xl grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
        <div className="reveal">
          <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.12em] text-forest-600 bg-forest-800/[0.06] rounded-full px-3 py-1.5 mb-6">
            Demand-driven, not listing-driven
          </span>

          <h1 className="font-display text-[2.6rem] sm:text-5xl md:text-[3.4rem] leading-[1.05] text-forest-950 text-balance">
            Your neighborhood's demand,
            <br className="hidden sm:block" /> combined and{" "}
            <span className="italic text-forest-600">delivered direct.</span>
          </h1>

          <p className="mt-6 text-lg text-ink-soft leading-relaxed max-w-xl text-pretty">
            FarmDirect doesn't just list produce — it combines what
            households nearby actually need into orders worth a farmer's
            time, then matches that demand directly to the farmers who can
            fulfil it.
          </p>

          <div className="mt-9 flex flex-col sm:flex-row gap-3">
            <Button to="/consumer" variant="primary" size="lg">
              Start as Consumer
              <ArrowRight size={17} strokeWidth={2} />
            </Button>
            <Button to="/farmer" variant="outline" size="lg">
              Join as Farmer
            </Button>
          </div>

          <div className="mt-10 flex items-center gap-6 font-mono text-xs text-ink-faint">
            <span>No middlemen markup</span>
            <span className="h-1 w-1 rounded-full bg-ink-faint/40" />
            <span>Transparent, direct pricing</span>
          </div>
        </div>

        <div className="reveal [animation-delay:150ms]">
          <HeroVisual />
        </div>
      </div>
    </section>
  );
}
