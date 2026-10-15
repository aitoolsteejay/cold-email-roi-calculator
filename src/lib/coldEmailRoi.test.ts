import { describe, expect, it } from "vitest";
import {
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

  it("month 1: warm-up to day 14, then 26 ids start 130 prospects a day", () => {
    expect(plan.months[0].segments).toEqual([
      { fromDay: 1, toDay: 14, idsSending: 0, newProspectsPerDay: 0 },
      { fromDay: 15, toDay: 30, idsSending: 26, newProspectsPerDay: 130 },
    ]);
    expect(plan.months[0].prospects).toBe(16 * 130);
    // First emails, plus follow ups due on days 20+, 25+ and 30.
    expect(plan.months[0].sent).toBe(2080 + 11 * 130 + 6 * 130 + 1 * 130);
  });

  it("month 2: 26 ids to day 14, all 52 from day 15 at the 250 a day target", () => {
    expect(plan.months[1].prospects).toBe(14 * 130 + 16 * 250);
    expect(plan.months[1].sent).toBe(5820 + 5220 + 4620 + 4020);
  });

  it("month 3 onward runs at the full target", () => {
    expect(plan.months[2]).toMatchObject({ prospects: 7500, sent: 30000 });
    expect(plan.months[3]).toMatchObject({ prospects: 7500, sent: 30000 });
  });

  it("never sends more than 25 emails per live id per day", () => {
    const busy = calculateSendingPlan(7500, 12);
    busy.months.forEach((m) => m.segments.forEach((s) => expect(s.newProspectsPerDay * 4).toBeLessThanOrEqual(s.idsSending * 25)));
  });
});

describe("calculateRoi", () => {
  it("runs the funnel on prospects reached", () => {
    const r = calculateRoi(base);
    expect(r.prospects).toBe(2080 + 5820 + 10 * 7500);
    expect(r.sent).toBe(4420 + 19680 + 10 * 30000);
    expect(r.delivered).toBeCloseTo(82900 * 0.985, 6);
    expect(Math.round(r.replies)).toBe(2776);
    expect(Math.round(r.positive)).toBe(1111);
    expect(Math.round(r.booked)).toBe(444);
    expect(Math.round(r.held)).toBe(333);
    expect(r.deals).toBeCloseTo(39.98, 2);
    expect(r.revenue).toBeCloseTo(r.deals * 12000, 6);
    expect(r.cost).toBe(30000);
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
    const countedShare = (2080 + 5820 + 7 * 7500) / r.prospects;
    expect(r.dealsCounted).toBeCloseTo(r.deals * countedShare, 6);
  });

  it("sanitises bad input", () => {
    const r = calculateRoi({ ...base, monthlyProspectTarget: NaN, dealValue: Infinity });
    expect(Number.isFinite(r.revenue)).toBe(true);
    expect(r.prospects).toBe(0);
  });
});

describe("helpers", () => {
  it("default rates give about 5.4 meetings per 1,000 prospects", () => {
    expect(meetingsPer1000Prospects(DEFAULT_STATE)).toBeCloseTo(5.4, 1);
  });
});
