/**
 * SPF Command Center — Management Router
 * All tRPC procedures for the /management section.
 */
import { TRPCError } from "@trpc/server";
import { eq, desc, asc, and, or, isNull, isNotNull, lte, gte, inArray, sql, ne, like, count } from "drizzle-orm";
import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";

/** Helper to get db or throw — management routes require DB */
async function requireDb(): Promise<NonNullable<Awaited<ReturnType<typeof getDb>>>> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  return db;
}
import {
  managementTasks,
  objectives,
  caseRisks,
  vendors,
  vendorAssignments,
  eventLog,
  automationAuditLog,
  integrationStatus,
  cases,
  users,
  taskComments,
  taskAttachments,
  MANAGEMENT_ROLES,
  VENDOR_ROLES,
  PRIORITY_LEVELS,
  TASK_STATUSES,
  TASK_QUEUES,
  TASK_CREATED_BY,
  RISK_LEVELS,
  OBJECTIVE_STATUSES,
  VENDOR_TYPES,
  VENDOR_ASSIGNMENT_STATUSES,
  VENDOR_ASSIGNMENT_TYPES,
  INTEGRATION_STATUSES,
  type UserRole,
  type ManagementTask,
  type CaseRisk,
  type IntegrationStatusEntry,
  type VendorAssignment,
  teamResources,
  RESOURCE_CATEGORIES,
  leads,
  LEAD_STATUSES,
  funnelChatMessages,
} from "../drizzle/schema";
import { storagePut } from "./storage";
import { invokeLLM } from "./_core/llm";

// ============================================================
// Middleware: Management access (internal team only)
// ============================================================

const managementProcedure = protectedProcedure.use(async (opts) => {
  const { ctx, next } = opts;
  const role = ctx.user.role as UserRole;

  if (!MANAGEMENT_ROLES.includes(role)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Management access required",
    });
  }

  return next({ ctx });
});

// Vendor procedure: gestores/translators see only their assigned work
const vendorProcedure = protectedProcedure.use(async (opts) => {
  const { ctx, next } = opts;
  const role = ctx.user.role as UserRole;

  if (![...MANAGEMENT_ROLES, ...VENDOR_ROLES].includes(role)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Access denied",
    });
  }

  return next({ ctx });
});

// ============================================================
// Management Router
// ============================================================

export const managementRouter = router({
  // --- Tasks ---
  tasks: router({
    list: managementProcedure
      .input(
        z.object({
          status: z.enum(TASK_STATUSES).optional(),
          queue: z.enum(TASK_QUEUES).optional(),
          ownerId: z.number().optional(),
          priority: z.enum(PRIORITY_LEVELS).optional(),
          linkedCaseId: z.number().optional(),
          includeArchived: z.boolean().default(false),
        }).optional()
      )
      .query(async ({ input }) => {
        const db = await requireDb();
        const conditions: any[] = [];

        // By default, exclude archived tasks
        if (!input?.includeArchived) {
          conditions.push(eq(managementTasks.archived, 0));
        }

        if (input?.status) conditions.push(eq(managementTasks.status, input.status));
        if (input?.queue) conditions.push(eq(managementTasks.queue, input.queue));
        if (input?.ownerId) conditions.push(eq(managementTasks.ownerId, input.ownerId));
        if (input?.priority) conditions.push(eq(managementTasks.priority, input.priority));
        if (input?.linkedCaseId) conditions.push(eq(managementTasks.linkedCaseId, input.linkedCaseId));

        const rows = await db
          .select()
          .from(managementTasks)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(managementTasks.createdAt))
          .limit(200);

        return rows;
      }),

    listArchived: managementProcedure
      .query(async () => {
        const db = await requireDb();
        const rows = await db
          .select()
          .from(managementTasks)
          .where(eq(managementTasks.archived, 1))
          .orderBy(desc(managementTasks.archivedAt))
          .limit(200);
        return rows;
      }),

    archive: managementProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await requireDb();
        await db
          .update(managementTasks)
          .set({ archived: 1, archivedAt: new Date() })
          .where(eq(managementTasks.id, input.id));
        return { success: true };
      }),

    unarchive: managementProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await requireDb();
        await db
          .update(managementTasks)
          .set({ archived: 0, archivedAt: null })
          .where(eq(managementTasks.id, input.id));
        return { success: true };
      }),

    getMyDay: managementProcedure.query(async ({ ctx }) => {
      const db = await requireDb();
      const userId = ctx.user.id;
      const role = ctx.user.role as UserRole;
      const isAdmin = role === "super_admin" || role === "admin";

      // Get tasks assigned to the user (exclude archived)
      const myTasks = await db
        .select()
        .from(managementTasks)
        .where(
          and(
            eq(managementTasks.ownerId, userId),
            ne(managementTasks.status, "done"),
            eq(managementTasks.archived, 0)
          )
        )
        .orderBy(
          sql`FIELD(${managementTasks.priority}, 'critical', 'high', 'normal', 'low')`,
          asc(managementTasks.dueAt)
        )
        .limit(50);

      // For admins, also include unassigned critical/overdue tasks (exclude archived)
      if (isAdmin) {
        const now = new Date();
        const unassignedUrgent = await db
          .select()
          .from(managementTasks)
          .where(
            and(
              isNull(managementTasks.ownerId),
              ne(managementTasks.status, "done"),
              eq(managementTasks.archived, 0),
              or(
                eq(managementTasks.priority, "critical"),
                and(
                  isNotNull(managementTasks.dueAt),
                  lte(managementTasks.dueAt, now)
                )
              )
            )
          )
          .orderBy(
            sql`FIELD(${managementTasks.priority}, 'critical', 'high', 'normal', 'low')`,
            asc(managementTasks.dueAt)
          )
          .limit(30);

        // Merge and deduplicate
        const existingIds = new Set(myTasks.map((t) => t.id));
        for (const task of unassignedUrgent) {
          if (!existingIds.has(task.id)) {
            myTasks.push(task);
          }
        }
      }

      return myTasks;
    }),

    create: managementProcedure
      .input(
        z.object({
          title: z.string().min(1).max(500),
          description: z.string().optional(),
          ownerId: z.number().optional(),
          priority: z.enum(PRIORITY_LEVELS).default("normal"),
          queue: z.enum(TASK_QUEUES).default("general"),
          dueAt: z.date().optional(),
          linkedObjectiveId: z.number().optional(),
          linkedCaseId: z.number().optional(),
          linkedVendorId: z.number().optional(),
          linkedMetric: z.string().optional(),
          explanation: z.string().optional(),
          evidenceRequired: z.boolean().default(false),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await requireDb();

        const [result] = await db.insert(managementTasks).values({
          title: input.title,
          description: input.description || null,
          ownerId: input.ownerId || null,
          createdById: ctx.user.id,
          createdBy: "human",
          priority: input.priority,
          status: "todo",
          queue: input.queue,
          dueAt: input.dueAt || null,
          linkedObjectiveId: input.linkedObjectiveId || null,
          linkedCaseId: input.linkedCaseId || null,
          linkedVendorId: input.linkedVendorId || null,
          linkedMetric: input.linkedMetric || null,
          explanation: input.explanation || null,
          evidenceRequired: input.evidenceRequired ? 1 : 0,
        });

        return { id: result.insertId };
      }),

    update: managementProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().min(1).max(500).optional(),
          description: z.string().optional(),
          ownerId: z.number().nullable().optional(),
          priority: z.enum(PRIORITY_LEVELS).optional(),
          status: z.enum(TASK_STATUSES).optional(),
          queue: z.enum(TASK_QUEUES).optional(),
          dueAt: z.date().nullable().optional(),
          linkedObjectiveId: z.number().nullable().optional(),
          linkedCaseId: z.number().nullable().optional(),
          linkedVendorId: z.number().nullable().optional(),
          explanation: z.string().optional(),
          evidenceText: z.string().optional(),
          evidenceUrl: z.string().optional(),
          label: z.enum(["red", "yellow", "green", "blue"]).nullable().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await requireDb();
        const updates: any = {};

        if (input.title !== undefined) updates.title = input.title;
        if (input.description !== undefined) updates.description = input.description;
        if (input.ownerId !== undefined) updates.ownerId = input.ownerId;
        if (input.priority !== undefined) updates.priority = input.priority;
        if (input.status !== undefined) {
          updates.status = input.status;
          if (input.status === "done") updates.completedAt = new Date();
        }
        if (input.queue !== undefined) updates.queue = input.queue;
        if (input.dueAt !== undefined) updates.dueAt = input.dueAt;
        if (input.linkedObjectiveId !== undefined) updates.linkedObjectiveId = input.linkedObjectiveId;
        if (input.linkedCaseId !== undefined) updates.linkedCaseId = input.linkedCaseId;
        if (input.linkedVendorId !== undefined) updates.linkedVendorId = input.linkedVendorId;
        if (input.explanation !== undefined) updates.explanation = input.explanation;
        if (input.evidenceText !== undefined) updates.evidenceText = input.evidenceText;
        if (input.evidenceUrl !== undefined) updates.evidenceUrl = input.evidenceUrl;
        if (input.label !== undefined) updates.label = input.label;

        await db
          .update(managementTasks)
          .set(updates)
          .where(eq(managementTasks.id, input.id));

        return { success: true };
      }),

    delete: managementProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await requireDb();
        await db.delete(managementTasks).where(eq(managementTasks.id, input.id));
        return { success: true };
      }),

    // --- Task Detail (single task + comments + attachments) ---
    getDetail: managementProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const db = await requireDb();
        const [task] = await db
          .select()
          .from(managementTasks)
          .where(eq(managementTasks.id, input.id))
          .limit(1);
        if (!task) throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });

        const comments = await db
          .select({
            id: taskComments.id,
            taskId: taskComments.taskId,
            authorId: taskComments.authorId,
            content: taskComments.content,
            createdAt: taskComments.createdAt,
            authorName: users.name,
          })
          .from(taskComments)
          .leftJoin(users, eq(taskComments.authorId, users.id))
          .where(eq(taskComments.taskId, input.id))
          .orderBy(asc(taskComments.createdAt));

        const attachments = await db
          .select({
            id: taskAttachments.id,
            taskId: taskAttachments.taskId,
            uploaderId: taskAttachments.uploaderId,
            fileName: taskAttachments.fileName,
            fileUrl: taskAttachments.fileUrl,
            mimeType: taskAttachments.mimeType,
            size: taskAttachments.size,
            createdAt: taskAttachments.createdAt,
            uploaderName: users.name,
          })
          .from(taskAttachments)
          .leftJoin(users, eq(taskAttachments.uploaderId, users.id))
          .where(eq(taskAttachments.taskId, input.id))
          .orderBy(desc(taskAttachments.createdAt));

        return { task, comments, attachments };
      }),

    // --- Comments ---
    addComment: managementProcedure
      .input(z.object({
        taskId: z.number(),
        content: z.string().min(1).max(5000),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await requireDb();
        const [result] = await db.insert(taskComments).values({
          taskId: input.taskId,
          authorId: ctx.user.id,
          content: input.content,
        });
        return { id: result.insertId };
      }),

    deleteComment: managementProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await requireDb();
        // Only allow deleting own comments (or admin)
        const [comment] = await db.select().from(taskComments).where(eq(taskComments.id, input.id)).limit(1);
        if (!comment) throw new TRPCError({ code: "NOT_FOUND" });
        const role = ctx.user.role as UserRole;
        if (comment.authorId !== ctx.user.id && role !== "super_admin" && role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Can only delete your own comments" });
        }
        await db.delete(taskComments).where(eq(taskComments.id, input.id));
        return { success: true };
      }),

    // --- Attachments ---
    addAttachment: managementProcedure
      .input(z.object({
        taskId: z.number(),
        fileName: z.string().min(1).max(500),
        fileData: z.string(), // base64
        mimeType: z.string(),
        fileSize: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await requireDb();
        // Validate size (max 10MB)
        if (input.fileSize > 10 * 1024 * 1024) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "File size exceeds 10MB limit" });
        }
        const fileBuffer = Buffer.from(input.fileData, "base64");
        const fileKey = `tasks/${input.taskId}/attachments/${input.fileName}`;
        const { key, url } = await storagePut(fileKey, fileBuffer, input.mimeType);

        const [result] = await db.insert(taskAttachments).values({
          taskId: input.taskId,
          uploaderId: ctx.user.id,
          fileName: input.fileName,
          fileUrl: url,
          fileKey: key,
          mimeType: input.mimeType,
          size: input.fileSize,
        });
        return { id: result.insertId, url };
      }),

    deleteAttachment: managementProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await requireDb();
        await db.delete(taskAttachments).where(eq(taskAttachments.id, input.id));
        return { success: true };
      }),
  }),

  // --- Objectives ---
  objectives: router({
    list: managementProcedure.query(async () => {
      const db = await requireDb();
      return db
        .select()
        .from(objectives)
        .orderBy(desc(objectives.createdAt))
        .limit(50);
    }),

    create: managementProcedure
      .input(
        z.object({
          title: z.string().min(1).max(500),
          description: z.string().optional(),
          ownerId: z.number().optional(),
          priority: z.enum(PRIORITY_LEVELS).default("normal"),
          startDate: z.date().optional(),
          dueDate: z.date().optional(),
          metricName: z.string().optional(),
          targetValue: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await requireDb();
        const [result] = await db.insert(objectives).values({
          title: input.title,
          description: input.description || null,
          ownerId: input.ownerId || null,
          priority: input.priority,
          startDate: input.startDate || null,
          dueDate: input.dueDate || null,
          metricName: input.metricName || null,
          targetValue: input.targetValue || null,
        });
        return { id: result.insertId };
      }),

    update: managementProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().optional(),
          description: z.string().optional(),
          ownerId: z.number().nullable().optional(),
          status: z.enum(OBJECTIVE_STATUSES).optional(),
          priority: z.enum(PRIORITY_LEVELS).optional(),
          currentValue: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await requireDb();
        const updates: any = {};
        if (input.title !== undefined) updates.title = input.title;
        if (input.description !== undefined) updates.description = input.description;
        if (input.ownerId !== undefined) updates.ownerId = input.ownerId;
        if (input.status !== undefined) updates.status = input.status;
        if (input.priority !== undefined) updates.priority = input.priority;
        if (input.currentValue !== undefined) updates.currentValue = input.currentValue;
        if (input.notes !== undefined) updates.notes = input.notes;

        await db.update(objectives).set(updates).where(eq(objectives.id, input.id));
        return { success: true };
      }),
  }),

  // --- Case Risks ---
  risks: router({
    list: managementProcedure
      .input(
        z.object({
          riskLevel: z.enum(RISK_LEVELS).optional(),
          unresolvedOnly: z.boolean().default(true),
        }).optional()
      )
      .query(async ({ input }) => {
        const db = await requireDb();
        const conditions: any[] = [];

        if (input?.riskLevel) conditions.push(eq(caseRisks.riskLevel, input.riskLevel));
        if (input?.unresolvedOnly !== false) conditions.push(isNull(caseRisks.resolvedAt));

        return db
          .select()
          .from(caseRisks)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(
            sql`FIELD(${caseRisks.riskLevel}, 'black', 'red', 'amber', 'green')`,
            desc(caseRisks.createdAt)
          )
          .limit(100);
      }),

    create: managementProcedure
      .input(
        z.object({
          caseId: z.number(),
          riskLevel: z.enum(RISK_LEVELS),
          riskReason: z.string().min(1),
          ownerId: z.number().optional(),
          dueAt: z.date().optional(),
          source: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await requireDb();
        const [result] = await db.insert(caseRisks).values({
          caseId: input.caseId,
          riskLevel: input.riskLevel,
          riskReason: input.riskReason,
          ownerId: input.ownerId || null,
          dueAt: input.dueAt || null,
          source: input.source || null,
        });
        return { id: result.insertId };
      }),

    resolve: managementProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await requireDb();
        await db
          .update(caseRisks)
          .set({ resolvedAt: new Date() })
          .where(eq(caseRisks.id, input.id));
        return { success: true };
      }),
  }),

  // --- Vendors ---
  vendors: router({
    list: managementProcedure
      .input(z.object({ type: z.enum(VENDOR_TYPES).optional() }).optional())
      .query(async ({ input }) => {
        const db = await requireDb();
        const conditions: any[] = [];
        if (input?.type) conditions.push(eq(vendors.type, input.type));

        return db
          .select()
          .from(vendors)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(vendors.createdAt));
      }),

    create: managementProcedure
      .input(
        z.object({
          type: z.enum(VENDOR_TYPES),
          name: z.string().min(1),
          email: z.string().email().optional(),
          phone: z.string().optional(),
          languagePairs: z.string().optional(),
          notes: z.string().optional(),
          userId: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await requireDb();
        const [result] = await db.insert(vendors).values({
          type: input.type,
          name: input.name,
          email: input.email || null,
          phone: input.phone || null,
          languagePairs: input.languagePairs || null,
          notes: input.notes || null,
          userId: input.userId || null,
        });
        return { id: result.insertId };
      }),

    update: managementProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          email: z.string().optional(),
          phone: z.string().optional(),
          active: z.boolean().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await requireDb();
        const updates: any = {};
        if (input.name !== undefined) updates.name = input.name;
        if (input.email !== undefined) updates.email = input.email;
        if (input.phone !== undefined) updates.phone = input.phone;
        if (input.active !== undefined) updates.active = input.active ? 1 : 0;
        if (input.notes !== undefined) updates.notes = input.notes;

        await db.update(vendors).set(updates).where(eq(vendors.id, input.id));
        return { success: true };
      }),
  }),

  // --- Vendor Assignments ---
  assignments: router({
    list: vendorProcedure
      .input(
        z.object({
          vendorId: z.number().optional(),
          caseId: z.number().optional(),
          status: z.enum(VENDOR_ASSIGNMENT_STATUSES).optional(),
        }).optional()
      )
      .query(async ({ ctx, input }) => {
        const db = await requireDb();
        const role = ctx.user.role as UserRole;
        const conditions: any[] = [];

        // Vendors only see their own assignments
        if (VENDOR_ROLES.includes(role)) {
          const vendorRecord = await db
            .select()
            .from(vendors)
            .where(eq(vendors.userId, ctx.user.id))
            .limit(1);

          if (vendorRecord.length === 0) return [];
          conditions.push(eq(vendorAssignments.vendorId, vendorRecord[0].id));
        } else {
          if (input?.vendorId) conditions.push(eq(vendorAssignments.vendorId, input.vendorId));
        }

        if (input?.caseId) conditions.push(eq(vendorAssignments.caseId, input.caseId));
        if (input?.status) conditions.push(eq(vendorAssignments.status, input.status));

        return db
          .select()
          .from(vendorAssignments)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(vendorAssignments.assignedAt))
          .limit(100);
      }),

    create: managementProcedure
      .input(
        z.object({
          vendorId: z.number(),
          caseId: z.number().optional(),
          taskId: z.number().optional(),
          assignmentType: z.enum(VENDOR_ASSIGNMENT_TYPES),
          dueAt: z.date().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await requireDb();
        const [result] = await db.insert(vendorAssignments).values({
          vendorId: input.vendorId,
          caseId: input.caseId || null,
          taskId: input.taskId || null,
          assignmentType: input.assignmentType,
          dueAt: input.dueAt || null,
        });
        return { id: result.insertId };
      }),

    updateStatus: vendorProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(VENDOR_ASSIGNMENT_STATUSES),
          blockerReason: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await requireDb();
        const role = ctx.user.role as UserRole;

        // Vendors can only update their own assignments
        if (VENDOR_ROLES.includes(role)) {
          const vendorRecord = await db
            .select()
            .from(vendors)
            .where(eq(vendors.userId, ctx.user.id))
            .limit(1);

          if (vendorRecord.length === 0) {
            throw new TRPCError({ code: "FORBIDDEN", message: "No vendor record found" });
          }

          const assignment = await db
            .select()
            .from(vendorAssignments)
            .where(
              and(
                eq(vendorAssignments.id, input.id),
                eq(vendorAssignments.vendorId, vendorRecord[0].id)
              )
            )
            .limit(1);

          if (assignment.length === 0) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Assignment not found" });
          }
        }

        const updates: any = { status: input.status };
        if (input.status === "completed") updates.completedAt = new Date();
        if (input.blockerReason) updates.blockerReason = input.blockerReason;

        await db
          .update(vendorAssignments)
          .set(updates)
          .where(eq(vendorAssignments.id, input.id));

        return { success: true };
      }),
  }),

  // --- Integration Status (Launch Checklist) ---
  integrations: router({
    list: managementProcedure.query(async () => {
      const db = await requireDb();
      return db
        .select()
        .from(integrationStatus)
        .orderBy(
          sql`FIELD(${integrationStatus.status}, 'blocked', 'warning', 'not_configured', 'ready')`,
          asc(integrationStatus.integrationName)
        );
    }),

    upsert: managementProcedure
      .input(
        z.object({
          integrationName: z.string().min(1),
          status: z.enum(INTEGRATION_STATUSES),
          notes: z.string().optional(),
          requiredForLaunch: z.boolean().default(true),
        })
      )
      .mutation(async ({ input }) => {
        const db = await requireDb();

        // Check if exists
        const existing = await db
          .select()
          .from(integrationStatus)
          .where(eq(integrationStatus.integrationName, input.integrationName))
          .limit(1);

        if (existing.length > 0) {
          await db
            .update(integrationStatus)
            .set({
              status: input.status,
              notes: input.notes || null,
              requiredForLaunch: input.requiredForLaunch ? 1 : 0,
              lastCheckedAt: new Date(),
            })
            .where(eq(integrationStatus.id, existing[0].id));
          return { id: existing[0].id };
        } else {
          const [result] = await db.insert(integrationStatus).values({
            integrationName: input.integrationName,
            status: input.status,
            notes: input.notes || null,
            requiredForLaunch: input.requiredForLaunch ? 1 : 0,
            lastCheckedAt: new Date(),
          });
          return { id: result.insertId };
        }
      }),
  }),

  // --- Audit Log ---
  auditLog: router({
    list: managementProcedure
      .input(
        z.object({
          limit: z.number().min(1).max(200).default(50),
          offset: z.number().min(0).default(0),
        }).optional()
      )
      .query(async ({ input }) => {
        const db = await requireDb();
        return db
          .select()
          .from(automationAuditLog)
          .orderBy(desc(automationAuditLog.createdAt))
          .limit(input?.limit || 50)
          .offset(input?.offset || 0);
      }),
  }),

  // --- Event Log ---
  events: router({
    list: managementProcedure
      .input(
        z.object({
          limit: z.number().min(1).max(200).default(50),
          eventType: z.string().optional(),
        }).optional()
      )
      .query(async ({ input }) => {
        const db = await requireDb();
        const conditions: any[] = [];
        if (input?.eventType) conditions.push(eq(eventLog.eventType, input.eventType));

        return db
          .select()
          .from(eventLog)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(eventLog.createdAt))
          .limit(input?.limit || 50);
      }),
  }),

  // --- Executive Dashboard ---
  executive: router({
    summary: managementProcedure.query(async () => {
      const db = await requireDb();

      // Count tasks by status (exclude archived)
      const allTasks = await db.select().from(managementTasks).where(and(ne(managementTasks.status, "done"), eq(managementTasks.archived, 0)));
      const criticalTasks = allTasks.filter((t: ManagementTask) => t.priority === "critical");
      const overdueTasks = allTasks.filter(
        (t: ManagementTask) => t.dueAt && new Date(t.dueAt) < new Date()
      );
      const blockedTasks = allTasks.filter((t: ManagementTask) => t.status === "blocked");

      // Count unresolved risks
      const unresolvedRisks = await db
        .select()
        .from(caseRisks)
        .where(isNull(caseRisks.resolvedAt));
      const redRisks = unresolvedRisks.filter((r: CaseRisk) => r.riskLevel === "red" || r.riskLevel === "black");

      // Count active cases
      const activeCases = await db
        .select({ id: cases.id, status: cases.status })
        .from(cases)
        .where(
          and(
            ne(cases.status, "approved"),
            ne(cases.status, "rejected")
          )
        );

      // Integration readiness
      const allIntegrations = await db.select().from(integrationStatus);
      const blockedIntegrations = allIntegrations.filter((i: IntegrationStatusEntry) => i.status === "blocked");
      const requiredNotReady = allIntegrations.filter(
        (i: IntegrationStatusEntry) => i.requiredForLaunch === 1 && i.status !== "ready"
      );

      // Vendor bottlenecks
      const pendingAssignments = await db
        .select()
        .from(vendorAssignments)
        .where(
          and(
            ne(vendorAssignments.status, "completed"),
            ne(vendorAssignments.status, "cancelled")
          )
        );
      const overdueAssignments = pendingAssignments.filter(
        (a: VendorAssignment) => a.dueAt && new Date(a.dueAt) < new Date()
      );

      // Approval queue count
      const approvalTasks = allTasks.filter((t: ManagementTask) => t.queue === "approval_required");

      return {
        totalOpenTasks: allTasks.length,
        criticalTasks: criticalTasks.length,
        overdueTasks: overdueTasks.length,
        blockedTasks: blockedTasks.length,
        unresolvedRisks: unresolvedRisks.length,
        redBlackRisks: redRisks.length,
        activeCases: activeCases.length,
        blockedIntegrations: blockedIntegrations.length,
        requiredIntegrationsNotReady: requiredNotReady.length,
        totalIntegrations: allIntegrations.length,
        readyIntegrations: allIntegrations.filter((i: IntegrationStatusEntry) => i.status === "ready").length,
        pendingVendorAssignments: pendingAssignments.length,
        overdueVendorAssignments: overdueAssignments.length,
        approvalQueueCount: approvalTasks.length,
        canGoLive: requiredNotReady.length === 0 && redRisks.length === 0 && blockedIntegrations.length === 0,
      };
    }),
  }),

  // --- Team members list (for assignment dropdowns) ---
  team: router({
    list: managementProcedure.query(async () => {
      const db = await requireDb();
      return db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
        })
        .from(users)
        .where(
          inArray(users.role, [
            "admin",
            "super_admin",
            "management",
            "case_manager",
            "tech_compliance",
            "marketing",
            "finance",
          ])
        );
    }),
  }),
  // --- Team Resources ---
  resources: router({
    list: managementProcedure
      .input(z.object({
        category: z.enum(RESOURCE_CATEGORIES).optional(),
      }).optional())
      .query(async ({ input }) => {
        const db = await requireDb();
        if (input?.category) {
          return db.select().from(teamResources)
            .where(eq(teamResources.category, input.category))
            .orderBy(asc(teamResources.category), asc(teamResources.title));
        }
        return db.select().from(teamResources)
          .orderBy(asc(teamResources.category), asc(teamResources.title));
      }),

    create: managementProcedure
      .input(z.object({
        title: z.string().min(1).max(255),
        url: z.string().max(1024).optional(),
        category: z.enum(RESOURCE_CATEGORIES).default("operations"),
        notes: z.string().optional(),
        hasBitwardenCreds: z.boolean().default(false),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await requireDb();
        const [result] = await db.insert(teamResources).values({
          title: input.title,
          url: input.url || null,
          category: input.category,
          notes: input.notes || null,
          hasBitwardenCreds: input.hasBitwardenCreds ? 1 : 0,
          createdById: ctx.user.id,
        });
        return { id: result.insertId };
      }),

    update: managementProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).max(255).optional(),
        url: z.string().max(1024).optional().nullable(),
        category: z.enum(RESOURCE_CATEGORIES).optional(),
        notes: z.string().optional().nullable(),
        hasBitwardenCreds: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await requireDb();
        const updates: Record<string, unknown> = {};
        if (input.title !== undefined) updates.title = input.title;
        if (input.url !== undefined) updates.url = input.url;
        if (input.category !== undefined) updates.category = input.category;
        if (input.notes !== undefined) updates.notes = input.notes;
        if (input.hasBitwardenCreds !== undefined) updates.hasBitwardenCreds = input.hasBitwardenCreds ? 1 : 0;
        if (Object.keys(updates).length === 0) return { success: true };
        await db.update(teamResources).set(updates).where(eq(teamResources.id, input.id));
        return { success: true };
      }),

    delete: managementProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await requireDb();
        await db.delete(teamResources).where(eq(teamResources.id, input.id));
        return { success: true };
      }),

    uploadFile: managementProcedure
      .input(z.object({
        resourceId: z.number(),
        fileName: z.string().min(1).max(500),
        fileData: z.string(), // base64
        mimeType: z.string(),
        fileSize: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await requireDb();
        if (input.fileSize > 10 * 1024 * 1024) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "File size exceeds 10MB limit" });
        }
        const fileBuffer = Buffer.from(input.fileData, "base64");
        const fileKey = `resources/${input.resourceId}/${input.fileName}`;
        const { key, url } = await storagePut(fileKey, fileBuffer, input.mimeType);
        await db.update(teamResources).set({
          fileKey: key,
          fileName: input.fileName,
        }).where(eq(teamResources.id, input.resourceId));
        return { url, key };
      }),

    removeFile: managementProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await requireDb();
        await db.update(teamResources).set({
          fileKey: null,
          fileName: null,
        }).where(eq(teamResources.id, input.id));
        return { success: true };
      }),
  }),

  // --- Leads Management ---
  leads: router({
    list: managementProcedure
      .input(
        z.object({
          status: z.enum(LEAD_STATUSES).optional(),
          source: z.string().optional(),
          nationality: z.string().optional(),
          visaType: z.string().optional(),
          search: z.string().optional(),
        }).optional()
      )
      .query(async ({ input }) => {
        const db = await requireDb();
        const conditions: any[] = [];

        if (input?.status) conditions.push(eq(leads.status, input.status));
        if (input?.source) conditions.push(eq(leads.source, input.source));
        if (input?.nationality) conditions.push(eq(leads.nationality, input.nationality));
        if (input?.visaType) conditions.push(eq(leads.visaType, input.visaType));
        if (input?.search) {
          conditions.push(
            or(
              like(leads.email, `%${input.search}%`),
              like(leads.name, `%${input.search}%`)
            )
          );
        }

        const rows = await db
          .select()
          .from(leads)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(leads.createdAt))
          .limit(500);

        return rows;
      }),

    getDetail: managementProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const db = await requireDb();
        const [lead] = await db
          .select()
          .from(leads)
          .where(eq(leads.id, input.id))
          .limit(1);
        if (!lead) throw new TRPCError({ code: "NOT_FOUND", message: "Lead not found" });

        // Get chat transcript if email exists
        const chatMessages = await db
          .select()
          .from(funnelChatMessages)
          .where(eq(funnelChatMessages.leadEmail, lead.email))
          .orderBy(asc(funnelChatMessages.createdAt));

        // Auto-generate notes from chat if lead has no notes and has chat history
        if (!lead.notes && chatMessages.length > 0) {
          try {
            const userMessages = chatMessages
              .filter((m) => m.role === "user")
              .map((m) => m.content)
              .join(" | ");
            const transcript = chatMessages
              .map((m) => `${m.role === "user" ? "Prospect" : "Laura"}: ${m.content}`)
              .join("\n");

            const llmResult = await invokeLLM({
              messages: [
                {
                  role: "system",
                  content:
                    "You extract key facts from a sales chat transcript. Output ONLY a ultra-brief summary (max 30 words) of what was learned about the prospect. Format: key facts separated by commas. Include: location, who is moving, visa type discussed, income status, timeline, employment type. No filler words. No sentences. Example: 'New York, couple, DNV, freelancer, €2.8k+ income OK, move by Sept, quoted €1098'",
                },
                {
                  role: "user",
                  content: transcript,
                },
              ],
            });

            const rawContent = llmResult?.choices?.[0]?.message?.content;
            const summary = typeof rawContent === "string" ? rawContent.trim() : undefined;
            if (summary) {
              await db.update(leads).set({ notes: summary }).where(eq(leads.id, lead.id));
              lead.notes = summary;
            }
          } catch (err) {
            console.error("[LeadDetail] Auto-summary failed:", err);
          }
        }

        // Get linked case if exists
        let linkedCase = null;
        if (lead.linkedCaseId) {
          const [c] = await db
            .select({
              id: cases.id,
              visaType: cases.visaType,
              status: cases.status,
              createdAt: cases.createdAt,
            })
            .from(cases)
            .where(eq(cases.id, lead.linkedCaseId))
            .limit(1);
          linkedCase = c || null;
        }

        // Also check if there's a case by email (auto-link)
        if (!linkedCase) {
          const [caseByEmail] = await db
            .select({
              id: cases.id,
              visaType: cases.visaType,
              status: cases.status,
              createdAt: cases.createdAt,
            })
            .from(cases)
            .leftJoin(users, eq(cases.userId, users.id))
            .where(eq(users.email, lead.email))
            .limit(1);
          if (caseByEmail) {
            linkedCase = caseByEmail;
            // Auto-link the case
            await db.update(leads).set({ linkedCaseId: caseByEmail.id }).where(eq(leads.id, lead.id));
          }
        }

        return { lead, chatMessages, linkedCase };
      }),

    updateStatus: managementProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(LEAD_STATUSES),
      }))
      .mutation(async ({ input }) => {
        const db = await requireDb();
        await db.update(leads).set({ status: input.status }).where(eq(leads.id, input.id));

        // When a lead converts, re-label their Gmail threads from Prospects → Clients
        if (input.status === "converted") {
          const [lead] = await db.select().from(leads).where(eq(leads.id, input.id)).limit(1);
          if (lead?.email) {
            import("./gmailService").then(({ relabelContactAsClient }) => {
              relabelContactAsClient(lead.email).catch((err: any) =>
                console.error("[Gmail] Re-label failed:", err)
              );
            });
          }
        }

        return { success: true };
      }),

    updateNotes: managementProcedure
      .input(z.object({
        id: z.number(),
        notes: z.string(),
      }))
      .mutation(async ({ input }) => {
        const db = await requireDb();
        await db.update(leads).set({ notes: input.notes }).where(eq(leads.id, input.id));
        return { success: true };
      }),

    convertToCase: managementProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await requireDb();
        const [lead] = await db.select().from(leads).where(eq(leads.id, input.id)).limit(1);
        if (!lead) throw new TRPCError({ code: "NOT_FOUND", message: "Lead not found" });
        if (lead.linkedCaseId) throw new TRPCError({ code: "BAD_REQUEST", message: "Lead already has a linked case" });

        // Validate visa type before conversion — do NOT silently default to
        // DNV. If the lead has no recognised visa type, ops must assign one
        // before converting. See docs/product-routes.md.
        const { isPaidVisaProduct } = await import("../shared/visaRoutes");
        if (!isPaidVisaProduct(lead.visaType)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Lead has no recognised visa product (got: ${JSON.stringify(lead.visaType)}). Please assign a valid visa type to the lead before converting it to a case.`,
          });
        }
        const { createCaseWithSlots } = await import("./portalDb");
        const caseId = await createCaseWithSlots({
          visaType: lead.visaType,
          clientName: lead.name || lead.email.split("@")[0],
          clientEmail: lead.email,
          clientPhone: lead.phone || null,
          nationality: lead.nationality || null,
          familyComposition: null,
          dependents: 0,
          notes: lead.notes || lead.situation || null,
          status: "onboarding",
        });

        // Link lead to the new case and mark as converted
        await db.update(leads).set({
          linkedCaseId: caseId,
          status: "converted",
        }).where(eq(leads.id, input.id));

        // Re-label Gmail threads from Prospects → Clients
        if (lead.email) {
          import("./gmailService").then(({ relabelContactAsClient }) => {
            relabelContactAsClient(lead.email).catch((err: any) =>
              console.error("[Gmail] Re-label failed:", err)
            );
          });
        }

        return { caseId };
      }),

    stats: managementProcedure.query(async () => {
      const db = await requireDb();

      const allLeads = await db.select().from(leads).orderBy(desc(leads.createdAt));

      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const total = allLeads.length;
      const thisWeek = allLeads.filter((l) => l.createdAt >= weekAgo).length;
      const converted = allLeads.filter((l) => l.status === "converted").length;
      const byStatus: Record<string, number> = {};
      const bySource: Record<string, number> = {};
      const byVisa: Record<string, number> = {};

      for (const l of allLeads) {
        byStatus[l.status] = (byStatus[l.status] || 0) + 1;
        bySource[l.source] = (bySource[l.source] || 0) + 1;
        if (l.visaType) byVisa[l.visaType] = (byVisa[l.visaType] || 0) + 1;
      }

      return {
        total,
        thisWeek,
        converted,
        conversionRate: total > 0 ? Math.round((converted / total) * 100) : 0,
        byStatus,
        bySource,
        byVisa,
      };
    }),
  }),

  // --- Database backup (manual trigger, super_admin only) ---
  backup: router({
    status: managementProcedure.query(async () => {
      const { getBackupStatus } = await import("./databaseBackup");
      return getBackupStatus();
    }),
    trigger: managementProcedure.mutation(async ({ ctx }) => {
      if (ctx.user.role !== "super_admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only super_admin can trigger backups" });
      }
      const { runDatabaseBackup } = await import("./databaseBackup");
      const result = await runDatabaseBackup();
      return result;
    }),
  }),
});
