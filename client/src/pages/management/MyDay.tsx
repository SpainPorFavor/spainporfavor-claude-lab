import { formatDate } from "@/lib/utils";
/**
 * My Day — Screen 2
 * Personalized priorities: overdue, blocked, newly assigned tasks for the current user.
 */
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Circle,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { Link } from "wouter";

const PRIORITY_COLORS: Record<string, string> = {
  critical: "bg-red-100 text-red-800 border-red-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  normal: "bg-blue-100 text-blue-800 border-blue-200",
  low: "bg-slate-100 text-slate-600 border-slate-200",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  new: <Circle className="w-3.5 h-3.5 text-slate-400" />,
  todo: <Circle className="w-3.5 h-3.5 text-blue-500" />,
  doing: <Loader2 className="w-3.5 h-3.5 text-amber-500" />,
  blocked: <AlertTriangle className="w-3.5 h-3.5 text-red-500" />,
  waiting_client: <Clock className="w-3.5 h-3.5 text-purple-500" />,
  waiting_vendor: <Clock className="w-3.5 h-3.5 text-indigo-500" />,
  needs_review: <CheckCircle2 className="w-3.5 h-3.5 text-teal-500" />,
  done: <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />,
};

export default function MyDay() {
  const { user } = useAuth();
  const { data: tasks, isLoading } = trpc.management.tasks.getMyDay.useQuery();

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-slate-200 rounded w-48" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-slate-200 rounded-lg" />
        ))}
      </div>
    );
  }

  const now = new Date();
  const overdue = tasks?.filter(
    (t) => t.dueAt && new Date(t.dueAt) < now
  ) || [];
  const blocked = tasks?.filter((t) => t.status === "blocked") || [];
  const critical = tasks?.filter(
    (t) => t.priority === "critical" && t.status !== "blocked"
  ) || [];
  const rest = tasks?.filter(
    (t) =>
      t.priority !== "critical" &&
      t.status !== "blocked" &&
      !(t.dueAt && new Date(t.dueAt) < now)
  ) || [];

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          My Day
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {user?.name ? `${user.name}'s` : "Your"} priorities for today
        </p>
      </div>

      {/* Overdue Section */}
      {overdue.length > 0 && (
        <Section
          title="Overdue"
          count={overdue.length}
          accent="red"
          tasks={overdue}
        />
      )}

      {/* Blocked Section */}
      {blocked.length > 0 && (
        <Section
          title="Blocked"
          count={blocked.length}
          accent="amber"
          tasks={blocked}
        />
      )}

      {/* Critical Section */}
      {critical.length > 0 && (
        <Section
          title="Critical Priority"
          count={critical.length}
          accent="orange"
          tasks={critical}
        />
      )}

      {/* Remaining Tasks */}
      {rest.length > 0 && (
        <Section
          title="Other Active Tasks"
          count={rest.length}
          accent="blue"
          tasks={rest}
        />
      )}

      {/* Empty state */}
      {tasks?.length === 0 && (
        <div className="text-center py-12">
          <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-slate-700">All clear!</h3>
          <p className="text-sm text-slate-500 mt-1">
            No tasks assigned to you right now.
          </p>
          <Link
            href="/management/tasks"
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mt-3"
          >
            View team task board <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  count,
  accent,
  tasks,
}: {
  title: string;
  count: number;
  accent: "red" | "amber" | "orange" | "blue";
  tasks: any[];
}) {
  const borderColor = {
    red: "border-l-red-500",
    amber: "border-l-amber-500",
    orange: "border-l-orange-500",
    blue: "border-l-blue-500",
  }[accent];

  return (
    <div>
      <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-2">
        {title}
        <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full">
          {count}
        </span>
      </h2>
      <div className="space-y-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`bg-white border border-slate-200 border-l-4 ${borderColor} rounded-lg p-4 flex items-start gap-3`}
          >
            <div className="mt-0.5">
              {STATUS_ICONS[task.status] || <Circle className="w-3.5 h-3.5" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">
                {task.title}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`text-xs px-2 py-0.5 rounded border ${
                    PRIORITY_COLORS[task.priority] || ""
                  }`}
                >
                  {task.priority}
                </span>
                <span className="text-xs text-slate-400">{task.queue}</span>
                {task.dueAt && (
                  <span className="text-xs text-slate-400">
                    Due: {formatDate(task.dueAt)}
                  </span>
                )}
              </div>
              {task.explanation && (
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {task.explanation}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
