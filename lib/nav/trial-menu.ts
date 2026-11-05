// What a trial organisation sees in the menu and in quick find: the Core and Second wave areas from
// founder/feature-triage.md. The trial previews the product's wedge (the Carbon Reduction Plan, imports,
// waste, fuel, reports), not the whole of Growth. Nothing is switched off: a parked page still opens by
// URL, its API routes work and every plan limit is unchanged. This only trims what a prospect is shown.
// Focus mode (lib/nav/modules.ts) lets an organisation choose its own list instead; a non-empty choice wins over this menu.

/** Page paths under /orgs/{orgId}/, each covering the pages nested beneath it. */
export const CORE_AREAS = [
  "dashboard", "carbon-reduction-plan", "imports", "records", "checklist", "submissions", "fuel", "waste",
  "calculations", "snapshots", "reports", "boundary", "base-year", "completeness", "targets", "audit",
  "lineage", "data-quality", "anomalies", "pilot", "settings",
] as const;

export const SECOND_WAVE_AREAS = [
  "management-systems", "contracts", "tenders", "social-value", "embodied-carbon", "plant", "material-movements",
  "suppliers", "supplier-reports", "kpis", "analytics", "map", "environment", "enforcement-notices",
  "compliance/deadlines", "compliance/assurance-readiness", "assurance", "commuting", "pathway", "offsets", "tasks",
] as const;

const TRIAL_AREAS = [...CORE_AREAS, ...SECOND_WAVE_AREAS];

/** Inside an allowed area but parked: ISO 14001 registers that travel with biodiversity and water. */
const TRIAL_EXCLUDED = ["environment/legal-register", "environment/aspects", "settings/sso"] as const;

export const within = (path: string, area: string) => path === area || path.startsWith(`${area}/`);

/** Whether the page at `path` (below /orgs/{orgId}/, no leading slash) is on the trial menu. */
export function inTrialMenu(path: string): boolean {
  const clean = path.replace(/^\/+/, "").replace(/[?#].*$/, "");
  if (TRIAL_EXCLUDED.some((x) => within(clean, x))) return false;
  return TRIAL_AREAS.some((a) => within(clean, a));
}

/** The trial menu applies to an organisation on the trial plan that is not a design-partner pilot. */
export function trialMenuApplies(org: { plan?: string | null; isPilot?: boolean | null }): boolean {
  return org.plan === "trial" && !org.isPilot;
}
