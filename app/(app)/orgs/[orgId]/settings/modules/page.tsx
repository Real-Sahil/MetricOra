export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { AuthError, requireOrgMember, ROLE_GROUPS } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { ModulesForm } from "./modules-form";

export default async function ModulesPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  let canEdit = false;
  try {
    const { membership } = await requireOrgMember(orgId, ...ROLE_GROUPS.dataReaders);
    canEdit = ROLE_GROUPS.admins.includes(membership.role);
  } catch (err) {
    if (err instanceof AuthError && err.status === 401) redirect("/sign-in");
    return <p className="p-8 text-red-600">You do not have access to modules.</p>;
  }
  const org = await prisma.organization.findUnique({ where: { id: orgId }, select: { focusModules: true } }).catch(() => null);
  return <ModulesForm orgId={orgId} canEdit={canEdit} initial={org?.focusModules ?? []} />;
}
