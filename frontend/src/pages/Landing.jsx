import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Hero from "../components/sections/Hero";
import Differentiator from "../components/sections/Differentiator";
import ConsumerPreview from "../components/sections/ConsumerPreview";
import FarmerPreview from "../components/sections/FarmerPreview";
import Impact from "../components/sections/Impact";
import HowItWorks from "../components/sections/HowItWorks";
import FinalCTA from "../components/sections/FinalCTA";

export default function Landing() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace("#", "");
      const timer = setTimeout(() => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [location.hash, location.pathname]);

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
