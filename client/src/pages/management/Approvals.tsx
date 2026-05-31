import { formatDate } from "@/lib/utils";
/**
 * Approvals Queue — Screen 6 (John's Queue)
 * Conditional approval required: pricing changes, vendor onboarding, policy decisions.
 */
import { trpc } from "@/lib/trpc";
import { CheckCircle, XCircle, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function Approvals() {
  const utils = trpc.useUtils();
  const { data: tasks, isLoading } = trpc.management.tasks.list.useQuery({
    queue: "approval_required",
  });
  const updateTask = trpc.management.tasks.update.useMutation({
    onSuccess: () => {
      utils.management.tasks.list.invalidate();
      toast.success("Task updated");
    },
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-slate-200 rounded w-64" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-slate-200 rounded-lg" />
        ))}
      </div>
    );
  }

  const pending = tasks?.filter((t) => t.status !== "done") || [];
  const completed = tasks?.filter((t) => t.status === "done") || [];

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <CheckCircle className="w-6 h-6 text-teal-600" />
          Approvals Required
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Items requiring conditional approval before proceeding
        </p>
      </div>

      {/* Pending Approvals */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          Pending ({pending.length})
        </h2>
        {pending.length === 0 && (
          <div className="text-center py-8">
            <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No approvals pending</p>
          </div>
        )}
        {pending.map((task) => (
          <div
            key={task.id}
            className="bg-white border border-slate-200 rounded-lg p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">
                  {task.title}
                </p>
                {task.explanation && (
                  <p className="text-xs text-slate-500 mt-1">
                    {task.explanation}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      task.priority === "critical"
                        ? "bg-red-100 text-red-700"
                        : task.priority === "high"
                        ? "bg-orange-100 text-orange-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {task.priority}
                  </span>
                  {task.dueAt && (
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(task.dueAt)}
                    </span>
                  )}
                  {task.linkedCaseId && (
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
                      Case #{task.linkedCaseId}
                    </span>
                  )}
                </div>
                {task.evidenceRequired === 1 && !task.evidenceText && (
                  <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Evidence required before approval
                  </p>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() =>
                    updateTask.mutate({ id: task.id, status: "blocked" })
                  }
                  disabled={updateTask.isPending}
                >
                  <XCircle className="w-3 h-3 mr-1" />
                  Reject
                </Button>
                <Button
                  size="sm"
                  onClick={() =>
                    updateTask.mutate({ id: task.id, status: "done" })
                  }
                  disabled={updateTask.isPending}
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Approve
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recently Completed */}
      {completed.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            Recently Approved ({completed.length})
          </h2>
          {completed.slice(0, 10).map((task) => (
            <div
              key={task.id}
              className="bg-slate-50 border border-slate-200 rounded-lg p-4 opacity-70"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <p className="text-sm text-slate-600">{task.title}</p>
                {task.completedAt && (
                  <span className="ml-auto text-xs text-slate-400">
                    {formatDate(task.completedAt)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
