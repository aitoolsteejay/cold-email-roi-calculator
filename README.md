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
