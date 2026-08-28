import { ArrowRight } from "lucide-react";
import Button from "../ui/Button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function FinalCTA() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleConsumerClick = () => {
    if (!user) {
      navigate("/register");
    } else {
      navigate("/dashboard/consumer");
    }
  };

  const handleFarmerClick = () => {
    if (!user) {
      navigate("/register");
    } else {
      navigate("/dashboard/farmer");
    }
  };

  return (
    <section className="px-5 sm:px-8 py-16 sm:py-24">
      <div className="mx-auto max-w-5xl rounded-3xl bg-forest-800 px-6 sm:px-14 py-14 sm:py-16 text-center relative overflow-hidden">
        <div
          className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-amber-500/20 blur-3xl"
          aria-hidden="true"
        />
        <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-canvas leading-[1.1] text-balance relative">
          Ready to make direct connections?
        </h2>
        <p className="mt-4 text-forest-200/85 text-base sm:text-lg max-w-lg mx-auto relative">
          Join the demand your neighborhood is already forming, or bring
          your farm into a fairer, more direct order.
        </p>
        <div className="mt-9 flex flex-col sm:flex-row gap-3 justify-center relative">
          <Button onClick={handleConsumerClick} variant="amber" size="lg">
            Start as Consumer
            <ArrowRight size={17} strokeWidth={2} />
          </Button>
          <Button
            onClick={handleFarmerClick}
            variant="outline"
            size="lg"
            className="!border-canvas/25 !text-canvas hover:!bg-canvas/10"
          >
            Join as Farmer
          </Button>
        </div>
      </div>
    </section>
  );
}
