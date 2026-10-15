/**
 * All benchmark data, defaults and model constants for the cold email ROI calculator.
 * The UI and lib/coldEmailRoi.ts import from here. Nothing numeric should live in components.
 *
 * Rates are stored as percentages (3.4 means 3.4%).
 */

export type MetricKey =
  | "bounceRate"
  | "replyRate"
  | "positiveShare"
  | "bookingRate"
  | "showRate"
  | "closeRate";

/** Visual tone for a "where you stand" chip. */
export type BandTone = "warn" | "average" | "good" | "great" | "bad";

export interface Band {
  label: string;
  /** Inclusive lower bound, in percent. */
  min: number;
  /** Exclusive upper bound, in percent. The last band uses Infinity. */
  max: number;
  tone: BandTone;
}

export interface BenchmarkSource {
  name: string;
  url: string;
  note: string;
}

export interface MetricBenchmark {
  key: MetricKey;
  label: string;
  unit: "%";
  /** Short label for the funnel step the percentage applies to. */
  appliesTo: string;
  /** Starting value for the slider: Myntmore's 2026 average where Smartlead tracks it, else the published average. */
  defaultValue: number;
  /** Myntmore's own 2026 Smartlead average, when Smartlead tracks this step. */
  myntmore?: { value: number; detail: string[] };
  bands: Band[];
  /** Published benchmark, one short line per fact. */
  typicalRange: string[];
  /** The benchmark in a few words, for the one-line caption under the slider. */
  shortRange: string;
  sources: BenchmarkSource[];
  slider: { min: number; max: number; step: number };
  /**
   * Show the soft "above the best published results" warning when the value is above this.
   * Left undefined where lower is better (bounce rate).
   */
  warnAbove?: number;
  /** Tooltip copy for the input label. */
  help: string;
}

export const BENCHMARKS: Record<MetricKey, MetricBenchmark> = {
  bounceRate: {
    key: "bounceRate",
    label: "Bounce rate",
    unit: "%",
    appliesTo: "of prospects",
    defaultValue: 1.67,
    myntmore: { value: 1.67, detail: ["Myntmore's 2026 average bounce rate"] },
    bands: [
      { label: "Healthy", min: 0, max: 2, tone: "good" },
      { label: "Watch", min: 2, max: 4, tone: "warn" },
      { label: "Too high", min: 4, max: Infinity, tone: "bad" },
    ],
    typicalRange: ["Keep under 2%", "Typical sender: 1.54%", "Above 4% hurts sender reputation"],
    shortRange: "under 2%",
    sources: [
      {
        name: "Smartlead",
        url: "https://www.smartlead.ai/blog/cold-email-bounce-rate",
        note: "Cold email bounce rate guidance",
      },
      {
        name: "Modern Inbound",
        url: "https://moderninbound.com/blog/cold-email-bounce-rate-benchmarks-2026",
        note: "Cold email bounce rate benchmarks, 2026",
      },
    ],
    slider: { min: 0, max: 10, step: 0.01 },
    help: "Share of prospects whose address bounces because it is invalid or the mailbox is full. Prospects delivered = prospects reached x (1 - bounce rate).",
  },
  replyRate: {
    key: "replyRate",
    label: "Reply rate",
    unit: "%",
    appliesTo: "of delivered prospects",
    defaultValue: 3.8,
    myntmore: {
      value: 3.8,
      detail: ["256 replies from 6,657 delivered prospects", "10 completed campaigns of 2026", "Out of office and auto replies left out"],
    },
    bands: [
      { label: "Below average", min: 0, max: 2, tone: "warn" },
      { label: "Average", min: 2, max: 3.5, tone: "average" },
      { label: "Above average", min: 3.5, max: 5.5, tone: "good" },
      { label: "Top quartile", min: 5.5, max: 10, tone: "great" },
      { label: "Elite", min: 10, max: Infinity, tone: "great" },
    ],
    typicalRange: ["Average: 2 to 3.5%", "Top quartile: 5.5%", "Elite: 10%+"],
    shortRange: "2 to 3.5%",
    sources: [
      {
        name: "Instantly 2026 benchmark report",
        url: "https://emailbison.com/blogs/cold-email-open-rates",
        note: "Average 3.43%, top quartile 5.5%, elite 10%+",
      },
      {
        name: "Saleshandy, 53M emails",
        url: "https://www.saleshandy.com/blog/cold-email-statistics/",
        note: "Average 3.7%",
      },
      {
        name: "Puzzle Inbox",
        url: "https://puzzleinbox.com/blog/cold-email-reply-rate-benchmarks-2026-by-segment",
        note: "Average 2 to 3%, top 10% 4 to 6%",
      },
      {
        name: "Smartlead, 850M emails",
        url: "https://www.smartlead.ai/benchmarks",
        note: "Typical sender 0.74%, top 10% 2.63%",
      },
    ],
    slider: { min: 0, max: 15, step: 0.1 },
    warnAbove: 10,
    help: "Share of delivered prospects who reply at any point in the sequence (first email or any follow up), including not interested replies.",
  },
  positiveShare: {
    key: "positiveShare",
    label: "Positive reply share",
    unit: "%",
    appliesTo: "of replies",
    defaultValue: 59,
    myntmore: { value: 59, detail: ["151 positive of 256 replies", "Meeting request, information request, interested"] },
    bands: [
      { label: "Low", min: 0, max: 30, tone: "warn" },
      { label: "Average", min: 30, max: 50, tone: "average" },
      { label: "Strong", min: 50, max: Infinity, tone: "great" },
    ],
    typicalRange: ["30 to 50% of replies are positive"],
    shortRange: "30 to 50%",
    sources: [
      {
        name: "Saleshandy via EmailBison",
        url: "https://emailbison.com/blogs/cold-email-open-rates",
        note: "30 to 50% of replies are positive",
      },
      {
        name: "Cleverly",
        url: "https://www.cleverly.co/blog/cold-email-benchmarks-by-industry",
        note: "40 to 60%",
      },
    ],
    slider: { min: 0, max: 100, step: 1 },
    // Upper end of the Cleverly range. Not a published "elite" level.
    warnAbove: 60,
    help: "Share of replies that show real interest. The rest is negative or not interested, and is calculated for you.",
  },
  bookingRate: {
    key: "bookingRate",
    label: "Meeting booking rate",
    unit: "%",
    appliesTo: "of positive replies",
    defaultValue: 47,
    myntmore: { value: 47, detail: ["71 meeting requests of 151 positive replies", "Smartlead tracks requests, not calendar bookings"] },
    bands: [
      { label: "Low", min: 0, max: 30, tone: "warn" },
      { label: "Average", min: 30, max: 50, tone: "average" },
      { label: "Strong", min: 50, max: Infinity, tone: "great" },
    ],
    typicalRange: ["20 to 50% of positive replies become meetings"],
    shortRange: "20 to 50%",
    sources: [
      {
        name: "JoinSync",
        url: "https://joinsync.substack.com/p/why-most-cold-outreach-fails",
        note: "20 to 50%",
      },
      {
        name: "Cleverly",
        url: "https://www.cleverly.co/blog/cold-email-benchmarks-by-industry",
        note: "30 to 60%",
      },
    ],
    slider: { min: 0, max: 100, step: 1 },
    // Upper end of the Cleverly range. Not a published "elite" level.
    warnAbove: 60,
    help: "Share of positive replies that end up as a booked meeting on the calendar.",
  },
  showRate: {
    key: "showRate",
    label: "Meeting show-up rate",
    unit: "%",
    appliesTo: "of booked meetings",
    defaultValue: 75,
    bands: [
      { label: "Low", min: 0, max: 70, tone: "warn" },
      { label: "Average", min: 70, max: 85, tone: "average" },
      { label: "Strong", min: 85, max: Infinity, tone: "great" },
    ],
    typicalRange: ["About 80%", "Top teams: 85%+"],
    shortRange: "about 80%",
    sources: [
      {
        name: "Leadhaste",
        url: "https://www.leadhaste.com/blog/outbound-sales-benchmarks-2026",
        note: "About 80%",
      },
      {
        name: "EngageTech, cited by Prospeo",
        url: "https://prospeo.io/s/outbound-sales-conversion-rates",
        note: "67% hold rate",
      },
    ],
    slider: { min: 0, max: 100, step: 1 },
    // Well above the "top teams 85%+" line. Not a published "elite" level.
    warnAbove: 90,
    help: "Share of booked meetings that actually happen. No-shows and cancellations are the rest.",
  },
  closeRate: {
    key: "closeRate",
    label: "Close rate",
    unit: "%",
    appliesTo: "of held first meetings",
    defaultValue: 12,
    bands: [
      { label: "Low", min: 0, max: 10, tone: "warn" },
      { label: "Average", min: 10, max: 20, tone: "average" },
      { label: "Strong", min: 20, max: Infinity, tone: "great" },
    ],
    typicalRange: ["Qualified opportunities: about 21%", "First meetings from cold outreach: 8 to 15%"],
    shortRange: "8 to 21%",
    sources: [
      {
        name: "Prospeo",
        url: "https://prospeo.io/s/average-sales-close-rate",
        note: "About 21% B2B average",
      },
      {
        name: "First Page Sage via SerpSculpt",
        url: "https://serpsculpt.com/b2b-saas-demo-to-close-rate-benchmark/",
        note: "12% B2B SaaS, SQL to closed won",
      },
      {
        name: "Landbase via SerpSculpt",
        url: "https://serpsculpt.com/b2b-saas-demo-to-close-rate-benchmark/",
        note: "Win rate by deal size: under $50K 25 to 35%, over $250K 12 to 22%",
      },
    ],
    slider: { min: 0, max: 100, step: 1 },
    // Top of the published win rate by deal size (small deals). Not a published "elite" level.
    warnAbove: 35,
    help: "Share of held first meetings that turn into a paying customer. Used exactly as entered.",
  },
};

/** Order the rate sliders appear in the funnel. */
export const RATE_ORDER: MetricKey[] = [
  "bounceRate",
  "replyRate",
  "positiveShare",
  "bookingRate",
  "showRate",
  "closeRate",
];

export const SOFT_WARNING_COPY =
  "This is above the best published results. Double check before you plan around it.";

/* ------------------------------------------------------------------ */
/* Input options and defaults                                          */
/* ------------------------------------------------------------------ */

export interface Currency {
  code: string;
  symbol: string;
  label: string;
  /** Locale used for number grouping. INR uses en-IN. */
  locale: string;
}

export const CURRENCIES: Currency[] = [
  { code: "USD", symbol: "$", label: "USD - United States Dollar", locale: "en-US" },
  { code: "INR", symbol: "₹", label: "INR - Indian Rupee", locale: "en-IN" },
  { code: "AUD", symbol: "A$", label: "AUD - Australian Dollar", locale: "en-US" },
  { code: "AED", symbol: "د.إ", label: "AED - UAE Dirham", locale: "en-US" },
  { code: "SGD", symbol: "S$", label: "SGD - Singapore Dollar", locale: "en-US" },
  { code: "HKD", symbol: "HK$", label: "HKD - Hong Kong Dollar", locale: "en-US" },
  { code: "CNY", symbol: "¥", label: "CNY - Chinese Yuan", locale: "en-US" },
  { code: "JPY", symbol: "¥", label: "JPY - Japanese Yen", locale: "en-US" },
  { code: "CAD", symbol: "C$", label: "CAD - Canadian Dollar", locale: "en-US" },
];

/** No 1 month option: it takes about 2 months to get all domains and ids live (see SENDING_SOP). */
export const DURATION_OPTIONS: { months: number; label: string }[] = [
  { months: 3, label: "3 Months" },
  { months: 6, label: "6 Months" },
  { months: 12, label: "12 Months" },
];

export type VolumeMode = "emails" | "prospects";

export interface CalculatorState {
  currency: string;
  /** Which volume box the visitor fills in. The other is calculated. */
  volumeMode: VolumeMode;
  /** Emails per day at full speed, used when volumeMode is "emails". */
  dailyEmailTarget: number;
  /** New prospects per month at full speed, used when volumeMode is "prospects". */
  monthlyProspectTarget: number;
  durationMonths: number;
  bounceRate: number;
  replyRate: number;
  positiveShare: number;
  bookingRate: number;
  showRate: number;
  closeRate: number;
  /** null means the visitor has not entered a value yet. */
  dealValue: number | null;
  invoicesPerYear: number;
  retentionMonths: number;
  monthlyInvestment: number | null;
  salesCycleLagMonths: number;
}

export const DEFAULT_STATE: CalculatorState = {
  currency: "USD",
  volumeMode: "emails",
  dailyEmailTarget: 1000,
  monthlyProspectTarget: 7500,
  durationMonths: 12,
  bounceRate: BENCHMARKS.bounceRate.defaultValue,
  replyRate: BENCHMARKS.replyRate.defaultValue,
  positiveShare: BENCHMARKS.positiveShare.defaultValue,
  bookingRate: BENCHMARKS.bookingRate.defaultValue,
  showRate: BENCHMARKS.showRate.defaultValue,
  closeRate: BENCHMARKS.closeRate.defaultValue,
  dealValue: null,
  invoicesPerYear: 1,
  retentionMonths: 12,
  monthlyInvestment: null,
  salesCycleLagMonths: 0,
};

/* ------------------------------------------------------------------ */
/* Model constants                                                     */
/* ------------------------------------------------------------------ */

export const MODEL = {
  /** Highest sales cycle lag the input accepts. */
  maxSalesCycleLagMonths: 12,
} as const;

/**
 * Myntmore sending ramp. Every domain gets the same schedule, and all domains are bought on day 1:
 * - Day 1: buy the domain, create the first 2 ids, add them to Smartlead and start warm-up.
 * - Warm up 14 days. The first 2 ids send from day 15.
 * - Exactly one month later: add the other 2 ids, warm up 14 days. From day 15 of month 2 all 4 ids send.
 * - Each id sends at most 25 emails a day. Ids send every day, and a month is counted as 30 days.
 * - Each prospect gets a first email plus 3 follow ups, 5 days apart.
 * - Ids work through lists of about 150 prospects each. Everyone on a list gets the first email first
 *   (up to 25 a day per id), then the follow ups. As soon as a list is done the ids start the next one,
 *   so ids are never idle. Domains are sized so every id runs at full capacity.
 */
export const SENDING_SOP = {
  emailsPerIdPerDay: 25,
  /** First email plus follow ups. */
  emailsPerProspect: 4,
  followUpGapDays: 5,
  /** Prospects per id on each list, at 25 emails a day. */
  prospectsPerIdPerList: 150,
  idsPerDomain: 4,
  /** Ids per domain created on day 1. The rest are added one month later. */
  firstBatchIds: 2,
  warmupDays: 14,
  daysPerMonth: 30,
  /** Month in which the second batch of ids is added. */
  secondBatchMonth: 2,
} as const;

/** Where the Myntmore defaults come from. Pulled from Smartlead on 15 October 2026. */
export const MYNTMORE_2026 = {
  source: "Myntmore Smartlead campaigns, January to October 2026",
  campaigns: 17,
  completedCampaigns: 10,
  prospects: 12453,
  summary: [
    "Defaults use Myntmore's own 2026 Smartlead campaigns",
    "Show-up and close rates are not tracked in Smartlead, so they use published benchmarks",
  ],
};

/* ------------------------------------------------------------------ */
/* Derived checks and reference lines                                  */
/* ------------------------------------------------------------------ */

export const MEETINGS_PER_1000_REFERENCE = {
  lines: [
    "Myntmore 2026: 10.2 meeting requests per 1,000 prospects",
    "Well run campaigns: 4 to 10 per 1,000 emails (Modern Inbound)",
    "Enterprise 3 to 8, mid market 5 to 15, SMB 10 to 25 (Cleverly)",
  ],
  source: {
    name: "Modern Inbound",
    url: "https://moderninbound.com/blog/cold-email-conversion-rate-benchmarks",
    note: "Cold email conversion rate benchmarks",
  },
};

export const POSITIVE_REPLY_RATE_REFERENCE = {
  formulaLabel: "Positive reply rate (reply rate x share)",
  lines: ["Myntmore 2026: 2.3%", "Average: 0.5 to 1.0%", "Top 10%: 1.5 to 3.0% (Puzzle Inbox)"],
  source: {
    name: "Puzzle Inbox",
    url: "https://puzzleinbox.com/blog/cold-email-reply-rate-benchmarks-2026-by-segment",
    note: "Cold email reply rate benchmarks by segment, 2026",
  },
};

export const COST_REFERENCE = {
  lines: ["Typical: $100 to $300 per qualified meeting (Prospeo)", "Best seen: about $152 per meeting (Instantly)"],
  sources: [
    { name: "Prospeo", url: "https://prospeo.io/s/email-outreach-qa", note: "Cost per qualified meeting" },
    {
      name: "Instantly",
      url: "https://instantly.ai/blog/email-sequence-benchmarks-2026-whats-a-good-open-rate-reply-rate-and-cost-per-meeting/",
      note: "Cost per meeting, 2026 benchmarks",
    },
  ] as BenchmarkSource[],
};

/* ------------------------------------------------------------------ */
/* Industry table                                                      */
/* ------------------------------------------------------------------ */

export interface IndustryRow {
  key: string;
  label: string;
  replyMin: number;
  replyMax: number;
  positiveReplyRange: string;
  /** True when no figure is published and the lowest range in the table is used instead. */
  positiveReplyEstimated?: boolean;
}

export const INDUSTRIES: IndustryRow[] = [
  { key: "saas", label: "B2B SaaS / Software", replyMin: 2, replyMax: 4, positiveReplyRange: "1-2%" },
  { key: "services", label: "B2B Services and Agencies", replyMin: 2, replyMax: 6, positiveReplyRange: "0.8-1.5%" },
  { key: "it", label: "IT Services and MSPs", replyMin: 3, replyMax: 4, positiveReplyRange: "0.3-0.7%", positiveReplyEstimated: true },
  { key: "manufacturing", label: "Manufacturing and Industrial", replyMin: 1.5, replyMax: 5, positiveReplyRange: "0.5-1.0%" },
  { key: "healthcare", label: "Healthcare and MedTech", replyMin: 1.5, replyMax: 6, positiveReplyRange: "0.5-1.0%" },
  { key: "finance", label: "Financial Services", replyMin: 2, replyMax: 4, positiveReplyRange: "0.7-1.2%" },
  { key: "education", label: "Education / EdTech", replyMin: 1.5, replyMax: 7, positiveReplyRange: "0.5-1.0%" },
  { key: "ecommerce", label: "E-commerce / DTC / Consumer", replyMin: 1, replyMax: 4, positiveReplyRange: "0.8-1.5%" },
  { key: "realestate", label: "Real Estate", replyMin: 1.5, replyMax: 7, positiveReplyRange: "0.5-1.0%" },
  { key: "legal", label: "Legal", replyMin: 8, replyMax: 10, positiveReplyRange: "0.3-0.7%", positiveReplyEstimated: true },
  { key: "government", label: "Government / Public sector", replyMin: 1, replyMax: 2, positiveReplyRange: "0.3-0.7%" },
];

export const INDUSTRY_ESTIMATE_NOTE = "No published figure. The lowest range in this table is used.";

export const INDUSTRY_NOTE =
  "Ranges across published 2026 sources. Your results depend on list quality, offer and deliverability.";

export const INDUSTRY_SOURCES: BenchmarkSource[] = [
  {
    name: "Puzzle Inbox",
    url: "https://puzzleinbox.com/blog/cold-email-reply-rate-benchmarks-2026-by-segment",
    note: "Reply and positive reply rates by segment",
  },
  {
    name: "Cleverly",
    url: "https://www.cleverly.co/blog/cold-email-benchmarks-by-industry",
    note: "Cold email benchmarks by industry",
  },
];

export const FOOTNOTE =
  "Benchmarks compiled from Instantly, Saleshandy, Smartlead, Woodpecker, Puzzle Inbox, Cleverly and others, 2026. Results vary. This is an estimate, not a guarantee.";
