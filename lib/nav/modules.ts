// Focus mode: an organisation switches optional areas on or off in Settings, Modules. The Core areas
// (founder/feature-triage.md) are always on. Switching an area off only hides it from the menu and quick
// find and shows a notice on its pages: records, API routes, plan limits and monitors are unchanged.
// An empty list means no focus has been chosen, so the menu follows the plan (see trial-menu.ts).

import { CORE_AREAS, inTrialMenu, within } from "./trial-menu";

export type ModuleDef = { key: string; label: string; text: string; wave: "second" | "parked"; areas: readonly string[] };

export const MODULES: readonly ModuleDef[] = [
  { key: "management-systems", label: "Management systems", text: "ISO 14001, 45001, 9001 and other frameworks, with shared registers.", wave: "second", areas: ["management-systems"] },
  { key: "bids", label: "Contracts, tenders and social value", text: "Contract carbon, Find a Tender watches and National TOMs tracking.", wave: "second", areas: ["contracts", "tenders", "social-value"] },
  { key: "site-ops", label: "Site operations", text: "Plant, material movements, embodied carbon and commuting.", wave: "second", areas: ["plant", "material-movements", "embodied-carbon", "commuting"] },
  { key: "suppliers", label: "Suppliers", text: "Supplier requests and supplier reports.", wave: "second", areas: ["suppliers", "supplier-reports"] },
  { key: "insight", label: "KPIs, analytics and pathway", text: "KPIs, analytics, site map, reduction pathway and offsets.", wave: "second", areas: ["kpis", "analytics", "map", "pathway", "offsets"] },
  { key: "environment", label: "Environment and enforcement", text: "Permits, enforcement notices and environmental registers.", wave: "second", areas: ["environment", "enforcement-notices"] },
  { key: "assurance", label: "Assurance and deadlines", text: "Assurance pack, readiness checks and the regulatory calendar.", wave: "second", areas: ["assurance", "compliance/assurance-readiness", "compliance/deadlines"] },
  { key: "tasks", label: "Tasks", text: "Review and follow-up tasks.", wave: "second", areas: ["tasks"] },
  { key: "disclosure", label: "Climate disclosure", text: "TCFD, TNFD, double materiality, transition plan, SBTi, scenarios and ESRS crosswalks.", wave: "parked", areas: ["tcfd", "tnfd", "materiality", "transition-plan", "sbti", "scenarios", "compliance/esrs-e1", "compliance/crosswalk", "case-studies", "programmes"] },
  { key: "finance", label: "Accounting and finance", text: "Accounting integrations, carbon by account and invoice review.", wave: "parked", areas: ["integrations", "carbon-by-account", "finance", "carbon-intelligence"] },
  { key: "hse", label: "Health, safety and nature", text: "Incidents, method statements, biodiversity and water.", wave: "parked", areas: ["hs-incidents", "method-statements", "biodiversity", "water"] },
] as const;

const KEYS = new Set(MODULES.map((m) => m.key));

/** Keeps only known module keys, once each, in catalogue order. */
export function cleanModuleKeys(keys: readonly string[]): string[] {
  const seen = new Set(keys.filter((k) => KEYS.has(k)));
  return MODULES.filter((m) => seen.has(m.key)).map((m) => m.key);
}

/** Whether the page at `path` (below /orgs/{orgId}/) is on when the organisation has chosen `focus`. A page is only hidden when it sits in a module that is off; a page no module claims stays on. */
export function inFocus(focus: readonly string[], path: string): boolean {
  const clean = path.replace(/^\/+/, "").replace(/[?#].*$/, "");
  if (CORE_AREAS.some((a) => within(clean, a))) return true;
  const owner = MODULES.filter((m) => m.areas.some((a) => within(clean, a)));
  return owner.length === 0 || owner.some((m) => focus.includes(m.key));
}

export type MenuState = { trialMenu?: boolean; focus?: readonly string[] };

/** One answer for the sidebar, quick find and the page notice: a chosen focus wins, then the trial menu, else everything. */
export function inMenu(state: MenuState, path: string): boolean {
  if (state.focus && state.focus.length > 0) return inFocus(state.focus, path);
  if (state.trialMenu) return inTrialMenu(path);
  return true;
}

/** The usage bucket of a page (below /orgs/{orgId}/): `core:<area>` for a Core area, the module key for a module's page, null for a page neither claims. */
export function usageAreaOf(path: string): string | null {
  const clean = path.replace(/^\/+/, "").replace(/[?#].*$/, "");
  if (clean === "") return null;
  const core = CORE_AREAS.find((a) => within(clean, a));
  if (core) return `core:${core}`;
  return MODULES.find((m) => m.areas.some((a) => within(clean, a)))?.key ?? null;
}

/** A label for a usage bucket from usageAreaOf(). */
export function usageAreaLabel(area: string): string {
  if (area.startsWith("core:")) return `Core: ${area.slice(5).replace(/-/g, " ")}`;
  return MODULES.find((m) => m.key === area)?.label ?? area;
}
