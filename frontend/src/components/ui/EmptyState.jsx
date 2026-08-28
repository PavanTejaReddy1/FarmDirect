import Button from "./Button";

/**
 * Generic empty state block with an icon, heading, body copy, and an
 * optional primary action. Used for no-demands, no-results, no-personal-demands.
 */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = "",
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center px-6 py-16 rounded-2xl border border-dashed border-forest-800/15 bg-canvas-raised/60 ${className}`}
    >
      {Icon && (
        <div
          className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-forest-800/[0.07] text-forest-500"
          aria-hidden="true"
        >
          <Icon size={26} strokeWidth={1.4} />
        </div>
      )}
      <h3 className="font-display text-xl text-forest-950 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-ink-soft max-w-xs leading-relaxed">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button variant="primary" size="md" className="mt-6" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
