/**
 * Pure cold email ROI math. No React, no formatting, no rounding.
 * Rates are percentages (3.4 means 3.4%). Everything stays unrounded until display.
 * The funnel runs on prospects: bounce and reply rates are per prospect, across the whole email sequence.
 */
import {
  BENCHMARKS,
  MODEL,
  SENDING_SOP,
  type Band,
  type MetricKey,
} from "@/data/coldEmailBenchmarks";

export interface RoiInputs {
  /** New prospects per month wanted once every domain runs at full speed. */
  monthlyProspectTarget: number;
  durationMonths: number;
  bounceRate: number;
  replyRate: number;
  positiveShare: number;
  bookingRate: number;
  showRate: number;
  closeRate: number;
  dealValue: number;
  invoicesPerYear: number;
  retentionMonths: number;
  monthlyInvestment: number;
  salesCycleLagMonths: number;
}

export interface MonthPoint {
  month: number;
  /** Cumulative revenue at the end of this month. */
  revenue: number;
  /** Cumulative service cost at the end of this month. */
  cost: number;
  /** Cumulative revenue minus cumulative cost. */
  profit: number;
}

/** A run of days within one month where the same ids start the same number of new prospects a day. */
export interface SendSegment {
  fromDay: number;
  toDay: number;
  idsSending: number;
  newProspectsPerDay: number;
}

export interface SendMonth {
  month: number;
  /** Ids added to Smartlead on day 1 of this month. They warm up and cannot send yet. */
  idsAdded: number;
  /** Last warm-up day for the ids added this month, or 0 when none were added. */
  warmupUntilDay: number;
  /** Ids sending on the last day of the month. */
  idsSendingAtEnd: number;
  /** New prospects who got their first email this month. */
  prospects: number;
  /** All emails sent this month: first emails plus follow ups. */
  sent: number;
  segments: SendSegment[];
}

export interface SendingPlan {
  domains: number;
  ids: number;
  /** New prospects per month at full speed (the target). */
  prospectsPerMonth: number;
  /** Average emails per day at full speed. */
  emailsPerDay: number;
  months: SendMonth[];
  totalProspects: number;
  totalSent: number;
}

export interface RoiResult {
  plan: SendingPlan;
  /** New prospects reached over the duration. */
  prospects: number;
  /** Emails sent over the duration. */
  sent: number;
  delivered: number;
  replies: number;
  positive: number;
  negative: number;
  booked: number;
  held: number;
  /** Deals the full funnel produces over the send period. */
  deals: number;
  /** Deals that close early enough to count inside the duration (sales cycle lag). */
  dealsCounted: number;
  effectiveLTV: number;
  fullLTV: number;
  revenue: number;
  cost: number;
  /** Null when cost is zero. */
  roiPercent: number | null;
  meetingsPer1000Prospects: number;
  costPerBookedMeeting: number | null;
  costPerCustomer: number | null;
  /** First month cumulative profit is above zero. Null when it never is. */
  paybackMonth: number | null;
  monthly: MonthPoint[];
}

/** Finite and at least zero, otherwise zero. Guards NaN, Infinity and negatives. */
export function safeNumber(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function safeRate(value: unknown): number {
  return Math.min(100, safeNumber(value));
}

function div(a: number, b: number): number | null {
  return b > 0 && Number.isFinite(a / b) ? a / b : null;
}

/** Share of prospects reached that end up as a deal, as a fraction (not a percent). */
function funnelFraction(i: RoiInputs): number {
  const p = (v: number) => safeRate(v) / 100;
  return (
    (1 - p(i.bounceRate)) *
    p(i.replyRate) *
    p(i.positiveShare) *
    p(i.bookingRate) *
    p(i.showRate) *
    p(i.closeRate)
  );
}

export function calculateLtv(i: Pick<RoiInputs, "dealValue" | "invoicesPerYear" | "retentionMonths" | "durationMonths">) {
  const deal = safeNumber(i.dealValue);
  const invoices = safeNumber(i.invoicesPerYear);
  const retention = safeNumber(i.retentionMonths);
  const duration = safeNumber(i.durationMonths);
  return {
    effectiveLTV: (deal * invoices * Math.min(duration, retention)) / 12,
    fullLTV: (deal * invoices * retention) / 12,
  };
}

/** Meetings booked for each prospect reached. Multiply by a month's prospects to get that month's meetings. */
export function bookedPerProspect(i: Pick<RoiInputs, "bounceRate" | "replyRate" | "positiveShare" | "bookingRate">): number {
  return meetingsPer1000Prospects(i) / 1000;
}

/** Meetings booked per 1,000 prospects reached, from the rates alone. */
export function meetingsPer1000Prospects(i: Pick<RoiInputs, "bounceRate" | "replyRate" | "positiveShare" | "bookingRate">): number {
  const p = (v: number) => safeRate(v) / 100;
  return 1000 * (1 - p(i.bounceRate)) * p(i.replyRate) * p(i.positiveShare) * p(i.bookingRate);
}

export function calculateRoi(raw: RoiInputs): RoiResult {
  const months = Math.max(0, Math.floor(safeNumber(raw.durationMonths)));
  const monthlyInvestment = safeNumber(raw.monthlyInvestment);
  const lag = Math.min(Math.floor(safeNumber(raw.salesCycleLagMonths)), MODEL.maxSalesCycleLagMonths);

  const plan = calculateSendingPlan(raw.monthlyProspectTarget, months);
  const prospects = plan.totalProspects;
  const sent = plan.totalSent;
  const delivered = prospects * (1 - safeRate(raw.bounceRate) / 100);
  const replies = delivered * (safeRate(raw.replyRate) / 100);
  const positive = replies * (safeRate(raw.positiveShare) / 100);
  const negative = replies - positive;
  const booked = positive * (safeRate(raw.bookingRate) / 100);
  const held = booked * (safeRate(raw.showRate) / 100);
  const deals = held * (safeRate(raw.closeRate) / 100);

  const { effectiveLTV, fullLTV } = calculateLtv({ ...raw, durationMonths: months });
  const fraction = funnelFraction(raw);
  const cost = monthlyInvestment * months;

  // Month by month. Deals from the prospects reached in month m start paying in month m + lag.
  // Each customer then pays deal value x invoices per year / 12 every month for the retention period.
  // Only payments inside the duration count, so a customer won late in the plan adds less revenue.
  const retention = Math.floor(safeNumber(raw.retentionMonths));
  const perCustomerPerMonth = (safeNumber(raw.dealValue) * safeNumber(raw.invoicesPerYear)) / 12;
  const revenueInMonth: number[] = new Array(months).fill(0);
  let dealsCounted = 0;
  plan.months.forEach((m, idx) => {
    const dealsWon = m.prospects * fraction;
    const firstPayMonth = idx + 1 + lag;
    if (firstPayMonth > months) return;
    dealsCounted += dealsWon;
    const lastPayMonth = Math.min(months, firstPayMonth + retention - 1);
    for (let pay = firstPayMonth; pay <= lastPayMonth; pay++) revenueInMonth[pay - 1] += dealsWon * perCustomerPerMonth;
  });

  const monthly: MonthPoint[] = [];
  let cumRevenue = 0;
  let paybackMonth: number | null = null;
  for (let m = 1; m <= months; m++) {
    cumRevenue += revenueInMonth[m - 1];
    const cumCost = monthlyInvestment * m;
    const profit = cumRevenue - cumCost;
    monthly.push({ month: m, revenue: cumRevenue, cost: cumCost, profit });
    if (paybackMonth === null && profit > 0) paybackMonth = m;
  }

  const revenue = cumRevenue;
  const roiRatio = div(revenue - cost, cost);

  return {
    plan,
    prospects,
    sent,
    delivered,
    replies,
    positive,
    negative,
    booked,
    held,
    deals,
    dealsCounted,
    effectiveLTV,
    fullLTV,
    revenue,
    cost,
    roiPercent: roiRatio === null ? null : roiRatio * 100,
    meetingsPer1000Prospects: meetingsPer1000Prospects(raw),
    costPerBookedMeeting: div(cost, booked),
    costPerCustomer: div(cost, deals),
    paybackMonth,
    monthly,
  };
}

/** Emails per day and prospects per month convert through the sequence length and a 30 day month. */
export function prospectsFromDailyEmails(dailyEmails: number, sop = SENDING_SOP): number {
  return (safeNumber(dailyEmails) * sop.daysPerMonth) / sop.emailsPerProspect;
}

export function dailyEmailsFromProspects(monthlyProspects: number, sop = SENDING_SOP): number {
  return (safeNumber(monthlyProspects) * sop.emailsPerProspect) / sop.daysPerMonth;
}

/** Ids at about 150 new prospects each a month, rounded up to whole domains of 4 ids. */
export function calculateInfrastructure(monthlyProspectTarget: number, sop = SENDING_SOP) {
  const prospects = safeNumber(monthlyProspectTarget);
  const idsNeeded = Math.ceil(prospects / sop.prospectsPerIdPerMonth);
  const domains = Math.ceil(idsNeeded / sop.idsPerDomain);
  return {
    domains,
    ids: domains * sop.idsPerDomain,
    prospectsPerMonth: prospects,
    emailsPerDay: dailyEmailsFromProspects(prospects, sop),
  };
}

/**
 * Day by day plan over the duration, following the ramp in SENDING_SOP.
 * Each day, live ids start new prospects (target / 30, capped at 150 a month per live id),
 * and every earlier prospect gets its follow ups 5, 10 and 15 days after the first email.
 * Daily sends never go above live ids x 25.
 */
export function calculateSendingPlan(monthlyProspectTarget: number, durationMonths: number, sop = SENDING_SOP): SendingPlan {
  const infra = calculateInfrastructure(monthlyProspectTarget, sop);
  const months = Math.max(0, Math.floor(safeNumber(durationMonths)));
  const totalDays = months * sop.daysPerMonth;
  const targetPerDay = infra.prospectsPerMonth / sop.daysPerMonth;
  const perIdPerDay = sop.prospectsPerIdPerMonth / sop.daysPerMonth;
  const firstBatch = infra.domains * sop.firstBatchIds;
  const secondBatch = infra.domains * (sop.idsPerDomain - sop.firstBatchIds);
  const firstLiveDay = sop.warmupDays + 1;
  const secondLiveDay = (sop.secondBatchMonth - 1) * sop.daysPerMonth + sop.warmupDays + 1;
  const followUpOffsets = Array.from({ length: sop.emailsPerProspect - 1 }, (_, i) => (i + 1) * sop.followUpGapDays);

  // newOnDay[d] = prospects whose first email goes out on day d (1-based).
  const newOnDay: number[] = new Array(totalDays + 1).fill(0);
  const plan: SendMonth[] = [];

  for (let m = 1; m <= months; m++) {
    const segments: SendSegment[] = [];
    let prospects = 0;
    let sent = 0;
    const idsAdded = (m === 1 ? firstBatch : 0) + (m === sop.secondBatchMonth ? secondBatch : 0);
    for (let dayOfMonth = 1; dayOfMonth <= sop.daysPerMonth; dayOfMonth++) {
      const day = (m - 1) * sop.daysPerMonth + dayOfMonth;
      const idsSending = (day >= firstLiveDay ? firstBatch : 0) + (day >= secondLiveDay ? secondBatch : 0);
      const followUps = followUpOffsets.reduce((t, off) => t + (day - off >= 1 ? newOnDay[day - off] : 0), 0);
      const capacity = idsSending * sop.emailsPerIdPerDay;
      const fresh = Math.max(0, Math.min(targetPerDay, idsSending * perIdPerDay, capacity - followUps));
      newOnDay[day] = fresh;
      prospects += fresh;
      sent += fresh + Math.min(followUps, capacity);

      const last = segments[segments.length - 1];
      if (last && last.idsSending === idsSending && last.newProspectsPerDay === fresh) last.toDay = dayOfMonth;
      else segments.push({ fromDay: dayOfMonth, toDay: dayOfMonth, idsSending, newProspectsPerDay: fresh });
    }
    const idsSendingAtEnd = segments[segments.length - 1]?.idsSending ?? 0;
    plan.push({ month: m, idsAdded, warmupUntilDay: idsAdded > 0 ? sop.warmupDays : 0, idsSendingAtEnd, prospects, sent, segments });
  }

  return {
    ...infra,
    months: plan,
    totalProspects: plan.reduce((t, m) => t + m.prospects, 0),
    totalSent: plan.reduce((t, m) => t + m.sent, 0),
  };
}

/** The band a value falls in, or null when the metric has no bands. */
export function bandFor(metric: MetricKey, value: number): Band | null {
  const bands = BENCHMARKS[metric].bands;
  const v = safeNumber(value);
  return bands.find((b) => v >= b.min && v < b.max) ?? bands[bands.length - 1] ?? null;
}

export function isAboveBestPublished(metric: MetricKey, value: number): boolean {
  const limit = BENCHMARKS[metric].warnAbove;
  return limit !== undefined && safeNumber(value) > limit;
}

/** Counts of the stage each rate slider acts on, used for the "3.4% = 2,009" readout. */
export function stageCounts(r: RoiResult, bounceRate: number) {
  const bounced = r.prospects * (safeRate(bounceRate) / 100);
  return {
    bounceRate: bounced,
    replyRate: r.replies,
    positiveShare: r.positive,
    bookingRate: r.booked,
    showRate: r.held,
    closeRate: r.deals,
    negative: r.negative,
  } as const;
}
