import { formatDateTime } from "@/lib/utils";
/**
 * Audit Log — Screen 9
 * AI/Rules automation audit trail: what was triggered, why, and what it created.
 */
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { ScrollText, Bot, Zap, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 25;

export default function AuditLog() {
  const [page, setPage] = useState(0);
  const { data: logs, isLoading } = trpc.management.auditLog.list.useQuery({
    limit: PAGE_SIZE + 1,
    offset: page * PAGE_SIZE,
  });

  const hasMore = (logs?.length || 0) > PAGE_SIZE;
  const displayLogs = hasMore ? logs?.slice(0, PAGE_SIZE) : logs;

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-slate-200 rounded w-64" />
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-16 bg-slate-200 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <ScrollText className="w-6 h-6 text-slate-700" />
          Automation Audit Log
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Every automated action: what rule fired, why, and what it produced
        </p>
      </div>

      {/* Log entries */}
      <div className="space-y-2">
        {displayLogs?.length === 0 && page === 0 && (
          <div className="text-center py-12">
            <Bot className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-slate-700">
              No automation events yet
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              When the case-risk engine or automation rules fire, entries will
              appear here.
            </p>
          </div>
        )}
        {displayLogs?.map((log) => (
          <div
            key={log.id}
            className="bg-white border border-slate-200 rounded-lg p-4"
          >
                <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {log.actionType === "create_task" ? (
                  <Zap className="w-4 h-4 text-amber-500" />
                ) : (
                  <Bot className="w-4 h-4 text-blue-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                    {log.ruleName || "Unknown Rule"}
                  </span>
                  <span className="text-xs text-slate-400">
                    {log.actionType}
                  </span>
                  {log.taskId && (
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
                      Task #{log.taskId}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-800 mt-1">
                  {log.explanation || log.actionType}
                </p>
                {log.explanation && (
                  <details className="mt-2">
                    <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600">
                      View explanation
                    </summary>
                    <pre className="text-xs text-slate-500 bg-slate-50 rounded p-2 mt-1 overflow-x-auto max-h-32">
                      {log.explanation}
                    </pre>
                  </details>
                )}
              </div>
              <div className="text-xs text-slate-400 shrink-0 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {log.createdAt
                  ? formatDateTime(log.createdAt)
                  : "—"}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {(page > 0 || hasMore) && (
        <div className="flex items-center justify-between pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="gap-1"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </Button>
          <span className="text-xs text-slate-500">
            Page {page + 1}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasMore}
            className="gap-1"
          >
            Next <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
