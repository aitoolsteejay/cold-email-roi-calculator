/**
 * Stand-in for the myntmore.com footer. On migration, replace with the site's own footer component.
 */
const COLUMNS = [
  {
    title: "Services",
    links: [
      ["LinkedIn Outreach & Automation", "/services"],
      ["Cold Email Infrastructure", "/services"],
      ["ICP Mapping & Lead Scoring", "/services"],
      ["AI Lead Generation", "/services"],
      ["Account-Based Marketing", "/services"],
      ["GTM Strategy", "/services"],
    ],
  },
  {
    title: "Company",
    links: [
      ["About Myntmore", "/about-us"],
      ["Case Studies", "/case-studies"],
      ["Resources & Playbooks", "/resources"],
      ["Blog", "/blog"],
      ["Careers", "/careers"],
      ["Contact", "/contact-us"],
    ],
  },
  {
    title: "Free Tools",
    links: [
      ["LinkedIn ROI Calculator", "/tools/roi-calculator"],
      ["Cold Email ROI Calculator", "/tools/cold-email-roi-calculator"],
      ["Battle Card Generator", "/tools/battle-card-generator"],
      ["ICP Builder", "/tools/icp-builder"],
    ],
  },
  {
    title: "Get in Touch",
    links: [
      ["growth@myntmore.com", "mailto:growth@myntmore.com"],
      ["+91 81693 18951", "tel:+918169318951"],
      ["Book a Call", "/founder-meeting"],
      ["Contact Page", "/contact-us"],
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-[#E8E2D9] bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 py-14 md:grid-cols-5">
          <div className="col-span-2 md:col-span-1">
            <img src="/logo.png" alt="Myntmore" width={200} height={56} className="mb-4 h-12 w-auto object-contain" />
            <p className="text-sm text-[#5F564E]">B2B growth systems for companies that want predictable pipeline, not more promises.</p>
          </div>
          {COLUMNS.map((c) => (
            <div key={c.title}>
              <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.15em] text-black">{c.title}</h3>
              <ul className="space-y-2.5">
                {c.links.map(([label, href]) => (
                  <li key={label}>
                    <a href={href} className="break-words text-sm text-[#5F564E] transition-colors hover:text-black">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex flex-col items-center justify-between gap-3 border-t border-[#E8E2D9] py-6 sm:flex-row">
          <p className="text-xs text-[#71675E]">© 2026 Myntmore. Built in Mumbai.</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {[
              ["Privacy Policy", "/privacy-policy"],
              ["Editorial Policy", "/editorial-policy"],
              ["Site Map", "/sitemap"],
            ].map(([l, h]) => (
              <a key={l} href={h} className="text-xs text-[#71675E] hover:text-black">
                {l}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
