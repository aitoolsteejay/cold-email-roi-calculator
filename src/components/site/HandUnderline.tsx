/** Green hand drawn underline used under headings on myntmore.com. */
export function HandUnderline({ children }: { children: React.ReactNode }) {
  return (
    <span className="relative inline-block">
      {children}
      <svg className="absolute -bottom-1 left-0 w-full overflow-visible" height="10" viewBox="0 0 300 10" preserveAspectRatio="none" aria-hidden="true">
        <path d="M2 7 Q75 2 150 6 Q225 10 298 5" stroke="#16a34a" strokeWidth="3" fill="none" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export function PillBadge({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5"
      style={{ background: "rgba(34,197,94,0.07)", borderColor: "rgba(34,197,94,0.35)" }}
    >
      <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ backgroundColor: "#16a34a" }} aria-hidden="true" />
      <span className="text-xs font-bold uppercase tracking-[0.15em]" style={{ color: "#166534" }}>
        {children}
      </span>
    </div>
  );
}
