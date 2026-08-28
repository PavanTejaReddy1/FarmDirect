import { forwardRef } from "react";
import { Link } from "react-router-dom";

const VARIANTS = {
  primary:
    "bg-forest-800 text-canvas hover:bg-forest-700 shadow-[0_1px_0_0_rgba(255,255,255,0.08)_inset]",
  amber: "bg-amber-500 text-forest-950 hover:bg-amber-400",
  outline:
    "border border-forest-800/25 text-forest-800 hover:bg-forest-800/[0.06] bg-transparent",
  ghost: "text-ink-soft hover:text-forest-800 hover:bg-forest-800/[0.06] bg-transparent",
};

const SIZES = {
  md: "text-sm px-5 py-2.5",
  lg: "text-base px-6 py-3.5",
};

/**
 * Button doubles as a router <Link> when `to` is provided, or a native
 * <button> otherwise, so callers never have to pick manually.
 */
const Button = forwardRef(function Button(
  { variant = "primary", size = "md", to, className = "", children, ...rest },
  ref
) {
  const classes = [
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold",
    "transition-all duration-200 active:scale-[0.98]",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-600",
    VARIANTS[variant],
    SIZES[size],
    className,
  ].join(" ");

  if (to) {
    return (
      <Link ref={ref} to={to} className={classes} {...rest}>
        {children}
      </Link>
    );
  }

  return (
    <button ref={ref} className={classes} {...rest}>
      {children}
    </button>
  );
});

export default Button;
