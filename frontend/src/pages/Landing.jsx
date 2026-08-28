import Hero from "../components/sections/Hero";
import Differentiator from "../components/sections/Differentiator";
import ConsumerPreview from "../components/sections/ConsumerPreview";
import FarmerPreview from "../components/sections/FarmerPreview";
import Impact from "../components/sections/Impact";
import HowItWorks from "../components/sections/HowItWorks";
import FinalCTA from "../components/sections/FinalCTA";

export default function Landing() {
  return (
    <>
      <Hero />
      <Differentiator />
      <ConsumerPreview />
      <FarmerPreview />
      <Impact />
      <HowItWorks />
      <FinalCTA />
    </>
  );
}
