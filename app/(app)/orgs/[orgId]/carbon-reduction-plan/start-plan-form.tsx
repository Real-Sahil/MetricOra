"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FieldRow, inputCls } from "@/components/structured-forms/ms-fields";
import { Button } from "@/components/ui/button";
import type { FiscalYear } from "@/lib/i18n/fiscal-year";

// Starts a plan for an existing reporting period. An organisation with no period yet picks a
// financial year instead: the form creates that period first, then the plan.
export function StartPlanForm({
  orgId,
  periods,
  suggestedYears = [],
}: {
  orgId: string;
  periods: { id: string; label: string }[];
  suggestedYears?: FiscalYear[];
}) {
  const router = useRouter();
  const creatingPeriod = periods.length === 0;
  const [periodId, setPeriodId] = useState(periods[0]?.id ?? "");
  const [yearIndex, setYearIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createPeriod(year: FiscalYear): Promise<string> {
    const res = await fetch(`/api/orgs/${orgId}/reporting-periods`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type: "year", startDate: year.startDate, endDate: year.endDate, label: year.label }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.message ?? "The reporting period could not be created.");
    return body.id as string;
  }

  async function start() {
    setBusy(true);
    setError(null);
    try {
      const year = suggestedYears[yearIndex];
      const id = creatingPeriod ? (year ? await createPeriod(year) : "") : periodId;
      if (!id) throw new Error("Choose the year the plan reports.");
      const res = await fetch(`/api/orgs/${orgId}/carbon-reduction-plans`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reportingPeriodId: id }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "The plan could not be started.");
      router.push(`/orgs/${orgId}/carbon-reduction-plan/${body.plan.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "The plan could not be started.");
      // A period created before the plan failed now exists; reload so the next try picks it from the list.
      if (creatingPeriod) router.refresh();
      setBusy(false);
    }
  }

  const ready = creatingPeriod ? suggestedYears.length > 0 : !!periodId;

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="min-w-[220px]">
        {creatingPeriod ? (
          <FieldRow label="Year the plan reports" htmlFor="crp-year">
            <select id="crp-year" className={inputCls} value={yearIndex} onChange={(e) => setYearIndex(Number(e.target.value))}>
              {suggestedYears.map((y, i) => (
                <option key={y.label} value={i}>
                  {y.label}, {i === 0 ? "last complete year" : "current year"}
                </option>
              ))}
            </select>
          </FieldRow>
        ) : (
          <FieldRow label="Reporting period" htmlFor="crp-period">
            <select id="crp-period" className={inputCls} value={periodId} onChange={(e) => setPeriodId(e.target.value)}>
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </FieldRow>
        )}
      </div>
      <Button onClick={start} disabled={busy || !ready}>
        {busy ? "Starting…" : "Start guided plan"}
      </Button>
      {error ? <p role="alert" className="w-full text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
