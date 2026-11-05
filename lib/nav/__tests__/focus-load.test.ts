import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({ organization: { findMany: vi.fn() } }));
vi.mock("@/lib/db", () => ({ prisma: db }));

import { orgsWithModuleOff } from "../focus-load";

describe("orgsWithModuleOff", () => {
  beforeEach(() => { db.organization.findMany.mockReset(); });

  it("lists organisations whose chosen focus leaves the module off", async () => {
    db.organization.findMany.mockResolvedValue([{ id: "a" }, { id: "b" }]);
    expect(await orgsWithModuleOff("bids")).toEqual(["a", "b"]);
    expect(db.organization.findMany).toHaveBeenCalledWith({
      where: { focusModules: { isEmpty: false }, NOT: { focusModules: { has: "bids" } } },
      select: { id: true },
    });
  });

  it("lists nobody when the read fails, so monitors run as before", async () => {
    db.organization.findMany.mockImplementation(async () => { throw new Error("column does not exist"); });
    expect(await orgsWithModuleOff("bids")).toEqual([]);
  });
});
