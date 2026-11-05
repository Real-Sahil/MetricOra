import { describe, expect, it } from "vitest";
import { inTrialMenu, trialMenuApplies } from "../trial-menu";

describe("inTrialMenu", () => {
  it("shows the Core areas and pages nested under them", () => {
    for (const p of ["carbon-reduction-plan", "imports", "waste", "waste/pack", "reports", "settings/members", "audit/data-lineage"]) {
      expect(inTrialMenu(p), p).toBe(true);
    }
  });

  it("shows the Second wave areas", () => {
    for (const p of ["contracts", "tenders", "plant", "kpis", "map", "environment/permits", "compliance/deadlines", "social-value/commitments"]) {
      expect(inTrialMenu(p), p).toBe(true);
    }
  });

  it("leaves out the parked areas", () => {
    for (const p of ["integrations", "integrations/accounting", "tcfd", "tnfd", "materiality", "transition-plan", "sbti", "scenarios", "carbon-intelligence/alerts", "hs-incidents", "method-statements", "biodiversity", "water", "programmes", "case-studies", "compliance/esrs-e1", "compliance/crosswalk", "carbon-by-account", "finance/invoice-review", "settings/sso", "environment/legal-register", "environment/aspects"]) {
      expect(inTrialMenu(p), p).toBe(false);
    }
  });

  it("does not match on a shared prefix alone", () => {
    expect(inTrialMenu("wastewater")).toBe(false);
    expect(inTrialMenu("/waste?x=1")).toBe(true);
  });
});

describe("trialMenuApplies", () => {
  it("applies to a trial organisation and not to a paid plan or a pilot", () => {
    expect(trialMenuApplies({ plan: "trial", isPilot: false })).toBe(true);
    expect(trialMenuApplies({ plan: "trial", isPilot: true })).toBe(false);
    expect(trialMenuApplies({ plan: "growth" })).toBe(false);
    expect(trialMenuApplies({})).toBe(false);
  });
});
