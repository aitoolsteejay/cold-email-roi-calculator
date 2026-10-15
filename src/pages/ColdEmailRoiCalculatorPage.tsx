import { ArrowRight, Calculator, CircleCheckBig, CircleHelp, MousePointer, TrendingUp, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ColdEmailRoiCalculator } from "@/components/calculator/ColdEmailRoiCalculator";
import { HandUnderline, PillBadge } from "@/components/site/HandUnderline";
import { ColdEmailRoiSeo } from "@/components/site/Seo";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";

const BORDER = "#E8E2D9";

function scrollToCalculator() {
  document.getElementById("calculator")?.scrollIntoView({ behavior: "smooth", block: "start" });
  // Move focus for keyboard and screen reader users.
  window.setTimeout(() => document.getElementById("calculator")?.focus({ preventScroll: true }), 400);
}

const PROBLEMS = [
  {
    icon: CircleHelp,
    color: "#16a34a",
    title: "No idea what a booked meeting is worth",
    body: "Without the funnel math, every decision about volume, lists and budget is a guess dressed up as strategy.",
  },
  {
    icon: Calculator,
    color: "#3B82F6",
    title: "Budgets approved on gut feeling",
    body: "\"Replies look good\" doesn't hold up in a budget review. You need the projected meetings, pipeline and return.",
  },
  {
    icon: TrendingUp,
    color: "#7C3AED",
    title: "Can't set expectations before you spend",
    body: "Leadership wants a number before they sign off on domains, tools and a team. \"We'll see\" isn't an answer.",
  },
];

const STEPS = [
  { icon: MousePointer, color: "#16a34a", title: "Enter your funnel numbers", body: "Emails per day or prospects per month, then reply, meeting and close rates, deal size and cost. Each rate is checked against 2026 benchmarks." },
  { icon: Zap, color: "#3B82F6", title: "Watch it calculate live", body: "Meetings, deals, revenue and ROI update instantly as you move a slider." },
  { icon: CircleCheckBig, color: "#10B981", title: "Export it as a PDF", body: "A clean report you can bring to a budget conversation or a client call." },
];

const WHY = [
  { color: "#16a34a", title: "Benchmarks built in", lead: "Every rate is checked against published 2026 data", body: "See where your numbers sit, from below average to elite, with the sources one click away." },
  { color: "#3B82F6", title: "The full funnel", lead: "From emails sent all the way to revenue and ROI", body: "See exactly where meetings and deals are won or lost, not just the final close rate." },
  { color: "#14B8A6", title: "Built to share", lead: "Export a clean PDF for stakeholders or clients", body: "Bring real numbers into your next budget or pitch conversation." },
];

const NEXT = [
  { title: "Competitor Battle Card Generator", body: "See exactly how you stack up against any competitor", href: "/tools/battle-card-generator" },
  { title: "ICP Builder & Value Proposition Generator", body: "Define exactly who to sell to, and what to say", href: "/tools/icp-builder" },
];

export function ColdEmailRoiCalculatorPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-cream">
      <ColdEmailRoiSeo />
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:shadow">
        Skip to content
      </a>
      <SiteHeader />

      <main id="main-content">
        <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-2">
              <li className="flex items-center gap-2">
                <a href="/" className="text-xs font-semibold text-[#5F564E] hover:text-black">Home</a>
              </li>
              <li className="flex items-center gap-2">
                <span aria-hidden="true" style={{ color: BORDER }}>/</span>
                <a href="/resources/tools" className="text-xs font-semibold text-[#5F564E] hover:text-black">Free Tools</a>
              </li>
              <li className="flex items-center gap-2">
                <span aria-hidden="true" style={{ color: BORDER }}>/</span>
                <span aria-current="page" className="text-xs font-semibold text-[#3D3D3D]">ROI Calculator</span>
              </li>
            </ol>
          </nav>
        </div>

        {/* Hero */}
        <section className="relative flex flex-col items-center overflow-hidden px-6 py-14 text-center md:py-20">
          <div aria-hidden="true" className="pointer-events-none absolute -left-40 -top-36 h-[650px] w-[650px] rounded-full blur-[55px]" style={{ background: "radial-gradient(circle, rgba(34,197,94,0.26) 0%, rgba(22,163,74,0.10) 40%, transparent 68%)" }} />
          <div aria-hidden="true" className="pointer-events-none absolute -right-40 -top-24 h-[600px] w-[600px] rounded-full blur-[55px]" style={{ background: "radial-gradient(circle, rgba(59,130,246,0.18) 0%, rgba(37,99,235,0.07) 40%, transparent 68%)" }} />
          <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center">
            <div className="mb-6">
              <PillBadge>ROI Calculator</PillBadge>
            </div>
            <h1 className="mb-6 text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
              See What Your <HandUnderline>Cold Email Is Worth</HandUnderline>
            </h1>
            <p className="mb-10 max-w-3xl text-lg text-muted-foreground sm:text-xl">
              Plug in your funnel numbers or start from 2026 industry benchmarks, and watch your meetings, pipeline and ROI calculate live.
            </p>
            <Button variant="hero" size="hero" onClick={scrollToCalculator}>
              Calculate My ROI <ArrowRight aria-hidden="true" />
            </Button>
          </div>
        </section>

        {/* Calculator */}
        <section id="calculator" tabIndex={-1} aria-label="Cold email ROI calculator" className="scroll-mt-24 outline-none">
          <div className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
            <ColdEmailRoiCalculator />
          </div>
        </section>

        {/* Problem */}
        <section className="bg-secondary/30 px-6 py-24">
          <div className="mx-auto max-w-6xl text-center">
            <h2 className="mb-16 text-3xl font-black sm:text-5xl">You're Sending Cold Email Without The Math</h2>
            <div className="grid grid-cols-1 gap-8 text-left md:grid-cols-3">
              {PROBLEMS.map((p) => (
                <div key={p.title} className="rounded-2xl bg-white p-8 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md" style={{ border: `1px solid ${BORDER}`, borderTop: `3px solid ${p.color}` }}>
                  <div className="mb-4 inline-flex rounded-xl p-3" style={{ backgroundColor: `${p.color}15` }}>
                    <p.icon className="h-6 w-6" style={{ color: p.color }} aria-hidden="true" />
                  </div>
                  <h3 className="mb-3 text-xl font-black">{p.title}</h3>
                  <p className="text-muted-foreground">{p.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Full funnel */}
        <section className="bg-white px-6 py-24">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="mb-8 text-3xl font-black sm:text-5xl">See The Full Funnel, Not Just A Guess</h2>
            <p className="text-lg leading-relaxed text-muted-foreground md:text-xl">
              Follow every prospect from first email and follow ups to delivered, replies, positive replies, meetings booked, meetings held
              and deals, all the way through to revenue and ROI. Then export it as a PDF to share.
            </p>
          </div>
        </section>

        {/* How it works */}
        <section className="bg-secondary/30 px-6 py-24">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-16 text-center text-3xl font-black sm:text-5xl">How It Works</h2>
            <ol className="grid grid-cols-1 gap-12 md:grid-cols-3">
              {STEPS.map((s) => (
                <li key={s.title} className="flex flex-col items-center text-center">
                  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full text-white" style={{ backgroundColor: s.color }}>
                    <s.icon className="h-7 w-7" aria-hidden="true" />
                  </div>
                  <h3 className="mb-4 text-xl font-black">{s.title}</h3>
                  <p className="text-muted-foreground">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Why this works */}
        <section className="bg-white px-6 py-24">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-16 text-center text-3xl font-black sm:text-5xl">Why This Works</h2>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {WHY.map((w) => (
                <div key={w.title} className="flex flex-col rounded-2xl bg-secondary/20 p-8" style={{ borderLeft: `4px solid ${w.color}` }}>
                  <h3 className="mb-3 text-xl font-black">{w.title}</h3>
                  <p className="mb-2 font-medium text-foreground">{w.lead}</p>
                  <p className="text-sm text-muted-foreground">{w.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-white px-6 py-24 text-center" style={{ borderTop: `1px solid ${BORDER}` }}>
          <h2 className="mb-10 text-3xl font-black sm:text-5xl">Ready to see the real math behind your outreach?</h2>
          <Button asChild variant="hero" size="hero">
            <a href="/founder-meeting">
              Book a Call <ArrowRight aria-hidden="true" />
            </a>
          </Button>
        </section>

        {/* Try this next */}
        <section className="bg-secondary/20 px-6 py-20" style={{ borderTop: `1px solid ${BORDER}` }}>
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-10 text-center text-2xl font-black sm:text-3xl">Try this next</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {NEXT.map((n) => (
                <a key={n.href} href={n.href} className="group flex flex-col justify-between rounded-2xl border bg-white p-6 transition-all duration-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" style={{ borderColor: BORDER }}>
                  <div>
                    <h3 className="mb-2 text-base font-black">{n.title}</h3>
                    <p className="text-sm text-muted-foreground">{n.body}</p>
                  </div>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold" style={{ color: "#A14A08" }}>
                    Try it free <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </span>
                </a>
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
