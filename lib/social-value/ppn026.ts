import type { Prisma } from "@prisma/client";
import { cleanCohortCounts, PPN026_COHORTS, PPN026_METRICS, type CohortCode, type SrmAggregate } from "./ppn026-metrics";

/**
 * PPN 026: The Social Value Model (Cabinet Office, published 5 August 2026).
 * Applies to central government procurements starting on or after
 * 1 January 2027 with a total value of £1m or more including VAT. Two
 * outcomes, six award criteria, weighted at least 10% (under £5m) or 20%
 * (£5m and above). It sets no reporting metrics: delivery is measured through
 * contract KPIs, at least three on contracts of £5m or more. Carbon is not
 * part of it; that stays with PPN 006.
 *
 * The guidance issued in October 2026 added sub-criteria, the 37 Standard
 * Reporting Metrics and the target cohorts, and replaced the three-KPI rule
 * with at least one Social Value Model KPI on contracts of £5m or more. It is
 * a separate framework (`PPN026_OCT_SLUG`) so KPIs set against the August
 * text keep it; new installs get the October version.
 */
export const PPN026_SLUG = "ppn-026";
export const PPN026_VERSION = "August 2026";
export const PPN026_APPLIES_FROM = "2027-01-01";
export const PPN026_MIN_CONTRACT_VALUE = 1_000_000;
export const PPN026_KPI_THRESHOLD = 5_000_000;
export const PPN026_MIN_KPIS_LARGE = 3;

export const PPN026_OCT_SLUG = "ppn-026-2026-10";
export const PPN026_OCT_VERSION = "October 2026";
/** Both versions, for reads that must find KPIs set against either. */
export const PPN026_SLUGS = [PPN026_SLUG, PPN026_OCT_SLUG];
export type Ppn026Version = "august" | "october";

export type Ppn026Criterion = { code: string; name: string; description: string };
export type Ppn026Outcome = { code: string; name: string; description: string; criteria: Ppn026Criterion[] };

export const PPN026_OUTCOMES: Ppn026Outcome[] = [
  {
    code: "good-jobs",
    name: "Good Jobs",
    description: "Good employment opportunities in every postcode, with fair pay and good working conditions.",
    criteria: [
      { code: "jobs", name: "Create and retain high quality jobs", description: "New or retained jobs on the contract, including for people facing barriers to employment." },
      { code: "conditions", name: "Fair working conditions", description: "Working conditions beyond the statutory minimum that help people stay in work." },
      { code: "pay", name: "Fair pay", description: "Pay beyond the statutory minimum for people working on the contract." },
    ],
  },
  {
    code: "skills",
    name: "Skills",
    description: "Learning and development that addresses skills needs and shortages, such as apprenticeships and work placements.",
    criteria: [
      { code: "training", name: "Training and retraining", description: "Training, retraining, apprenticeships and work placements." },
      { code: "progression", name: "In-work progression", description: "Opportunities that help people move into higher-paid or more skilled work." },
      { code: "pipeline", name: "Talent pipeline", description: "Pre-employment training and routes into work that build the future workforce." },
    ],
  },
];

/** Annex B of the October 2026 guidance. Criterion codes match August's, so KPIs line up across versions. */
export const PPN026_OCT_OUTCOMES: Ppn026Outcome[] = [
  {
    code: "good-jobs",
    name: "Good jobs",
    description:
      "Good jobs offering fair pay and good working conditions, helping people to get a job, stay in work and progress in their careers.",
    criteria: [
      { code: "jobs", name: "Create good jobs or apprenticeships", description: "New jobs and apprenticeships on the contract, including for the target cohorts and in high-growth or critical manufacturing sectors." },
      { code: "conditions", name: "Fair working conditions", description: "Contracts that reflect hours worked, leave beyond the statutory minimum and support for people with health conditions." },
      { code: "pay", name: "Fair pay", description: "Pay above the National Minimum Wage and National Living Wage, and sick pay from day one." },
    ],
  },
  {
    code: "skills",
    name: "Skills",
    description:
      "Activities to address skills shortages, promoting skills development particularly for people who face barriers to employment.",
    criteria: [
      { code: "training", name: "Training and retraining", description: "Placements, training schemes and opportunities for the target cohorts, current and future workforce." },
      { code: "progression", name: "In-work progression", description: "Upskilling, career support and volunteering for people working on the contract." },
      { code: "pipeline", name: "Talent pipeline", description: "Apprenticeships, placements and essential skills that build the future workforce, including in deprived areas." },
    ],
  },
];

export const ppn026Outcomes = (v: Ppn026Version) => (v === "october" ? PPN026_OCT_OUTCOMES : PPN026_OUTCOMES);

/** Minimum social value weighting a buyer must apply, or null below the threshold. */
export function ppn026MinimumWeighting(contractValue: number | null): number | null {
  if (contractValue == null || contractValue < PPN026_MIN_CONTRACT_VALUE) return null;
  return contractValue >= PPN026_KPI_THRESHOLD ? 20 : 10;
}

/**
 * Creates the October 2026 framework, with the Standard Reporting Metrics as
 * measures, or returns the existing one. Idempotent. An organisation that
 * installed the August version keeps it beside this one.
 */
export async function installPpn026(tx: Prisma.TransactionClient, orgId: string): Promise<{ id: string; created: boolean }> {
  const existing = await tx.svFramework.findUnique({
    where: { organizationId_slug: { organizationId: orgId, slug: PPN026_OCT_SLUG } },
    select: { id: true },
  });
  if (existing) return { id: existing.id, created: false };
  const fw = await tx.svFramework.create({
    data: {
      organizationId: orgId,
      name: "PPN 026 Social Value Model",
      slug: PPN026_OCT_SLUG,
      version: PPN026_OCT_VERSION,
      description:
        "Central government Social Value Model for procurements from 1 January 2027 of £1m or more: Good jobs and Skills, six award criteria and 37 standard reporting metrics. Delivery is tracked as contract KPIs.",
      themes: {
        create: PPN026_OCT_OUTCOMES.map((o, i) => ({
          code: o.code,
          name: o.name,
          description: o.description,
          sortOrder: i,
          outcomes: {
            create: o.criteria.map((c, j) => ({
              code: c.code,
              name: c.name,
              description: c.description,
              sortOrder: j,
              measures: {
                create: PPN026_METRICS.filter((m) => m.criterion === c.code).map((m, k) => ({
                  code: m.code,
                  name: m.text,
                  unit: m.unit,
                  sortOrder: k,
                })),
              },
            })),
          },
        })),
      },
    },
    select: { id: true },
  });
  return { id: fw.id, created: true };
}

// ── Contract KPIs: committed against delivered ───────────────────────────────

export type KpiInput = {
  id: string;
  title: string;
  outcomeCode: string | null;
  targetValue: number | null;
  targetUnit: string | null;
  status: string;
  /** Standard Reporting Metric code, when the KPI uses one. */
  metricCode?: string | null;
  /** How entries combine; defaults to "sum". */
  aggregate?: SrmAggregate;
  activities: {
    status: string;
    quantityValue: number | null;
    quantityUnit: string | null;
    evidenceCount: number;
    activityDate?: Date | string | null;
    cohortCounts?: unknown;
  }[];
};

export type KpiSummary = {
  id: string;
  title: string;
  target: number | null;
  unit: string | null;
  delivered: number;
  progressPct: number | null;
  approvedEntries: number;
  pendingEntries: number;
  entriesWithEvidence: number;
  metricCode: string | null;
  aggregate: SrmAggregate;
  /** People reached from each target cohort, summed over approved entries. */
  cohortTotals: Partial<Record<CohortCode, number>>;
};

const sameUnit = (a: string | null, b: string | null) => !a || !b || a.trim().toLowerCase() === b.trim().toLowerCase();

const dayOf = (d: Date | string | null | undefined) => (d == null ? -Infinity : new Date(d).getTime());

/**
 * Delivered so far. "sum" adds approved entries in the KPI's unit; "latest"
 * takes the approved entry with the latest activity date (a position, such as
 * people paid above the National Living Wage, is reported, not added up).
 */
export function summariseKpi(k: KpiInput): KpiSummary {
  const aggregate = k.aggregate ?? "sum";
  const approved = k.activities.filter((a) => a.status === "approved");
  const counted = approved.filter((a) => a.quantityValue != null && sameUnit(a.quantityUnit, k.targetUnit));
  let delivered = 0;
  if (aggregate === "latest") {
    let latest: (typeof counted)[number] | undefined;
    for (const a of counted) if (!latest || dayOf(a.activityDate) >= dayOf(latest.activityDate)) latest = a;
    delivered = latest?.quantityValue ?? 0;
  } else {
    delivered = counted.reduce((s, a) => s + (a.quantityValue ?? 0), 0);
  }
  const cohortTotals: Partial<Record<CohortCode, number>> = {};
  for (const a of approved) {
    for (const [code, n] of Object.entries(cleanCohortCounts(a.cohortCounts)) as [CohortCode, number][]) {
      cohortTotals[code] = (cohortTotals[code] ?? 0) + n;
    }
  }
  return {
    id: k.id,
    title: k.title,
    target: k.targetValue,
    unit: k.targetUnit,
    delivered,
    progressPct: k.targetValue && k.targetValue > 0 ? Math.round((delivered / k.targetValue) * 100) : null,
    approvedEntries: approved.length,
    pendingEntries: k.activities.filter((a) => a.status === "submitted" || a.status === "under_review").length,
    entriesWithEvidence: approved.filter((a) => a.evidenceCount > 0).length,
    metricCode: k.metricCode ?? null,
    aggregate,
    cohortTotals,
  };
}

export type CriterionSummary = Ppn026Criterion & { outcomeCode: string; outcomeName: string; kpis: KpiSummary[] };

/** Every PPN 026 criterion in model order, with the contract's KPIs against it. Cancelled KPIs are left out. */
export function summarisePpn026(kpis: KpiInput[], version: Ppn026Version = "august"): CriterionSummary[] {
  const live = kpis.filter((k) => k.status !== "cancelled");
  return ppn026Outcomes(version).flatMap((o) =>
    o.criteria.map((c) => ({
      ...c,
      outcomeCode: o.code,
      outcomeName: o.name,
      kpis: live.filter((k) => k.outcomeCode === c.code).map(summariseKpi),
    })),
  );
}

export type Ppn026Check = { id: string; label: string; passed: boolean; fix: string };

export function ppn026Checks(
  contractValue: number | null,
  criteria: CriterionSummary[],
  version: Ppn026Version = "august",
): Ppn026Check[] {
  const kpis = criteria.flatMap((c) => c.kpis);
  const large = contractValue != null && contractValue >= PPN026_KPI_THRESHOLD;
  const needed = large && version === "august" ? PPN026_MIN_KPIS_LARGE : 1;
  const approvedWithoutEvidence = kpis.reduce((s, k) => s + (k.approvedEntries - k.entriesWithEvidence), 0);
  const withoutMetric = kpis.filter((k) => !k.metricCode).length;
  const countLabel =
    version === "october"
      ? large
        ? "At least one Social Value Model KPI (required on contracts of £5m or more)"
        : "At least one Social Value Model KPI (encouraged below £5m)"
      : large
        ? `At least ${PPN026_MIN_KPIS_LARGE} social value KPIs (contracts of £5m or more)`
        : "At least one social value KPI";
  return [
    {
      id: "kpi-count",
      label: countLabel,
      passed: kpis.length >= needed,
      fix: `Add ${Math.max(needed - kpis.length, 0)} more KPI${needed - kpis.length === 1 ? "" : "s"} against the criteria you committed to in the bid.`,
    },
    ...(version === "october"
      ? [
          {
            id: "srm",
            label: "Every KPI reports against a standard reporting metric",
            passed: kpis.length > 0 && withoutMetric === 0,
            fix:
              withoutMetric > 0
                ? `${withoutMetric} KPI${withoutMetric === 1 ? " has" : "s have"} no metric. Pick the standard reporting metric under Add KPI; where the buyer agreed a different metric, say so in the KPI title.`
                : "Add a KPI and pick its standard reporting metric.",
          },
        ]
      : []),
    {
      id: "targets",
      label: "Every KPI has a target and a unit",
      passed: kpis.length > 0 && kpis.every((k) => k.target != null && k.target > 0 && !!k.unit),
      fix: "Give each KPI the number and unit committed in the bid, for example 12 apprenticeship starts.",
    },
    {
      id: "evidence",
      label: "Every approved delivery entry has evidence attached",
      passed: approvedWithoutEvidence === 0,
      fix: `${approvedWithoutEvidence} approved entr${approvedWithoutEvidence === 1 ? "y has" : "ies have"} no evidence. Attach payroll extracts, training records or timesheets.`,
    },
  ];
}

// ── Contract performance notice ──────────────────────────────────────────────

/**
 * Contracts of £5m or more need a contract performance notice on the Central
 * Digital Platform at least every 12 months. The buyer publishes it; this is
 * the next 12-month mark from the contract start on or after `today`, as a
 * prompt to have the numbers ready. Null below £5m or without a start date.
 */
export function nextPerformanceNoticeDue(start: Date | null, contractValue: number | null, today: Date): Date | null {
  if (!start || contractValue == null || contractValue < PPN026_KPI_THRESHOLD) return null;
  const day = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  for (let k = 1; k < 200; k++) {
    const d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 12 * k, start.getUTCDate()));
    if (d.getTime() >= day) return d;
  }
  return null;
}

// ── KPI export ───────────────────────────────────────────────────────────────

const csvCell = (v: string | number | null) => {
  if (v == null) return "";
  const s = String(v);
  // Neutralise spreadsheet formulas in KPI titles; plain negative numbers stay numbers.
  const safe = /^[=+\-@\t\r]/.test(s) && !/^-?\d+(\.\d+)?$/.test(s) ? `'${s}` : s;
  return /[",\n\r]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
};

/**
 * One row per KPI with the figures a buyer asks for in a contract performance
 * notice: metric, target, delivered, evidence and people reached per cohort.
 * Only approved entries count.
 */
export function ppn026KpiCsv(criteria: CriterionSummary[]): string {
  const head = [
    "Metric code",
    "Criterion",
    "KPI",
    "Metric",
    "Target",
    "Unit",
    "Delivered (approved entries)",
    "Progress %",
    "How delivered is counted",
    "Approved entries",
    "Approved entries with evidence",
    ...PPN026_COHORTS.map((c) => `People reached: ${c.label}`),
  ];
  const rows = criteria.flatMap((c) =>
    c.kpis.map((k) => [
      k.metricCode,
      c.name,
      k.title,
      k.metricCode ? (PPN026_METRICS.find((m) => m.code === k.metricCode)?.text ?? null) : null,
      k.target,
      k.unit,
      k.delivered,
      k.progressPct,
      k.aggregate === "latest" ? "Latest approved figure" : "Sum of approved entries",
      k.approvedEntries,
      k.entriesWithEvidence,
      ...PPN026_COHORTS.map((co) => k.cohortTotals[co.code] ?? 0),
    ]),
  );
  return [head, ...rows].map((r) => r.map(csvCell).join(",")).join("\n") + "\n";
}
