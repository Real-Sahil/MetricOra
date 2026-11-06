/**
 * PPN 026 Standard Reporting Metrics and target cohorts, from Annex B of
 * "Guidance on using PPN 026: The Social Value Model" (Cabinet Office, issued
 * October 2026, GOV.UK, Open Government Licence v3.0). Pure data: the
 * October framework version installs these as its measures.
 *
 * `aggregate` says how delivery entries combine into the KPI's figure:
 * "sum" adds approved entries (jobs created, person hours), "latest" takes the
 * most recent approved entry, for metrics that describe a position at a point
 * in time (people paid above the National Living Wage, retention rate).
 * `cohort` marks the metrics the guidance phrases as "for the target community
 * or cohort", where the entry records how many people from each cohort it reached.
 */

export type SrmAggregate = "sum" | "latest";

export type Ppn026Metric = {
  code: string;
  /** Criterion code in the framework (jobs, conditions, pay, training, progression, pipeline). */
  criterion: string;
  text: string;
  unit: string;
  aggregate: SrmAggregate;
  cohort?: boolean;
};

export const PPN026_METRICS: Ppn026Metric[] = [
  // 1a. Create good jobs or apprenticeships
  { code: "1ai", criterion: "jobs", text: "Number of jobs created under the contract, by UK region", unit: "jobs", aggregate: "sum" },
  { code: "1aii", criterion: "jobs", text: "Number of apprenticeships (Level 2, 3, and 4+) created or retained under the contract, by UK region", unit: "apprenticeships", aggregate: "sum" },
  { code: "1aiii", criterion: "jobs", text: "Number of jobs aligned with Industrial Strategy high-growth sectors", unit: "jobs", aggregate: "sum" },
  { code: "1aiv", criterion: "jobs", text: "Number of jobs created which address critical manufacturing in the UK", unit: "jobs", aggregate: "sum" },
  { code: "1av", criterion: "jobs", text: "Number of new entrants supported in critical manufacturing sectors in the UK to develop supply chain capacity", unit: "new entrants", aggregate: "sum" },
  { code: "1avi", criterion: "jobs", text: "Number of SMEs and VCSEs in the supply chain", unit: "organisations", aggregate: "latest" },
  { code: "1avii", criterion: "jobs", text: "Number of jobs created through delivery of the contract, including in supply chains", unit: "jobs", aggregate: "sum" },
  // 1b. Fair working conditions
  { code: "1bi", criterion: "conditions", text: "Number of people working on the contract (aged 16 and above) who have a permanent contract", unit: "people", aggregate: "latest" },
  { code: "1bii", criterion: "conditions", text: "Number of people with long-term health conditions supported into work", unit: "people", aggregate: "sum" },
  { code: "1biii", criterion: "conditions", text: "Number of employees receiving workplace adjustments", unit: "employees", aggregate: "latest" },
  { code: "1biv", criterion: "conditions", text: "Retention rates for employees with health conditions", unit: "%", aggregate: "latest" },
  { code: "1bv", criterion: "conditions", text: "Participation rates in health and wellbeing initiatives", unit: "%", aggregate: "latest" },
  { code: "1bvi", criterion: "conditions", text: "Number of workers with flexible working arrangements", unit: "workers", aggregate: "latest" },
  // 1c. Fair pay
  { code: "1ci", criterion: "pay", text: "Number of people working on the contract paid above the National Minimum Wage", unit: "people", aggregate: "latest" },
  { code: "1cii", criterion: "pay", text: "Number of people working on the contract paid above the National Living Wage", unit: "people", aggregate: "latest" },
  { code: "1ciii", criterion: "pay", text: "Number of people working on the contract paid above the National Living Wage irrespective of age", unit: "people", aggregate: "latest" },
  { code: "1civ", criterion: "pay", text: "Number of people not meeting the earnings threshold for statutory sick pay who are entitled to sick pay from day one at 100% of their usual earnings", unit: "people", aggregate: "latest" },
  // 2a. Training / Retraining
  { code: "2ai", criterion: "training", text: "Number of T-Level industry placements hosted or retained for the target community or cohort", unit: "placements", aggregate: "sum", cohort: true },
  { code: "2aii", criterion: "training", text: "Number of training schemes delivered to address identified skills gaps in target communities or cohorts in the contract workforce", unit: "schemes", aggregate: "sum", cohort: true },
  { code: "2aiii", criterion: "training", text: "Person hours of training schemes delivered to address identified skills gaps in target communities or cohorts in the contract workforce", unit: "person hours", aggregate: "sum", cohort: true },
  { code: "2aiv", criterion: "training", text: "Number of training schemes delivered to address identified skills gaps in target communities or cohorts in the future contract workforce", unit: "schemes", aggregate: "sum", cohort: true },
  { code: "2av", criterion: "training", text: "Person hours of training schemes delivered to address identified skills gaps in target communities or cohorts in the future contract workforce", unit: "person hours", aggregate: "sum", cohort: true },
  { code: "2avi", criterion: "training", text: "Number of individual non-apprenticeship training opportunities created or retained for the target community or cohort", unit: "opportunities", aggregate: "sum", cohort: true },
  { code: "2avii", criterion: "training", text: "Number of skills or training positions created which address critical manufacturing in the UK", unit: "positions", aggregate: "sum" },
  // 2b. In-work progression
  { code: "2bi", criterion: "progression", text: "Person hours of staff in-work progression upskilling delivered through training opportunities and comprehensive upskilling programmes", unit: "person hours", aggregate: "sum" },
  { code: "2bii", criterion: "progression", text: "Number of hours of career support and guidance provided to the workforce", unit: "hours", aggregate: "sum" },
  { code: "2biii", criterion: "progression", text: "Person hours spent participating in volunteering opportunities", unit: "person hours", aggregate: "sum" },
  // 2c. Talent Pipeline
  { code: "2ci", criterion: "pipeline", text: "Number of apprenticeships created in high-growth innovative industries", unit: "apprenticeships", aggregate: "sum" },
  { code: "2cii", criterion: "pipeline", text: "Number of training places offered in high-growth innovative industries", unit: "training places", aggregate: "sum" },
  { code: "2ciii", criterion: "pipeline", text: "Number of work experience placements delivered in high-growth innovative industries", unit: "placements", aggregate: "sum" },
  { code: "2civ", criterion: "pipeline", text: "Number of SMEs, VCSEs, universities, catapults or research organisations engaged in the supply chain", unit: "organisations", aggregate: "latest" },
  { code: "2cv", criterion: "pipeline", text: "Number of people located in deprived areas who have received skills training", unit: "people", aggregate: "sum" },
  { code: "2cvi", criterion: "pipeline", text: "Number of people located in deprived areas who report a positive impact of receiving the training", unit: "people", aggregate: "sum" },
  { code: "2cvii", criterion: "pipeline", text: "Number of new entrants supported in critical manufacturing sectors in the UK to develop supply chain capacity", unit: "new entrants", aggregate: "sum" },
  { code: "2cviii", criterion: "pipeline", text: "Number of actions to address systemic barriers to future employment or training for the target community or cohort", unit: "actions", aggregate: "sum", cohort: true },
  { code: "2cix", criterion: "pipeline", text: "Number of activities supporting the target community or cohort to attain essential skills", unit: "activities", aggregate: "sum", cohort: true },
  { code: "2cx", criterion: "pipeline", text: "Number of people in the contract workforce with learner-owned skills \"passports\"", unit: "people", aggregate: "latest" },
];

export const PPN026_METRIC_BY_CODE = new Map(PPN026_METRICS.map((m) => [m.code, m]));

/** The guidance's target cohorts, in its order. Entries record counts of people only, never who they are. */
export const PPN026_COHORTS = [
  { code: "neet", label: "Not in education, employment or training (NEET), aged 16 to 24" },
  { code: "education-transition", label: "Moving from education into work (left in the last 12 months)" },
  { code: "health-disability", label: "Long-term health condition or disability (Equality Act 2010)" },
  { code: "send", label: "Special educational needs and disabilities (SEND) or neurodiversity" },
  { code: "care-leavers", label: "Care leavers aged 16 to 24" },
  { code: "probation", label: "On probation, leaving prison, or in prison with support to reduce reoffending" },
  { code: "domestic-abuse", label: "Victims of domestic abuse" },
  { code: "veterans", label: "Veterans" },
] as const;

export type CohortCode = (typeof PPN026_COHORTS)[number]["code"];
export const COHORT_CODES = PPN026_COHORTS.map((c) => c.code) as [CohortCode, ...CohortCode[]];

/** Keeps only known cohort codes with whole, non-negative counts; anything else is dropped. */
export function cleanCohortCounts(raw: unknown): Partial<Record<CohortCode, number>> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Partial<Record<CohortCode, number>> = {};
  for (const code of COHORT_CODES) {
    const v = (raw as Record<string, unknown>)[code];
    if (typeof v === "number" && Number.isInteger(v) && v > 0) out[code] = v;
  }
  return out;
}
