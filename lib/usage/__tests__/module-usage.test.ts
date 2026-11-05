import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({ moduleUsageDay: { upsert: vi.fn(), deleteMany: vi.fn() } }));
vi.mock("@/lib/db", () => ({ prisma: db }));

import { MODULES } from "@/lib/nav/modules";
import { recordModuleVisit, summariseUsage, usageDay } from "../module-usage";

const now = new Date("2026-11-05T15:30:00Z");
const daysAgo = (n: number) => new Date(Date.UTC(2026, 10, 5 - n));

describe("usageDay", () => {
  it("counts a visit under its UTC day", () => {
    expect(usageDay(new Date("2026-11-05T23:59:59Z")).toISOString()).toBe("2026-11-05T00:00:00.000Z");
  });
});

describe("summariseUsage", () => {
  it("counts organisations and visits in the 30 and 90 day windows, and lists every module", () => {
    const lines = summariseUsage(
      [
        { organizationId: "a", area: "core:waste", day: daysAgo(0), visits: 3 },
        { organizationId: "a", area: "core:waste", day: daysAgo(29), visits: 1 },
        { organizationId: "b", area: "core:waste", day: daysAgo(30), visits: 2 },
        { organizationId: "c", area: "core:waste", day: daysAgo(90), visits: 9 },
        { organizationId: "a", area: "site-ops", day: daysAgo(89), visits: 4 },
      ],
      now,
    );
    expect(lines[0]).toEqual({ area: "core:waste", orgs30: 1, visits30: 4, orgs90: 2, visits90: 6 });
    expect(lines.find((l) => l.area === "site-ops")).toEqual({ area: "site-ops", orgs30: 0, visits30: 0, orgs90: 1, visits90: 4 });
    for (const m of MODULES) expect(lines.some((l) => l.area === m.key)).toBe(true);
    expect(lines.find((l) => l.area === "tasks")).toEqual({ area: "tasks", orgs30: 0, visits30: 0, orgs90: 0, visits90: 0 });
  });
});

describe("recordModuleVisit", () => {
  beforeEach(() => {
    db.moduleUsageDay.upsert.mockReset();
    db.moduleUsageDay.deleteMany.mockReset();
  });

  it("adds one visit to the organisation's area for the day", async () => {
    db.moduleUsageDay.upsert.mockResolvedValue({});
    await recordModuleVisit("org1", "core:waste", now);
    const day = new Date("2026-11-05T00:00:00Z");
    expect(db.moduleUsageDay.upsert).toHaveBeenCalledWith({
      where: { organizationId_area_day: { organizationId: "org1", area: "core:waste", day } },
      create: { organizationId: "org1", area: "core:waste", day, visits: 1 },
      update: { visits: { increment: 1 } },
    });
  });

  it("never throws when the write fails", async () => {
    db.moduleUsageDay.upsert.mockImplementation(async () => { throw new Error("relation does not exist"); });
    await expect(recordModuleVisit("org1", "core:waste", now)).resolves.toBeUndefined();
  });
});
