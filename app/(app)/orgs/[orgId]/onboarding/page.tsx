"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Users,
  CalendarRange,
  Upload,
  Calculator,
  CheckCircle2,
  Circle,
  Loader2,
  ChevronRight,
  FileCheck2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OnboardingStepId as StepId } from "@/lib/onboarding/steps";

interface StepDef {
  id: StepId;
  label: string;
  description: string;
  detail: string;
  icon: React.ElementType;
  href: (orgId: string) => string;
  cta: string;
}

// Required steps, in order. The Carbon Reduction Plan is first: it is what most organisations sign up
// for, and the plan's own checks say which figures it still needs.
const STEP_DEFS: StepDef[] = [
  {
    id: "first_crp",
    label: "Start your Carbon Reduction Plan",
    description: "The guided PPN 006 plan, section by section",
    detail:
      "Pick the year the plan reports and the wizard walks you through each section, telling you what is still missing before you generate it.",
    icon: FileCheck2,
    href: (orgId) => `/orgs/${orgId}/carbon-reduction-plan`,
    cta: "Start the plan",
  },
  {
    id: "org_profile",
    label: "Organisation profile",
    description: "Set your industry, country, and reporting currency",
    detail:
      "This ensures emission factors are matched correctly and reports use the right regional standards.",
    icon: Building2,
    href: (orgId) => `/orgs/${orgId}/settings/operations`,
    cta: "Go to settings",
  },
  {
    id: "reporting_period",
    label: "Create a reporting period",
    description: "Define your first annual or quarterly reporting window",
    detail:
      "All activity records and calculations are scoped to a reporting period. Create one before importing data.",
    icon: CalendarRange,
    href: (orgId) => `/orgs/${orgId}/settings/periods`,
    cta: "Create period",
  },
  {
    id: "first_import",
    label: "Import activity data",
    description: "Upload a CSV or enter records manually",
    detail:
      "Import your first batch of activity records: fuel, electricity, travel, or waste data.",
    icon: Upload,
    href: (orgId) => `/orgs/${orgId}/imports`,
    cta: "Go to imports",
  },
  {
    id: "first_calculation",
    label: "Run your first calculation",
    description: "Calculate CO2e for your activity records",
    detail:
      "Once records are committed, run a calculation to produce emission figures you can publish and report on.",
    icon: Calculator,
    href: (orgId) => `/orgs/${orgId}/calculations`,
    cta: "Go to calculations",
  },
];

// Offered, never required: one person can finish setup alone.
const INVITE_STEP: StepDef = {
  id: "first_team_member",
  label: "Invite a colleague",
  description: "Optional. Add an editor, reviewer or auditor whenever you are ready.",
  detail: "Optional. Add an editor, reviewer or auditor whenever you are ready.",
  icon: Users,
  href: (orgId) => `/orgs/${orgId}/settings/members`,
  cta: "Invite",
};

interface StepState {
  id: StepId;
  done: boolean;
}

export default function OnboardingPage() {
  const params = useParams<{ orgId: string }>();
  const orgId = params.orgId;

  const [steps, setSteps] = useState<StepState[]>([]);
  const [inviteDone, setInviteDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [markingStep, setMarkingStep] = useState<StepId | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);

  const fetchProgress = useCallback(async () => {
    setLoadError(false);
    try {
      const res = await fetch(`/api/orgs/${orgId}/onboarding`);
      if (!res.ok) {
        setLoadError(true);
        return;
      }
      const data = await res.json();
      setSteps(data.steps ?? []);
      setInviteDone((data.optional ?? []).some((s: StepState) => s.id === "first_team_member" && s.done));
      if (data.isComplete) {
        // Hard navigation: the sidebar's persistent "Dashboard" link prefetches
        // that route while this page is open, caching a stale "redirect to
        // onboarding" response from before completion. router.push() would
        // reuse that cache and bounce straight back here; a full page load
        // forces the server to re-check completion against current data.
        window.location.assign(`/orgs/${orgId}/dashboard`);
      }
    } catch {
      // Network failure (Safari reports "Load failed"): offer a retry.
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    void fetchProgress();
  }, [fetchProgress]);

  const [skipping, setSkipping] = useState(false);
  const [skipError, setSkipError] = useState<string | null>(null);

  const skipAll = async () => {
    setSkipping(true);
    setSkipError(null);
    try {
      const res = await fetch(`/api/orgs/${orgId}/onboarding`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skipAll: true }),
      });
      if (!res.ok) {
        setSkipError("Couldn't skip setup. Please try again.");
        setSkipping(false);
        return;
      }
      // Hard navigation — see the comment in fetchProgress() above.
      window.location.assign(`/orgs/${orgId}/dashboard`);
    } catch {
      setSkipError("Couldn't skip setup. Please try again.");
      setSkipping(false);
    }
  };

  const markStepDone = async (stepId: StepId) => {
    setMarkingStep(stepId);
    setStepError(null);
    try {
      const res = await fetch(`/api/orgs/${orgId}/onboarding`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: stepId }),
      });
      if (!res.ok) {
        setStepError("Couldn't save that step. Please try again.");
        return;
      }
      // The POST only knows the steps marked by hand; re-read so steps the data already shows stay done.
      await fetchProgress();
    } catch {
      setStepError("Couldn't save that step. Check your connection and try again.");
    } finally {
      setMarkingStep(null);
    }
  };

  const completedCount = steps.filter((s) => s.done).length;
  const total = STEP_DEFS.length;
  const progressPct = total > 0 ? Math.round((completedCount / total) * 100) : 0;
  const activeStepIndex = steps.findIndex((s) => !s.done);
  const activeStepId = activeStepIndex >= 0 ? steps[activeStepIndex]?.id : null;

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-[#5B6A78]" />
      </div>
    );
  }

  if (loadError && steps.length === 0) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm text-[#41505F]">Couldn&apos;t load your setup progress. Check your connection and try again.</p>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            void fetchProgress();
          }}
          className="rounded-md border border-[#E3E8EE] bg-white px-3 py-1.5 text-sm font-medium text-[#131d29] hover:bg-[#F9FAFC]"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#F9FAFC]">
      <div className="max-w-2xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-10">
          <p className="text-xs font-medium tracking-widest uppercase text-[#c2400c] mb-3">
            Setup
          </p>
          <h1 className="text-3xl tracking-tight text-[#131d29] mb-2">
            Get MetricOra ready
          </h1>
          <p className="text-sm text-[#5B6A78] leading-relaxed">
            Start with your Carbon Reduction Plan, then add the data behind it. You can do this on your
            own, and come back to this page at any time from the dashboard.
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#5B6A78]">
              {completedCount} of {total} complete
            </span>
            <span className="text-xs font-medium text-[#131d29]">{progressPct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-[#E3E8EE] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {STEP_DEFS.map((def, i) => {
            const stepState = steps.find((s) => s.id === def.id);
            const done = stepState?.done ?? false;
            const isActive = def.id === activeStepId;
            const Icon = def.icon;
            const isMarking = markingStep === def.id;

            return (
              <div
                key={def.id}
                className={`rounded-[14px] border transition-all ${
                  done
                    ? "border-[#D1FAE5] bg-white opacity-60"
                    : isActive
                    ? "border-[#FED7AA] bg-white shadow-sm"
                    : "border-[#E3E8EE] bg-white"
                }`}
              >
                <div className="flex items-start gap-4 p-4">
                  {/* Step number / check */}
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full mt-0.5 ${
                      done
                        ? "bg-[#D1FAE5]"
                        : isActive
                        ? "bg-[#FFF7ED] border border-[#FED7AA]"
                        : "bg-[#F9FAFC]"
                    }`}
                  >
                    {done ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <span
                        className={`text-xs font-semibold ${
                          isActive ? "text-[#c2400c]" : "text-[#5B6A78]"
                        }`}
                      >
                        {i + 1}
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Icon
                        className={`h-3.5 w-3.5 shrink-0 ${
                          done ? "text-emerald-600" : isActive ? "text-[#c2400c]" : "text-[#5B6A78]"
                        }`}
                      />
                      <p
                        className={`text-sm font-medium tracking-[-0.3px] ${
                          done ? "text-[#5B6A78] line-through" : "text-[#131d29]"
                        }`}
                      >
                        {def.label}
                      </p>
                    </div>
                    <p className="text-xs text-[#5B6A78] leading-relaxed">
                      {isActive ? def.detail : def.description}
                    </p>
                  </div>

                  {/* Actions */}
                  {!done && (
                    <div className="flex items-center gap-2 shrink-0 mt-0.5">
                      {isActive && (
                        <Link href={def.href(orgId)}>
                          <Button
                            size="sm"
                            className="h-7 px-3 text-xs"
                          >
                            {def.cta}
                            <ArrowRight className="ml-1 h-3 w-3" />
                          </Button>
                        </Link>
                      )}
                      <button
                        onClick={() => markStepDone(def.id)}
                        disabled={isMarking}
                        className="text-xs text-[#5B6A78] hover:text-[#5B6A78] transition-colors disabled:opacity-40 flex items-center gap-0.5"
                        title="Mark as done"
                      >
                        {isMarking ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Circle className="h-3.5 w-3.5" />
                        )}
                        <span className="sr-only">Mark done</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Optional: inviting a colleague never holds setup open */}
        <div className="mt-6 flex items-center justify-between gap-4 rounded-[14px] border border-dashed border-[#E3E8EE] bg-white p-4">
          <div className="flex items-start gap-3 min-w-0">
            {inviteDone ? (
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-emerald-600" aria-hidden="true" />
            ) : (
              <Users className="h-4 w-4 mt-0.5 shrink-0 text-[#5B6A78]" aria-hidden="true" />
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#131d29]">{INVITE_STEP.label}</p>
              <p className="text-xs text-[#5B6A78] leading-relaxed">{INVITE_STEP.description}</p>
            </div>
          </div>
          {!inviteDone && (
            <Link
              href={INVITE_STEP.href(orgId)}
              className="shrink-0 text-xs font-medium text-[#c2400c] hover:underline"
            >
              {INVITE_STEP.cta}
            </Link>
          )}
        </div>

        {stepError && (
          <p role="alert" className="mt-4 text-sm text-red-600">{stepError}</p>
        )}

        {/* Skip link */}
        <div className="mt-8 text-center">
          <button
            onClick={skipAll}
            disabled={skipping}
            className="text-xs text-[#5B6A78] hover:text-[#5B6A78] transition-colors inline-flex items-center gap-1 disabled:opacity-40"
          >
            {skipping ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
            Skip setup and go to dashboard
            <ChevronRight className="h-3 w-3" />
          </button>
          {skipError && (
            <p className="mt-2 text-xs text-red-500">{skipError}</p>
          )}
        </div>
      </div>
    </div>
  );
}
