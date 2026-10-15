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

/**
 * One campaign launch: a list of prospects loaded onto a group of ids.
 * Days are counted from day 1 of the plan (day 31 is month 2, day 1).
 */
export interface Campaign {
  launchDay: number;
  ids: number;
  listSize: number;
  /** Most first emails these ids can send in a day (ids x 25). */
  firstEmailsPerDay: number;
  firstEmailsFrom: number;
  firstEmailsTo: number;
  /** First and last day a follow up went out, within the plan. Null when none did. */
  followUpsFrom: number | null;
  followUpsTo: number | null;
  /** True when every follow up for this list went out before the plan ended. */
  complete: boolean;
}

export interface SendMonth {
  month: number;
  /** Ids added to Smartlead on day 1 of this month. They warm up and cannot send yet. */
  idsAdded: number;
  /** Last warm-up day for the ids added this month, or 0 when none were added. */
  warmupUntilDay: number;
  /** Ids able to send on the last day of the month. */
  idsSendingAtEnd: number;
  /** New prospects who got their first email this month. */
  prospects: number;
  /** All emails sent this month: first emails plus follow ups. */
  sent: number;
}

export interface SendingPlan {
  domains: number;
  ids: number;
  /** New prospects per month at full speed (the target). */
  prospectsPerMonth: number;
  /** Average emails per day at full speed. */
  emailsPerDay: number;
  months: SendMonth[];
  campaigns: Campaign[];
  /** Longest delay, in days, of any follow up past its due date. 0 means every follow up went out on time. */
  maxFollowUpDelayDays: number;
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
 *
 * How Myntmore runs campaigns:
 * - When ids go live they get a list, sized at the target split evenly across all ids (about 150 per id).
 * - Every prospect on the list gets the first email before any follow up is sent, at up to 25 emails per id a day.
 * - Follow ups go out 5 days after the previous email. They only slip when the day's capacity is used up.
 * - Each id gets a new list every 30 days from the day it went live.
 */
export function calculateSendingPlan(monthlyProspectTarget: number, durationMonths: number, sop = SENDING_SOP): SendingPlan {
  const infra = calculateInfrastructure(monthlyProspectTarget, sop);
  const months = Math.max(0, Math.floor(safeNumber(durationMonths)));
  const totalDays = months * sop.daysPerMonth;
  const listPerId = infra.ids > 0 ? infra.prospectsPerMonth / infra.ids : 0;
  const batches = [
    { ids: infra.domains * sop.firstBatchIds, addedMonth: 1, liveDay: sop.warmupDays + 1 },
    {
      ids: infra.domains * (sop.idsPerDomain - sop.firstBatchIds),
      addedMonth: sop.secondBatchMonth,
      liveDay: (sop.secondBatchMonth - 1) * sop.daysPerMonth + sop.warmupDays + 1,
    },
  ].filter((b) => b.ids > 0);

  // Ids launching a new list on each day: every 30 days from the day each batch goes live.
  const launchIds = new Map<number, number>();
  for (const b of batches) {
    for (let d = b.liveDay; d <= totalDays; d += sop.daysPerMonth) launchIds.set(d, (launchIds.get(d) ?? 0) + b.ids);
  }

  const campaigns: Campaign[] = [];
  const firstQueue: { c: Campaign; left: number }[] = [];
  // Follow ups waiting to go out, oldest due date first. step 1 is the first follow up.
  let followQueue: { c: Campaign; step: number; due: number; amount: number }[] = [];
  const lastStep = sop.emailsPerProspect - 1;
  const outstanding = new Map<Campaign, number>();
  const EPS = 1e-9;
  let maxDelay = 0;

  const monthTotals = Array.from({ length: months }, () => ({ prospects: 0, sent: 0 }));

  const schedule = (c: Campaign, step: number, due: number, amount: number) => {
    const same = followQueue.find((f) => f.c === c && f.step === step && f.due === due);
    if (same) same.amount += amount;
    else followQueue.push({ c, step, due, amount });
    outstanding.set(c, (outstanding.get(c) ?? 0) + amount);
  };

  for (let day = 1; day <= totalDays; day++) {
    const monthIdx = Math.floor((day - 1) / sop.daysPerMonth);
    const liveIds = batches.reduce((t, b) => t + (day >= b.liveDay ? b.ids : 0), 0);
    let capacity = liveIds * sop.emailsPerIdPerDay;

    const launching = launchIds.get(day);
    if (launching) {
      const c: Campaign = {
        launchDay: day,
        ids: liveIds,
        listSize: launching * listPerId,
        firstEmailsPerDay: liveIds * sop.emailsPerIdPerDay,
        firstEmailsFrom: day,
        firstEmailsTo: day,
        followUpsFrom: null,
        followUpsTo: null,
        complete: false,
      };
      campaigns.push(c);
      firstQueue.push({ c, left: c.listSize });
    }

    // New prospects first.
    for (const q of firstQueue) {
      if (capacity <= EPS || q.left <= EPS) continue;
      const send = Math.min(q.left, capacity);
      q.left -= send;
      capacity -= send;
      q.c.firstEmailsTo = day;
      monthTotals[monthIdx].prospects += send;
      monthTotals[monthIdx].sent += send;
      if (lastStep > 0) schedule(q.c, 1, day + sop.followUpGapDays, send);
      else q.c.complete = q.left <= EPS;
    }

    // Then follow ups that are due, oldest first. Anything left over waits for the next day.
    followQueue.sort((a, b) => a.due - b.due || a.step - b.step);
    for (const f of followQueue) {
      if (f.due > day || capacity <= EPS) continue;
      const send = Math.min(f.amount, capacity);
      f.amount -= send;
      capacity -= send;
      maxDelay = Math.max(maxDelay, day - f.due);
      monthTotals[monthIdx].sent += send;
      f.c.followUpsFrom ??= day;
      f.c.followUpsTo = day;
      outstanding.set(f.c, (outstanding.get(f.c) ?? 0) - send);
      if (f.step < lastStep) schedule(f.c, f.step + 1, day + sop.followUpGapDays, send);
    }
    followQueue = followQueue.filter((f) => f.amount > EPS);
    for (const q of firstQueue) if (q.left <= EPS && (outstanding.get(q.c) ?? 0) <= EPS) q.c.complete = true;
  }

  const plan: SendMonth[] = monthTotals.map((t, i) => {
    const m = i + 1;
    const monthEnd = m * sop.daysPerMonth;
    return {
      month: m,
      idsAdded: batches.filter((b) => b.addedMonth === m).reduce((x, b) => x + b.ids, 0),
      warmupUntilDay: batches.some((b) => b.addedMonth === m) ? sop.warmupDays : 0,
      idsSendingAtEnd: batches.reduce((x, b) => x + (monthEnd >= b.liveDay ? b.ids : 0), 0),
      prospects: t.prospects,
      sent: t.sent,
    };
  });

  return {
    ...infra,
    months: plan,
    campaigns,
    maxFollowUpDelayDays: maxDelay,
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
