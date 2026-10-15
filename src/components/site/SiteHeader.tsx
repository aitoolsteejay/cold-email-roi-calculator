import { useState } from "react";
import { ArrowRight, ChevronDown, Menu, X } from "lucide-react";

/**
 * Stand-in for the myntmore.com header. On migration, replace with the site's own header component.
 */
const NAV = [
  { label: "Services", href: "/services", menu: true },
  { label: "Case Studies", href: "/case-studies" },
  { label: "Resources", href: "/resources", menu: true },
  { label: "About", href: "/about-us" },
  { label: "Careers", href: "/careers" },
  { label: "Contact", href: "/contact-us" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-[#E8E2D9]/70 bg-cream/90 backdrop-blur-md">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Main">
        <div className="flex h-16 items-center justify-between sm:h-20">
          <a href="/" aria-label="Myntmore home" className="flex items-center">
            <img src="/logo.png" alt="Myntmore" width={200} height={56} className="h-10 w-auto object-contain sm:h-14" />
          </a>
          <div className="hidden items-center gap-7 lg:flex">
            {NAV.map((n) => (
              <a key={n.label} href={n.href} className="group relative flex items-center gap-1 text-sm font-medium text-[#3D3D3D] transition-colors hover:text-[#0a0a0a]">
                {n.label}
                {n.menu && <ChevronDown className="h-4 w-4" aria-hidden="true" />}
                <span className="absolute -bottom-0.5 left-0 h-[2px] w-0 rounded-full bg-[#F5B731] transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </div>
          <a
            href="/founder-meeting"
            className="hidden items-center gap-1.5 rounded-full border-[1.5px] border-[#F5B731] bg-white px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-[#FFF8E6] lg:inline-flex"
          >
            Book a Call <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>
          <button
            type="button"
            className="rounded-lg p-3 text-[#52525B] lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label="Toggle navigation menu"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>
      {open && (
        <div id="mobile-nav" className="space-y-1 border-t border-[#E8E2D9] bg-cream px-4 py-4 lg:hidden">
          {NAV.map((n) => (
            <a key={n.label} href={n.href} className="block rounded-lg px-3 py-3 text-sm font-medium text-[#3D3D3D] hover:bg-white">
              {n.label}
            </a>
          ))}
          <a href="/founder-meeting" className="mt-2 flex items-center justify-center gap-1.5 rounded-full bg-primary px-5 py-3 text-sm font-semibold">
            Book a Call <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      )}
    </header>
  );
}
