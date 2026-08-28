import Logo from "../ui/Logo";

/**
 * Centered card shell shared by the login and register placeholders.
 * No real submission yet — inputs are visual only until auth exists.
 */
export default function AuthShell({ title, subtitle, footer, children }) {
  return (
    <div className="min-h-[calc(100vh-4.5rem)] flex items-center justify-center px-5 py-16 bg-forest-100/40">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Logo />
        </div>
        <div className="rounded-2xl border border-forest-800/10 bg-canvas-raised p-7 sm:p-8">
          <h1 className="font-display text-2xl text-forest-950 text-center">{title}</h1>
          {subtitle && (
            <p className="text-sm text-ink-faint text-center mt-2 mb-7">{subtitle}</p>
          )}
          <div className={subtitle ? "" : "mt-7"}>{children}</div>
        </div>
        {footer && <div className="mt-6 text-center text-sm text-ink-soft">{footer}</div>}
      </div>
    </div>
  );
}
