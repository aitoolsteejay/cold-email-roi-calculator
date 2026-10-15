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

const perProspect = 0.985 * 0.034 * 0.4 * 0.4 * 0.75 * 0.12;

describe("volume inputs", () => {
  it("converts emails per day and prospects per month through 4 emails and 30 days", () => {
    expect(prospectsFromDailyEmails(1000)).toBe(7500);
    expect(dailyEmailsFromProspects(7500)).toBe(1000);
  });

  it("sizes domains so every id runs at full capacity: 4 ids x 25 emails a day each", () => {
    expect(calculateInfrastructure(7500)).toEqual({ domains: 10, ids: 40, prospectsPerMonth: 7500, emailsPerDay: 1000 });
    // 1,050 a day needs 10.5 domains, rounded up to 11.
    expect(calculateInfrastructure(prospectsFromDailyEmails(1050))).toMatchObject({ domains: 11, ids: 44 });
    expect(calculateInfrastructure(600)).toMatchObject({ domains: 1, ids: 4 });
    expect(calculateInfrastructure(0)).toMatchObject({ domains: 0, ids: 0 });
  });
});

describe("sending plan", () => {
  const plan = calculateSendingPlan(7500, 12);

  it("records ids added, warm-up and who is sending each month", () => {
    expect(plan.months[0]).toMatchObject({ idsAdded: 20, warmupUntilDay: 14, idsSendingAtEnd: 20 });
    expect(plan.months[0].idSegments).toEqual([
      { fromDay: 1, toDay: 14, idsSending: 0 },
      { fromDay: 15, toDay: 30, idsSending: 20 },
    ]);
    expect(plan.months[1].idSegments).toEqual([
      { fromDay: 1, toDay: 14, idsSending: 20 },
      { fromDay: 15, toDay: 30, idsSending: 40 },
    ]);
    expect(plan.months[2]).toMatchObject({ idsAdded: 0, idSegments: [{ fromDay: 1, toDay: 30, idsSending: 40 }] });
  });

  it("never leaves ids idle once they are live", () => {
    expect(plan.utilisation).toBeCloseTo(1, 9);
    // Month 1: 20 ids x 25 x 16 days. Month 2: 20 ids x 25 x 30 + 20 ids x 25 x 16. Month 3 onwards: 1,000 a day.
    expect(plan.months[0].sent).toBeCloseTo(8000, 6);
    expect(plan.months[1].sent).toBeCloseTo(23000, 6);
    plan.months.slice(2).forEach((m) => expect(m.sent).toBeCloseTo(30000, 6));
  });

  it("works through lists of 150 per id: first emails to everyone, then follow ups, then the next list", () => {
    const groupOne = plan.campaigns.filter((c) => c.group === 1);
    expect(groupOne[0]).toMatchObject({ ids: 20, listSize: 3000, launchDay: 15, firstEmailsDoneDay: 20 });
    groupOne.slice(0, -1).forEach((c, i) => {
      expect(c.completeDay).not.toBeNull();
      // The next list starts the day the previous one finishes, or the day after.
      expect(groupOne[i + 1].launchDay - (c.completeDay as number)).toBeLessThanOrEqual(1);
    });
  });

  it("follow ups slip by at most a day", () => {
    expect(plan.maxFollowUpDelayDays).toBeLessThanOrEqual(1);
    expect(calculateSendingPlan(600, 6).maxFollowUpDelayDays).toBeLessThanOrEqual(1);
  });

  it("averages the target number of new prospects once all ids are live", () => {
    const later = plan.months.slice(2);
    const average = later.reduce((t, m) => t + m.prospects, 0) / later.length;
    expect(average).toBeGreaterThan(7500 * 0.95);
    expect(average).toBeLessThan(7500 * 1.05);
  });
});

describe("calculateRoi", () => {
  it("runs the funnel on prospects reached", () => {
    const r = calculateRoi(base);
    expect(r.prospects).toBeCloseTo(r.plan.totalProspects, 9);
    expect(r.sent).toBeCloseTo(r.plan.totalSent, 9);
    expect(r.delivered).toBeCloseTo(r.prospects * 0.985, 6);
    expect(r.replies).toBeCloseTo(r.delivered * 0.034, 6);
    expect(r.booked).toBeCloseTo(r.prospects * 0.985 * 0.034 * 0.4 * 0.4, 6);
    expect(r.deals).toBeCloseTo(r.prospects * perProspect, 6);
    expect(r.cost).toBe(30000);
  });

  it("pays revenue month by month, so customers won late add less", () => {
    const r = calculateRoi(base);
    // $1,000 x 12 invoices / 12 = $1,000 a month per customer, paid from the month won to month 12.
    const expected = r.plan.months.reduce((t, m, i) => t + m.prospects * perProspect * 1000 * (12 - i), 0);
    expect(r.revenue).toBeCloseTo(expected, 6);
    expect(r.revenue).toBeLessThan(r.deals * r.effectiveLTV);
    expect(r.monthly[11].revenue).toBeCloseTo(r.revenue, 6);
  });

  it("stops payments at the end of the retention period", () => {
    const r = calculateRoi({ ...base, retentionMonths: 3, durationMonths: 3 });
    const [m1, m2, m3] = r.plan.months.map((m) => m.prospects);
    // Month 1 customers pay 3 months, month 2 customers 2, month 3 customers 1.
    expect(r.revenue).toBeCloseTo(perProspect * 1000 * (m1 * 3 + m2 * 2 + m3 * 1), 6);
  });

  it("does not pay back in month 1 when nothing sends until day 15", () => {
    const r = calculateRoi({ ...base, monthlyInvestment: 20000 });
    expect(r.paybackMonth).not.toBe(1);
  });

  it("builds meetings month by month from ramped prospects, not full speed", () => {
    const r = calculateRoi({ ...base, durationMonths: 3 });
    const perMonth = r.plan.months.map((m) => m.prospects * bookedPerProspect(base));
    expect(perMonth.reduce((a, b) => a + b, 0)).toBeCloseTo(r.booked, 9);
    // Full speed for all 3 months would have been 22,500 prospects.
    expect(r.prospects).toBeLessThan(22500);
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
    const counted = r.plan.months.slice(0, 9).reduce((t, m) => t + m.prospects, 0);
    expect(r.dealsCounted).toBeCloseTo(counted * perProspect, 6);
    // Month 1 customers start paying in month 4, so they pay 9 months inside the 12.
    const expected = r.plan.months.slice(0, 9).reduce((t, m, i) => t + m.prospects * perProspect * 1000 * (12 - (i + 3)), 0);
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
