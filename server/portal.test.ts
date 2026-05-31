import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the portalDb module
vi.mock("./portalDb", () => ({
  createCaseWithSlots: vi.fn().mockResolvedValue(1),
  getCaseByUserId: vi.fn().mockResolvedValue(null),
  getCasesByUserId: vi.fn().mockResolvedValue([]),
  getCaseWithDocuments: vi.fn().mockResolvedValue(null),
  getAllCases: vi.fn().mockResolvedValue([]),
  updateCaseStatus: vi.fn().mockResolvedValue(undefined),
  linkCaseToUser: vi.fn().mockResolvedValue(undefined),
  createDocumentUpload: vi.fn().mockResolvedValue(1),
  updateUploadValidation: vi.fn().mockResolvedValue(undefined),
  getUnclearUploads: vi.fn().mockResolvedValue([]),
  getSlotsByCaseId: vi.fn().mockResolvedValue([]),
  getUploadsBySlotId: vi.fn().mockResolvedValue([]),
  getCaseById: vi.fn().mockResolvedValue(null),
}));

// Mock the document validation module
vi.mock("./documentValidation", () => ({
  validateDocument: vi.fn().mockResolvedValue({
    status: "pass",
    issues: [],
    feedback: "Document looks good!",
  }),
}));

// Mock storage
vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ key: "test-key", url: "/manus-storage/test-key" }),
  storageGetSignedUrl: vi.fn().mockResolvedValue("https://signed-url.example.com"),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createUserContext(role: "user" | "admin" = "user"): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-123",
    email: "test@example.com",
    name: "Test User",
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
      headers: {},
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

describe("portal.getMyCase", () => {
  it("returns null when user has no case", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.portal.getMyCase();
    expect(result).toBeNull();
  });

  it("rejects unauthenticated users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.portal.getMyCase()).rejects.toThrow();
  });
});

describe("portal.getMyCases", () => {
  it("returns empty array when user has no cases", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.portal.getMyCases();
    expect(result).toEqual([]);
  });

  it("rejects unauthenticated users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.portal.getMyCases()).rejects.toThrow();
  });
});

describe("portal.uploadDocument", () => {
  it("rejects unauthenticated users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.portal.uploadDocument({
        slotId: 1,
        fileName: "passport.pdf",
        fileData: "dGVzdA==",
        mimeType: "application/pdf",
        fileSize: 1024,
      })
    ).rejects.toThrow();
  });

  it("rejects when user has no case", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.portal.uploadDocument({
        slotId: 1,
        fileName: "passport.pdf",
        fileData: "dGVzdA==",
        mimeType: "application/pdf",
        fileSize: 1024,
      })
    ).rejects.toThrow("No active case found");
  });

  it("rejects files over 10MB", async () => {
    const { getCaseByUserId, getSlotsByCaseId } = await import("./portalDb");
    (getCaseByUserId as any).mockResolvedValueOnce({
      id: 1,
      userId: 1,
      visaType: "digital-nomad-visa",
      status: "collecting_documents",
      clientName: "Test User",
      clientEmail: "test@example.com",
    });
    (getSlotsByCaseId as any).mockResolvedValueOnce([{ id: 1, documentType: "passport" }]);

    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.portal.uploadDocument({
        slotId: 1,
        fileName: "huge-file.pdf",
        fileData: "dGVzdA==",
        mimeType: "application/pdf",
        fileSize: 11 * 1024 * 1024, // 11MB
      })
    ).rejects.toThrow("File size exceeds 10MB limit");
  });

  it("rejects unsupported file types", async () => {
    const { getCaseByUserId, getSlotsByCaseId } = await import("./portalDb");
    (getCaseByUserId as any).mockResolvedValueOnce({
      id: 1,
      userId: 1,
      visaType: "digital-nomad-visa",
      status: "collecting_documents",
      clientName: "Test User",
      clientEmail: "test@example.com",
    });
    (getSlotsByCaseId as any).mockResolvedValueOnce([{ id: 1, documentType: "passport" }]);

    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.portal.uploadDocument({
        slotId: 1,
        fileName: "document.docx",
        fileData: "dGVzdA==",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        fileSize: 1024,
      })
    ).rejects.toThrow("File type not supported");
  });
});

describe("portal.claimCase", () => {
  it("rejects unauthenticated users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.portal.claimCase({ email: "test@example.com" })
    ).rejects.toThrow();
  });

  it("rejects when email does not match authenticated user", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.portal.claimCase({ email: "nonexistent@example.com" })
    ).rejects.toThrow("You can only claim cases associated with your own email address");
  });

  it("rejects when no unclaimed case found for matching email", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    // User's email is test@example.com — matches but no unclaimed case exists
    await expect(
      caller.portal.claimCase({ email: "test@example.com" })
    ).rejects.toThrow("No unclaimed case found");
  });
});

describe("portal.adminCreateCase", () => {
  it("rejects non-admin users", async () => {
    const ctx = createUserContext("user");
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.portal.adminCreateCase({
        visaType: "digital-nomad-visa",
        clientName: "John Doe",
        clientEmail: "john@example.com",
      })
    ).rejects.toThrow();
  });

  it("creates a case successfully for admin", async () => {
    const ctx = createUserContext("admin");
    const caller = appRouter.createCaller(ctx);

    const result = await caller.portal.adminCreateCase({
      visaType: "digital-nomad-visa",
      clientName: "John Doe",
      clientEmail: "john@example.com",
      nationality: "us",
      dependents: 1,
    });

    expect(result).toHaveProperty("caseId");
    expect(result.caseId).toBe(1);
  });

  it("validates required fields", async () => {
    const ctx = createUserContext("admin");
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.portal.adminCreateCase({
        visaType: "digital-nomad-visa",
        clientName: "",
        clientEmail: "john@example.com",
      })
    ).rejects.toThrow();
  });

  it("validates email format", async () => {
    const ctx = createUserContext("admin");
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.portal.adminCreateCase({
        visaType: "digital-nomad-visa",
        clientName: "John Doe",
        clientEmail: "not-an-email",
      })
    ).rejects.toThrow();
  });
});

describe("portal.adminGetAllCases", () => {
  it("rejects non-admin users", async () => {
    const ctx = createUserContext("user");
    const caller = appRouter.createCaller(ctx);

    await expect(caller.portal.adminGetAllCases()).rejects.toThrow();
  });

  it("returns cases for admin", async () => {
    const ctx = createUserContext("admin");
    const caller = appRouter.createCaller(ctx);

    const result = await caller.portal.adminGetAllCases();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("portal.adminUpdateCaseStatus", () => {
  it("rejects non-admin users", async () => {
    const ctx = createUserContext("user");
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.portal.adminUpdateCaseStatus({
        caseId: 1,
        status: "with_gestor",
      })
    ).rejects.toThrow();
  });

  it("updates status for admin", async () => {
    const ctx = createUserContext("admin");
    const caller = appRouter.createCaller(ctx);

    const result = await caller.portal.adminUpdateCaseStatus({
      caseId: 1,
      status: "ready_for_gestor",
      note: "All documents validated",
    });

    expect(result).toEqual({ success: true });
  });
});

describe("portal.adminOverrideValidation", () => {
  it("rejects non-admin users", async () => {
    const ctx = createUserContext("user");
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.portal.adminOverrideValidation({
        uploadId: 1,
        status: "pass",
        feedback: "Manually approved",
      })
    ).rejects.toThrow();
  });

  it("overrides validation for admin", async () => {
    const ctx = createUserContext("admin");
    const caller = appRouter.createCaller(ctx);

    const result = await caller.portal.adminOverrideValidation({
      uploadId: 1,
      status: "pass",
      feedback: "Manually approved by admin",
    });

    expect(result).toEqual({ success: true });
  });
});

describe("portal.adminGetReviewQueue", () => {
  it("rejects non-admin users", async () => {
    const ctx = createUserContext("user");
    const caller = appRouter.createCaller(ctx);

    await expect(caller.portal.adminGetReviewQueue()).rejects.toThrow();
  });

  it("returns empty queue for admin", async () => {
    const ctx = createUserContext("admin");
    const caller = appRouter.createCaller(ctx);

    const result = await caller.portal.adminGetReviewQueue();
    expect(Array.isArray(result)).toBe(true);
  });
});
