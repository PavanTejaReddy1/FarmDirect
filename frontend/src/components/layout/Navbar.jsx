import { useState, useEffect } from "react";
import { Menu, X, LogOut, LayoutDashboard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Logo from "../ui/Logo";
import Button from "../ui/Button";
import { useAuth } from "../../context/AuthContext";

const NAV_LINKS = [
  { label: "How It Works",  href: "#how-it-works" },
  { label: "For Consumers", href: "#for-consumers" },
  { label: "For Farmers",   href: "#for-farmers" },
  { label: "Impact",        href: "#impact" },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  async function handleLogout() {
    setMobileOpen(false);
    await logout();
    navigate("/", { replace: true });
  }

  const dashboardPath = user?.role === "FARMER" ? "/farmer" : "/consumer";
  const dashboardLabel = user?.role === "FARMER" ? "Farmer Dashboard" : "My Dashboard";

  return (
    <header
      className={`sticky top-0 z-50 transition-colors duration-300 ${
        scrolled
          ? "bg-canvas/90 backdrop-blur-md border-b border-forest-800/10"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <nav
        className="mx-auto max-w-7xl px-5 sm:px-8 h-16 sm:h-[4.5rem] flex items-center justify-between"
        aria-label="Primary"
      >
        <Logo />

        {/* Desktop nav links */}
        <ul className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="px-4 py-2 text-sm font-medium text-ink-soft hover:text-forest-900 rounded-full hover:bg-forest-800/[0.06] transition-colors"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Desktop auth area */}
        <div className="hidden lg:flex items-center gap-2">
          {user ? (
            <>
              <span className="text-sm text-ink-soft font-medium px-2">
                Hi, <span className="text-forest-900 font-semibold">{user.name.split(" ")[0]}</span>
              </span>
              <Button to={dashboardPath} variant="ghost" size="md">
                <LayoutDashboard size={15} strokeWidth={2} />
                {dashboardLabel}
              </Button>
              <Button variant="outline" size="md" onClick={handleLogout}>
                <LogOut size={15} strokeWidth={2} />
                Log out
              </Button>
            </>
          ) : (
            <>
              <Button to="/login"    variant="ghost"   size="md">Login</Button>
              <Button to="/register" variant="primary" size="md">Get Started</Button>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="lg:hidden inline-flex items-center justify-center h-10 w-10 rounded-full text-forest-900 hover:bg-forest-800/[0.08] transition-colors"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((o) => !o)}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-canvas border-b border-forest-800/10 px-5 pb-6 pt-2 animate-reveal">
          <ul className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-3 text-base font-medium text-ink-soft hover:text-forest-900 rounded-lg hover:bg-forest-800/[0.06] transition-colors"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-forest-800/10">
            {user ? (
              <>
                <p className="px-3 py-1 text-sm text-ink-faint font-mono">
                  {user.name} · {user.role}
                </p>
                <Button
                  to={dashboardPath}
                  variant="outline"
                  size="md"
                  onClick={() => setMobileOpen(false)}
                >
                  <LayoutDashboard size={15} strokeWidth={2} />
                  {dashboardLabel}
                </Button>
                <Button variant="ghost" size="md" onClick={handleLogout}>
                  <LogOut size={15} strokeWidth={2} />
                  Log out
                </Button>
              </>
            ) : (
              <>
                <Button to="/login"    variant="outline" size="md" onClick={() => setMobileOpen(false)}>Login</Button>
                <Button to="/register" variant="primary" size="md" onClick={() => setMobileOpen(false)}>Get Started</Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
