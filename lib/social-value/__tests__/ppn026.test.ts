import { describe, expect, it } from "vitest";
import {
  PPN026_OCT_OUTCOMES,
  PPN026_OUTCOMES,
  nextPerformanceNoticeDue,
  ppn026Checks,
  ppn026KpiCsv,
  ppn026MinimumWeighting,
  summariseKpi,
  summarisePpn026,
  type KpiInput,
} from "../ppn026";
import { PPN026_COHORTS, PPN026_METRICS, cleanCohortCounts } from "../ppn026-metrics";

const kpi = (over: Partial<KpiInput> = {}): KpiInput => ({
  id: "k",
  title: "Apprenticeship starts",
  outcomeCode: "training",
  targetValue: 10,
  targetUnit: "starts",
  status: "active",
  activities: [],
  ...over,
});

describe("PPN 026 model", () => {
  it("has two outcomes and six award criteria", () => {
    expect(PPN026_OUTCOMES.map((o) => o.name)).toEqual(["Good Jobs", "Skills"]);
    expect(PPN026_OUTCOMES.flatMap((o) => o.criteria.map((c) => c.code))).toEqual(["jobs", "conditions", "pay", "training", "progression", "pipeline"]);
  });

  it("sets the minimum weighting by contract value", () => {
    expect(ppn026MinimumWeighting(null)).toBeNull();
    expect(ppn026MinimumWeighting(999_999)).toBeNull();
    expect(ppn026MinimumWeighting(1_000_000)).toBe(10);
    expect(ppn026MinimumWeighting(4_999_999)).toBe(10);
    expect(ppn026MinimumWeighting(5_000_000)).toBe(20);
  });
});

describe("KPI delivery", () => {
  it("counts only approved entries in the KPI's unit", () => {
    const s = summariseKpi(
      kpi({
        activities: [
          { status: "approved", quantityValue: 4, quantityUnit: "starts", evidenceCount: 1 },
          { status: "approved", quantityValue: 2, quantityUnit: "Starts ", evidenceCount: 0 },
          { status: "approved", quantityValue: 100, quantityUnit: "hours", evidenceCount: 1 },
          { status: "submitted", quantityValue: 5, quantityUnit: "starts", evidenceCount: 1 },
          { status: "rejected", quantityValue: 9, quantityUnit: "starts", evidenceCount: 1 },
        ],
      }),
    );
    expect(s).toMatchObject({ delivered: 6, progressPct: 60, approvedEntries: 3, pendingEntries: 1, entriesWithEvidence: 2 });
  });

  it("lists every criterion in model order and leaves cancelled KPIs out", () => {
    const out = summarisePpn026([kpi(), kpi({ id: "x", status: "cancelled" }), kpi({ id: "p", outcomeCode: "pay", title: "Real Living Wage" })]);
    expect(out.map((c) => c.code)).toEqual(["jobs", "conditions", "pay", "training", "progression", "pipeline"]);
    expect(out.find((c) => c.code === "training")!.kpis.map((k) => k.id)).toEqual(["k"]);
    expect(out.find((c) => c.code === "pay")!.kpis[0].title).toBe("Real Living Wage");
  });
});

describe("PPN 026 checks", () => {
  const failing = (value: number | null, kpis: KpiInput[]) => ppn026Checks(value, summarisePpn026(kpis)).filter((c) => !c.passed).map((c) => c.id);

  it("needs three KPIs on contracts of £5m or more, one below", () => {
    expect(failing(6_000_000, [kpi(), kpi({ id: "b" })])).toContain("kpi-count");
    expect(failing(6_000_000, [kpi(), kpi({ id: "b" }), kpi({ id: "c" })])).not.toContain("kpi-count");
    expect(failing(2_000_000, [kpi()])).not.toContain("kpi-count");
    expect(failing(2_000_000, [])).toEqual(expect.arrayContaining(["kpi-count", "targets"]));
  });

  it("needs a target and unit on each KPI and evidence on approved entries", () => {
    expect(failing(2_000_000, [kpi({ targetUnit: null })])).toContain("targets");
    expect(
      failing(2_000_000, [kpi({ activities: [{ status: "approved", quantityValue: 1, quantityUnit: "starts", evidenceCount: 0 }] })]),
    ).toContain("evidence");
  });
});

describe("PPN 026 October 2026 metrics", () => {
  it("loads the 37 standard reporting metrics against the six criteria", () => {
    expect(PPN026_METRICS).toHaveLength(37);
    expect(new Set(PPN026_METRICS.map((m) => m.code)).size).toBe(37);
    const per = (c: string) => PPN026_METRICS.filter((m) => m.criterion === c).length;
    expect(["jobs", "conditions", "pay", "training", "progression", "pipeline"].map(per)).toEqual([7, 6, 4, 7, 3, 10]);
    const criteria = new Set(PPN026_OCT_OUTCOMES.flatMap((o) => o.criteria.map((c) => c.code)));
    expect(PPN026_METRICS.every((m) => criteria.has(m.criterion))).toBe(true);
    expect(PPN026_COHORTS).toHaveLength(8);
  });

  it("keeps only known cohorts with whole positive counts", () => {
    expect(cleanCohortCounts({ neet: 3, veterans: 0, "care-leavers": 1.5, send: -2, unknown: 4, probation: "2" })).toEqual({ neet: 3 });
    expect(cleanCohortCounts(null)).toEqual({});
    expect(cleanCohortCounts([1, 2])).toEqual({});
  });

  it("takes the latest approved figure for position metrics and sums cohorts", () => {
    const s = summariseKpi(
      kpi({
        targetUnit: "people",
        aggregate: "latest",
        metricCode: "1cii",
        activities: [
          { status: "approved", quantityValue: 40, quantityUnit: "people", evidenceCount: 1, activityDate: "2027-06-30", cohortCounts: { neet: 2 } },
          { status: "approved", quantityValue: 25, quantityUnit: "people", evidenceCount: 1, activityDate: "2027-03-31", cohortCounts: { neet: 1, veterans: 3 } },
          { status: "submitted", quantityValue: 90, quantityUnit: "people", evidenceCount: 1, activityDate: "2027-09-30", cohortCounts: { neet: 50 } },
        ],
      }),
    );
    expect(s).toMatchObject({ delivered: 40, aggregate: "latest", metricCode: "1cii", cohortTotals: { neet: 3, veterans: 3 } });
  });
});

describe("PPN 026 October checks", () => {
  const failing = (value: number | null, kpis: KpiInput[]) =>
    ppn026Checks(value, summarisePpn026(kpis, "october"), "october").filter((c) => !c.passed).map((c) => c.id);

  it("needs one Social Value Model KPI at £5m or more", () => {
    expect(failing(6_000_000, [kpi({ metricCode: "2ai" })])).not.toContain("kpi-count");
    expect(failing(6_000_000, [])).toContain("kpi-count");
  });

  it("needs a standard reporting metric on every KPI", () => {
    expect(failing(6_000_000, [kpi()])).toContain("srm");
    expect(failing(6_000_000, [kpi({ metricCode: "2ai" })])).not.toContain("srm");
    expect(ppn026Checks(6_000_000, summarisePpn026([kpi()])).map((c) => c.id)).not.toContain("srm");
  });
});

describe("contract performance notice", () => {
  const today = new Date("2026-11-06T12:00:00Z");
  it("is only for contracts of £5m or more with a start date", () => {
    expect(nextPerformanceNoticeDue(new Date("2026-01-01"), 4_999_999, today)).toBeNull();
    expect(nextPerformanceNoticeDue(null, 6_000_000, today)).toBeNull();
  });

  it("falls on the next 12-month mark from the start", () => {
    expect(nextPerformanceNoticeDue(new Date("2027-02-01"), 6_000_000, today)?.toISOString().slice(0, 10)).toBe("2028-02-01");
    expect(nextPerformanceNoticeDue(new Date("2024-03-15"), 6_000_000, today)?.toISOString().slice(0, 10)).toBe("2027-03-15");
    expect(nextPerformanceNoticeDue(new Date("2025-11-06"), 6_000_000, today)?.toISOString().slice(0, 10)).toBe("2026-11-06");
  });
});

describe("KPI CSV", () => {
  it("has a column per cohort and neutralises formulas", () => {
    const csv = ppn026KpiCsv(
      summarisePpn026(
        [
          kpi({ title: "=cmd|' /C calc'!A0", metricCode: "2ai", activities: [{ status: "approved", quantityValue: 2, quantityUnit: "starts", evidenceCount: 1, cohortCounts: { neet: 2 } }] }),
          kpi({ id: "n", title: "-5", targetValue: null }),
        ],
        "october",
      ),
    );
    const [head, ...rows] = csv.trim().split("\n");
    expect(head.startsWith("Metric code,Criterion,KPI,Metric,Target,Unit")).toBe(true);
    expect(head.match(/People reached: /g)).toHaveLength(PPN026_COHORTS.length);
    expect(rows[0]).toContain("'=cmd");
    expect(rows[0].endsWith(",2,0,0,0,0,0,0,0")).toBe(true);
    expect(rows[1]).toContain(",-5,");
  });
});
