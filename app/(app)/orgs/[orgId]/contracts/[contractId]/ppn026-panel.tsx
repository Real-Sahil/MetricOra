"use client";

import { Table } from "@/components/ui/table";
import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Circle, Download, Loader2, Plus } from "lucide-react";
import { inputCls } from "@/components/structured-forms/ms-fields";
import type { CriterionSummary, Ppn026Check } from "@/lib/social-value/ppn026";
import type { Ppn026MeasureOption } from "@/lib/social-value/ppn026-load";
import { PPN026_COHORTS } from "@/lib/social-value/ppn026-metrics";
import { FormActions, FormField, FormSection } from "@/components/forms/form-kit";
import { Button } from "@/components/ui/button";

type Props = {
  orgId: string;
  contractId: string;
  canEdit: boolean;
  installed: boolean;
  version: string | null;
  minimumWeighting: number | null;
  criteria: CriterionSummary[];
  checks: Ppn026Check[];
  criterionIds: Record<string, string>;
  frameworkId: string | null;
  unassigned: number;
  /** Standard reporting metrics of the installed version, to pick under Add KPI. */
  measures: Ppn026MeasureOption[];
  /** The org has only the August 2026 version; the October one can be added beside it. */
  upgradeAvailable: boolean;
  /** Next 12-month contract performance notice, already formatted; null below £5m. */
  noticeDue: string | null;
  csv: string;
};

const NETWORK = "Couldn't reach the server. Check your connection and try again.";

async function send(url: string, body: unknown): Promise<string | null> {
  try {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) return null;
    const d = (await res.json().catch(() => ({}))) as { message?: string };
    return d.message ?? "Could not save.";
  } catch {
    return NETWORK;
  }
}

const fmt = (n: number) => n.toLocaleString("en-GB", { maximumFractionDigits: 2 });

export function Ppn026Panel(p: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [logFor, setLogFor] = useState<string | null>(null);
  const [kpi, setKpi] = useState({ criterion: p.criteria[0]?.code ?? "jobs", measureId: "", title: "", target: "", unit: "" });
  const [cohorts, setCohorts] = useState<Record<string, string>>({});
  const [entry, setEntry] = useState({ date: new Date().toISOString().slice(0, 10), quantity: "", evidence: "", note: "" });
  const [file, setFile] = useState<File | null>(null);

  async function run(key: string, fn: () => Promise<string | null>, done?: () => void) {
    setBusy(key);
    setError(null);
    const err = await fn();
    setBusy(null);
    if (err) setError(err);
    else {
      done?.();
      router.refresh();
    }
  }

  if (!p.installed) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-[#41505F] max-w-[65ch]">
          From 1 January 2027, central government buyers score social value on jobs and skills for contracts of £1m or more (PPN 026). Add the model to
          track the KPIs you commit to on this contract and the evidence of delivery.
        </p>
        {p.canEdit ? (
          <div>
            <Button
              type="button"
              disabled={!!busy}
              onClick={() => run("install", () => send(`/api/orgs/${p.orgId}/sv/frameworks/ppn-026`, {}))}
              className="gap-1.5"
            >
              {busy === "install" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Add the PPN 026 Social Value Model
            </Button>
          </div>
        ) : null}
        {error ? <p role="alert" className="text-sm text-red-600">{error}</p> : null}
      </div>
    );
  }

  const allKpis = p.criteria.flatMap((c) => c.kpis);
  const unitFor = (id: string) => allKpis.find((k) => k.id === id)?.unit ?? "";
  const metricOf = (code: string | null) => (code ? p.measures.find((m) => m.code === code) : undefined);
  const logKpi = logFor ? allKpis.find((k) => k.id === logFor) : undefined;
  const logCohorts = !!metricOf(logKpi?.metricCode ?? null)?.cohort;
  const criterionMetrics = p.measures.filter((m) => m.criterion === kpi.criterion);

  function downloadCsv() {
    const url = URL.createObjectURL(new Blob([p.csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "ppn026-kpis.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-[#5B6A78]">
        <span>Model version: {p.version}</span>
        <span>
          Minimum social value weighting for this contract value:{" "}
          {p.minimumWeighting != null ? `${p.minimumWeighting}%` : "not in scope (under £1m or no value set)"}
        </span>
        {p.noticeDue ? <span>Next contract performance notice due by {p.noticeDue} (the buyer publishes it)</span> : null}
      </div>

      {p.upgradeAvailable && p.canEdit ? (
        <div className="flex flex-col gap-2 rounded-lg border border-[#E3E8EE] bg-[#F9FAFC] p-3 text-sm">
          <p className="text-[#41505F] max-w-[65ch]">
            The Cabinet Office guidance of October 2026 adds standard reporting metrics for each criterion and asks for at least one KPI on contracts of £5m or
            more. Adding the October version keeps your August KPIs and their delivery.
          </p>
          <div>
            <Button
              type="button"
              size="sm"
              disabled={!!busy}
              onClick={() => run("install", () => send(`/api/orgs/${p.orgId}/sv/frameworks/ppn-026`, {}))}
              className="gap-1.5"
            >
              {busy === "install" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Add the October 2026 version
            </Button>
          </div>
        </div>
      ) : null}

      <ul className="grid gap-1.5">
        {p.checks.map((c) => (
          <li key={c.id} className="flex items-start gap-2 text-sm">
            {c.passed ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />}
            <span>
              <span className="text-[#131d29]">{c.label}</span>
              {!c.passed ? <span className="block text-xs text-[#5B6A78]">{c.fix}</span> : null}
            </span>
          </li>
        ))}
      </ul>

      {["good-jobs", "skills"].map((outcome) => {
        const rows = p.criteria.filter((c) => c.outcomeCode === outcome);
        return (
          <section key={outcome} className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-[#131d29]">{rows[0]?.outcomeName}</h3>
            <div className="rounded-[14px] border border-[#E3E8EE] overflow-x-auto">
              <Table className="w-full table-fixed text-sm">
                <thead>
                  <tr className="bg-[#F9FAFC] text-left text-xs text-[#41505F]">
                    <th className="py-2.5 pl-4 font-normal">Award criterion and KPI</th>
                    <th className="py-2.5 font-normal text-right w-[110px]">Target</th>
                    <th className="py-2.5 font-normal text-right w-[110px]">Delivered</th>
                    <th className="py-2.5 font-normal text-right w-[80px]">Evidence</th>
                    <th className="py-2.5 pr-4 w-[120px]" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((c) => (
                    <Fragment key={c.code}>
                      <tr className="border-t border-[#E3E8EE]">
                        <td colSpan={5} className="py-2 pl-4 text-xs font-medium text-[#41505F]">
                          {c.name}
                          {c.kpis.length === 0 ? <span className="ml-2 font-normal text-[#5B6A78]">No KPI</span> : null}
                        </td>
                      </tr>
                      {c.kpis.map((k) => (
                        <tr key={k.id} className="border-t border-[#E3E8EE]">
                          <td className="py-2 pl-8 text-[#131d29]">
                            {k.metricCode ? (
                              <span className="mr-1.5 rounded border border-[#E3E8EE] px-1 py-0.5 font-mono text-[11px] text-[#41505F]" title={metricOf(k.metricCode)?.name}>
                                {k.metricCode}
                              </span>
                            ) : null}
                            {k.title}
                            {k.aggregate === "latest" ? <span className="ml-2 text-xs text-[#5B6A78]">latest figure</span> : null}
                            {Object.keys(k.cohortTotals).length > 0 ? (
                              <span
                                className="block text-xs text-[#5B6A78]"
                                title={PPN026_COHORTS.filter((c) => k.cohortTotals[c.code]).map((c) => `${c.label}: ${k.cohortTotals[c.code]}`).join("\n")}
                              >
                                People reached from target cohorts: {fmt(Object.values(k.cohortTotals).reduce((s, n) => s + (n ?? 0), 0))}
                              </span>
                            ) : null}
                            {k.pendingEntries > 0 ? (
                              <Link href={`/orgs/${p.orgId}/social-value/activities`} className="ml-2 text-xs text-[#c2400c] underline">
                                {k.pendingEntries} awaiting review
                              </Link>
                            ) : null}
                          </td>
                          <td className="py-2 text-right tabular-nums">{k.target != null ? `${fmt(k.target)} ${k.unit ?? ""}` : "-"}</td>
                          <td className="py-2 text-right tabular-nums">
                            {fmt(k.delivered)}
                            {k.progressPct != null ? <span className="ml-1 text-xs text-[#5B6A78]">{k.progressPct}%</span> : null}
                          </td>
                          <td className="py-2 text-right tabular-nums text-xs text-[#41505F]">
                            {k.entriesWithEvidence}/{k.approvedEntries}
                          </td>
                          <td className="py-2 pr-4 text-right">
                            {p.canEdit ? (
                              <button type="button" onClick={() => setLogFor(logFor === k.id ? null : k.id)} className="text-xs text-[#131d29] underline underline-offset-2">
                                Log delivery
                              </button>
                            ) : null}
                          </td>
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </Table>
            </div>
          </section>
        );
      })}

      {p.unassigned > 0 ? (
        <p className="text-xs text-[#5B6A78]">
          {p.unassigned} KPI{p.unassigned === 1 ? " is" : "s are"} not linked to a criterion. Link them from Social value, Commitments.
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        {allKpis.length > 0 ? (
          <button type="button" onClick={downloadCsv} className="inline-flex items-center gap-1 rounded-md border border-[#E3E8EE] px-3 py-1.5 text-sm text-[#131d29] hover:bg-[#F9FAFC]">
            <Download className="h-3.5 w-3.5" /> Download KPI figures (CSV)
          </button>
        ) : null}
        <p className="text-xs text-[#5B6A78] max-w-[65ch]">
          The guidance refers to a Community Programme list for local delivery. It has not been published yet, so it is not in this model.
        </p>
      </div>

      {logFor ? (
        <form
          className="space-y-6 rounded-lg border border-[#E3E8EE] bg-white p-4 sm:p-5"
          onSubmit={(e) => {
            e.preventDefault();
            const k = logKpi;
            const cohortCounts = logCohorts
              ? Object.fromEntries(Object.entries(cohorts).filter(([, v]) => v !== "" && Number(v) > 0).map(([c, v]) => [c, Math.round(Number(v))]))
              : undefined;
            void run(
              "log",
              async () => {
                let evidenceUrl = entry.evidence;
                if (file) {
                  try {
                    const body = new FormData();
                    body.append("file", file);
                    const up = await fetch(`/api/orgs/${p.orgId}/sv/activities/evidence`, { method: "POST", body });
                    const d = (await up.json().catch(() => ({}))) as { url?: string; message?: string };
                    if (!up.ok || !d.url) return d.message ?? "Couldn't upload the evidence file.";
                    evidenceUrl = d.url;
                  } catch {
                    return NETWORK;
                  }
                }
                return send(`/api/orgs/${p.orgId}/sv/activities`, {
                  commitmentId: logFor,
                  title: k?.title ?? "Delivery",
                  description: entry.note || undefined,
                  activityDate: entry.date,
                  quantityValue: Number(entry.quantity),
                  quantityUnit: unitFor(logFor) || undefined,
                  evidenceUrls: evidenceUrl ? [evidenceUrl] : undefined,
                  cohortCounts,
                });
              },
              () => {
                setFile(null);
                setLogFor(null);
                setCohorts({});
                setEntry({ date: new Date().toISOString().slice(0, 10), quantity: "", evidence: "", note: "" });
              },
            );
          }}
        >
          <FormSection title={`Log delivery: ${logKpi?.title ?? ""}`} description="Delivery is reviewed before it counts. Do not include personal details in notes or files." cols={3}>
            <FormField label="Date" htmlFor="ppn026-date">
              <input id="ppn026-date" type="date" required className={inputCls} value={entry.date} onChange={(e) => setEntry({ ...entry, date: e.target.value })} />
            </FormField>
            <FormField label={`Quantity${unitFor(logFor) ? ` (${unitFor(logFor)})` : ""}`} htmlFor="ppn026-qty">
              <input id="ppn026-qty" type="number" min="0" step="any" required className={inputCls} value={entry.quantity} onChange={(e) => setEntry({ ...entry, quantity: e.target.value })} />
            </FormField>
            <FormField label="Evidence" htmlFor="ppn026-file" span={3} optional hint="Upload a file or paste a link to the payroll extract, training record or timesheet">
              <input id="ppn026-file" type="file" accept="application/pdf,image/*,.csv,.xlsx,.docx" className="block w-full text-sm text-[#41505F] file:mr-3 file:rounded-md file:border file:border-[#E3E8EE] file:bg-white file:px-3 file:py-1.5 file:text-sm" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              <input id="ppn026-evidence" type="url" aria-label="Or a link to the evidence" placeholder="https://" className={inputCls} value={entry.evidence} onChange={(e) => setEntry({ ...entry, evidence: e.target.value })} />
            </FormField>
            <FormField label="Note" htmlFor="ppn026-note" span={3} optional>
              <input id="ppn026-note" className={inputCls} value={entry.note} onChange={(e) => setEntry({ ...entry, note: e.target.value })} />
            </FormField>
          </FormSection>
          {logCohorts ? (
            <FormSection
              title="People reached from the target cohorts"
              description="How many people from each cohort this delivery reached. Numbers only: never record who they are."
              cols={2}
            >
              {PPN026_COHORTS.map((c) => (
                <FormField key={c.code} label={c.label} htmlFor={`ppn026-cohort-${c.code}`} optional>
                  <input
                    id={`ppn026-cohort-${c.code}`}
                    type="number"
                    min="0"
                    step="1"
                    inputMode="numeric"
                    className={inputCls}
                    value={cohorts[c.code] ?? ""}
                    onChange={(e) => setCohorts({ ...cohorts, [c.code]: e.target.value })}
                  />
                </FormField>
              ))}
            </FormSection>
          ) : null}
          <FormActions>
            <Button type="button" size="sm" variant="outline" onClick={() => { setLogFor(null); setCohorts({}); }}>Cancel</Button>
            <Button type="submit" size="sm" disabled={!!busy}>{busy === "log" ? "Saving..." : "Submit for review"}</Button>
          </FormActions>
        </form>
      ) : null}

      {p.canEdit ? (
        adding ? (
          <form
            className="space-y-6 rounded-lg border border-[#E3E8EE] bg-white p-4 sm:p-5"
            onSubmit={(e) => {
              e.preventDefault();
              void run(
                "kpi",
                () =>
                  send(`/api/orgs/${p.orgId}/sv/commitments`, {
                    contractId: p.contractId,
                    frameworkId: p.frameworkId,
                    outcomeId: p.criterionIds[kpi.criterion],
                    measureId: kpi.measureId || undefined,
                    title: kpi.title,
                    targetValue: kpi.target ? Number(kpi.target) : undefined,
                    targetUnit: kpi.unit || undefined,
                    status: "active",
                  }),
                () => {
                  setAdding(false);
                  setKpi({ ...kpi, measureId: "", title: "", target: "", unit: "" });
                },
              );
            }}
          >
            <FormSection title="Add a KPI" description="The measure you committed to in the bid, under one of the award criteria." cols={4}>
              <FormField label="Award criterion" htmlFor="ppn026-criterion" span={2}>
                <select id="ppn026-criterion" className={inputCls} value={kpi.criterion} onChange={(e) => setKpi({ ...kpi, criterion: e.target.value, measureId: "" })}>
                  {p.criteria.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.outcomeName}: {c.name}
                    </option>
                  ))}
                </select>
              </FormField>
              {p.measures.length > 0 ? (
                <FormField
                  label="Standard reporting metric"
                  htmlFor="ppn026-metric"
                  span={2}
                  optional
                  hint="From Annex B of the guidance. Leave blank only where the buyer agreed a different metric."
                >
                  <select
                    id="ppn026-metric"
                    className={inputCls}
                    value={kpi.measureId}
                    onChange={(e) => {
                      const m = criterionMetrics.find((x) => x.id === e.target.value);
                      setKpi({ ...kpi, measureId: e.target.value, unit: m?.unit ?? kpi.unit });
                    }}
                  >
                    <option value="">None (agreed with the buyer)</option>
                    {criterionMetrics.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.code}: {m.name}
                      </option>
                    ))}
                  </select>
                </FormField>
              ) : null}
              <FormField label="KPI, as committed in the bid" htmlFor="ppn026-title" span={2}>
                <input id="ppn026-title" required maxLength={300} placeholder="For example: apprenticeship starts on the contract" className={inputCls} value={kpi.title} onChange={(e) => setKpi({ ...kpi, title: e.target.value })} />
              </FormField>
              <FormField label="Target" htmlFor="ppn026-target" optional>
                <input id="ppn026-target" type="number" min="0" step="any" className={inputCls} value={kpi.target} onChange={(e) => setKpi({ ...kpi, target: e.target.value })} />
              </FormField>
              <FormField label="Unit" htmlFor="ppn026-unit" optional>
                <input id="ppn026-unit" maxLength={50} placeholder="starts, hours, people" className={inputCls} value={kpi.unit} onChange={(e) => setKpi({ ...kpi, unit: e.target.value })} />
              </FormField>
            </FormSection>
            <FormActions>
              <Button type="button" size="sm" variant="outline" onClick={() => setAdding(false)}>Cancel</Button>
              <Button type="submit" size="sm" disabled={!!busy}>{busy === "kpi" ? "Saving..." : "Add KPI"}</Button>
            </FormActions>
          </form>
        ) : (
          <div>
            <button type="button" onClick={() => setAdding(true)} className="inline-flex items-center gap-1 rounded-md border border-[#E3E8EE] px-3 py-1.5 text-sm text-[#131d29] hover:bg-[#F9FAFC]">
              <Plus className="h-3.5 w-3.5" /> Add KPI
            </button>
          </div>
        )
      ) : null}

      {error ? <p role="alert" className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
