/**
 * Case-Risk Engine — Evaluates cases and auto-creates tasks/risks.
 * Called on case events (status change, document upload, payment, etc.)
 *
 * Rules:
 * 1. Paid case with no document upload in 72h → amber risk + task for Naomi
 * 2. Case stuck in same status > 7 days → amber risk
 * 3. Case stuck in same status > 14 days → red risk + escalation task
 * 4. Requerimiento received → black risk + critical task for gestor + task for Naomi
 * 5. Document rejected twice → red risk + task for case manager
 * 6. Case approaching consulate deadline (< 5 days) → red risk
 * 7. Vendor assignment overdue → amber risk + task for management
 */

import { eq, and, isNull, ne, lte, desc, inArray } from "drizzle-orm";
import { getDb } from "./db";
import {
  cases,
  managementTasks,
  caseRisks,
  automationAuditLog,
  eventLog,
  vendorAssignments,
  caseStatusHistory,
  documentUploads,
} from "../drizzle/schema";

interface RuleResult {
  ruleName: string;
  riskLevel?: "green" | "amber" | "red" | "black";
  riskReason?: string;
  taskTitle?: string;
  taskPriority?: "critical" | "high" | "normal" | "low";
  taskQueue?: string;
  explanation: string;
}

/**
 * Evaluate a single case and return any triggered rules.
 */
export async function evaluateCase(caseId: number): Promise<RuleResult[]> {
  const db = await getDb();
  if (!db) return [];

  const results: RuleResult[] = [];
  const now = new Date();

  // Get the case
  const [caseRow] = await db
    .select()
    .from(cases)
    .where(eq(cases.id, caseId))
    .limit(1);

  if (!caseRow) return [];

  // Get status history
  const statusHistory = await db
    .select()
    .from(caseStatusHistory)
    .where(eq(caseStatusHistory.caseId, caseId))
    .orderBy(desc(caseStatusHistory.changedAt))
    .limit(10);

  // Rule 1: Paid case (has stripeSessionId) with no document uploads in 72h
  if (caseRow.status === "onboarding" && caseRow.stripeSessionId) {
    const caseCreated = new Date(caseRow.createdAt);
    const hoursSinceCreated = (now.getTime() - caseCreated.getTime()) / (1000 * 60 * 60);

    if (hoursSinceCreated > 72) {
      // Check if any documents were uploaded across ALL slots for this case
      const { documentSlots } = await import("../drizzle/schema");
      const slots = await db
        .select({ id: documentSlots.id })
        .from(documentSlots)
        .where(eq(documentSlots.caseId, caseId));

      let hasUploads = false;
      if (slots.length > 0) {
        const slotIds = slots.map(s => s.id);
        const uploads = await db
          .select()
          .from(documentUploads)
          .where(inArray(documentUploads.slotId, slotIds))
          .limit(1);
        hasUploads = uploads.length > 0;
      }

      if (!hasUploads) {
        results.push({
          ruleName: "paid_no_docs_72h",
          riskLevel: "amber",
          riskReason: `Case #${caseId}: Paid but no documents uploaded (${Math.round(hoursSinceCreated)}h since payment)`,
          taskTitle: `Follow up: Case #${caseId} paid but no documents uploaded`,
          taskPriority: "high",
          taskQueue: "case_rescue",
          explanation: `Client paid ${Math.round(hoursSinceCreated)} hours ago but hasn't uploaded any documents. Needs outreach.`,
        });
      }
    }
  }

  // Rule 2 & 3: Case stuck in same status
  if (statusHistory.length > 0) {
    const lastChange = statusHistory[0];
    const daysSinceChange =
      (now.getTime() - new Date(lastChange.changedAt).getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceChange > 14 && caseRow.status !== "approved" && caseRow.status !== "rejected") {
      results.push({
        ruleName: "stuck_14_days",
        riskLevel: "red",
        riskReason: `Case #${caseId}: Stuck in "${caseRow.status}" for ${Math.round(daysSinceChange)} days`,
        taskTitle: `ESCALATION: Case #${caseId} stuck in "${caseRow.status}" for ${Math.round(daysSinceChange)} days`,
        taskPriority: "critical",
        taskQueue: "case_rescue",
        explanation: `Case has been in "${caseRow.status}" status for over 14 days. Requires immediate escalation.`,
      });
    } else if (daysSinceChange > 7 && caseRow.status !== "approved" && caseRow.status !== "rejected") {
      results.push({
        ruleName: "stuck_7_days",
        riskLevel: "amber",
        riskReason: `Case #${caseId}: In "${caseRow.status}" for ${Math.round(daysSinceChange)} days`,
        taskTitle: `Review: Case #${caseId} in "${caseRow.status}" for ${Math.round(daysSinceChange)} days`,
        taskPriority: "normal",
        taskQueue: "case_rescue",
        explanation: `Case has been in the same status for over 7 days. May need attention.`,
      });
    }
  }

  // Rule 4: Requerimiento — check requerimientos table for unresolved ones
  const { requerimientos } = await import("../drizzle/schema");
  const openReqs = await db
    .select()
    .from(requerimientos)
    .where(
      and(
        eq(requerimientos.caseId, caseId),
        eq(requerimientos.status, "pending")
      )
    )
    .limit(1);

  if (openReqs.length > 0) {
    results.push({
      ruleName: "requerimiento_received",
      riskLevel: "black",
      riskReason: `Case #${caseId}: Requerimiento received — urgent response needed`,
      taskTitle: `URGENT: Respond to requerimiento for Case #${caseId}`,
      taskPriority: "critical",
      taskQueue: "case_rescue",
      explanation: `Spanish authorities have issued a requerimiento (formal request for additional info). Must respond within deadline or case is rejected.`,
    });
  }

  return results;
}

/**
 * Execute rules for a case: create risks and tasks, log to audit.
 */
export async function runRiskEngine(caseId: number, triggerEvent?: string): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const results = await evaluateCase(caseId);
  if (results.length === 0) return;

  for (const result of results) {
    // Check if this exact risk already exists (avoid duplicates — dedupe by rule name, not just severity)
    let riskCreated = false;
    if (result.riskLevel && result.riskReason) {
      const ruleSource = result.ruleName || "rule_engine";
      const existingRisk = await db
        .select()
        .from(caseRisks)
        .where(
          and(
            eq(caseRisks.caseId, caseId),
            eq(caseRisks.source, ruleSource),
            isNull(caseRisks.resolvedAt)
          )
        )
        .limit(1);

      if (existingRisk.length === 0) {
        await db.insert(caseRisks).values({
          caseId,
          riskLevel: result.riskLevel,
          riskReason: result.riskReason,
          source: ruleSource,
        });
        riskCreated = true;
      }
    }

    // Create task if specified
    let taskId: number | null = null;
    let actionTaken = false;
    if (result.taskTitle) {
      // Check for duplicate task by caseId + queue (not exact title) to prevent duplicates
      // Exclude archived tasks so they don't block new task creation
      const existingTask = await db
        .select()
        .from(managementTasks)
        .where(
          and(
            eq(managementTasks.linkedCaseId, caseId),
            eq(managementTasks.queue, (result.taskQueue as any) || "general"),
            ne(managementTasks.status, "done"),
            eq(managementTasks.archived, 0)
          )
        )
        .limit(1);

      if (existingTask.length === 0) {
        const [inserted] = await db.insert(managementTasks).values({
          title: result.taskTitle,
          priority: result.taskPriority || "normal",
          status: "new",
          queue: (result.taskQueue as any) || "general",
          createdBy: "rule_engine",
          linkedCaseId: caseId,
          explanation: result.explanation,
        });
        taskId = inserted.insertId;
        actionTaken = true;
      }
    }

    // Only log to audit when an action was actually taken (new task created or new risk flagged)
    if (actionTaken || riskCreated) {
      await db.insert(automationAuditLog).values({
        actionType: actionTaken ? "create_task" : "flag_risk",
        ruleName: result.ruleName,
        explanation: result.explanation,
        taskId,
        confidence: "high",
      });
    }
  }
}

/**
 * Batch evaluation: run risk engine on all active cases.
 * Intended to be called periodically (e.g., daily via heartbeat).
 */
export async function runBatchRiskEvaluation(): Promise<{ evaluated: number; actionsCreated: number }> {
  const db = await getDb();
  if (!db) return { evaluated: 0, actionsCreated: 0 };

  const activeCases = await db
    .select({ id: cases.id })
    .from(cases)
    .where(
      and(
        ne(cases.status, "approved"),
        ne(cases.status, "rejected")
      )
    );

  let actionsCreated = 0;
  for (const c of activeCases) {
    const results = await evaluateCase(c.id);
    if (results.length > 0) {
      await runRiskEngine(c.id, "batch_evaluation");
      actionsCreated += results.length;
    }
  }

  return { evaluated: activeCases.length, actionsCreated };
}

// ============================================================
// SCHEDULER — Runs risk engine daily
// ============================================================

const RISK_SCAN_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

let riskInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Start the risk engine scheduler.
 * Runs first scan after 2 minutes (let server finish starting),
 * then every 24 hours.
 */
export function startRiskEngineScheduler(): void {
  console.log(`[RiskEngine] Starting scheduler (interval: 24h)`);

  // Run first scan after a 2-minute delay
  setTimeout(() => {
    runBatchRiskEvaluation()
      .then((result) => {
        console.log(
          `[RiskEngine] Batch evaluation complete: ${result.evaluated} cases evaluated, ${result.actionsCreated} actions created`
        );
      })
      .catch((err) => {
        console.error("[RiskEngine] Batch evaluation error:", err);
      });
  }, 120_000);

  // Then run every 24 hours
  riskInterval = setInterval(() => {
    runBatchRiskEvaluation()
      .then((result) => {
        console.log(
          `[RiskEngine] Batch evaluation complete: ${result.evaluated} cases evaluated, ${result.actionsCreated} actions created`
        );
      })
      .catch((err) => {
        console.error("[RiskEngine] Batch evaluation error:", err);
      });
  }, RISK_SCAN_INTERVAL_MS);
}

/**
 * Stop the risk engine scheduler (for testing/shutdown).
 */
export function stopRiskEngineScheduler(): void {
  if (riskInterval) {
    clearInterval(riskInterval);
    riskInterval = null;
    console.log("[RiskEngine] Scheduler stopped");
  }
}
