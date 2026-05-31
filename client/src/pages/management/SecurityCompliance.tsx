import { formatDate } from "@/lib/utils";
/**
 * Security & Compliance Queue — Screen 5 (Paddy's Queue)
 * System risks, GDPR compliance, tech debt, security issues.
 */
import { trpc } from "@/lib/trpc";
import { Lock, ShieldCheck, AlertTriangle, Bug } from "lucide-react";

export default function SecurityCompliance() {
  const { data: tasks, isLoading } = trpc.management.tasks.list.useQuery({
    queue: "security_compliance",
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

  const critical = tasks?.filter((t) => t.priority === "critical") || [];
  const high = tasks?.filter((t) => t.priority === "high") || [];
  const normal = tasks?.filter((t) => t.priority === "normal" || t.priority === "low") || [];

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Lock className="w-6 h-6 text-slate-700" />
          Security & Compliance
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          GDPR, data security, system risks, and tech compliance tasks
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-red-700">{critical.length}</p>
          <p className="text-xs text-red-600 font-medium">Critical</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-orange-700">{high.length}</p>
          <p className="text-xs text-orange-600 font-medium">High</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-blue-700">{normal.length}</p>
          <p className="text-xs text-blue-600 font-medium">Normal/Low</p>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {tasks?.length === 0 && (
          <div className="text-center py-12">
            <ShieldCheck className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-slate-700">All secure</h3>
            <p className="text-sm text-slate-500">
              No security or compliance tasks pending.
            </p>
          </div>
        )}
        {tasks?.map((task) => (
          <div
            key={task.id}
            className={`bg-white border rounded-lg p-4 ${
              task.priority === "critical"
                ? "border-red-200 border-l-4 border-l-red-500"
                : task.priority === "high"
                ? "border-orange-200 border-l-4 border-l-orange-400"
                : "border-slate-200"
            }`}
          >
            <div className="flex items-start gap-3">
              {task.priority === "critical" ? (
                <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              ) : (
                <Bug className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800">
                  {task.title}
                </p>
                {task.explanation && (
                  <p className="text-xs text-slate-500 mt-1">
                    {task.explanation}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-slate-400">{task.status}</span>
                  {task.dueAt && (
                    <span
                      className={`text-xs ${
                        new Date(task.dueAt) < new Date()
                          ? "text-red-600"
                          : "text-slate-400"
                      }`}
                    >
                      Due: {formatDate(task.dueAt)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
