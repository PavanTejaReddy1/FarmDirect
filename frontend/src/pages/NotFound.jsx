import Button from "../components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-5 py-20">
      <span className="font-mono text-xs uppercase tracking-[0.12em] text-forest-600 mb-3">
        404
      </span>
      <h1 className="font-display text-3xl text-forest-950">This page isn't in demand yet</h1>
      <p className="mt-3 text-ink-soft max-w-sm">
        We couldn't find what you were looking for. Let's get you back home.
      </p>
      <Button to="/" variant="primary" size="md" className="mt-7">
        Back to home
      </Button>
    </div>
  );
}
