import { describe, it, expect, afterAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { leads } from "../drizzle/schema";
import { like, eq } from "drizzle-orm";

// Test lead email prefix for cleanup
const TEST_PREFIX = "vitest-leads";
const TEST_EMAIL = `${TEST_PREFIX}@test.example.com`;

// Clean up test leads after all tests
afterAll(async () => {
  const db = await getDb();
  if (!db) return;
  await db.delete(leads).where(like(leads.email, `${TEST_PREFIX}%`));
});

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createManagementContext(role: string = "admin"): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user-001",
    email: "admin@spainporfavor.com",
    name: "Admin User",
    loginMethod: "manus",
    role: role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

function createUserContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 99,
    openId: "regular-user-001",
    email: "user@example.com",
    name: "Regular User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("leads management", () => {
  const caller = appRouter.createCaller(createManagementContext().ctx);
  const userCaller = appRouter.createCaller(createUserContext().ctx);

  let testLeadId: number;

  it("should insert a test lead for subsequent tests", async () => {
    const db = await getDb();
    expect(db).not.toBeNull();
    const result = await db!.insert(leads).values({
      email: TEST_EMAIL,
      source: "quiz",
      nationality: "us",
      visaType: "Digital Nomad Visa (DNV)",
      name: "Vitest Lead",
      status: "new",
    });
    testLeadId = result[0].insertId;
    expect(testLeadId).toBeGreaterThan(0);
  });

  it("should list leads for management users", async () => {
    const result = await caller.management.leads.list();
    expect(Array.isArray(result)).toBe(true);
    // Should include our test lead
    const found = result.find((l: any) => l.email === TEST_EMAIL);
    expect(found).toBeDefined();
    expect(found!.status).toBe("new");
  });

  it("should filter leads by status", async () => {
    const result = await caller.management.leads.list({ status: "new" });
    expect(Array.isArray(result)).toBe(true);
    const found = result.find((l: any) => l.email === TEST_EMAIL);
    expect(found).toBeDefined();

    // Should not appear in "converted" filter
    const converted = await caller.management.leads.list({ status: "converted" });
    const notFound = converted.find((l: any) => l.email === TEST_EMAIL);
    expect(notFound).toBeUndefined();
  });

  it("should filter leads by search query", async () => {
    const result = await caller.management.leads.list({ search: "vitest-leads" });
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].email).toBe(TEST_EMAIL);
  });

  it("should get lead detail with chat messages", async () => {
    const detail = await caller.management.leads.getDetail({ id: testLeadId });
    expect(detail.lead).toBeDefined();
    expect(detail.lead.email).toBe(TEST_EMAIL);
    expect(detail.lead.name).toBe("Vitest Lead");
    expect(Array.isArray(detail.chatMessages)).toBe(true);
    // linkedCase may or may not exist
    expect(detail).toHaveProperty("linkedCase");
  });

  it("should update lead status", async () => {
    await caller.management.leads.updateStatus({ id: testLeadId, status: "contacted" });
    const detail = await caller.management.leads.getDetail({ id: testLeadId });
    expect(detail.lead.status).toBe("contacted");
  });

  it("should update lead notes", async () => {
    await caller.management.leads.updateNotes({
      id: testLeadId,
      notes: "Called on May 27 — interested in DNV, follow up next week",
    });
    const detail = await caller.management.leads.getDetail({ id: testLeadId });
    expect(detail.lead.notes).toContain("Called on May 27");
  });

  it("should return stats", async () => {
    const stats = await caller.management.leads.stats();
    expect(stats.total).toBeGreaterThan(0);
    expect(stats).toHaveProperty("thisWeek");
    expect(stats).toHaveProperty("converted");
    expect(stats).toHaveProperty("conversionRate");
    expect(stats).toHaveProperty("byStatus");
    expect(stats).toHaveProperty("bySource");
    expect(stats).toHaveProperty("byVisa");
  });

  it("should deny access to regular users", async () => {
    await expect(userCaller.management.leads.list()).rejects.toThrow();
  });
});
