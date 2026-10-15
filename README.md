# Cold Email ROI Calculator (Myntmore)

Standalone Vite + React + TypeScript + Tailwind build of `/tools/cold-email-roi-calculator`, styled to match the live LinkedIn ROI calculator at myntmore.com/tools/roi-calculator.

```bash
npm install
npm run dev     # http://localhost:5173/tools/cold-email-roi-calculator
npm test        # unit tests for src/lib/coldEmailRoi.ts
npm run build
```

## Where things live

| Path | What |
|---|---|
| `src/data/coldEmailBenchmarks.ts` | All benchmark data, bands, sources, presets, defaults, currencies, sending SOP, industry table |
| `src/lib/coldEmailRoi.ts` | Pure math (no rounding). Rates are percentages, so 3.4 means 3.4% |
| `src/lib/format.ts` | Display formatting only (INR uses en-IN grouping) |
| `src/lib/exportPdf.ts` | html2canvas + jsPDF export on the cream background with the logo |
| `src/components/calculator/` | Calculator UI. `ColdEmailRoiCalculator` is the drop-in section |
| `src/components/ui/` | shadcn-style primitives (Radix) |
| `src/components/site/` | Stand-in header, footer, badge, underline and SEO tags |
| `src/pages/` | Page layout and SEO data |

## Sending model

The visitor fills in one volume box: emails per day or new prospects per month, both at full speed. The other is worked out (1,000 emails a day = 7,500 prospects a month, at 4 emails per prospect over a 30 day month). `calculateSendingPlan` in `src/lib/coldEmailRoi.ts` then works day by day, using the rules in `SENDING_SOP`:

- Each prospect gets a first email and 3 follow ups, 5 days apart.
- Domains are sized so every id runs at full capacity: emails per day / (4 ids x 25 emails), rounded up. All domains are bought on day 1.
- Day 1: 2 ids per domain go into Smartlead and warm up for 14 days. They go live on day 15.
- Exactly one month later the other 2 ids are added and warmed for 14 days. They go live on day 15 of month 2.
- Ids work through lists of about 150 prospects each. Everyone on a list gets the first email before any follow up, then the follow ups go out 5 days apart. As soon as a list is finished the same ids start the next one, so ids are never idle.
- Ids send every day, and a month is 30 days.

The funnel runs on prospects: bounce and reply rates are per prospect, across the whole sequence.

Counts of people, meetings and deals are shown as whole numbers; the math underneath is not rounded.

Revenue is paid month by month. A customer won in month m starts paying in month m + sales cycle lag and pays deal value x invoices per year / 12 every month until their retention period ends. Only payments inside the chosen duration count, so customers won late in the plan add less.

## Default rates

The sliders start at Myntmore's own 2026 Smartlead averages (pulled 15 October 2026, stored in `BENCHMARKS[*].myntmore` and `MYNTMORE_2026`):

| Rate | Default | From |
|---|---|---|
| Bounce | 1.67% | Myntmore's 2026 average bounce rate |
| Reply | 3.8% | 256 replies / 6,657 delivered prospects, 10 completed campaigns (auto replies left out) |
| Positive share | 59% | 151 positive / 256 replies |
| Meeting booking | 47% | 71 meeting requests / 151 positive replies |
| Show-up | 75% | Published benchmark (not tracked in Smartlead) |
| Close | 12% | Published benchmark (not tracked in Smartlead) |

To refresh them, update those numbers in `src/data/coldEmailBenchmarks.ts`.

For 1,000 emails a day (7,500 prospects a month) that is 10 domains and 40 ids. Month 1: 20 ids from day 15 send 8,000 emails to 3,000 new prospects. Month 2: 23,000 emails, 6,000 prospects. Month 3 onwards: 30,000 emails a month, about 7,500 new prospects a month (it varies a little as lists finish on different days).

## Moving it into the Next.js site

1. Copy `data/coldEmailBenchmarks.ts`, `lib/coldEmailRoi.ts` (with its test), `lib/format.ts`, `lib/exportPdf.ts` and `components/calculator/` across.
2. Swap `components/ui/*` imports for the site's own shadcn components (same API).
3. Drop `components/site/SiteHeader`, `SiteFooter` and `Seo`, and use the site's layout. Turn `pages/seo.ts` into `export const metadata` and render the JSON-LD with a script tag.
4. Add `"use client"` to `ColdEmailRoiCalculator.tsx` and the components it imports.
5. Create `app/tools/cold-email-roi-calculator/page.tsx` from `pages/ColdEmailRoiCalculatorPage.tsx`. Pass the site's logo path to `<ColdEmailRoiCalculator logoSrc=... />`.

## Deploying to Vercel

The repo is ready to import into Vercel as is. `vercel.json` sets the Vite framework, `npm ci`, `npm run build` and the `dist` output, so no dashboard settings are needed.

- `/` redirects to `/tools/cold-email-roi-calculator`.
- Every other path falls back to `index.html` so client-side routes load. Hashed files in `/assets` are cached for a year.
- Node 20.19 or newer is required (set in `package.json` `engines`).
- The canonical URL and Open Graph tags point to `https://www.myntmore.com/tools/cold-email-roi-calculator`. Change `SITE_URL` in `src/pages/seo.ts` if this deployment should be the canonical page.
