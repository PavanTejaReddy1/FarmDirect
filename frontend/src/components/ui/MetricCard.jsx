export default function MetricCard({ title, description }) {
  return (
    <div className="rounded-2xl bg-forest-900 text-canvas p-6 sm:p-7 h-full flex flex-col">
      <div className="h-1.5 w-8 rounded-full bg-amber-500 mb-6" aria-hidden="true" />
      <h3 className="font-display text-xl mb-2.5 leading-snug">{title}</h3>
      <p className="text-sm text-forest-200/80 leading-relaxed">{description}</p>
    </div>
  );
}
