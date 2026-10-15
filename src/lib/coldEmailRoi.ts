/**
 * Pure cold email ROI math. No React, no formatting, no rounding.
 * Rates are percentages (3.4 means 3.4%). Everything stays unrounded until display.
 */
import {
  BENCHMARKS,
  MODEL,
  SENDING_SOP,
  type Band,
  type MetricKey,
} from "@/data/coldEmailBenchmarks";

export interface RoiInputs {
  /** Emails per day wanted once every domain runs at full capacity. */
  dailyEmailTarget: number;
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

/** A run of days within one month where the same number of ids send the same daily volume. */
export interface SendSegment {
  fromDay: number;
  toDay: number;
  idsSending: number;
  emailsPerDay: number;
}

export interface SendMonth {
  month: number;
  sent: number;
  segments: SendSegment[];
}

export interface SendingPlan {
  domains: number;
  ids: number;
  /** Emails per day the infrastructure can send once all ids are live. */
  fullCapacityPerDay: number;
  /** Emails per day actually sent at full speed: the target, capped by capacity. */
  fullSpeedPerDay: number;
  months: SendMonth[];
  totalSent: number;
}

export interface RoiResult {
  plan: SendingPlan;
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
  meetingsPer1000: number;
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

/** Share of emails sent that survive each funnel step, as a fraction (not a percent). */
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

/** Meetings booked per 1,000 emails sent, from the rates alone. */
export function meetingsPer1000(i: Pick<RoiInputs, "bounceRate" | "replyRate" | "positiveShare" | "bookingRate">): number {
  const p = (v: number) => safeRate(v) / 100;
  return 1000 * (1 - p(i.bounceRate)) * p(i.replyRate) * p(i.positiveShare) * p(i.bookingRate);
}

export function calculateRoi(raw: RoiInputs): RoiResult {
  const months = Math.max(0, Math.floor(safeNumber(raw.durationMonths)));
  const monthlyInvestment = safeNumber(raw.monthlyInvestment);
  const lag = Math.min(Math.floor(safeNumber(raw.salesCycleLagMonths)), MODEL.maxSalesCycleLagMonths);

  const plan = calculateSendingPlan(raw.dailyEmailTarget, months);
  const sent = plan.totalSent;
  const delivered = sent * (1 - safeRate(raw.bounceRate) / 100);
  const replies = delivered * (safeRate(raw.replyRate) / 100);
  const positive = replies * (safeRate(raw.positiveShare) / 100);
  const negative = replies - positive;
  const booked = positive * (safeRate(raw.bookingRate) / 100);
  const held = booked * (safeRate(raw.showRate) / 100);
  const deals = held * (safeRate(raw.closeRate) / 100);

  const { effectiveLTV, fullLTV } = calculateLtv({ ...raw, durationMonths: months });
  const fraction = funnelFraction(raw);
  const cost = monthlyInvestment * months;

  // Month by month. Deals closed in month m are paid out in month m + lag; anything past the duration is dropped.
  const dealsClosedInMonth: number[] = [];
  plan.months.forEach((m) => dealsClosedInMonth.push(m.sent * fraction));
  const revenueInMonth: number[] = new Array(months).fill(0);
  let dealsCounted = 0;
  dealsClosedInMonth.forEach((d, idx) => {
    const payoutMonth = idx + 1 + lag;
    if (payoutMonth <= months) {
      revenueInMonth[payoutMonth - 1] += d * effectiveLTV;
      dealsCounted += d;
    }
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
    meetingsPer1000: meetingsPer1000(raw),
    costPerBookedMeeting: div(cost, booked),
    costPerCustomer: div(cost, deals),
    paybackMonth,
    monthly,
  };
}

/** Domains and ids needed so every domain runs at full capacity for the daily target. */
export function calculateInfrastructure(dailyEmailTarget: number, sop = SENDING_SOP) {
  const target = safeNumber(dailyEmailTarget);
  const perDomainPerDay = sop.idsPerDomain * sop.emailsPerIdPerDay;
  const domains = Math.ceil(target / perDomainPerDay);
  const ids = domains * sop.idsPerDomain;
  const fullCapacityPerDay = ids * sop.emailsPerIdPerDay;
  return { domains, ids, fullCapacityPerDay, fullSpeedPerDay: Math.min(target, fullCapacityPerDay) };
}

/**
 * Day by day sending volume over the duration, following the ramp in SENDING_SOP.
 * Each day sends the lower of the daily target and what the live ids can send.
 */
export function calculateSendingPlan(dailyEmailTarget: number, durationMonths: number, sop = SENDING_SOP): SendingPlan {
  const target = safeNumber(dailyEmailTarget);
  const months = Math.max(0, Math.floor(safeNumber(durationMonths)));
  const infra = calculateInfrastructure(target, sop);
  const firstBatch = infra.domains * sop.firstBatchIds;
  const secondBatch = infra.domains * (sop.idsPerDomain - sop.firstBatchIds);
  const firstLiveDay = sop.warmupDays + 1;
  const secondLiveDay = (sop.secondBatchMonth - 1) * sop.daysPerMonth + sop.warmupDays + 1;

  const plan: SendMonth[] = [];
  for (let m = 1; m <= months; m++) {
    const segments: SendSegment[] = [];
    let sent = 0;
    for (let dayOfMonth = 1; dayOfMonth <= sop.daysPerMonth; dayOfMonth++) {
      const day = (m - 1) * sop.daysPerMonth + dayOfMonth;
      const idsSending = (day >= firstLiveDay ? firstBatch : 0) + (day >= secondLiveDay ? secondBatch : 0);
      const emailsPerDay = Math.min(target, idsSending * sop.emailsPerIdPerDay);
      sent += emailsPerDay;
      const last = segments[segments.length - 1];
      if (last && last.idsSending === idsSending && last.emailsPerDay === emailsPerDay) last.toDay = dayOfMonth;
      else segments.push({ fromDay: dayOfMonth, toDay: dayOfMonth, idsSending, emailsPerDay });
    }
    plan.push({ month: m, sent, segments });
  }

  return { ...infra, months: plan, totalSent: plan.reduce((t, m) => t + m.sent, 0) };
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
  const bounced = r.sent * (safeRate(bounceRate) / 100);
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
