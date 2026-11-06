// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  carbonReductionPlan: { findMany: vi.fn() },
  organizationMembership: { findMany: vi.fn() },
  notification: { findFirst: vi.fn() },
  baseYearRecalculation: { findMany: vi.fn() },
  restatement: { findMany: vi.fn() },
  auditLog: { findFirst: vi.fn() },
  organization: { findUnique: vi.fn() },
}));
const jobs = vi.hoisted(() => ({ dispatchNotification: vi.fn() }));
const audit = vi.hoisted(() => ({ writeAuditLog: vi.fn() }));
const mail = vi.hoisted(() => ({ sendEmail: vi.fn() }));

vi.mock("@/lib/db", () => ({ prisma: db }));
vi.mock("@/lib/jobs/dispatch", () => jobs);
vi.mock("@/lib/db/audit", () => audit);
vi.mock("@/lib/notifications/email", async (orig) => ({ ...(await orig<typeof import("@/lib/notifications/email")>()), sendEmail: mail.sendEmail }));
vi.mock("@/lib/observability", () => ({ getLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }) }));

import { anniversary, crpRenewal, processCrpRenewalReminders, renewalStage } from "../renewal";
import { crpSectionsSchema } from "../plan";
import { notificationPresentation } from "@/lib/notifications/presentation";
import { crpReminderEmail } from "@/lib/notifications/email";

function plan(id: string, signedDate: string, status = "generated", label = "FY2025", signatoryEmail = "") {
  return { id, status, sections: { declaration: { signatoryName: "A Director", signatoryTitle: "Director", signedDate, signatoryEmail } }, reportingPeriod: { label } };
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
    db.organizationMembership.findMany.mockResolvedValue([
      { userId: "u1", user: { email: "ed1@example.com" } },
      { userId: "u2", user: { email: "Ed2@Example.com" } },
    ]);
    db.notification.findFirst.mockResolvedValue(null);
    db.baseYearRecalculation.findMany.mockResolvedValue([]);
    db.restatement.findMany.mockResolvedValue([]);
    db.auditLog.findFirst.mockResolvedValue(null);
    db.organization.findUnique.mockResolvedValue({ name: "Acme <Civils>" });
    jobs.dispatchNotification.mockResolvedValue("processed");
    mail.sendEmail.mockResolvedValue(undefined);
  });

  it("raises a material change recorded after the sign-off day, even when the annual update is not due", async () => {
    db.carbonReductionPlan.findMany.mockResolvedValue([{ ...plan("p1", "2026-06-01"), organizationId: "org-a" }]);
    db.baseYearRecalculation.findMany.mockResolvedValue([
      { id: "r1", approvedAt: new Date("2026-08-14T10:00:00Z"), deltaPercent: { toString: () => "-6.25" }, baseYear: { significanceThresholdPercent: { toString: () => "5" } } },
    ]);
    db.restatement.findMany.mockResolvedValue([{ id: "s1", createdAt: new Date("2026-07-02T09:00:00Z"), deltaPercent: null }]);
    expect(await processCrpRenewalReminders(now)).toBe(4);
    const where = db.baseYearRecalculation.findMany.mock.calls[0][0].where;
    expect(where).toMatchObject({ organizationId: "org-a", status: "approved", isSignificant: true, approvedAt: { gte: new Date("2026-06-02T00:00:00Z") } });
    expect(db.restatement.findMany.mock.calls[0][0].where).toMatchObject({ organizationId: "org-a", isMaterial: true });
    const ids = jobs.dispatchNotification.mock.calls.map((c) => c[0].resourceId);
    expect(ids).toEqual(["p1:restatement:s1", "p1:restatement:s1", "p1:base_year_recalculation:r1", "p1:base_year_recalculation:r1"]);
    expect(jobs.dispatchNotification.mock.calls[2][0]).toMatchObject({
      type: "crp_material_change",
      metadata: { kind: "base_year_recalculation", date: "2026-08-14", deltaPercent: -6.25, thresholdPercent: 5, signedDate: "2026-06-01" },
    });
  });

  it("emails the plan's signatory once per stage, and records it in the audit log", async () => {
    db.carbonReductionPlan.findMany.mockResolvedValue([{ ...plan("p1", "2025-12-01", "generated", "FY2025", "director@acme.example"), organizationId: "org-a" }]);
    expect(await processCrpRenewalReminders(now)).toBe(3);
    expect(mail.sendEmail).toHaveBeenCalledTimes(1);
    const sent = mail.sendEmail.mock.calls[0][0];
    expect(sent.to).toBe("director@acme.example");
    expect(sent.html).toContain("Acme &lt;Civils&gt;");
    expect(sent.text).toContain("remove it from the plan's declaration");
    expect(audit.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: "org-a", action: "carbon_reduction_plan.reminder_emailed", resourceId: "p1:2026-12-01:due_30", actorUserId: null }),
    );
    expect(JSON.stringify(audit.writeAuditLog.mock.calls[0][0].metadata)).not.toContain("director@");

    vi.clearAllMocks();
    db.auditLog.findFirst.mockResolvedValue({ id: "a" });
    db.notification.findFirst.mockResolvedValue({ id: "n" });
    db.baseYearRecalculation.findMany.mockResolvedValue([]);
    db.restatement.findMany.mockResolvedValue([]);
    db.organizationMembership.findMany.mockResolvedValue([{ userId: "u1", user: { email: "ed1@example.com" } }]);
    expect(await processCrpRenewalReminders(now)).toBe(0);
    expect(mail.sendEmail).not.toHaveBeenCalled();
  });

  it("does not email the signatory separately when they are an editor already", async () => {
    db.carbonReductionPlan.findMany.mockResolvedValue([{ ...plan("p1", "2025-12-01", "generated", "FY2025", "ed2@example.com"), organizationId: "org-a" }]);
    expect(await processCrpRenewalReminders(now)).toBe(2);
    expect(mail.sendEmail).not.toHaveBeenCalled();
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

describe("crp_material_change presentation", () => {
  it("names the change and the organisation's own threshold, without claiming compliance", () => {
    const p = notificationPresentation({
      type: "crp_material_change",
      recipientUserId: "u1",
      orgId: "org-a",
      resourceId: "p1:base_year_recalculation:r1",
      metadata: { kind: "base_year_recalculation", date: "2026-08-14", deltaPercent: -6.25, thresholdPercent: 5, signedDate: "2026-06-01", periodLabel: "FY2025" },
    });
    expect(p.body).toContain("-6.3%");
    expect(p.body).toContain("threshold 5%");
    expect(p.body).toContain("where there has been a material change");
    expect(p.link).toBe("/orgs/org-a/carbon-reduction-plan");
    expect(`${p.title} ${p.body}`).not.toMatch(/complian/i);
  });
});

describe("crpReminderEmail", () => {
  it("escapes the organisation's text in the HTML", () => {
    const e = crpReminderEmail({ recipientName: "<b>Ed</b>", orgName: "A&B", title: "T", body: "<script>x</script>", appUrl: "https://app.example/p" });
    expect(e.html).not.toContain("<script>");
    expect(e.html).toContain("&lt;b&gt;Ed&lt;/b&gt;");
    expect(e.text).toContain("as an editor of A&B");
  });
});

describe("signatory email field", () => {
  it("accepts a blank or plausible address and refuses anything else", () => {
    const decl = (signatoryEmail: string) => crpSectionsSchema.safeParse({ declaration: { signatoryEmail } }).success;
    expect(decl("")).toBe(true);
    expect(decl(" director@acme.co.uk ")).toBe(true);
    expect(decl("not an email")).toBe(false);
    expect(decl("a@b")).toBe(false);
  });
});
