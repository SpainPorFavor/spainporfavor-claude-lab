import { formatDate } from "@/lib/utils";
/**
 * Vendor Work Queue — Screen 7
 * Gestores and translators see only their assigned work.
 * Management sees all vendor assignments.
 */
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  assigned: "bg-blue-100 text-blue-800",
  accepted: "bg-indigo-100 text-indigo-800",
  in_progress: "bg-amber-100 text-amber-800",
  completed: "bg-green-100 text-green-800",
  blocked: "bg-red-100 text-red-800",
  cancelled: "bg-slate-100 text-slate-600",
};

export default function VendorQueue() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const { data: assignments, isLoading } =
    trpc.management.assignments.list.useQuery();
  const { data: vendorsList } = trpc.management.vendors.list.useQuery();
  const { data: allTasks } = trpc.management.tasks.list.useQuery();
  const vendorTasks = (allTasks || []).filter(
    (t: any) => (t.queue === "vendor_gestor" || t.queue === "vendor_translator") && t.status !== "done"
  );
  const updateStatus = trpc.management.assignments.updateStatus.useMutation({
    onSuccess: () => {
      utils.management.assignments.list.invalidate();
      toast.success("Status updated");
    },
  });

  const isVendor = user?.role === "gestor" || user?.role === "translator";

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

  const active =
    assignments?.filter(
      (a) => a.status !== "completed" && a.status !== "cancelled"
    ) || [];
  const completed =
    assignments?.filter((a) => a.status === "completed") || [];

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Users className="w-6 h-6 text-indigo-600" />
          {isVendor ? "My Assignments" : "Vendor Work Queue"}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {isVendor
            ? "Your current work assignments"
            : "All vendor assignments across gestores and translators"}
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-blue-700">{active.length}</p>
          <p className="text-xs text-blue-600">Active</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-amber-700">
            {active.filter((a) => a.status === "in_progress").length}
          </p>
          <p className="text-xs text-amber-600">In Progress</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-red-700">
            {active.filter((a) => a.status === "blocked").length}
          </p>
          <p className="text-xs text-red-600">Blocked</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-green-700">
            {completed.length}
          </p>
          <p className="text-xs text-green-600">Completed</p>
        </div>
      </div>

      {/* Vendor Tasks (from task board queues) */}
      {!isVendor && vendorTasks.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            Pending Vendor Tasks ({vendorTasks.length})
          </h2>
          <p className="text-xs text-slate-500 -mt-2">Tasks in vendor queues awaiting assignment</p>
          {vendorTasks.map((task: any) => (
            <div key={task.id} className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
                      {task.queue.replace(/_/g, " ")}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {task.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-800">{task.title}</p>
                  {task.dueAt && (
                    <p className={`text-xs mt-1 flex items-center gap-1 ${new Date(task.dueAt) < new Date() ? "text-red-600" : "text-slate-400"}`}>
                      <Clock className="w-3 h-3" />
                      Due: {formatDate(task.dueAt)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Active Assignments */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          Active Assignments ({active.length})
        </h2>
        {active.length === 0 && (
          <div className="text-center py-8">
            <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No active assignments</p>
          </div>
        )}
        {active.map((assignment) => {
          const vendor = vendorsList?.find(
            (v) => v.id === assignment.vendorId
          );
          return (
            <div
              key={assignment.id}
              className="bg-white border border-slate-200 rounded-lg p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        STATUS_COLORS[assignment.status] || ""
                      }`}
                    >
                      {assignment.status.replace(/_/g, " ")}
                    </span>
                    <span className="text-xs text-slate-400">
                      {assignment.assignmentType.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-700">
                    {!isVendor && vendor && (
                      <span className="font-medium">{vendor.name}</span>
                    )}
                    {assignment.caseId && (
                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
                        Case #{assignment.caseId}
                      </span>
                    )}
                  </div>
                  {assignment.dueAt && (
                    <p
                      className={`text-xs mt-1 flex items-center gap-1 ${
                        new Date(assignment.dueAt) < new Date()
                          ? "text-red-600"
                          : "text-slate-400"
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      Due: {formatDate(assignment.dueAt)}
                    </p>
                  )}
                  {assignment.blockerReason && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {assignment.blockerReason}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  {assignment.status === "assigned" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        updateStatus.mutate({
                          id: assignment.id,
                          status: "in_progress",
                        })
                      }
                      disabled={updateStatus.isPending}
                    >
                      Start
                    </Button>
                  )}
                  {(assignment.status === "in_progress" ||
                    assignment.status === "accepted") && (
                    <Button
                      size="sm"
                      onClick={() =>
                        updateStatus.mutate({
                          id: assignment.id,
                          status: "completed",
                        })
                      }
                      disabled={updateStatus.isPending}
                    >
                      Complete
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Completed (collapsed) */}
      {completed.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            Completed ({completed.length})
          </h2>
          {completed.slice(0, 5).map((a) => (
            <div
              key={a.id}
              className="bg-slate-50 border border-slate-200 rounded-lg p-3 opacity-60"
            >
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <CheckCircle2 className="w-3 h-3 text-green-500" />
                <span>{a.assignmentType.replace(/_/g, " ")}</span>
                {a.caseId && <span>Case #{a.caseId}</span>}
                {a.completedAt && (
                  <span className="ml-auto">
                    {formatDate(a.completedAt)}
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
