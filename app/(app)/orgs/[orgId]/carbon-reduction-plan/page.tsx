export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthError, requireOrgMember, ROLE_GROUPS } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { previousFiscalYear, fiscalYearOf } from "@/lib/i18n/fiscal-year";
import { formatters, orgFormat } from "@/lib/i18n/org-format";
import { loadCrpRenewal } from "@/lib/crp/renewal";
import { StartPlanForm } from "./start-plan-form";

type Props = { params: Promise<{ orgId: string }> };

const STATUS: Record<string, { label: string; cls: string }> = {
  draft: { label: "Draft", cls: "bg-amber-100 text-amber-800" },
  generated: { label: "Generated", cls: "bg-green-100 text-green-800" },
};

// Guided PPN 006 Carbon Reduction Plans, one per reporting period.
export default async function CarbonReductionPlansPage({ params }: Props) {
  const { orgId } = await params;
  let canEdit = false;
  try {
    const { membership } = await requireOrgMember(orgId, ...ROLE_GROUPS.dataReaders);
    canEdit = (ROLE_GROUPS.editor as string[]).includes(membership.role);
  } catch (err) {
    if (err instanceof AuthError) redirect("/sign-in");
    return <div className="p-8 text-sm text-red-600">Access denied.</div>;
  }

  const [plans, periods, org, renewal] = await Promise.all([
    prisma.carbonReductionPlan.findMany({
      where: { organizationId: orgId },
      orderBy: { updatedAt: "desc" },
      select: { id: true, status: true, updatedAt: true, reportingPeriod: { select: { label: true } } },
    }),
    prisma.reportingPeriod.findMany({
      where: { organizationId: orgId },
      orderBy: { startDate: "desc" },
      select: { id: true, label: true },
    }),
    prisma.organization.findUnique({ where: { id: orgId }, select: { fiscalYearStartMonth: true, hqCountry: true, reportingCurrency: true } }),
    loadCrpRenewal(orgId),
  ]);
  const f = formatters(orgFormat(org ?? {}));
  const day = (iso: string) => f.date(new Date(`${iso}T00:00:00Z`));

  // With no reporting period yet, offer the last complete financial year (what a plan usually reports)
  // and the current one, so the plan can start here instead of a detour through Settings.
  const now = new Date();
  const startMonth = org?.fiscalYearStartMonth ?? 1;
  const suggestedYears = periods.length ? [] : [previousFiscalYear(now, startMonth), fiscalYearOf(now, startMonth)];

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6 md:p-8">
      <div>
        <h1 className="text-2xl text-[#131d29]">Carbon Reduction Plan</h1>
        <p className="mt-2 max-w-2xl text-sm text-[#41505F]">
          A guided PPN 006 plan for central government contracts of £5 million a year or more. Each step checks what an evaluator
          looks for, the figures come from your published emissions, and the plan is generated in the Cabinet Office format with a
          director&apos;s sign-off.
        </p>
      </div>

      {renewal ? (
        <section
          className={`rounded-lg border p-4 text-sm ${
            renewal.stage === "overdue"
              ? "border-red-200 bg-red-50 text-red-900"
              : renewal.stage === "current"
                ? "border-[#E3E8EE] bg-white text-[#41505F]"
                : "border-amber-200 bg-amber-50 text-amber-900"
          }`}
        >
          <p>
            <span className="font-medium">
              {renewal.stage === "overdue" ? "Annual update overdue." : renewal.stage === "current" ? "Next annual update" : "Annual update due soon."}
            </span>{" "}
            Your latest signed plan ({renewal.periodLabel}) was signed on {day(renewal.signedDate)}
            {renewal.stage === "overdue"
              ? `, so its update was due on ${day(renewal.dueOn)}.`
              : `; update it by ${day(renewal.dueOn)}.`}{" "}
            PPN 006 asks for a plan to be updated at least annually, or sooner after a material change.
            {canEdit && renewal.stage !== "current" ? " Start a plan for the latest reporting period below; it carries this year's text over." : ""}
          </p>
        </section>
      ) : null}

      {canEdit ? (
        <section className="rounded-lg border border-[#E3E8EE] bg-white p-5">
          <h2 className="text-sm font-semibold text-[#131d29]">Start a plan</h2>
          <p className="mt-1 text-sm text-[#41505F]">
            Pick the reporting period the plan reports. Text from your latest plan is carried over so next year starts from this year.
          </p>
          <div className="mt-4">
            <StartPlanForm orgId={orgId} periods={periods} suggestedYears={suggestedYears} />
            {periods.length ? null : (
              <p className="mt-3 text-xs text-[#5B6A78]">
                This creates the year as a reporting period. For other dates, add a period under{" "}
                <Link href={`/orgs/${orgId}/settings/periods`} className="text-[#c2400c] underline">
                  Settings, Reporting periods
                </Link>
                .
              </p>
            )}
          </div>
        </section>
      ) : null}

      <section>
        <h2 className="text-sm font-semibold text-[#131d29]">Plans</h2>
        {plans.length === 0 ? (
          <p className="mt-2 text-sm text-[#41505F]">No plans yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-[#E3E8EE] rounded-lg border border-[#E3E8EE] bg-white">
            {plans.map((p) => {
              const st = STATUS[p.status] ?? STATUS.draft;
              return (
                <li key={p.id}>
                  <Link href={`/orgs/${orgId}/carbon-reduction-plan/${p.id}`} className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-[#F9FAFC]">
                    <span className="text-sm font-medium text-[#131d29]">{p.reportingPeriod.label}</span>
                    <span className="flex items-center gap-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${st.cls}`}>{st.label}</span>
                      <span className="text-xs text-[#5B6A78]">
                        Updated {p.updatedAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
