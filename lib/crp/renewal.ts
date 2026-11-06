// PPN 006 renewal: a Carbon Reduction Plan should be updated at least annually
// (Cabinet Office, Model Services Contract buyer guidance). The clock runs from
// the director's sign-off date on the organisation's latest generated plan, so
// the reminder never guesses: a plan with no valid sign-off date starts no clock.
//
// Daily (migration 20261106000116) editors are told once at each stage: 60 days
// before the anniversary, 30 days before, and once the anniversary has passed.
// The notification row is the record that a stage was sent; its resource id
// carries the due date, so re-signing a plan starts a fresh set of reminders.

import { prisma } from "@/lib/db";
import { ROLE_GROUPS } from "@/lib/auth/session";
import { dispatchNotification } from "@/lib/jobs/dispatch";
import { getLogger } from "@/lib/observability";
import { parseSections } from "./plan";

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
  let best: { plan: PlanRow; signedDate: string } | null = null;
  for (const p of plans) {
    if (p.status !== "generated") continue;
    const signedDate = parseSections(p.sections).declaration.signedDate;
    if (!parseDay(signedDate)) continue;
    if (!best || signedDate > best.signedDate) best = { plan: p, signedDate };
  }
  if (!best) return null;
  const dueOn = anniversary(best.signedDate)!;
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const daysLeft = Math.round((parseDay(dueOn)!.getTime() - todayUtc) / DAY_MS);
  return { planId: best.plan.id, periodLabel: best.plan.reportingPeriod.label, signedDate: best.signedDate, dueOn, daysLeft, stage: renewalStage(daysLeft) };
}

const PLAN_SELECT = { id: true, status: true, sections: true, reportingPeriod: { select: { label: true } } } as const;

/** The renewal position for one organisation, for the plans page. */
export async function loadCrpRenewal(orgId: string, today = new Date()): Promise<CrpRenewal | null> {
  const plans = await prisma.carbonReductionPlan.findMany({ where: { organizationId: orgId, status: "generated" }, select: PLAN_SELECT });
  return crpRenewal(plans, today);
}

const logger = getLogger("crp.renewal");

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
      if (!r || r.stage === "current") continue;
      const resourceId = `${r.planId}:${r.dueOn}:${r.stage}`;
      const editors = await prisma.organizationMembership.findMany({
        where: { organizationId: orgId, role: { in: ROLE_GROUPS.editor }, terminatedAt: null },
        select: { userId: true },
      });
      for (const { userId } of editors) {
        const already = await prisma.notification.findFirst({
          where: { organizationId: orgId, userId, type: "crp_renewal", resourceId },
          select: { id: true },
        });
        if (already) continue;
        await dispatchNotification({
          type: "crp_renewal",
          recipientUserId: userId,
          orgId,
          resourceId,
          metadata: { stage: r.stage, dueOn: r.dueOn, signedDate: r.signedDate, periodLabel: r.periodLabel },
        });
        sent++;
      }
    } catch (err) {
      logger.error("CRP renewal reminder failed for an organisation", { orgId, error: err instanceof Error ? err.message : String(err) });
    }
  }
  return sent;
}
