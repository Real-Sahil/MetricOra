"use server";

import { z } from "zod";
import { requireOrgMember } from "@/lib/auth/session";
import { usageAreaOf } from "@/lib/nav/modules";
import { recordModuleVisit } from "@/lib/usage/module-usage";

const schema = z.object({ orgId: z.string().min(1).max(64), path: z.string().max(300) });

/** Counts one visit to the area of `path` (below /orgs/{orgId}/) for the platform Growth page. Members only; never throws. */
export async function noteAreaVisit(input: unknown): Promise<void> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return;
  const area = usageAreaOf(parsed.data.path);
  if (!area) return;
  try {
    await requireOrgMember(parsed.data.orgId);
  } catch {
    return;
  }
  await recordModuleVisit(parsed.data.orgId, area);
}
