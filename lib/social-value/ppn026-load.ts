import { prisma } from "@/lib/db";
import {
  PPN026_OCT_SLUG,
  PPN026_SLUGS,
  nextPerformanceNoticeDue,
  ppn026Checks,
  ppn026KpiCsv,
  summarisePpn026,
  type KpiInput,
  type Ppn026Version,
} from "./ppn026";
import { PPN026_METRIC_BY_CODE } from "./ppn026-metrics";

export type Ppn026MeasureOption = { id: string; code: string; name: string; unit: string | null; criterion: string; cohort: boolean };

/**
 * The contract's PPN 026 view: the org's PPN 026 framework (the October 2026
 * version when installed, else August), the criterion ids and standard
 * reporting metrics to create KPIs against, and each KPI's delivery so far.
 * KPIs set against either version are shown. Everything is scoped to the
 * organisation. Null when the contract is not the org's.
 */
export async function loadContractPpn026(orgId: string, contractId: string, today = new Date()) {
  const contract = await prisma.contract.findFirst({
    where: { id: contractId, organizationId: orgId },
    select: { id: true, contractValue: true, startDate: true },
  });
  if (!contract) return null;
  const frameworks = await prisma.svFramework.findMany({
    where: { organizationId: orgId, slug: { in: PPN026_SLUGS } },
    select: {
      id: true,
      slug: true,
      version: true,
      themes: {
        orderBy: { sortOrder: "asc" },
        select: {
          outcomes: {
            orderBy: { sortOrder: "asc" },
            select: {
              id: true,
              code: true,
              measures: { orderBy: { sortOrder: "asc" }, select: { id: true, code: true, name: true, unit: true } },
            },
          },
        },
      },
    },
  });
  const contractValue = contract.contractValue != null ? Number(contract.contractValue) : null;
  const framework = frameworks.find((f) => f.slug === PPN026_OCT_SLUG) ?? frameworks[0];
  if (!framework) {
    return {
      framework: null,
      contractValue,
      criteria: [],
      checks: [],
      criterionIds: {} as Record<string, string>,
      measures: [] as Ppn026MeasureOption[],
      upgradeAvailable: false,
      noticeDue: null,
      csv: "",
      unassigned: 0,
    };
  }
  const version: Ppn026Version = framework.slug === PPN026_OCT_SLUG ? "october" : "august";

  const commitments = await prisma.svCommitment.findMany({
    where: { organizationId: orgId, contractId, frameworkId: { in: frameworks.map((f) => f.id) } },
    select: {
      id: true,
      title: true,
      status: true,
      targetValue: true,
      targetUnit: true,
      outcome: { select: { code: true } },
      measure: { select: { code: true } },
      activities: {
        select: { status: true, quantityValue: true, quantityUnit: true, evidenceUrls: true, activityDate: true, cohortCounts: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });
  const kpis: KpiInput[] = commitments.map((c) => {
    const metricCode = c.measure?.code ?? null;
    return {
      id: c.id,
      title: c.title,
      outcomeCode: c.outcome?.code ?? null,
      targetValue: c.targetValue != null ? Number(c.targetValue) : null,
      targetUnit: c.targetUnit,
      status: c.status,
      metricCode,
      aggregate: (metricCode && PPN026_METRIC_BY_CODE.get(metricCode)?.aggregate) || "sum",
      activities: c.activities.map((a) => ({
        status: a.status,
        quantityValue: a.quantityValue != null ? Number(a.quantityValue) : null,
        quantityUnit: a.quantityUnit,
        evidenceCount: a.evidenceUrls.length,
        activityDate: a.activityDate,
        cohortCounts: a.cohortCounts,
      })),
    };
  });
  const criteria = summarisePpn026(kpis, version);
  const outcomes = framework.themes.flatMap((t) => t.outcomes);
  const criterionIds = Object.fromEntries(outcomes.map((o) => [o.code, o.id]));
  const measures: Ppn026MeasureOption[] = outcomes.flatMap((o) =>
    o.measures
      .filter((m) => m.code)
      .map((m) => ({
        id: m.id,
        code: m.code as string,
        name: m.name,
        unit: m.unit,
        criterion: o.code,
        cohort: PPN026_METRIC_BY_CODE.get(m.code as string)?.cohort === true,
      })),
  );
  return {
    framework: { id: framework.id, version: framework.version },
    contractValue,
    criteria,
    checks: ppn026Checks(contractValue, criteria, version),
    criterionIds,
    measures,
    upgradeAvailable: version === "august",
    noticeDue: nextPerformanceNoticeDue(contract.startDate, contractValue, today),
    csv: ppn026KpiCsv(criteria),
    unassigned: kpis.filter((k) => !k.outcomeCode && k.status !== "cancelled").length,
  };
}
