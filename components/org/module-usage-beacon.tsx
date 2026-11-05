"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { usageAreaOf } from "@/lib/nav/modules";
import { noteAreaVisit } from "@/app/(app)/orgs/[orgId]/usage-actions";

/**
 * Counts the area of each page the person opens, once per tab, area and UTC day, for the platform Growth page.
 * Runs on every navigation, which the org layout alone would miss (a shared layout is not re-rendered).
 */
export function ModuleUsageBeacon({ orgId }: { orgId: string }) {
  const pathname = usePathname();
  useEffect(() => {
    const path = (pathname ?? "").replace(`/orgs/${orgId}`, "").replace(/^\/+/, "");
    const area = usageAreaOf(path);
    if (!area) return;
    const key = `metricora:usage:${orgId}:${area}:${new Date().toISOString().slice(0, 10)}`;
    try {
      if (window.sessionStorage.getItem(key)) return;
      window.sessionStorage.setItem(key, "1");
    } catch {
      // Storage blocked: count anyway, at most once per navigation.
    }
    void noteAreaVisit({ orgId, path }).catch(() => undefined);
  }, [orgId, pathname]);
  return null;
}
