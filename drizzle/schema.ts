import { boolean, int, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Roles: user (client), admin (business owner), gestor (immigration specialist)
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "gestor", "super_admin", "management", "case_manager", "tech_compliance", "marketing", "finance", "translator", "read_only_advisor", "ai_system"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  passwordHash: varchar("passwordHash", { length: 255 }),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Invite codes for team member onboarding
export const inviteCodes = mysqlTable("invite_codes", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 64 }).notNull().unique(),
  email: varchar("email", { length: 320 }),
  role: mysqlEnum("role", ["user", "admin", "gestor", "super_admin", "management", "case_manager", "tech_compliance", "marketing", "finance", "translator", "read_only_advisor", "ai_system"]).notNull(),
  roles: json("roles").$type<string[]>(), // JSON array of all roles to assign on registration
  createdById: int("createdById").notNull(),
  usedById: int("usedById"),
  usedAt: timestamp("usedAt"),
  expiresAt: timestamp("expiresAt").notNull(),
  status: mysqlEnum("status", ["active", "used", "revoked", "expired"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type InviteCode = typeof inviteCodes.$inferSelect;
export type InsertInviteCode = typeof inviteCodes.$inferInsert;

// Leads table for capturing exit-intent, quiz, and free-assessment leads
export const LEAD_STATUSES = ["new", "contacted", "engaged", "qualified", "converted", "lost"] as const;

export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  source: varchar("source", { length: 64 }).notNull(),
  nationality: varchar("nationality", { length: 32 }),
  visaType: varchar("visaType", { length: 128 }),
  name: varchar("name", { length: 255 }),
  phone: varchar("phone", { length: 32 }),
  whatsappOptIn: int("whatsappOptIn").default(0).notNull(),
  whatsappConsentAt: timestamp("whatsappConsentAt"),
  whatsappConsentText: text("whatsappConsentText"),
  situation: text("situation"),
  status: mysqlEnum("status", LEAD_STATUSES).default("new").notNull(),
  notes: text("notes"),
  linkedCaseId: int("linkedCaseId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

// ============================================================
// CLIENT PORTAL — Cases, Document Slots, Document Uploads
// ============================================================

export const CASE_STATUSES = [
  "onboarding",
  "collecting_documents",
  "ready_for_gestor",
  "with_gestor",
  "submitted",
  "approved",
  "rejected",
] as const;

export type CaseStatus = (typeof CASE_STATUSES)[number];

export const cases = mysqlTable("cases", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"), // nullable — may not have logged in yet
  visaType: varchar("visaType", { length: 64 }).notNull(),
  status: mysqlEnum("status", CASE_STATUSES).default("onboarding").notNull(),
  nationality: varchar("nationality", { length: 64 }),
  clientName: varchar("clientName", { length: 255 }).notNull(),
  clientEmail: varchar("clientEmail", { length: 320 }).notNull(),
  clientPhone: varchar("clientPhone", { length: 32 }),
  familyComposition: varchar("familyComposition", { length: 255 }),
  dependents: int("dependents").default(0).notNull(),
  stripeSessionId: varchar("stripeSessionId", { length: 255 }),
  gestorId: int("gestorId"),
  notes: text("notes"),
  privacyAcknowledgedAt: timestamp("privacyAcknowledgedAt"),
  privacyNoticeVersion: varchar("privacyNoticeVersion", { length: 32 }),
  aiValidationEnabled: boolean("aiValidationEnabled").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Case = typeof cases.$inferSelect;
export type InsertCase = typeof cases.$inferInsert;

export const VALIDATION_STATUSES = [
  "pending",
  "pass",
  "needs_revision",
  "unclear",
  "manual_override",
] as const;

export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];

export const documentSlots = mysqlTable("document_slots", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("caseId").notNull(),
  documentType: varchar("documentType", { length: 64 }).notNull(),
  label: varchar("label", { length: 255 }).notNull(),
  description: text("description"),
  requirementsText: text("requirementsText"),
  isRequired: int("isRequired").default(1).notNull(),
  apostilleRequired: int("apostilleRequired").default(0).notNull(),
  translationRequired: int("translationRequired").default(0).notNull(),
  validityDays: int("validityDays"),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DocumentSlot = typeof documentSlots.$inferSelect;
export type InsertDocumentSlot = typeof documentSlots.$inferInsert;

export const documentUploads = mysqlTable("document_uploads", {
  id: int("id").autoincrement().primaryKey(),
  slotId: int("slotId").notNull(),
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileSize: int("fileSize").notNull(),
  mimeType: varchar("mimeType", { length: 128 }).notNull(),
  validationStatus: mysqlEnum("validationStatus", VALIDATION_STATUSES).default("pending").notNull(),
  aiFeedback: json("aiFeedback"),
  reviewedBy: int("reviewedBy"),
  reviewedAt: timestamp("reviewedAt"),
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
});

export type DocumentUpload = typeof documentUploads.$inferSelect;
export type InsertDocumentUpload = typeof documentUploads.$inferInsert;

export const caseStatusHistory = mysqlTable("case_status_history", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("caseId").notNull(),
  fromStatus: varchar("fromStatus", { length: 64 }).notNull(),
  toStatus: varchar("toStatus", { length: 64 }).notNull(),
  changedBy: int("changedBy"),
  note: text("note"),
  changedAt: timestamp("changedAt").defaultNow().notNull(),
});

export type CaseStatusHistoryEntry = typeof caseStatusHistory.$inferSelect;
export type InsertCaseStatusHistory = typeof caseStatusHistory.$inferInsert;

// ============================================================
// AI-OWNED CLIENT ENGAGEMENT — Messages, Events, Escalations
// ============================================================

export const MESSAGE_ROLES = ["laura", "client", "system"] as const;
export type MessageRole = (typeof MESSAGE_ROLES)[number];

/**
 * Portal messages — all communication between Laura (AI) and the client.
 * Also stores system messages (status updates, notifications).
 */
export const portalMessages = mysqlTable("portal_messages", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("caseId").notNull(),
  role: mysqlEnum("role", MESSAGE_ROLES).notNull(),
  content: text("content").notNull(),
  metadata: json("metadata"), // { triggerEvent, escalationId, etc. }
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PortalMessage = typeof portalMessages.$inferSelect;
export type InsertPortalMessage = typeof portalMessages.$inferInsert;

/**
 * Case events — structured events that trigger AI messages or actions.
 * Events are generated by: document uploads, status changes, gestor actions, system checks.
 */
export const EVENT_TYPES = [
  "document_uploaded",
  "document_validated",
  "status_changed",
  "requerimiento_created",
  "resolution_logged",
  "expiry_warning",
  "inactivity_detected",
  "milestone_reached",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export const caseEvents = mysqlTable("case_events", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("caseId").notNull(),
  eventType: mysqlEnum("eventType", EVENT_TYPES).notNull(),
  payload: json("payload").notNull(), // Event-specific data
  triggeredMessageId: int("triggeredMessageId"), // The message generated by this event
  processed: int("processed").default(0).notNull(), // 1 = AI has handled this event
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CaseEvent = typeof caseEvents.$inferSelect;
export type InsertCaseEvent = typeof caseEvents.$inferInsert;

/**
 * Escalation tickets — questions AI couldn't answer, flagged for admin.
 */
export const ESCALATION_STATUSES = ["open", "resolved"] as const;
export type EscalationStatus = (typeof ESCALATION_STATUSES)[number];

export const escalationTickets = mysqlTable("escalation_tickets", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("caseId").notNull(),
  messageId: int("messageId"), // The client message that triggered escalation
  question: text("question").notNull(), // What the client asked
  aiContext: text("aiContext"), // Why AI couldn't answer (for admin context)
  status: mysqlEnum("status", ESCALATION_STATUSES).default("open").notNull(),
  adminResponse: text("adminResponse"), // Admin's answer
  resolvedBy: int("resolvedBy"), // Admin user ID
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EscalationTicket = typeof escalationTickets.$inferSelect;
export type InsertEscalationTicket = typeof escalationTickets.$inferInsert;

// ============================================================
// GESTOR WORKFLOW — Submissions, Requerimientos, Resolutions
// ============================================================

/**
 * Requerimientos — government requests for additional information.
 */
export const REQUERIMIENTO_STATUSES = ["pending", "responded", "expired"] as const;
export type RequerimientoStatus = (typeof REQUERIMIENTO_STATUSES)[number];

export const requerimientos = mysqlTable("requerimientos", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("caseId").notNull(),
  gestorId: int("gestorId").notNull(),
  description: text("description").notNull(), // What the government asked (in Spanish)
  descriptionEn: text("descriptionEn"), // AI-translated English version
  documentsNeeded: json("documentsNeeded"), // Array of { documentType, instructions }
  deadline: timestamp("deadline"), // Government-imposed deadline
  status: mysqlEnum("status", REQUERIMIENTO_STATUSES).default("pending").notNull(),
  respondedAt: timestamp("respondedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Requerimiento = typeof requerimientos.$inferSelect;
export type InsertRequerimiento = typeof requerimientos.$inferInsert;

/**
 * Government submissions — records of when applications were filed.
 */
export const submissions = mysqlTable("submissions", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("caseId").notNull(),
  gestorId: int("gestorId").notNull(),
  channel: varchar("channel", { length: 128 }).notNull(), // e.g., "consulate_houston", "mercurio", "delegacion_gobierno"
  referenceNumber: varchar("referenceNumber", { length: 128 }),
  receiptFileKey: varchar("receiptFileKey", { length: 512 }), // S3 key for submission receipt
  submittedAt: timestamp("submittedAt").notNull(),
  expectedResolutionAt: timestamp("expectedResolutionAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Submission = typeof submissions.$inferSelect;
export type InsertSubmission = typeof submissions.$inferInsert;

/**
 * Resolutions — final government decisions.
 */
export const RESOLUTION_TYPES = ["approved", "denied", "silencio_administrativo"] as const;
export type ResolutionType = (typeof RESOLUTION_TYPES)[number];

export const resolutions = mysqlTable("resolutions", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("caseId").notNull(),
  gestorId: int("gestorId").notNull(),
  type: mysqlEnum("type", RESOLUTION_TYPES).notNull(),
  resolutionFileKey: varchar("resolutionFileKey", { length: 512 }), // S3 key for resolution document
  reason: text("reason"), // Reason for denial if applicable
  visaValidFrom: timestamp("visaValidFrom"),
  visaValidTo: timestamp("visaValidTo"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Resolution = typeof resolutions.$inferSelect;
export type InsertResolution = typeof resolutions.$inferInsert;

// ============================================================
// SECURITY — Audit Log
// ============================================================

/**
 * Audit log — tracks all sensitive actions for security and compliance.
 * Who accessed what, when, and what they did.
 */
export const auditLog = mysqlTable("audit_log", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"), // null for system actions
  action: varchar("action", { length: 128 }).notNull(), // e.g., "view_document", "download_case", "override_validation"
  resourceType: varchar("resourceType", { length: 64 }).notNull(), // e.g., "case", "document", "message"
  resourceId: int("resourceId").notNull(),
  metadata: json("metadata"), // Additional context (IP, user agent, etc.)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLogEntry = typeof auditLog.$inferSelect;
export type InsertAuditLog = typeof auditLog.$inferInsert;

// ============================================================
// GDPR COMPLIANCE — Consent Records
// ============================================================

export const CONSENT_TYPES = [
  "data_processing",      // Consent to process identity documents
  "ai_validation",        // Consent for AI to analyze documents
  "third_party_sharing",  // Consent for Gestor access to documents
  "marketing",            // Optional marketing communications
] as const;

export type ConsentType = (typeof CONSENT_TYPES)[number];

/**
 * Consent records — tracks explicit GDPR consent with full audit trail.
 * Each consent is a separate record (not a boolean flag on the user).
 */
export const consentRecords = mysqlTable("consent_records", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  caseId: int("caseId"), // nullable — some consents are case-specific
  consentType: mysqlEnum("consentType", CONSENT_TYPES).notNull(),
  consentText: text("consentText").notNull(), // Exact text the user agreed to
  granted: int("granted").default(1).notNull(), // 1 = granted, 0 = revoked
  ipAddress: varchar("ipAddress", { length: 45 }), // IPv4 or IPv6
  userAgent: text("userAgent"),
  grantedAt: timestamp("grantedAt").defaultNow().notNull(),
  revokedAt: timestamp("revokedAt"),
});

export type ConsentRecord = typeof consentRecords.$inferSelect;
export type InsertConsentRecord = typeof consentRecords.$inferInsert;

/**
 * Data erasure requests — tracks GDPR Article 17 right-to-erasure requests.
 */
export const ERASURE_STATUSES = ["pending", "confirmed", "completed", "cancelled"] as const;
export type ErasureStatus = (typeof ERASURE_STATUSES)[number];

export const erasureRequests = mysqlTable("erasure_requests", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  caseId: int("caseId"),
  status: mysqlEnum("status", ERASURE_STATUSES).default("pending").notNull(),
  reason: text("reason"), // Optional reason from client
  confirmedAt: timestamp("confirmedAt"), // Client confirmed the deletion
  completedAt: timestamp("completedAt"), // Deletion actually executed
  deletedResources: json("deletedResources"), // Record of what was deleted
  requestedAt: timestamp("requestedAt").defaultNow().notNull(),
});

export type ErasureRequest = typeof erasureRequests.$inferSelect;
export type InsertErasureRequest = typeof erasureRequests.$inferInsert;

// Email notification queue — stores outbound emails for batch sending
export const emailQueue = mysqlTable("email_queue", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("caseId"),
  recipientEmail: varchar("recipientEmail", { length: 320 }).notNull(),
  recipientName: varchar("recipientName", { length: 255 }),
  subject: varchar("subject", { length: 500 }).notNull(),
  body: text("body").notNull(),
  emailType: mysqlEnum("emailType", [
    "document_validated",
    "document_needs_revision",
    "status_update",
    "requerimiento",
    "resolution",
    "expiry_warning",
    "inactivity_nudge",
    "milestone",
    "welcome",
    "prospect_nurture",
    "prospect_followup",
    "assessment_response",
  ]).notNull(),
  category: mysqlEnum("category", ["prospect", "client"]).default("client").notNull(),
  status: mysqlEnum("status", ["queued", "sent", "failed"]).default("queued").notNull(),
  gmailMessageId: varchar("gmailMessageId", { length: 255 }),
  gmailThreadId: varchar("gmailThreadId", { length: 255 }),
  sentAt: timestamp("sentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ============================================================
// PRE-PURCHASE CHAT PERSISTENCE — Funnel Chat Messages
// ============================================================

/**
 * Funnel chat messages — stores pre-purchase Laura conversations.
 * Linked to lead email so returning visitors get context-aware responses.
 * Privacy-safe: Laura uses this context internally but never reveals
 * private details back to the user (in case someone impersonates).
 */
export const FUNNEL_CHAT_ROLES = ["user", "assistant"] as const;
export type FunnelChatRole = (typeof FUNNEL_CHAT_ROLES)[number];

export const funnelChatMessages = mysqlTable("funnel_chat_messages", {
  id: int("id").autoincrement().primaryKey(),
  leadEmail: varchar("leadEmail", { length: 320 }).notNull(),
  sessionId: varchar("sessionId", { length: 64 }).notNull(), // Groups messages from same visit
  role: mysqlEnum("role", FUNNEL_CHAT_ROLES).notNull(),
  content: text("content").notNull(),
  source: varchar("source", { length: 64 }), // "homepage", "free-assessment"
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FunnelChatMessage = typeof funnelChatMessages.$inferSelect;
export type InsertFunnelChatMessage = typeof funnelChatMessages.$inferInsert;

// ============================================================
// SPF COMMAND CENTER — Management Tasks, Objectives, Risks, Vendors
// ============================================================

/**
 * Extended user roles for Command Center.
 * The role enum in the users table above is the source of truth.
 * These constants help with access control logic.
 */
export const USER_ROLES = [
  "user",
  "admin",
  "gestor",
  "super_admin",
  "management",
  "case_manager",
  "tech_compliance",
  "marketing",
  "finance",
  "translator",
  "read_only_advisor",
  "ai_system",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

/** Internal team roles that can access /management */
export const MANAGEMENT_ROLES: UserRole[] = [
  "admin",
  "super_admin",
  "management",
  "case_manager",
  "tech_compliance",
  "marketing",
  "finance",
];

/** External vendor roles */
export const VENDOR_ROLES: UserRole[] = ["gestor", "translator"];

// --- Objectives ---

export const OBJECTIVE_STATUSES = ["active", "completed", "paused", "cancelled"] as const;
export type ObjectiveStatus = (typeof OBJECTIVE_STATUSES)[number];

export const PRIORITY_LEVELS = ["critical", "high", "normal", "low"] as const;
export type PriorityLevel = (typeof PRIORITY_LEVELS)[number];

export const objectives = mysqlTable("objectives", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  ownerId: int("ownerId"),
  status: mysqlEnum("status", OBJECTIVE_STATUSES).default("active").notNull(),
  priority: mysqlEnum("priority", PRIORITY_LEVELS).default("normal").notNull(),
  startDate: timestamp("startDate"),
  dueDate: timestamp("dueDate"),
  metricName: varchar("metricName", { length: 255 }),
  targetValue: varchar("targetValue", { length: 128 }),
  currentValue: varchar("currentValue", { length: 128 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Objective = typeof objectives.$inferSelect;
export type InsertObjective = typeof objectives.$inferInsert;

// --- Management Tasks ---

export const TASK_STATUSES = [
  "new",
  "todo",
  "doing",
  "blocked",
  "waiting_client",
  "waiting_vendor",
  "needs_review",
  "done",
] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_CREATED_BY = ["human", "ai", "system", "rule_engine"] as const;
export type TaskCreatedBy = (typeof TASK_CREATED_BY)[number];

export const TASK_QUEUES = [
  "general",
  "case_rescue",
  "security_compliance",
  "approval_required",
  "vendor_gestor",
  "vendor_translator",
] as const;
export type TaskQueue = (typeof TASK_QUEUES)[number];

export const managementTasks = mysqlTable("management_tasks", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  ownerId: int("ownerId"),
  createdById: int("createdById"),
  createdBy: mysqlEnum("createdBy", TASK_CREATED_BY).default("human").notNull(),
  priority: mysqlEnum("priority", PRIORITY_LEVELS).default("normal").notNull(),
  status: mysqlEnum("status", TASK_STATUSES).default("new").notNull(),
  queue: mysqlEnum("queue", TASK_QUEUES).default("general").notNull(),
  dueAt: timestamp("dueAt"),
  linkedObjectiveId: int("linkedObjectiveId"),
  linkedCaseId: int("linkedCaseId"),
  linkedVendorId: int("linkedVendorId"),
  linkedMetric: varchar("linkedMetric", { length: 255 }),
  sourceEventId: int("sourceEventId"),
  explanation: text("explanation"),
  evidenceRequired: int("evidenceRequired").default(0).notNull(),
  evidenceText: text("evidenceText"),
  evidenceUrl: varchar("evidenceUrl", { length: 1024 }),
  evidenceFileId: varchar("evidenceFileId", { length: 512 }),
  escalated: int("escalated").default(0).notNull(),
  escalatedAt: timestamp("escalatedAt"),
  completedAt: timestamp("completedAt"),
  label: mysqlEnum("label", ["red", "yellow", "green", "blue"]),
  archived: int("archived").default(0).notNull(),
  archivedAt: timestamp("archivedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ManagementTask = typeof managementTasks.$inferSelect;
export type InsertManagementTask = typeof managementTasks.$inferInsert;

// --- Task Comments ---
export const taskComments = mysqlTable("task_comments", {
  id: int("id").autoincrement().primaryKey(),
  taskId: int("taskId").notNull(),
  authorId: int("authorId").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type TaskComment = typeof taskComments.$inferSelect;
export type InsertTaskComment = typeof taskComments.$inferInsert;

// --- Task Attachments ---
export const taskAttachments = mysqlTable("task_attachments", {
  id: int("id").autoincrement().primaryKey(),
  taskId: int("taskId").notNull(),
  uploaderId: int("uploaderId").notNull(),
  fileName: varchar("fileName", { length: 500 }).notNull(),
  fileUrl: varchar("fileUrl", { length: 1024 }).notNull(),
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  mimeType: varchar("mimeType", { length: 128 }),
  size: int("size"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type TaskAttachment = typeof taskAttachments.$inferSelect;
export type InsertTaskAttachment = typeof taskAttachments.$inferInsert;

// --- Case Risks ---

export const RISK_LEVELS = ["green", "amber", "red", "black"] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export const caseRisks = mysqlTable("case_risks", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("caseId").notNull(),
  riskLevel: mysqlEnum("riskLevel", RISK_LEVELS).default("green").notNull(),
  riskReason: text("riskReason").notNull(),
  ownerId: int("ownerId"),
  dueAt: timestamp("dueAt"),
  source: varchar("source", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  resolvedAt: timestamp("resolvedAt"),
});

export type CaseRisk = typeof caseRisks.$inferSelect;
export type InsertCaseRisk = typeof caseRisks.$inferInsert;

// --- Vendors ---

export const VENDOR_TYPES = ["gestor", "translator"] as const;
export type VendorType = (typeof VENDOR_TYPES)[number];

export const vendors = mysqlTable("vendors", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", VENDOR_TYPES).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 32 }),
  languagePairs: varchar("languagePairs", { length: 500 }),
  active: int("active").default(1).notNull(),
  notes: text("notes"),
  userId: int("userId"), // linked user account if they have login
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Vendor = typeof vendors.$inferSelect;
export type InsertVendor = typeof vendors.$inferInsert;

// --- Vendor Assignments ---

export const VENDOR_ASSIGNMENT_STATUSES = [
  "assigned",
  "accepted",
  "in_progress",
  "completed",
  "blocked",
  "cancelled",
] as const;
export type VendorAssignmentStatus = (typeof VENDOR_ASSIGNMENT_STATUSES)[number];

export const VENDOR_ASSIGNMENT_TYPES = [
  "case_review",
  "translation",
  "submission",
  "correction",
] as const;
export type VendorAssignmentType = (typeof VENDOR_ASSIGNMENT_TYPES)[number];

export const vendorAssignments = mysqlTable("vendor_assignments", {
  id: int("id").autoincrement().primaryKey(),
  vendorId: int("vendorId").notNull(),
  caseId: int("caseId"),
  taskId: int("taskId"),
  assignmentType: mysqlEnum("assignmentType", VENDOR_ASSIGNMENT_TYPES).notNull(),
  status: mysqlEnum("status", VENDOR_ASSIGNMENT_STATUSES).default("assigned").notNull(),
  assignedAt: timestamp("assignedAt").defaultNow().notNull(),
  dueAt: timestamp("dueAt"),
  completedAt: timestamp("completedAt"),
  blockerReason: text("blockerReason"),
  qualityFlag: varchar("qualityFlag", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VendorAssignment = typeof vendorAssignments.$inferSelect;
export type InsertVendorAssignment = typeof vendorAssignments.$inferInsert;

// --- Event Log (business events that trigger automation) ---

export const eventLog = mysqlTable("event_log", {
  id: int("id").autoincrement().primaryKey(),
  eventType: varchar("eventType", { length: 128 }).notNull(),
  sourceSystem: varchar("sourceSystem", { length: 64 }).notNull(),
  sourceId: varchar("sourceId", { length: 255 }),
  payload: json("payload"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  processedAt: timestamp("processedAt"),
});

export type EventLogEntry = typeof eventLog.$inferSelect;
export type InsertEventLog = typeof eventLog.$inferInsert;

// --- Automation Audit Log ---

export const automationAuditLog = mysqlTable("automation_audit_log", {
  id: int("id").autoincrement().primaryKey(),
  eventLogId: int("eventLogId"),
  actionType: varchar("actionType", { length: 128 }).notNull(),
  ruleName: varchar("ruleName", { length: 255 }),
  explanation: text("explanation"),
  ownerAssigned: int("ownerAssigned"),
  priorityAssigned: varchar("priorityAssigned", { length: 32 }),
  taskId: int("taskId"),
  confidence: varchar("confidence", { length: 32 }),
  humanOverrideReason: text("humanOverrideReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AutomationAuditLogEntry = typeof automationAuditLog.$inferSelect;
export type InsertAutomationAuditLog = typeof automationAuditLog.$inferInsert;

// --- Integration Status (Launch Checklist) ---

export const INTEGRATION_STATUSES = ["ready", "warning", "blocked", "not_configured"] as const;
export type IntegrationStatusType = (typeof INTEGRATION_STATUSES)[number];

export const integrationStatus = mysqlTable("integration_status", {
  id: int("id").autoincrement().primaryKey(),
  integrationName: varchar("integrationName", { length: 255 }).notNull().unique(),
  status: mysqlEnum("status", INTEGRATION_STATUSES).default("not_configured").notNull(),
  lastCheckedAt: timestamp("lastCheckedAt"),
  notes: text("notes"),
  requiredForLaunch: int("requiredForLaunch").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type IntegrationStatusEntry = typeof integrationStatus.$inferSelect;
export type InsertIntegrationStatus = typeof integrationStatus.$inferInsert;


// Multi-role support: junction table allowing multiple roles per user
export const USER_ROLE_VALUES = ["user", "admin", "gestor", "super_admin", "management", "case_manager", "tech_compliance", "marketing", "finance", "translator", "read_only_advisor", "ai_system"] as const;

export const userRoles = mysqlTable("user_roles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", USER_ROLE_VALUES).notNull(),
  assignedAt: timestamp("assignedAt").defaultNow().notNull(),
  assignedById: int("assignedById"),
});
export type UserRoleEntry = typeof userRoles.$inferSelect;
export type InsertUserRoleEntry = typeof userRoles.$inferInsert;

// Password reset tokens
export const passwordResetTokens = mysqlTable("password_reset_tokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  token: varchar("token", { length: 128 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = typeof passwordResetTokens.$inferInsert;

// Team Resources — shared tool links, documents, and SOPs
export const RESOURCE_CATEGORIES = [
  "finance",
  "marketing",
  "tech",
  "legal",
  "vendors",
  "operations",
] as const;
export type ResourceCategory = (typeof RESOURCE_CATEGORIES)[number];

export const teamResources = mysqlTable("team_resources", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  url: varchar("url", { length: 1024 }),
  category: mysqlEnum("category", RESOURCE_CATEGORIES).default("operations").notNull(),
  notes: text("notes"),
  hasBitwardenCreds: int("hasBitwardenCreds").default(0).notNull(),
  fileKey: varchar("fileKey", { length: 512 }),
  fileName: varchar("fileName", { length: 255 }),
  createdById: int("createdById").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type TeamResource = typeof teamResources.$inferSelect;
export type InsertTeamResource = typeof teamResources.$inferInsert;


// ============================================================
// SECURE DOCUMENT STORAGE — Private AWS S3 (eu-south-2)
// Passports, IDs, and immigration documents
// ============================================================

export const SECURE_DOC_UPLOAD_STATUSES = [
  "requested",
  "upload_started",
  "uploaded",
  "pending_manual_review",
  "accepted",
  "rejected",
  "replacement_requested",
  "deletion_scheduled",
  "deleted",
] as const;
export type SecureDocUploadStatus = (typeof SECURE_DOC_UPLOAD_STATUSES)[number];

export const SECURE_DOC_QUALITY_STATUSES = [
  "not_checked",
  "passed",
  "failed_blurry",
  "failed_glare",
  "failed_corners",
  "failed_dark",
  "failed_wrong_side",
] as const;
export type SecureDocQualityStatus = (typeof SECURE_DOC_QUALITY_STATUSES)[number];

export const SECURE_DOC_EXTRACTION_STATUSES = [
  "not_started",
  "pending",
  "completed",
  "failed",
  "skipped",
] as const;
export type SecureDocExtractionStatus = (typeof SECURE_DOC_EXTRACTION_STATUSES)[number];

export const SECURE_DOC_REVIEW_STATUSES = [
  "not_reviewed",
  "pending_manual_review",
  "approved",
  "rejected",
  "needs_resubmission",
] as const;
export type SecureDocReviewStatus = (typeof SECURE_DOC_REVIEW_STATUSES)[number];

export const SECURE_DOC_TYPES = [
  "passport",
  "eu_national_id",
  "criminal_record",
  "proof_of_income",
  "health_insurance",
  "proof_of_address",
  "employment_contract",
  "remote_work_contract",
  "university_degree",
  "professional_qualification",
  "bank_statement",
  "tax_return",
  "marriage_certificate",
  "birth_certificate",
  "other",
] as const;
export type SecureDocType = (typeof SECURE_DOC_TYPES)[number];

export const SECURE_DOC_SIDES = ["single", "front", "back"] as const;
export type SecureDocSide = (typeof SECURE_DOC_SIDES)[number];

export const SECURE_DOC_DELETION_STATUSES = ["active", "scheduled", "deleted"] as const;
export type SecureDocDeletionStatus = (typeof SECURE_DOC_DELETION_STATUSES)[number];

/**
 * Secure documents — private S3 storage for passports, IDs, immigration documents.
 * Files stored in AWS S3 eu-south-2 with KMS encryption.
 * No public URLs. Presigned URLs only with short TTL.
 */
export const secureDocuments = mysqlTable("secure_documents", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("caseId").notNull(),
  applicantId: int("applicantId"), // userId of the applicant
  productType: varchar("productType", { length: 64 }), // e.g., "eu-registration", "digital-nomad-visa"
  documentType: mysqlEnum("documentType", SECURE_DOC_TYPES).notNull(),
  documentSide: mysqlEnum("documentSide", SECURE_DOC_SIDES).default("single").notNull(),
  originalFileName: varchar("originalFileName", { length: 255 }),
  fileMimeType: varchar("fileMimeType", { length: 128 }),
  fileSize: int("fileSize"), // bytes
  storageProvider: varchar("storageProvider", { length: 32 }).default("aws_s3").notNull(),
  storageBucket: varchar("storageBucket", { length: 255 }),
  storageKey: varchar("storageKey", { length: 512 }), // S3 object key — set after upload completes
  uploadStatus: mysqlEnum("uploadStatus", SECURE_DOC_UPLOAD_STATUSES).default("requested").notNull(),
  qualityStatus: mysqlEnum("qualityStatus", SECURE_DOC_QUALITY_STATUSES).default("not_checked").notNull(),
  extractionStatus: mysqlEnum("extractionStatus", SECURE_DOC_EXTRACTION_STATUSES).default("not_started").notNull(),
  reviewStatus: mysqlEnum("reviewStatus", SECURE_DOC_REVIEW_STATUSES).default("not_reviewed").notNull(),
  uploadedAt: timestamp("uploadedAt"),
  uploadedBy: int("uploadedBy"), // userId who uploaded
  retentionUntil: timestamp("retentionUntil"), // When the document should be deleted
  deletionStatus: mysqlEnum("deletionStatus", SECURE_DOC_DELETION_STATUSES).default("active").notNull(),
  deletedAt: timestamp("deletedAt"),
  deletionReason: text("deletionReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SecureDocument = typeof secureDocuments.$inferSelect;
export type InsertSecureDocument = typeof secureDocuments.$inferInsert;

/**
 * Document access logs — every staff view/download is recorded.
 * Required for GDPR compliance and security audit.
 */
export const DOCUMENT_ACCESS_ACTIONS = [
  "view_metadata",
  "download",
  "preview",
  "share_with_gestor",
  "delete",
] as const;
export type DocumentAccessAction = (typeof DOCUMENT_ACCESS_ACTIONS)[number];

export const documentAccessLogs = mysqlTable("document_access_logs", {
  id: int("id").autoincrement().primaryKey(),
  documentId: int("documentId").notNull(), // FK to secure_documents.id
  caseId: int("caseId").notNull(),
  staffUserId: int("staffUserId").notNull(),
  action: mysqlEnum("action", DOCUMENT_ACCESS_ACTIONS).notNull(),
  viewedAt: timestamp("viewedAt").defaultNow().notNull(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
});

export type DocumentAccessLog = typeof documentAccessLogs.$inferSelect;
export type InsertDocumentAccessLog = typeof documentAccessLogs.$inferInsert;

/**
 * Document events — lifecycle events for audit trail.
 */
export const DOCUMENT_EVENT_TYPES = [
  "upload_initiated",
  "upload_completed",
  "quality_check_passed",
  "quality_check_failed",
  "extraction_started",
  "extraction_completed",
  "extraction_failed",
  "manual_review_started",
  "manual_review_completed",
  "accepted",
  "rejected",
  "replacement_requested",
  "deletion_scheduled",
  "deleted",
] as const;
export type DocumentEventType = (typeof DOCUMENT_EVENT_TYPES)[number];

export const documentEvents = mysqlTable("document_events", {
  id: int("id").autoincrement().primaryKey(),
  documentId: int("documentId").notNull(),
  caseId: int("caseId").notNull(),
  eventType: mysqlEnum("eventType", DOCUMENT_EVENT_TYPES).notNull(),
  eventPayload: json("eventPayload"), // Additional context
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  createdBy: int("createdBy"), // userId or null for system
});

export type DocumentEvent = typeof documentEvents.$inferSelect;
export type InsertDocumentEvent = typeof documentEvents.$inferInsert;
