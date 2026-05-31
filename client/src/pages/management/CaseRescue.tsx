import { formatDate } from "@/lib/utils";
/**
 * Case Rescue Queue — Screen 4 (Naomi's Queue)
 * Paid cases without activity, missing docs, delays, risk flags.
 */
import { trpc } from "@/lib/trpc";
import {
  AlertTriangle,
  Clock,
  FileWarning,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const RISK_BADGE: Record<string, { bg: string; text: string }> = {
  green: { bg: "bg-green-100", text: "text-green-800" },
  amber: { bg: "bg-amber-100", text: "text-amber-800" },
  red: { bg: "bg-red-100", text: "text-red-800" },
  black: { bg: "bg-slate-800", text: "text-white" },
};

export default function CaseRescue() {
  const utils = trpc.useUtils();
  const { data: risks, isLoading } = trpc.management.risks.list.useQuery({
    unresolvedOnly: true,
  });
  const { data: tasks } = trpc.management.tasks.list.useQuery({
    queue: "case_rescue",
  });
  const resolveRisk = trpc.management.risks.resolve.useMutation({
    onSuccess: () => {
      utils.management.risks.list.invalidate();
      utils.management.executive.summary.invalidate();
      toast.success("Risk resolved");
    },
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-slate-200 rounded w-64" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 bg-slate-200 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-amber-600" />
          Case Rescue Queue
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Cases at risk — paid but stalled, missing documents, or delayed
        </p>
      </div>

      {/* Risk Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(["black", "red", "amber", "green"] as const).map((level) => {
          const count = risks?.filter((r) => r.riskLevel === level).length || 0;
          return (
            <div
              key={level}
              className={`rounded-lg p-3 border ${RISK_BADGE[level].bg}`}
            >
              <p className={`text-2xl font-bold ${RISK_BADGE[level].text}`}>
                {count}
              </p>
              <p className={`text-xs font-medium uppercase ${RISK_BADGE[level].text}`}>
                {level}
              </p>
            </div>
          );
        })}
      </div>

      {/* Risk Items */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          Active Risks ({risks?.length || 0})
        </h2>
        {risks?.length === 0 && (
          <div className="text-center py-8">
            <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No active case risks</p>
          </div>
        )}
        {risks?.map((risk) => (
          <div
            key={risk.id}
            className="bg-white border border-slate-200 rounded-lg p-4 flex items-start gap-4"
          >
            <div
              className={`w-3 h-3 rounded-full mt-1 shrink-0 ${
                risk.riskLevel === "black"
                  ? "bg-slate-800"
                  : risk.riskLevel === "red"
                  ? "bg-red-500"
                  : risk.riskLevel === "amber"
                  ? "bg-amber-500"
                  : "bg-green-500"
              }`}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-slate-500">
                  Case #{risk.caseId}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded ${RISK_BADGE[risk.riskLevel].bg} ${RISK_BADGE[risk.riskLevel].text}`}
                >
                  {risk.riskLevel.toUpperCase()}
                </span>
                {risk.source && (
                  <span className="text-xs text-slate-400">{risk.source}</span>
                )}
              </div>
              <p className="text-sm text-slate-800">{risk.riskReason}</p>
              {risk.dueAt && (
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Due: {formatDate(risk.dueAt)}
                </p>
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => resolveRisk.mutate({ id: risk.id })}
              disabled={resolveRisk.isPending}
            >
              Resolve
            </Button>
          </div>
        ))}
      </div>

      {/* Related Tasks */}
      {tasks && tasks.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            Case Rescue Tasks ({tasks.length})
          </h2>
          {tasks.map((task) => (
            <div
              key={task.id}
              className="bg-white border border-slate-200 rounded-lg p-4"
            >
              <div className="flex items-center gap-2">
                <FileWarning className="w-4 h-4 text-amber-500" />
                <p className="text-sm font-medium text-slate-800">
                  {task.title}
                </p>
                <span className="ml-auto text-xs text-slate-400">
                  {task.status}
                </span>
              </div>
              {task.explanation && (
                <p className="text-xs text-slate-500 mt-1 ml-6">
                  {task.explanation}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
