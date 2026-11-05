import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({ requireOrgMember: vi.fn(), recordModuleVisit: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ requireOrgMember: m.requireOrgMember }));
vi.mock("@/lib/usage/module-usage", () => ({ recordModuleVisit: m.recordModuleVisit }));

import { noteAreaVisit } from "@/app/(app)/orgs/[orgId]/usage-actions";

describe("noteAreaVisit", () => {
  beforeEach(() => {
    m.requireOrgMember.mockReset();
    m.recordModuleVisit.mockReset();
  });

  it("records a member's visit under the page's area", async () => {
    m.requireOrgMember.mockResolvedValue({});
    await noteAreaVisit({ orgId: "org1", path: "plant/readings" });
    expect(m.requireOrgMember).toHaveBeenCalledWith("org1");
    expect(m.recordModuleVisit).toHaveBeenCalledWith("org1", "site-ops");
  });

  it("records nothing for someone outside the organisation", async () => {
    m.requireOrgMember.mockImplementation(async () => { throw new Error("NOT_MEMBER"); });
    await expect(noteAreaVisit({ orgId: "other", path: "waste" })).resolves.toBeUndefined();
    expect(m.recordModuleVisit).not.toHaveBeenCalled();
  });

  it("ignores pages no area claims and malformed input", async () => {
    await noteAreaVisit({ orgId: "org1", path: "" });
    await noteAreaVisit({ orgId: 5, path: "waste" });
    expect(m.requireOrgMember).not.toHaveBeenCalled();
    expect(m.recordModuleVisit).not.toHaveBeenCalled();
  });
});
