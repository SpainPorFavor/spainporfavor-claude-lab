/**
 * Tests for AI-owned client engagement system:
 * - Portal chat (Laura) with case context
 * - Gestor router (access isolation)
 * - Escalation system (admin resolve + relay)
 * - Security boundaries (role-based access)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the LLM module
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content: "Hello! I'm Laura, your immigration assistant. How can I help you today?",
        },
      },
    ],
  }),
}));


// Mock the database module.
// Key insight: `await getDb()` must return a plain object (NOT thenable).
// But `await db.select().from(x).where(y)` must resolve to an array.
// Solution: db itself has no `.then`, but calling any method returns a thenable chain.
vi.mock("./db", () => {
  function makeQueryChain() {
    const chain: any = new Proxy({}, {
      get(_target, prop) {
        if (prop === "then") {
          return (resolve: any, reject?: any) => Promise.resolve([]).then(resolve, reject);
        }
        // Any method call returns the same thenable chain
        return (..._args: any[]) => chain;
      },
    });
    return chain;
  }

  // The db object is NOT a Proxy — it's a plain object with method stubs.
  // Each method returns a thenable query chain.
  const db = {
    select: () => makeQueryChain(),
    insert: () => makeQueryChain(),
    update: () => makeQueryChain(),
    delete: () => makeQueryChain(),
  };

  return {
    getDb: () => Promise.resolve(db),
    captureLead: () => Promise.resolve(undefined),
  };
});

// Mock portalDb — these are the domain-level helpers that chatRouter uses
vi.mock("./portalDb", () => ({
  getCaseByUserId: vi.fn().mockResolvedValue({
    id: 1,
    userId: 1,
    visaType: "digital-nomad-visa",
    status: "collecting_documents",
    clientName: "Test Client",
    clientEmail: "client@test.com",
    nationality: "us",
    dependents: 0,
    familyComposition: "solo",
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  getCaseById: vi.fn().mockResolvedValue({
    id: 1,
    userId: 1,
    visaType: "digital-nomad-visa",
    status: "collecting_documents",
    clientName: "Test Client",
    clientEmail: "client@test.com",
    nationality: "us",
    dependents: 0,
  }),
  getCasesByUserId: vi.fn().mockResolvedValue([]),
  getCaseWithDocuments: vi.fn().mockResolvedValue({
    id: 1,
    visaType: "digital-nomad-visa",
    status: "collecting_documents",
    clientName: "Test Client",
    clientEmail: "client@test.com",
    nationality: "us",
    dependents: 0,
    familyComposition: "solo",
    createdAt: new Date(),
    slots: [],
    progress: { total: 6, completed: 0, percentage: 0 },
  }),
  getAllCases: vi.fn().mockResolvedValue([]),
  updateCaseStatus: vi.fn().mockResolvedValue(undefined),
  linkCaseToUser: vi.fn().mockResolvedValue(undefined),
  createDocumentUpload: vi.fn().mockResolvedValue(1),
  updateUploadValidation: vi.fn().mockResolvedValue(undefined),
  getUnclearUploads: vi.fn().mockResolvedValue([]),
  getSlotsByCaseId: vi.fn().mockResolvedValue([]),
  getUploadsBySlotId: vi.fn().mockResolvedValue([]),
  createCaseWithSlots: vi.fn().mockResolvedValue(1),
}));

// Mock storage
vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ key: "test-key", url: "/manus-storage/test-key" }),
  storageGetSignedUrl: vi.fn().mockResolvedValue("https://signed-url.example.com"),
}));

// Mock event messaging
vi.mock("./eventMessaging", () => ({
  fireCaseEvent: vi.fn().mockResolvedValue(undefined),
}));

// Mock document validation
vi.mock("./documentValidation", () => ({
  validateDocument: vi.fn().mockResolvedValue({ status: "pass", issues: [], feedback: "Looks good" }),
}));

// ============================================================
// CONTEXT HELPERS (following portal.test.ts pattern)
// ============================================================

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createUserContext(role: "user" | "admin" | "gestor" = "user", id = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id,
    openId: `test-${role}-${id}`,
    email: `${role}@test.com`,
    name: `Test ${role.charAt(0).toUpperCase() + role.slice(1)}`,
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: { origin: "http://localhost:3000" },
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

// ============================================================
// SECURITY BOUNDARIES
// ============================================================

describe("Security Boundaries — Role-Based Access", () => {
  it("unauthenticated user cannot access portal chat", async () => {
    const caller = appRouter.createCaller(createPublicContext());

    await expect(
      caller.portalChat.sendMessage({ content: "Hello" })
    ).rejects.toThrow();
  });

  it("unauthenticated user cannot access gestor dashboard", async () => {
    const caller = appRouter.createCaller(createPublicContext());

    await expect(
      caller.gestor.getMyCases()
    ).rejects.toThrow();
  });

  it("regular user cannot access admin escalation management", async () => {
    const caller = appRouter.createCaller(createUserContext("user"));

    await expect(
      caller.portalChat.getEscalations({ status: "open" })
    ).rejects.toThrow();
  });

  it("regular user cannot access gestor procedures", async () => {
    const caller = appRouter.createCaller(createUserContext("user"));

    await expect(
      caller.gestor.getMyCases()
    ).rejects.toThrow();
  });

  it("gestor cannot access admin procedures", async () => {
    const caller = appRouter.createCaller(createUserContext("gestor", 2));

    await expect(
      caller.portalChat.getEscalations({ status: "open" })
    ).rejects.toThrow();
  });

  it("gestor can access gestor procedures", async () => {
    const caller = appRouter.createCaller(createUserContext("gestor", 2));

    const result = await caller.gestor.getMyCases();
    expect(Array.isArray(result)).toBe(true);
  });

  it("admin can access admin escalation procedures", async () => {
    const caller = appRouter.createCaller(createUserContext("admin", 3));

    const result = await caller.portalChat.getEscalations({ status: "open" });
    expect(Array.isArray(result)).toBe(true);
  });
});

// ============================================================
// PORTAL CHAT
// ============================================================

describe("Portal Chat — Laura AI", () => {
  it("authenticated user can send a message and get a response", async () => {
    const caller = appRouter.createCaller(createUserContext("user"));

    const result = await caller.portalChat.sendMessage({ content: "What documents do I need?" });
    expect(result).toHaveProperty("response");
    expect(typeof result.response).toBe("string");
    expect(result.response.length).toBeGreaterThan(0);
  });

  it("rejects empty messages", async () => {
    const caller = appRouter.createCaller(createUserContext("user"));

    await expect(
      caller.portalChat.sendMessage({ content: "" })
    ).rejects.toThrow();
  });

  it("returns escalation flag when Laura detects it", async () => {
    const { invokeLLM } = await import("./_core/llm");
    (invokeLLM as any).mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: "[ESCALATE] I'm not sure about the specific tax implications for your situation. Let me check with our team and get back to you shortly.",
          },
        },
      ],
    });

    const caller = appRouter.createCaller(createUserContext("user"));

    const result = await caller.portalChat.sendMessage({ content: "What are the tax implications of Beckham Law?" });
    expect(result.escalated).toBe(true);
    // The [ESCALATE] marker should be stripped from the visible response
    expect(result.response).not.toContain("[ESCALATE]");
  });

  it("authenticated user can get message history", async () => {
    const caller = appRouter.createCaller(createUserContext("user"));

    const result = await caller.portalChat.getMessages({ limit: 50 });
    expect(Array.isArray(result)).toBe(true);
  });
});

// ============================================================
// GESTOR DATA ISOLATION
// ============================================================

describe("Gestor Router — Data Isolation", () => {
  it("gestor can access their case queue", async () => {
    const caller = appRouter.createCaller(createUserContext("gestor", 2));

    const result = await caller.gestor.getMyCases();
    expect(Array.isArray(result)).toBe(true);
  });

  it("gestor cannot access case not assigned to them (empty result = not found)", async () => {
    const caller = appRouter.createCaller(createUserContext("gestor", 2));

    // The DB mock returns empty array for the ownership check (destructured as [caseData] = undefined)
    // This triggers NOT_FOUND error
    await expect(
      caller.gestor.getCaseDetail({ caseId: 999 })
    ).rejects.toThrow(/not found|not assigned/i);
  });

  it("gestor cannot reject document on unassigned case", async () => {
    const caller = appRouter.createCaller(createUserContext("gestor", 2));

    await expect(
      caller.gestor.rejectDocument({ uploadId: 1, caseId: 999, reason: "Missing apostille" })
    ).rejects.toThrow();
  });

  it("gestor cannot log submission on unassigned case", async () => {
    const caller = appRouter.createCaller(createUserContext("gestor", 2));

    await expect(
      caller.gestor.logSubmission({ caseId: 999, submittedVia: "mercurio" })
    ).rejects.toThrow();
  });

  it("gestor cannot create requerimiento on unassigned case", async () => {
    const caller = appRouter.createCaller(createUserContext("gestor", 2));

    await expect(
      caller.gestor.createRequerimiento({
        caseId: 999,
        description: "Need updated bank statement",
        documentsNeeded: ["Bank statement"],
      })
    ).rejects.toThrow();
  });
});

// ============================================================
// ESCALATION SYSTEM
// ============================================================

describe("Escalation System", () => {
  it("admin can access escalation queue", async () => {
    const caller = appRouter.createCaller(createUserContext("admin", 3));

    const result = await caller.portalChat.getEscalations({ status: "open" });
    expect(Array.isArray(result)).toBe(true);
  });

  it("non-admin cannot resolve escalation tickets", async () => {
    const caller = appRouter.createCaller(createUserContext("user"));

    await expect(
      caller.portalChat.resolveEscalation({ ticketId: 1, response: "test" })
    ).rejects.toThrow();
  });

  it("gestor cannot resolve escalation tickets", async () => {
    const caller = appRouter.createCaller(createUserContext("gestor", 2));

    await expect(
      caller.portalChat.resolveEscalation({ ticketId: 1, response: "test" })
    ).rejects.toThrow();
  });
});
