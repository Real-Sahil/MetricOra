// PPN 006 renewal: a Carbon Reduction Plan should be updated at least annually
// (Cabinet Office, Model Services Contract buyer guidance). The clock runs from
// the director's sign-off date on the organisation's latest generated plan, so
// the reminder never guesses: a plan with no valid sign-off date starts no clock.
//
// Daily (migration 20261106000116) editors are told once at each stage: 60 days
// before the anniversary, 30 days before, and once the anniversary has passed.
// The notification row is the record that a stage was sent; its resource id
// carries the due date, so re-signing a plan starts a fresh set of reminders.
//
// PPN 006 also asks for an update "where there has been a material change". The
// app does not decide what is material: it uses the organisation's own calls, a
// base year recalculation approved as significant (against the base year's own
// threshold) or a restatement marked material, dated after the sign-off day.
// Each one is notified once per editor.
//
// Editors get the in-app, push and email copies through the notification worker.
// A signatory email on the plan's declaration (optional, for a director without
// an account) gets the same email once per stage or change; the audit log is the
// record that it went, so it is never sent twice.

import { prisma } from "@/lib/db";
import { ROLE_GROUPS } from "@/lib/auth/session";
import { dispatchNotification } from "@/lib/jobs/dispatch";
import { getLogger } from "@/lib/observability";
import { writeAuditLog } from "@/lib/db/audit";
import { crpReminderEmail, sendEmail } from "@/lib/notifications/email";
import { notificationPresentation } from "@/lib/notifications/presentation";
import type { NotificationJobData } from "@/lib/jobs/queues/index";
import { parseSections, SIGNATORY_EMAIL } from "./plan";

export type RenewalStage = "current" | "due_60" | "due_30" | "overdue";

export type CrpRenewal = {
  planId: string;
  periodLabel: string;
  /** The director's sign-off date, YYYY-MM-DD. */
  signedDate: string;
  /** The first anniversary of the sign-off, YYYY-MM-DD. */
  dueOn: string;
  /** Whole days from today to the due date; negative once it has passed. */
  daysLeft: number;
  stage: RenewalStage;
  /** The signatory's reminder address from the declaration, or "". */
  signatoryEmail: string;
};

export type MaterialChange = {
  kind: "base_year_recalculation" | "restatement";
  id: string;
  /** The day the recalculation was approved or the restatement recorded, YYYY-MM-DD (UTC). */
  date: string;
  /** Signed change in the total, per cent, when recorded. */
  deltaPercent: number | null;
  /** The base year's significance threshold, per cent (recalculations only). */
  thresholdPercent: number | null;
};

type PlanRow = { id: string; status: string; sections: unknown; reportingPeriod: { label: string } };

const DAY_MS = 86_400_000;

/** A real calendar date in YYYY-MM-DD form, or null. */
function parseDay(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return d.getUTCMonth() === Number(m[2]) - 1 && d.getUTCDate() === Number(m[3]) ? d : null;
}

/** The first anniversary of a YYYY-MM-DD date; 29 February falls back to 28 February. */
export function anniversary(signedDate: string): string | null {
  const d = parseDay(signedDate);
  if (!d) return null;
  const y = d.getUTCFullYear() + 1;
  const mo = d.getUTCMonth();
  const lastDay = new Date(Date.UTC(y, mo + 1, 0)).getUTCDate();
  const due = new Date(Date.UTC(y, mo, Math.min(d.getUTCDate(), lastDay)));
  return due.toISOString().slice(0, 10);
}

export function renewalStage(daysLeft: number): RenewalStage {
  if (daysLeft < 0) return "overdue";
  if (daysLeft <= 30) return "due_30";
  if (daysLeft <= 60) return "due_60";
  return "current";
}

/**
 * The renewal position of the organisation's plans: the generated plan with the
 * latest valid sign-off date. Drafts do not count, since only a generated plan is
 * one the organisation can have published. Null when no generated plan is signed.
 */
export function crpRenewal(plans: PlanRow[], today: Date): CrpRenewal | null {
  let best: { plan: PlanRow; signedDate: string; signatoryEmail: string } | null = null;
  for (const p of plans) {
    if (p.status !== "generated") continue;
    const { signedDate, signatoryEmail } = parseSections(p.sections).declaration;
    if (!parseDay(signedDate)) continue;
    if (!best || signedDate > best.signedDate) best = { plan: p, signedDate, signatoryEmail };
  }
  if (!best) return null;
  const dueOn = anniversary(best.signedDate)!;
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const daysLeft = Math.round((parseDay(dueOn)!.getTime() - todayUtc) / DAY_MS);
  return {
    planId: best.plan.id,
    periodLabel: best.plan.reportingPeriod.label,
    signedDate: best.signedDate,
    dueOn,
    daysLeft,
    stage: renewalStage(daysLeft),
    signatoryEmail: SIGNATORY_EMAIL.test(best.signatoryEmail) ? best.signatoryEmail : "",
  };
}

const toNum = (v: { toString(): string } | null): number | null => (v == null ? null : Number(v.toString()));

/**
 * Material changes recorded after the plan was signed: approved significant base
 * year recalculations and material restatements, strictly after the sign-off day
 * (a change on the day itself is taken to be in the signed plan). Oldest first.
 */
export async function loadMaterialChanges(orgId: string, signedDate: string): Promise<MaterialChange[]> {
  const signed = parseDay(signedDate);
  if (!signed) return [];
  const after = new Date(signed.getTime() + DAY_MS);
  const recalcs = await prisma.baseYearRecalculation.findMany({
    where: { organizationId: orgId, status: "approved", isSignificant: true, approvedAt: { gte: after } },
    select: { id: true, approvedAt: true, deltaPercent: true, baseYear: { select: { significanceThresholdPercent: true } } },
    orderBy: { approvedAt: "asc" },
    take: 50,
  });
  const restatements = await prisma.restatement.findMany({
    where: { organizationId: orgId, isMaterial: true, createdAt: { gte: after } },
    select: { id: true, createdAt: true, deltaPercent: true },
    orderBy: { createdAt: "asc" },
    take: 50,
  });
  const changes: MaterialChange[] = [
    ...recalcs.map((r) => ({
      kind: "base_year_recalculation" as const,
      id: r.id,
      date: r.approvedAt!.toISOString().slice(0, 10),
      deltaPercent: toNum(r.deltaPercent),
      thresholdPercent: toNum(r.baseYear.significanceThresholdPercent),
    })),
    ...restatements.map((r) => ({
      kind: "restatement" as const,
      id: r.id,
      date: r.createdAt.toISOString().slice(0, 10),
      deltaPercent: toNum(r.deltaPercent),
      thresholdPercent: null,
    })),
  ];
  return changes.sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
}

const PLAN_SELECT = { id: true, status: true, sections: true, reportingPeriod: { select: { label: true } } } as const;

/** The renewal position for one organisation, for the plans page. */
export async function loadCrpRenewal(orgId: string, today = new Date()): Promise<CrpRenewal | null> {
  const plans = await prisma.carbonReductionPlan.findMany({ where: { organizationId: orgId, status: "generated" }, select: PLAN_SELECT });
  return crpRenewal(plans, today);
}

const logger = getLogger("crp.renewal");

type Job = Pick<NotificationJobData, "type" | "resourceId" | "metadata">;

/** What is owed for one organisation's latest signed plan: the renewal stage (if due) and each material change. */
export function remindersFor(r: CrpRenewal, changes: MaterialChange[]): Job[] {
  const base = { signedDate: r.signedDate, periodLabel: r.periodLabel };
  const jobs: Job[] = [];
  if (r.stage !== "current") {
    jobs.push({ type: "crp_renewal", resourceId: `${r.planId}:${r.dueOn}:${r.stage}`, metadata: { ...base, stage: r.stage, dueOn: r.dueOn } });
  }
  for (const c of changes) {
    jobs.push({
      type: "crp_material_change",
      resourceId: `${r.planId}:${c.kind}:${c.id}`,
      metadata: { ...base, kind: c.kind, date: c.date, deltaPercent: c.deltaPercent, thresholdPercent: c.thresholdPercent },
    });
  }
  return jobs;
}

export async function processCrpRenewalReminders(now = new Date()): Promise<number> {
  const plans = await prisma.carbonReductionPlan.findMany({
    where: { status: "generated" },
    select: { ...PLAN_SELECT, organizationId: true },
    orderBy: { organizationId: "asc" },
    take: 5000,
  });
  const byOrg = new Map<string, typeof plans>();
  for (const p of plans) byOrg.set(p.organizationId, [...(byOrg.get(p.organizationId) ?? []), p]);

  let sent = 0;
  for (const [orgId, list] of byOrg) {
    try {
      const r = crpRenewal(list, now);
      if (!r) continue;
      const jobs = remindersFor(r, await loadMaterialChanges(orgId, r.signedDate));
      if (jobs.length === 0) continue;
      const editors = await prisma.organizationMembership.findMany({
        where: { organizationId: orgId, role: { in: ROLE_GROUPS.editor }, terminatedAt: null },
        select: { userId: true, user: { select: { email: true } } },
      });
      for (const job of jobs) {
        for (const { userId } of editors) {
          const already = await prisma.notification.findFirst({
            where: { organizationId: orgId, userId, type: job.type, resourceId: job.resourceId },
            select: { id: true },
          });
          if (already) continue;
          await dispatchNotification({ ...job, recipientUserId: userId, orgId });
          sent++;
        }
        const to = r.signatoryEmail;
        const isEditor = editors.some((e) => e.user.email.toLowerCase() === to.toLowerCase());
        if (!to || isEditor) continue;
        try {
          if (await emailSignatory(orgId, r, job, to)) sent++;
        } catch (err) {
          logger.error("CRP reminder email to the signatory failed", { orgId, error: err instanceof Error ? err.message : String(err) });
        }
      }
    } catch (err) {
      logger.error("CRP renewal reminder failed for an organisation", { orgId, error: err instanceof Error ? err.message : String(err) });
    }
  }
  return sent;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.metricora.co.uk";

/** Emails the plan's signatory once per stage or change. The audit row is both the record and the dedupe key. */
async function emailSignatory(orgId: string, r: CrpRenewal, job: Job, to: string): Promise<boolean> {
  const already = await prisma.auditLog.findFirst({
    where: { organizationId: orgId, resourceType: "CarbonReductionPlanReminder", resourceId: job.resourceId },
    select: { id: true },
  });
  if (already) return false;
  const org = await prisma.organization.findUnique({ where: { id: orgId }, select: { name: true } });
  const orgName = org?.name ?? "your organisation";
  const { title, body, link } = notificationPresentation({ ...job, recipientUserId: "", orgId });
  await sendEmail({
    to,
    ...crpReminderEmail({ recipientName: null, orgName, title, body, appUrl: `${APP_URL}${link ?? ""}`, toSignatory: true }),
  });
  await writeAuditLog({
    organizationId: orgId,
    actorUserId: null,
    action: "carbon_reduction_plan.reminder_emailed",
    resourceType: "CarbonReductionPlanReminder",
    resourceId: job.resourceId,
    metadata: { planId: r.planId, type: job.type, recipient: "signatory" },
  });
  return true;
}
