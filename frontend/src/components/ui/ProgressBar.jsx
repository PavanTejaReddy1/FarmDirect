/**
 * Accessible progress bar. Pass `value` (0–100), an optional `color`
 * override class, and an `aria-label` via `label`.
 *
 * Colors:
 *   "green"  → forest-600  (default)
 *   "amber"  → amber-500
 *   "full"   → forest-800  (demand fully matched)
 */
const COLOR_MAP = {
  green: "bg-forest-600",
  amber: "bg-amber-500",
  full: "bg-forest-800",
};

export default function ProgressBar({ value = 0, color = "green", label = "Progress" }) {
  const clamped = Math.min(Math.max(Math.round(value), 0), 100);
  const barColor = COLOR_MAP[color] ?? COLOR_MAP.green;

  return (
    <div
      className="h-2 w-full rounded-full bg-forest-800/[0.08] overflow-hidden"
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-700 ${barColor}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
