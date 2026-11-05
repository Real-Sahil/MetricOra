import { describe, expect, it } from "vitest";
import { onboardingState, REQUIRED_STEPS, requiredStepsDone, type OnboardingStepId } from "../steps";

const none: Record<OnboardingStepId, boolean> = {
  first_crp: false,
  org_profile: false,
  reporting_period: false,
  first_import: false,
  first_calculation: false,
  first_team_member: false,
};

describe("onboardingState", () => {
  it("puts the Carbon Reduction Plan first", () => {
    expect(onboardingState(none, []).steps[0].id).toBe("first_crp");
  });

  it("completes without inviting anyone", () => {
    const all = { ...none, first_crp: true, org_profile: true, reporting_period: true, first_import: true, first_calculation: true };
    const s = onboardingState(all, []);
    expect(s.isComplete).toBe(true);
    expect(s.optional).toEqual([{ id: "first_team_member", done: false }]);
  });

  it("merges steps the user marked done with steps the data shows", () => {
    const s = onboardingState({ ...none, org_profile: true }, ["first_crp"]);
    expect(s.steps.filter((x) => x.done).map((x) => x.id)).toEqual(["first_crp", "org_profile"]);
    expect(s.isComplete).toBe(false);
  });

  it("an organisation that finished the old checklist without a plan is not complete", () => {
    const old = ["org_profile", "first_team_member", "reporting_period", "first_import", "first_calculation"];
    expect(requiredStepsDone(old)).toBe(false);
    expect(requiredStepsDone([...REQUIRED_STEPS])).toBe(true);
  });
});
