// The setup checklist on /orgs/{orgId}/onboarding. The Carbon Reduction Plan comes first because it
// is what most new organisations sign up for. Inviting a colleague is offered but never required:
// one person should be able to finish setup alone.

export const REQUIRED_STEPS = [
  "first_crp",
  "org_profile",
  "reporting_period",
  "first_import",
  "first_calculation",
] as const;

export const OPTIONAL_STEPS = ["first_team_member"] as const;

export const ALL_STEPS = [...REQUIRED_STEPS, ...OPTIONAL_STEPS] as const;

export type RequiredStepId = (typeof REQUIRED_STEPS)[number];
export type OnboardingStepId = (typeof ALL_STEPS)[number];

export type StepState = { id: OnboardingStepId; done: boolean };

/**
 * Each step is done when the data shows it (`derived`) or the user marked it done (`saved`).
 * Setup is complete when every required step is done; optional steps never hold it open.
 */
export function onboardingState(derived: Record<OnboardingStepId, boolean>, saved: Iterable<string>) {
  const marked = new Set(saved);
  const state = (id: OnboardingStepId): StepState => ({ id, done: derived[id] || marked.has(id) });
  const steps = REQUIRED_STEPS.map(state);
  const optional = OPTIONAL_STEPS.map(state);
  return { steps, optional, isComplete: steps.every((s) => s.done) };
}

/** Whether a saved set of step ids covers every required step (used when the user marks steps done). */
export function requiredStepsDone(saved: Iterable<string>): boolean {
  const marked = new Set(saved);
  return REQUIRED_STEPS.every((s) => marked.has(s));
}
