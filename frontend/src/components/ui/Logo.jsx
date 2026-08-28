import { Link } from "react-router-dom";

export default function Logo({ dark = false, className = "" }) {
  return (
    <Link
      to="/"
      className={`inline-flex items-center gap-2 font-display font-semibold text-lg shrink-0 ${
        dark ? "text-canvas" : "text-forest-950"
      } ${className}`}
      aria-label="FarmDirect home"
    >
      <svg width="26" height="26" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <rect width="32" height="32" rx="9" fill={dark ? "#DDA85F" : "#1F3D2B"} />
        <path
          d="M9 21C9 13 15 9 23 9C23 17 19 23 11 23C10 23 9.5 22.5 9 21Z"
          fill={dark ? "#16281C" : "#DDA85F"}
        />
        <path
          d="M9.5 21.5L20 11"
          stroke={dark ? "#DDA85F" : "#1F3D2B"}
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </svg>
      FarmDirect
    </Link>
  );
}
