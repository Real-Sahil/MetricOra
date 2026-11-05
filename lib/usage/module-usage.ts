// Which areas of the app organisations actually open, for the platform Growth page. One row per organisation,
// area and UTC day with a visit count; no user, path or record is stored. A visit is counted once per browser
// tab, area and day (module-usage-beacon.tsx), so the count is "tab-days", not page views.

import { prisma } from "@/lib/db";
import { createLogger } from "@/lib/logger";
import { MODULES } from "@/lib/nav/modules";

const log = createLogger("module-usage");

const RETENTION_DAYS = 400;
/** One write in this many also prunes old rows, so no scheduled job is needed. */
const PRUNE_ONE_IN = 200;
const DAY_MS = 86_400_000;

/** Midnight UTC of `at`, the day a visit is counted under. */
export function usageDay(at: Date): Date {
  return new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate()));
}

export async function recordModuleVisit(orgId: string, area: string, at = new Date()): Promise<void> {
  const day = usageDay(at);
  try {
    await prisma.moduleUsageDay.upsert({
      where: { organizationId_area_day: { organizationId: orgId, area, day } },
      create: { organizationId: orgId, area, day, visits: 1 },
      update: { visits: { increment: 1 } },
    });
    if (Math.random() < 1 / PRUNE_ONE_IN) {
      await prisma.moduleUsageDay.deleteMany({ where: { day: { lt: new Date(day.getTime() - RETENTION_DAYS * DAY_MS) } } });
    }
  } catch (err) {
    // Usage is diagnostics: a failed write must never affect the page.
    log.warn("Could not record a module visit", { error: err instanceof Error ? err.message : String(err) });
  }
}

export type UsageRow = { organizationId: string; area: string; day: Date; visits: number };
export type UsageLine = { area: string; orgs30: number; visits30: number; orgs90: number; visits90: number };

/**
 * Organisations and visits per area over the last 30 and 90 days (counting today). Every module is listed,
 * used or not, so an area nobody opens shows as zero; a Core area is listed once someone has opened it.
 * Sorted by organisations in 90 days, then visits.
 */
export function summariseUsage(rows: readonly UsageRow[], now: Date): UsageLine[] {
  const today = usageDay(now).getTime();
  const from30 = today - 29 * DAY_MS;
  const from90 = today - 89 * DAY_MS;
  const acc = new Map<string, { o30: Set<string>; v30: number; o90: Set<string>; v90: number }>();
  const line = (area: string) => {
    let a = acc.get(area);
    if (!a) acc.set(area, (a = { o30: new Set(), v30: 0, o90: new Set(), v90: 0 }));
    return a;
  };
  for (const m of MODULES) line(m.key);
  for (const r of rows) {
    const t = usageDay(r.day).getTime();
    if (t < from90 || t > today) continue;
    const a = line(r.area);
    a.o90.add(r.organizationId);
    a.v90 += r.visits;
    if (t >= from30) {
      a.o30.add(r.organizationId);
      a.v30 += r.visits;
    }
  }
  return [...acc.entries()]
    .map(([area, a]) => ({ area, orgs30: a.o30.size, visits30: a.v30, orgs90: a.o90.size, visits90: a.v90 }))
    .sort((x, y) => y.orgs90 - x.orgs90 || y.visits90 - x.visits90 || x.area.localeCompare(y.area));
}
