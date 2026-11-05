"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/db/audit";
import { AuthError, requireOrgMember, ROLE_GROUPS } from "@/lib/auth/session";
import { cleanModuleKeys } from "@/lib/nav/modules";

const schema = z.object({ orgId: z.string().min(1), modules: z.array(z.string().max(64)).max(50) });

/** Saves which optional areas an organisation shows. Admin only; changes the menu, never the data. */
export async function saveFocusModules(input: unknown): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Reload the page and try again." };
  const { orgId } = parsed.data;
  try {
    const { session } = await requireOrgMember(orgId, ...ROLE_GROUPS.admins);
    const modules = cleanModuleKeys(parsed.data.modules);
    const before = await prisma.organization.findUnique({ where: { id: orgId }, select: { focusModules: true } });
    await prisma.organization.update({ where: { id: orgId }, data: { focusModules: modules } });
    await writeAuditLog({
      organizationId: orgId,
      actorUserId: session.user.id,
      action: "organization.focus_modules_updated",
      resourceType: "organization",
      resourceId: orgId,
      metadata: { before: before?.focusModules ?? [], after: modules },
    });
    revalidatePath(`/orgs/${orgId}`, "layout");
    return { ok: true };
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: "Only an administrator can change the modules." };
    return { ok: false, error: "Could not save. Try again." };
  }
}
