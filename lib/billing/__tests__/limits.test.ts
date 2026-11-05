import { describe, it, expect } from "vitest";
import { getLimits, hasFeature, usagePercent, PLAN_ANNUAL_TOTAL, PLAN_PRICES, PLAN_LABELS, ENTERPRISE_FROM_ANNUAL, formatPlanPrice } from "@/lib/billing/limits";

describe("getLimits", () => {
  it("returns trial limits for unknown plan", () => {
    const limits = getLimits("unknown");
    expect(limits.reportsPerMonth).toBe(2);
    expect(limits.members).toBe(3);
  });

  it("returns trial limits", () => {
    const l = getLimits("trial");
    expect(l.fieldSubmissionsPerMonth).toBe(50);
    expect(l.importsPerMonth).toBe(5);
  });

  it("returns starter limits", () => {
    const l = getLimits("starter");
    expect(l.fieldSubmissionsPerMonth).toBe(500);
    expect(l.members).toBe(5);
  });

  it("returns growth limits", () => {
    const l = getLimits("growth");
    expect(l.members).toBe(25);
    expect(l.apiRequestsPerMonth).toBe(100_000);
  });

  it("enterprise has Infinity limits", () => {
    const l = getLimits("enterprise");
    expect(l.reportsPerMonth).toBe(Infinity);
    expect(l.importsPerMonth).toBe(Infinity);
  });
});

describe("management system frameworks", () => {
  it("allows 1 on Starter, 5 on Growth, 3 in the trial and all on Enterprise", () => {
    expect(getLimits("starter").frameworks).toBe(1);
    expect(getLimits("growth").frameworks).toBe(5);
    expect(getLimits("trial").frameworks).toBe(3);
    expect(getLimits("enterprise").frameworks).toBe(Infinity);
  });
});

describe("usagePercent", () => {
  it("returns 0 for Infinity limit", () => {
    expect(usagePercent(1000, Infinity)).toBe(0);
  });

  it("returns 0 for limit of 0", () => {
    expect(usagePercent(5, 0)).toBe(0);
  });

  it("calculates percent correctly", () => {
    expect(usagePercent(25, 100)).toBe(25);
    expect(usagePercent(50, 100)).toBe(50);
  });

  it("caps at 100%", () => {
    expect(usagePercent(200, 100)).toBe(100);
  });

  it("rounds to nearest integer", () => {
    expect(usagePercent(1, 3)).toBe(33);
  });
});

describe("PLAN_PRICES", () => {
  it("trial is free", () => {
    expect(PLAN_PRICES.trial.monthly).toBe(0);
    expect(PLAN_PRICES.trial.annual).toBe(0);
  });

  it("growth has annual discount vs monthly", () => {
    expect(PLAN_PRICES.growth.annual).toBeLessThan(PLAN_PRICES.growth.monthly);
  });

  it("enterprise starts at £5,999.99 a year, billed annually", () => {
    expect(ENTERPRISE_FROM_ANNUAL).toBe(5999.99);
    expect(PLAN_PRICES.enterprise.monthly).toBe(Math.floor((ENTERPRISE_FROM_ANNUAL / 12) * 100) / 100);
  });

  it("annual prices save about two months against paying monthly", () => {
    for (const p of ["starter", "growth"] as const) {
      const saved = PLAN_PRICES[p].monthly * 12 - PLAN_ANNUAL_TOTAL[p];
      expect(saved).toBeGreaterThan(PLAN_PRICES[p].monthly * 1.9);
      expect(saved).toBeLessThan(PLAN_PRICES[p].monthly * 2.1);
    }
  });

  it("every price is one penny under a round figure", () => {
    const pennies = (n: number) => Math.round(n * 100) % 100;
    for (const n of [...Object.values(PLAN_ANNUAL_TOTAL), ENTERPRISE_FROM_ANNUAL, PLAN_PRICES.starter.monthly, PLAN_PRICES.growth.monthly]) {
      expect(pennies(n)).toBe(99);
    }
  });

  it("formatPlanPrice keeps both decimals", () => {
    expect(formatPlanPrice(1499.99)).toBe("£1,499.99");
    expect(formatPlanPrice(199.99)).toBe("£199.99");
  });
});

describe("plan features", () => {
  it("social value, bid carbon pack and PAS 2080 start at Growth (and are open on trial)", () => {
    for (const f of ["socialValue", "bidCarbonPack", "pas2080"] as const) {
      expect(hasFeature("starter", f)).toBe(false);
      expect(hasFeature("growth", f)).toBe(true);
      expect(hasFeature("enterprise", f)).toBe(true);
      expect(hasFeature("trial", f)).toBe(true);
    }
  });
});

describe("PLAN_LABELS", () => {
  it("has labels for all plans", () => {
    expect(PLAN_LABELS.trial).toBe("Trial");
    expect(PLAN_LABELS.starter).toBe("Starter");
    expect(PLAN_LABELS.growth).toBe("Growth");
    expect(PLAN_LABELS.enterprise).toBe("Enterprise");
  });
});
