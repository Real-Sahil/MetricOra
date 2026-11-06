// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  carbonReductionPlan: { findMany: vi.fn() },
  organizationMembership: { findMany: vi.fn() },
  notification: { findFirst: vi.fn() },
}));
const jobs = vi.hoisted(() => ({ dispatchNotification: vi.fn() }));

vi.mock("@/lib/db", () => ({ prisma: db }));
vi.mock("@/lib/jobs/dispatch", () => jobs);
vi.mock("@/lib/observability", () => ({ getLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }) }));

import { anniversary, crpRenewal, processCrpRenewalReminders, renewalStage } from "../renewal";
import { notificationPresentation } from "@/lib/notifications/presentation";

function plan(id: string, signedDate: string, status = "generated", label = "FY2025") {
  return { id, status, sections: { declaration: { signatoryName: "A Director", signatoryTitle: "Director", signedDate } }, reportingPeriod: { label } };
}

describe("anniversary", () => {
  it("is the same day a year later", () => {
    expect(anniversary("2026-03-12")).toBe("2027-03-12");
  });
  it("moves 29 February to 28 February", () => {
    expect(anniversary("2028-02-29")).toBe("2029-02-28");
  });
  it("rejects text that is not a real date", () => {
    expect(anniversary("2026-02-30")).toBeNull();
    expect(anniversary("12/03/2026")).toBeNull();
    expect(anniversary("")).toBeNull();
  });
});

describe("renewalStage", () => {
  it("steps through 60 days, 30 days and overdue", () => {
    expect(renewalStage(61)).toBe("current");
    expect(renewalStage(60)).toBe("due_60");
    expect(renewalStage(31)).toBe("due_60");
    expect(renewalStage(30)).toBe("due_30");
    expect(renewalStage(0)).toBe("due_30");
    expect(renewalStage(-1)).toBe("overdue");
  });
});

describe("crpRenewal", () => {
  const today = new Date("2026-11-06T15:30:00Z");

  it("runs from the latest signed generated plan, ignoring drafts", () => {
    const r = crpRenewal([plan("old", "2025-01-10"), plan("new", "2025-12-01", "generated", "FY2025"), plan("draft", "2026-10-01", "draft")], today);
    expect(r).toMatchObject({ planId: "new", signedDate: "2025-12-01", dueOn: "2026-12-01", daysLeft: 25, stage: "due_30", periodLabel: "FY2025" });
  });

  it("is overdue once the anniversary has passed", () => {
    expect(crpRenewal([plan("p", "2025-11-05")], today)).toMatchObject({ dueOn: "2026-11-05", daysLeft: -1, stage: "overdue" });
  });

  it("starts no clock without a valid sign-off date", () => {
    expect(crpRenewal([plan("p", ""), plan("q", "soon")], today)).toBeNull();
    expect(crpRenewal([], today)).toBeNull();
  });
});

describe("processCrpRenewalReminders", () => {
  const now = new Date("2026-11-06T07:23:00Z");

  beforeEach(() => {
    vi.clearAllMocks();
    db.organizationMembership.findMany.mockResolvedValue([{ userId: "u1" }, { userId: "u2" }]);
    db.notification.findFirst.mockResolvedValue(null);
    jobs.dispatchNotification.mockResolvedValue("processed");
  });

  it("tells each editor once per stage, keyed by plan, due date and stage", async () => {
    db.carbonReductionPlan.findMany.mockResolvedValue([{ ...plan("p1", "2025-12-01"), organizationId: "org-a" }]);
    db.notification.findFirst.mockImplementation(async ({ where }: { where: { userId: string } }) => (where.userId === "u2" ? { id: "n" } : null));
    expect(await processCrpRenewalReminders(now)).toBe(1);
    expect(jobs.dispatchNotification).toHaveBeenCalledWith(
      expect.objectContaining({ type: "crp_renewal", recipientUserId: "u1", orgId: "org-a", resourceId: "p1:2026-12-01:due_30" }),
    );
    expect(db.organizationMembership.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ organizationId: "org-a", terminatedAt: null }) }));
  });

  it("sends nothing while the plan is more than 60 days from its anniversary", async () => {
    db.carbonReductionPlan.findMany.mockResolvedValue([{ ...plan("p1", "2026-06-01"), organizationId: "org-a" }]);
    expect(await processCrpRenewalReminders(now)).toBe(0);
    expect(jobs.dispatchNotification).not.toHaveBeenCalled();
  });

  it("keeps each organisation's plans to itself", async () => {
    db.carbonReductionPlan.findMany.mockResolvedValue([
      { ...plan("a-new", "2026-06-01"), organizationId: "org-a" },
      { ...plan("b-old", "2025-10-01"), organizationId: "org-b" },
    ]);
    expect(await processCrpRenewalReminders(now)).toBe(2);
    for (const call of jobs.dispatchNotification.mock.calls) expect(call[0]).toMatchObject({ orgId: "org-b", resourceId: "b-old:2026-10-01:overdue" });
  });
});

describe("crp_renewal presentation", () => {
  it("cites the annual update and links to the plans page without claiming compliance", () => {
    const p = notificationPresentation({
      type: "crp_renewal",
      recipientUserId: "u1",
      orgId: "org-a",
      resourceId: "p1:2026-12-01:due_30",
      metadata: { stage: "due_30", dueOn: "2026-12-01", signedDate: "2025-12-01", periodLabel: "FY2025" },
    });
    expect(p.body).toContain("at least annually");
    expect(p.body).toContain("(FY2025)");
    expect(p.link).toBe("/orgs/org-a/carbon-reduction-plan");
    expect(`${p.title} ${p.body}`).not.toMatch(/complian/i);
  });
});
