import { prisma } from "@/lib/db";

/**
 * Ids of organisations that chose a focus (Settings, Modules) that leaves `moduleKey` off. A monitor skips
 * them, so nobody is alerted about an area they switched off. An organisation with no focus chosen is never
 * listed, and a failed read (a deploy that lands before its migration) lists nobody, so monitors run as before.
 * Only alerts are skipped: records, API routes and plan limits are unchanged.
 */
export async function orgsWithModuleOff(moduleKey: string): Promise<string[]> {
  try {
    const rows = await prisma.organization.findMany({
      where: { focusModules: { isEmpty: false }, NOT: { focusModules: { has: moduleKey } } },
      select: { id: true },
    });
    return rows.map((r) => r.id);
  } catch {
    return [];
  }
}
