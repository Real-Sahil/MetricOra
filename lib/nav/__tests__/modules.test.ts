import { describe, expect, it } from "vitest";
import { cleanModuleKeys, inFocus, inMenu, MODULES, usageAreaLabel, usageAreaOf } from "../modules";

describe("focus modules", () => {
  it("keeps Core areas on whatever is chosen", () => {
    for (const p of ["dashboard", "settings/modules", "carbon-reduction-plan", "reports/abc"]) expect(inFocus(["tasks"], p)).toBe(true);
  });
  it("hides an area only when its module is off", () => {
    expect(inFocus(["tasks"], "plant")).toBe(false);
    expect(inFocus(["site-ops"], "plant/readings")).toBe(true);
    expect(inFocus(["tasks"], "tcfd")).toBe(false);
    expect(inFocus(["disclosure"], "tcfd")).toBe(true);
  });
  it("leaves a page no module claims on", () => {
    expect(inFocus(["tasks"], "compliance")).toBe(true);
  });
  it("cleans keys: known only, once each, catalogue order", () => {
    expect(cleanModuleKeys(["tasks", "nope", "bids", "tasks"])).toEqual(["bids", "tasks"]);
  });
  it("gives each area to one module", () => {
    const all = MODULES.flatMap((m) => m.areas);
    expect(new Set(all).size).toBe(all.length);
  });
  it("lets a chosen focus win over the trial menu, else the trial menu, else everything", () => {
    expect(inMenu({ trialMenu: true, focus: ["disclosure"] }, "tcfd")).toBe(true);
    expect(inMenu({ trialMenu: true, focus: ["disclosure"] }, "plant")).toBe(false);
    expect(inMenu({ trialMenu: true, focus: [] }, "tcfd")).toBe(false);
    expect(inMenu({ trialMenu: false, focus: [] }, "tcfd")).toBe(true);
  });
  it("answers the dashboard's Social and Audit tiles from their pages' modules", () => {
    expect(inMenu({ focus: ["bids"] }, "social-value")).toBe(true);
    expect(inMenu({ focus: ["environment"] }, "social-value")).toBe(false);
    expect(inMenu({ focus: ["disclosure"] }, "compliance/crosswalk")).toBe(true);
    expect(inMenu({ focus: ["bids"] }, "compliance/crosswalk")).toBe(false);
    expect(inMenu({ trialMenu: true }, "social-value")).toBe(true);
    expect(inMenu({ trialMenu: true }, "compliance/crosswalk")).toBe(false);
  });
  it("puts each page in one usage bucket: a Core area, a module, or none", () => {
    expect(usageAreaOf("waste/documents")).toBe("core:waste");
    expect(usageAreaOf("/settings/modules?x=1")).toBe("core:settings");
    expect(usageAreaOf("plant")).toBe("site-ops");
    expect(usageAreaOf("compliance/crosswalk")).toBe("disclosure");
    expect(usageAreaOf("")).toBeNull();
    expect(usageAreaOf("not-a-module")).toBeNull();
    expect(usageAreaLabel("core:base-year")).toBe("Core: base year");
    expect(usageAreaLabel("site-ops")).toBe("Site operations");
  });
});
