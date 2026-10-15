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

/** One list worked by a group of ids: first emails to everyone, then the follow ups. */
export interface Campaign {
  /** Which id group runs it: 1 for the ids added in month 1, 2 for the ids added in month 2. */
  group: number;
  ids: number;
  listSize: number;
  /** Days are counted from day 1 of the plan (day 31 is month 2, day 1). */
  launchDay: number;
  firstEmailsDoneDay: number | null;
  /** Day the last follow up went out. Null while the list is still running. */
  completeDay: number | null;
}

/** A run of days within one month with the same number of ids sending. 0 ids means warm-up. */
export interface IdSegment {
  fromDay: number;
  toDay: number;
  idsSending: number;
}

export interface SendMonth {
  month: number;
  /** Ids added to Smartlead on day 1 of this month. They warm up and cannot send yet. */
  idsAdded: number;
  /** Last warm-up day for the ids added this month, or 0 when none were added. */
  warmupUntilDay: number;
  /** Ids able to send on the last day of the month. */
  idsSendingAtEnd: number;
  /** How many ids send on which days. */
  idSegments: IdSegment[];
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
  /** Emails per day at full speed. */
  emailsPerDay: number;
  /** Emails each live id sends a day: 25, or less when the target does not need every id at full capacity. */
  emailsPerIdPerDay: number;
  months: SendMonth[];
  campaigns: Campaign[];
  /** Emails sent / emails the live ids could have sent. 1 means the ids were never idle. */
  utilisation: number;
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

/** Domains needed so every id runs at full capacity (4 ids x 25 emails a day per domain), rounded up. */
export function calculateInfrastructure(monthlyProspectTarget: number, sop = SENDING_SOP) {
  const prospects = safeNumber(monthlyProspectTarget);
  const emailsPerDay = dailyEmailsFromProspects(prospects, sop);
  // The small tolerance stops float noise turning an exact 10 into 11. Math.max keeps 0 from becoming -0.
  const domains = Math.max(0, Math.ceil(emailsPerDay / (sop.idsPerDomain * sop.emailsPerIdPerDay) - 1e-9));
  return {
    domains,
    ids: domains * sop.idsPerDomain,
    prospectsPerMonth: prospects,
    emailsPerDay,
  };
}

/**
 * Day by day plan over the duration, following the ramp in SENDING_SOP.
 *
 * How Myntmore runs campaigns:
 * - Each group of ids works through lists of about 150 prospects per id.
 * - Everyone on a list gets the first email before any follow up goes out.
 * - Follow ups go 5 days after the previous email, and only slip if the day's capacity is used up.
 * - As soon as a list is finished, the same ids start the next one, so ids are never idle.
 * Each id sends at most 25 emails a day, or less when the target needs fewer than all of them at full capacity.
 */
export function calculateSendingPlan(monthlyProspectTarget: number, durationMonths: number, sop = SENDING_SOP): SendingPlan {
  const infra = calculateInfrastructure(monthlyProspectTarget, sop);
  const months = Math.max(0, Math.floor(safeNumber(durationMonths)));
  const totalDays = months * sop.daysPerMonth;
  const perIdPerDay = infra.ids > 0 ? Math.min(sop.emailsPerIdPerDay, infra.emailsPerDay / infra.ids) : 0;
  const lastStep = sop.emailsPerProspect - 1;
  const EPS = 1e-9;

  interface FollowUp {
    step: number;
    due: number;
    amount: number;
  }
  const groups = [
    { group: 1, ids: infra.domains * sop.firstBatchIds, addedMonth: 1, liveDay: sop.warmupDays + 1 },
    {
      group: 2,
      ids: infra.domains * (sop.idsPerDomain - sop.firstBatchIds),
      addedMonth: sop.secondBatchMonth,
      liveDay: (sop.secondBatchMonth - 1) * sop.daysPerMonth + sop.warmupDays + 1,
    },
  ]
    .filter((g) => g.ids > 0)
    .map((g) => ({ ...g, campaign: null as Campaign | null, firstsLeft: 0, queue: [] as FollowUp[] }));

  const campaigns: Campaign[] = [];
  const monthTotals = Array.from({ length: months }, () => ({ prospects: 0, sent: 0 }));
  let maxDelay = 0;
  let capacityTotal = 0;

  for (let day = 1; day <= totalDays; day++) {
    const m = Math.floor((day - 1) / sop.daysPerMonth);
    for (const g of groups) {
      if (day < g.liveDay) continue;
      let capacity = g.ids * perIdPerDay;
      capacityTotal += capacity;

      // Keep going while there is capacity: finishing a list frees the ids for the next one the same day.
      for (let guard = 0; capacity > EPS && guard < 4; guard++) {
        if (!g.campaign) {
          g.campaign = {
            group: g.group,
            ids: g.ids,
            // About 150 per id at 25 emails a day; scaled down when ids send less, so follow ups stay on time.
            listSize: g.ids * sop.prospectsPerIdPerList * (perIdPerDay / sop.emailsPerIdPerDay),
            launchDay: day,
            firstEmailsDoneDay: null,
            completeDay: null,
          };
          campaigns.push(g.campaign);
          g.firstsLeft = g.campaign.listSize;
        }
        const c = g.campaign;

        // New prospects first.
        if (g.firstsLeft > EPS) {
          const send = Math.min(g.firstsLeft, capacity);
          g.firstsLeft -= send;
          capacity -= send;
          monthTotals[m].prospects += send;
          monthTotals[m].sent += send;
          if (lastStep > 0) g.queue.push({ step: 1, due: day + sop.followUpGapDays, amount: send });
          if (g.firstsLeft <= EPS) c.firstEmailsDoneDay = day;
        }

        // Then follow ups that are due, oldest first.
        g.queue.sort((a, b) => a.due - b.due || a.step - b.step);
        const next: FollowUp[] = [];
        for (const f of g.queue) {
          if (f.due > day || capacity <= EPS) continue;
          const send = Math.min(f.amount, capacity);
          f.amount -= send;
          capacity -= send;
          maxDelay = Math.max(maxDelay, day - f.due);
          monthTotals[m].sent += send;
          if (f.step < lastStep) next.push({ step: f.step + 1, due: day + sop.followUpGapDays, amount: send });
        }
        g.queue = [...g.queue.filter((f) => f.amount > EPS), ...next];

        const finished = g.firstsLeft <= EPS && g.queue.length === 0;
        if (finished) {
          c.completeDay = day;
          g.campaign = null;
          continue;
        }
        break;
      }
    }
  }

  const plan: SendMonth[] = monthTotals.map((t, i) => {
    const month = i + 1;
    const start = i * sop.daysPerMonth + 1;
    const idSegments: IdSegment[] = [];
    for (let d = 1; d <= sop.daysPerMonth; d++) {
      const abs = start + d - 1;
      const idsSending = groups.reduce((x, g) => x + (abs >= g.liveDay ? g.ids : 0), 0);
      const last = idSegments[idSegments.length - 1];
      if (last && last.idsSending === idsSending) last.toDay = d;
      else idSegments.push({ fromDay: d, toDay: d, idsSending });
    }
    return {
      month,
      idsAdded: groups.filter((g) => g.addedMonth === month).reduce((x, g) => x + g.ids, 0),
      warmupUntilDay: groups.some((g) => g.addedMonth === month) ? sop.warmupDays : 0,
      idsSendingAtEnd: idSegments[idSegments.length - 1]?.idsSending ?? 0,
      idSegments,
      prospects: t.prospects,
      sent: t.sent,
    };
  });

  const totalSent = plan.reduce((t, x) => t + x.sent, 0);
  return {
    ...infra,
    emailsPerIdPerDay: perIdPerDay,
    months: plan,
    campaigns,
    utilisation: capacityTotal > 0 ? totalSent / capacityTotal : 0,
    maxFollowUpDelayDays: maxDelay,
    totalProspects: plan.reduce((t, x) => t + x.prospects, 0),
    totalSent,
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
