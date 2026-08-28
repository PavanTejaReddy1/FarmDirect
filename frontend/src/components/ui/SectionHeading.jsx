/**
 * Consistent section intro: small eyebrow label, display headline, optional
 * supporting copy. Alignment defaults to left; pass align="center" for
 * closing/CTA-style sections.
 */
export default function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  dark = false,
  className = "",
}) {
  const alignClasses = align === "center" ? "items-center text-center mx-auto" : "items-start text-left";

  return (
    <div className={`flex flex-col gap-4 max-w-2xl ${alignClasses} ${className}`}>
      {eyebrow && (
        <span
          className={`font-mono text-xs tracking-[0.14em] uppercase font-medium ${
            dark ? "text-amber-400" : "text-forest-600"
          }`}
        >
          {eyebrow}
        </span>
      )}
      <h2
        className={`font-display text-3xl sm:text-4xl md:text-[2.75rem] leading-[1.1] text-balance ${
          dark ? "text-canvas" : "text-forest-950"
        }`}
      >
        {title}
      </h2>
      {description && (
        <p
          className={`text-base sm:text-lg leading-relaxed text-pretty ${
            dark ? "text-forest-200/80" : "text-ink-soft"
          }`}
        >
          {description}
        </p>
      )}
    </div>
  );
}
