export default function FeatureCard({ icon: Icon, title, description, className = "" }) {
  return (
    <div
      className={`group rounded-2xl border border-forest-800/10 bg-canvas-raised p-6 sm:p-7 
      shadow-[0_1px_2px_rgba(22,38,28,0.04)] transition-all duration-300 
      hover:shadow-[0_8px_24px_rgba(22,38,28,0.08)] hover:-translate-y-0.5 hover:border-forest-800/20 ${className}`}
    >
      {Icon && (
        <div className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-forest-800/[0.07] text-forest-700 transition-colors duration-300 group-hover:bg-forest-800 group-hover:text-canvas">
          <Icon size={19} strokeWidth={1.8} />
        </div>
      )}
      <h3 className="font-display text-lg text-forest-950 mb-2">{title}</h3>
      <p className="text-sm text-ink-soft leading-relaxed">{description}</p>
    </div>
  );
}
