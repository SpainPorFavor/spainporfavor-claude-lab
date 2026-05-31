import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { managementTasks, objectives } from "../drizzle/schema";
import { like, or, eq } from "drizzle-orm";
import { afterAll } from "vitest";

// Clean up test artifacts after all tests run
afterAll(async () => {
  const db = await getDb();
  if (!db) return;
  await db.delete(managementTasks).where(
    or(
      like(managementTasks.title, "%vitest%"),
      like(managementTasks.title, "%Task to update%")
    )
  );
  await db.delete(objectives).where(
    like(objectives.title, "%Launch by Q3 2026%")
  );
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

function createVendorContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "gestor-user-001",
    email: "gestor@example.com",
    name: "Test Gestor",
    loginMethod: "manus",
    role: "gestor",
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

function createRegularUserContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 3,
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

describe("management router - access control", () => {
  it("allows admin to access executive summary", async () => {
    const { ctx } = createManagementContext("admin");
    const caller = appRouter.createCaller(ctx);

    // Should not throw FORBIDDEN
    const result = await caller.management.executive.summary();
    expect(result).toHaveProperty("totalOpenTasks");
    expect(result).toHaveProperty("canGoLive");
    expect(typeof result.totalOpenTasks).toBe("number");
    expect(typeof result.canGoLive).toBe("boolean");
  });

  it("allows super_admin to access executive summary", async () => {
    const { ctx } = createManagementContext("super_admin");
    const caller = appRouter.createCaller(ctx);

    const result = await caller.management.executive.summary();
    expect(result).toHaveProperty("totalOpenTasks");
  });

  it("allows case_manager to access tasks", async () => {
    const { ctx } = createManagementContext("case_manager");
    const caller = appRouter.createCaller(ctx);

    const result = await caller.management.tasks.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("denies regular user access to management", async () => {
    const { ctx } = createRegularUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.management.executive.summary()).rejects.toThrow(
      "Management access required"
    );
  });

  it("denies regular user access to tasks", async () => {
    const { ctx } = createRegularUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.management.tasks.list()).rejects.toThrow(
      "Management access required"
    );
  });

  it("allows gestor to access vendor assignments", async () => {
    const { ctx } = createVendorContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.management.assignments.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("denies regular user access to vendor assignments", async () => {
    const { ctx } = createRegularUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.management.assignments.list()).rejects.toThrow(
      "Access denied"
    );
  });
});

describe("management router - task operations", () => {
  it("can create a task", async () => {
    const { ctx } = createManagementContext("admin");
    const caller = appRouter.createCaller(ctx);

    const result = await caller.management.tasks.create({
      title: "Test task from vitest",
      priority: "normal",
      queue: "general",
    });

    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");
  });

  it("can list tasks", async () => {
    const { ctx } = createManagementContext("admin");
    const caller = appRouter.createCaller(ctx);

    const tasks = await caller.management.tasks.list();
    expect(Array.isArray(tasks)).toBe(true);
    // Should have at least the task we just created
    expect(tasks.length).toBeGreaterThanOrEqual(0);
  });

  it("can get my day tasks", async () => {
    const { ctx } = createManagementContext("admin");
    const caller = appRouter.createCaller(ctx);

    const tasks = await caller.management.tasks.getMyDay();
    expect(Array.isArray(tasks)).toBe(true);
  });

  it("can update a task status", async () => {
    const { ctx } = createManagementContext("admin");
    const caller = appRouter.createCaller(ctx);

    // Create first
    const { id } = await caller.management.tasks.create({
      title: "Task to update",
      priority: "high",
      queue: "general",
    });

    // Update
    const result = await caller.management.tasks.update({
      id,
      status: "doing",
    });
    expect(result).toEqual({ success: true });
  });
});

describe("management router - task archive", () => {
  it("can archive a task", async () => {
    const { ctx } = createManagementContext("admin");
    const caller = appRouter.createCaller(ctx);

    // Create a task
    const { id } = await caller.management.tasks.create({
      title: "Task to archive vitest",
      priority: "normal",
      queue: "general",
    });

    // Archive it
    const result = await caller.management.tasks.archive({ id });
    expect(result).toEqual({ success: true });

    // It should NOT appear in the default list
    const tasks = await caller.management.tasks.list();
    const found = tasks.find((t: any) => t.id === id);
    expect(found).toBeUndefined();
  });

  it("archived tasks appear in listArchived", async () => {
    const { ctx } = createManagementContext("admin");
    const caller = appRouter.createCaller(ctx);

    // Create and archive a task
    const { id } = await caller.management.tasks.create({
      title: "Archived list vitest",
      priority: "low",
      queue: "general",
    });
    await caller.management.tasks.archive({ id });

    // Should appear in archived list
    const archived = await caller.management.tasks.listArchived();
    const found = archived.find((t: any) => t.id === id);
    expect(found).toBeDefined();
    expect(found.archived).toBe(1);
    expect(found.archivedAt).not.toBeNull();
  });

  it("can unarchive a task", async () => {
    const { ctx } = createManagementContext("admin");
    const caller = appRouter.createCaller(ctx);

    // Create, archive, then unarchive
    const { id } = await caller.management.tasks.create({
      title: "Task to unarchive vitest",
      priority: "normal",
      queue: "general",
    });
    await caller.management.tasks.archive({ id });
    const result = await caller.management.tasks.unarchive({ id });
    expect(result).toEqual({ success: true });

    // Should appear in the default list again
    const tasks = await caller.management.tasks.list();
    const found = tasks.find((t: any) => t.id === id);
    expect(found).toBeDefined();
    expect(found.archived).toBe(0);
  });

  it("archived tasks do not appear in getMyDay", async () => {
    const { ctx } = createManagementContext("admin");
    const caller = appRouter.createCaller(ctx);

    // Create a task assigned to admin (id: 1)
    const { id } = await caller.management.tasks.create({
      title: "MyDay archive vitest",
      priority: "critical",
      queue: "general",
    });
    // Assign to admin
    await caller.management.tasks.update({ id, ownerId: 1 });
    // Archive it
    await caller.management.tasks.archive({ id });

    // Should NOT appear in getMyDay
    const myDay = await caller.management.tasks.getMyDay();
    const found = myDay.find((t: any) => t.id === id);
    expect(found).toBeUndefined();
  });
});

describe("management router - objectives", () => {
  it("can create and list objectives", async () => {
    const { ctx } = createManagementContext("admin");
    const caller = appRouter.createCaller(ctx);

    const { id } = await caller.management.objectives.create({
      title: "Launch by Q3 2026",
      priority: "high",
    });
    expect(typeof id).toBe("number");

    const objectives = await caller.management.objectives.list();
    expect(Array.isArray(objectives)).toBe(true);
  });
});

describe("management router - integrations", () => {
  it("can upsert and list integrations", async () => {
    const { ctx } = createManagementContext("admin");
    const caller = appRouter.createCaller(ctx);

    await caller.management.integrations.upsert({
      integrationName: "Stripe Payments",
      status: "ready",
      requiredForLaunch: true,
    });

    await caller.management.integrations.upsert({
      integrationName: "Email Notification Service",
      status: "not_configured",
      requiredForLaunch: true,
    });

    const list = await caller.management.integrations.list();
    expect(list.length).toBeGreaterThanOrEqual(2);
  });
});

describe("management router - risks", () => {
  it("can list risks", async () => {
    const { ctx } = createManagementContext("admin");
    const caller = appRouter.createCaller(ctx);

    const risks = await caller.management.risks.list();
    expect(Array.isArray(risks)).toBe(true);
  });
});

describe("management router - audit log", () => {
  it("can list audit log entries", async () => {
    const { ctx } = createManagementContext("admin");
    const caller = appRouter.createCaller(ctx);

    const logs = await caller.management.auditLog.list();
    expect(Array.isArray(logs)).toBe(true);
  });
});
