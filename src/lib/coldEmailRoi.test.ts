import { describe, expect, it } from "vitest";
import {
  bookedPerProspect,
  calculateInfrastructure,
  calculateRoi,
  calculateSendingPlan,
  dailyEmailsFromProspects,
  meetingsPer1000Prospects,
  prospectsFromDailyEmails,
  type RoiInputs,
} from "./coldEmailRoi";
import { DEFAULT_STATE } from "@/data/coldEmailBenchmarks";

const base: RoiInputs = {
  monthlyProspectTarget: 7500,
  durationMonths: 12,
  bounceRate: 1.5,
  replyRate: 3.4,
  positiveShare: 40,
  bookingRate: 40,
  showRate: 75,
  closeRate: 12,
  dealValue: 1000,
  invoicesPerYear: 12,
  retentionMonths: 12,
  monthlyInvestment: 2500,
  salesCycleLagMonths: 0,
};

describe("volume inputs", () => {
  it("converts emails per day and prospects per month through 4 emails and 30 days", () => {
    expect(prospectsFromDailyEmails(1000)).toBe(7500);
    expect(dailyEmailsFromProspects(7500)).toBe(1000);
  });

  it("sizes ids at 150 prospects each, rounded up to whole domains of 4", () => {
    // 7,500 / 150 = 50 ids, so 13 domains and 52 ids.
    expect(calculateInfrastructure(7500)).toEqual({ domains: 13, ids: 52, prospectsPerMonth: 7500, emailsPerDay: 1000 });
    expect(calculateInfrastructure(600)).toMatchObject({ domains: 1, ids: 4 });
    expect(calculateInfrastructure(601)).toMatchObject({ domains: 2, ids: 8 });
    expect(calculateInfrastructure(0)).toMatchObject({ domains: 0, ids: 0 });
  });
});

describe("sending plan", () => {
  const plan = calculateSendingPlan(7500, 4);

  it("records ids added and warm-up per month", () => {
    expect(plan.months[0]).toMatchObject({ idsAdded: 26, warmupUntilDay: 14, idsSendingAtEnd: 26 });
    expect(plan.months[1]).toMatchObject({ idsAdded: 26, warmupUntilDay: 14, idsSendingAtEnd: 52 });
    expect(plan.months[2]).toMatchObject({ idsAdded: 0, warmupUntilDay: 0, idsSendingAtEnd: 52 });
  });

  it("month 1: 26 ids go live on day 15 and get a list of 3,750", () => {
    const c = plan.campaigns[0];
    expect(c).toMatchObject({ launchDay: 15, ids: 26, listSize: 3750, firstEmailsPerDay: 650 });
    // 3,750 first emails at 650 a day: days 15 to 20.
    expect(c.firstEmailsFrom).toBe(15);
    expect(c.firstEmailsTo).toBe(20);
    expect(plan.months[0].prospects).toBe(3750);
  });

  it("sends every first email on a list before any of its follow ups", () => {
    plan.campaigns.forEach((c) => {
      if (c.followUpsFrom !== null) expect(c.followUpsFrom).toBeGreaterThanOrEqual(c.firstEmailsTo);
    });
  });

  it("month 2: month 1's follow ups finish, then all 52 ids get a list of 7,500 on day 15", () => {
    expect(plan.campaigns[0].complete).toBe(true);
    expect(plan.campaigns[0].followUpsTo).toBeLessThan(45);
    expect(plan.campaigns[1]).toMatchObject({ launchDay: 45, ids: 52, listSize: 7500, firstEmailsFrom: 45, firstEmailsTo: 50 });
    expect(plan.months[1].prospects).toBe(7500);
  });

  it("month 3 onwards runs at the full target", () => {
    expect(plan.months[2]).toMatchObject({ prospects: 7500, sent: 30000 });
    expect(plan.months[3]).toMatchObject({ prospects: 7500, sent: 30000 });
  });

  it("every list gets all 4 emails, and follow ups slip by at most a day", () => {
    const long = calculateSendingPlan(7500, 13);
    // All but the last list finish inside 13 months.
    long.campaigns.slice(0, -1).forEach((c) => expect(c.complete).toBe(true));
    const firstEmails = long.months.reduce((t, m) => t + m.prospects, 0);
    const finished = long.campaigns.slice(0, -1).reduce((t, c) => t + c.listSize, 0);
    expect(long.totalSent).toBeGreaterThanOrEqual(finished * 4);
    expect(firstEmails).toBe(3750 + 12 * 7500);
    expect(long.maxFollowUpDelayDays).toBeLessThanOrEqual(1);
  });
});

describe("calculateRoi", () => {
  it("runs the funnel on prospects reached", () => {
    const r = calculateRoi(base);
    expect(r.prospects).toBe(3750 + 11 * 7500);
    expect(r.sent).toBe(r.plan.months.reduce((t, m) => t + m.sent, 0));
    expect(r.delivered).toBeCloseTo(86250 * 0.985, 6);
    expect(Math.round(r.replies)).toBe(2889);
    expect(Math.round(r.positive)).toBe(1155);
    expect(Math.round(r.booked)).toBe(462);
    expect(Math.round(r.held)).toBe(347);
    expect(r.deals).toBeCloseTo(41.59, 2);
    expect(r.cost).toBe(30000);
  });

  it("pays revenue month by month, so customers won late add less", () => {
    const r = calculateRoi(base);
    const perProspect = 0.985 * 0.034 * 0.4 * 0.4 * 0.75 * 0.12;
    const prospectsByMonth = [3750, ...Array(11).fill(7500)];
    // $1,000 x 12 invoices / 12 = $1,000 a month per customer, paid from the month won to month 12.
    const expected = prospectsByMonth.reduce((t, p, i) => t + p * perProspect * 1000 * (12 - i), 0);
    expect(r.revenue).toBeCloseTo(expected, 6);
    expect(r.revenue).toBeLessThan(r.deals * r.effectiveLTV);
    // Cumulative chart line ends at the headline revenue.
    expect(r.monthly[11].revenue).toBeCloseTo(r.revenue, 6);
  });

  it("stops payments at the end of the retention period", () => {
    const r = calculateRoi({ ...base, retentionMonths: 3, durationMonths: 3 });
    const perProspect = 0.985 * 0.034 * 0.4 * 0.4 * 0.75 * 0.12;
    // Month 1 customers pay 3 months, month 2 customers 2, month 3 customers 1.
    expect(r.revenue).toBeCloseTo(perProspect * 1000 * (3750 * 3 + 7500 * 2 + 7500 * 1), 6);
  });

  it("does not pay back in month 1 when nothing sends until day 15", () => {
    const r = calculateRoi({ ...base, monthlyInvestment: 20000 });
    expect(r.paybackMonth).not.toBe(1);
  });

  it("builds meetings month by month from ramped prospects, not full speed", () => {
    const r = calculateRoi({ ...base, durationMonths: 3 });
    expect(r.prospects).toBe(3750 + 7500 + 7500);
    const perMonth = r.plan.months.map((m) => m.prospects * bookedPerProspect(base));
    expect(perMonth[0]).toBeCloseTo(3750 * 0.985 * 0.034 * 0.4 * 0.4, 9);
    expect(perMonth.reduce((a, b) => a + b, 0)).toBeCloseTo(r.booked, 9);
    // Full speed for all 3 months would have been 22,500 prospects.
    expect(r.booked).toBeLessThan(22500 * bookedPerProspect(base));
  });

  it("returns null ROI and no NaN when cost is zero", () => {
    const r = calculateRoi({ ...base, monthlyInvestment: 0 });
    expect(r.roiPercent).toBeNull();
    expect(r.costPerBookedMeeting).toBe(0);
    expect(Number.isFinite(r.revenue)).toBe(true);
  });

  it("handles zero volume", () => {
    const r = calculateRoi({ ...base, monthlyProspectTarget: 0 });
    expect(r.prospects).toBe(0);
    expect(r.sent).toBe(0);
    expect(r.revenue).toBe(0);
    expect(r.costPerBookedMeeting).toBeNull();
    expect(r.paybackMonth).toBeNull();
    expect(r.roiPercent).toBe(-100);
  });

  it("handles a 100% close rate", () => {
    const r = calculateRoi({ ...base, closeRate: 100 });
    expect(r.deals).toBeCloseTo(r.held, 9);
  });

  it("drops deals that pay out after the duration ends", () => {
    const r = calculateRoi({ ...base, salesCycleLagMonths: 3 });
    const countedShare = (3750 + 8 * 7500) / r.prospects;
    expect(r.dealsCounted).toBeCloseTo(r.deals * countedShare, 6);
    // Month 1 customers start paying in month 4, so they pay 9 months inside the 12.
    const perProspect = 0.985 * 0.034 * 0.4 * 0.4 * 0.75 * 0.12;
    const prospectsByMonth = [3750, ...Array(8).fill(7500)];
    const expected = prospectsByMonth.reduce((t, p, i) => t + p * perProspect * 1000 * (12 - (i + 3)), 0);
    expect(r.revenue).toBeCloseTo(expected, 6);
  });

  it("sanitises bad input", () => {
    const r = calculateRoi({ ...base, monthlyProspectTarget: NaN, dealValue: Infinity });
    expect(Number.isFinite(r.revenue)).toBe(true);
    expect(r.prospects).toBe(0);
  });
});

describe("helpers", () => {
  it("Myntmore 2026 defaults land close to the Smartlead meeting request rate", () => {
    // (1 - 1.67%) x 3.8% x 59% x 47% = 10.36 per 1,000. Smartlead 2026 shows 10.2 meeting requests per 1,000 prospects.
    expect(meetingsPer1000Prospects(DEFAULT_STATE)).toBeCloseTo(10.36, 1);
  });
});
