import { Share2, AtSign, Link2 } from "lucide-react";
import Logo from "../ui/Logo";

const NAVIGATE = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "Impact", href: "#impact" },
  { label: "Login", href: "/login" },
];

const CONSUMERS = [
  { label: "Start as Consumer", href: "/consumer" },
  { label: "Join Demand", href: "#for-consumers" },
];

const FARMERS = [
  { label: "Join as Farmer", href: "/farmer" },
  { label: "View Nearby Demand", href: "#for-farmers" },
];

const SOCIALS = [
  { label: "Twitter", icon: Share2, href: "#" },
  { label: "Instagram", icon: AtSign, href: "#" },
  { label: "LinkedIn", icon: Link2, href: "#" },
];

function FooterColumn({ title, links }) {
  return (
    <div>
      <h3 className="font-mono text-xs uppercase tracking-[0.12em] text-forest-300 mb-4">
        {title}
      </h3>
      <ul className="flex flex-col gap-2.5">
        {links.map((link) => (
          <li key={link.label}>
            <a
              href={link.href}
              className="text-sm text-forest-200/80 hover:text-canvas transition-colors"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="bg-forest-950 text-canvas">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 py-14 sm:py-16">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
          <div className="col-span-2">
            <Logo dark />
            <p className="mt-4 text-sm text-forest-200/75 leading-relaxed max-w-xs">
              Combining what neighborhoods need with what farmers can grow —
              matched directly, without unnecessary layers in between.
            </p>
            <div className="flex items-center gap-3 mt-6">
              {SOCIALS.map(({ label, icon: Icon, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-canvas/10 text-forest-200 hover:bg-amber-500 hover:text-forest-950 transition-colors"
                >
                  <Icon size={16} strokeWidth={1.8} />
                </a>
              ))}
            </div>
          </div>

          <FooterColumn title="Navigate" links={NAVIGATE} />
          <FooterColumn title="For Consumers" links={CONSUMERS} />
          <FooterColumn title="For Farmers" links={FARMERS} />
        </div>

        <div className="mt-12 pt-6 border-t border-canvas/10 flex flex-col sm:flex-row gap-3 justify-between items-center">
          <p className="text-xs text-forest-200/60">
            © {new Date().getFullYear()} FarmDirect. Built for a hackathon prototype.
          </p>
          <p className="text-xs text-forest-200/60 font-mono">Demand, combined. Delivered direct.</p>
        </div>
      </div>
    </footer>
  );
}
