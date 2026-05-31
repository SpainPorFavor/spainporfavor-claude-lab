import { formatDate } from "@/lib/utils";
/**
 * Team Task Board — Screen 3
 * Kanban-style 8-column board with search and archive features.
 * Click a card to open the detail panel. Use the "Move to" dropdown to change status.
 */
import { trpc } from "@/lib/trpc";
import { useState, useMemo, useRef, useEffect } from "react";
import {
  Plus,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Circle,
  Loader2,
  X,
  MoveRight,
  User,
  Filter,
  Search,
  Archive,
  ArchiveRestore,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import TaskDetail from "./TaskDetail";

const COLUMNS = [
  { key: "new", label: "New", icon: Circle, color: "text-slate-400" },
  { key: "todo", label: "To Do", icon: Circle, color: "text-blue-500" },
  { key: "doing", label: "Doing", icon: Loader2, color: "text-amber-500" },
  { key: "blocked", label: "Blocked", icon: AlertTriangle, color: "text-red-500" },
  { key: "waiting_client", label: "Waiting Client", icon: Clock, color: "text-purple-500" },
  { key: "waiting_vendor", label: "Waiting Vendor", icon: Clock, color: "text-indigo-500" },
  { key: "needs_review", label: "Needs Review", icon: CheckCircle2, color: "text-teal-500" },
  { key: "done", label: "Done", icon: CheckCircle2, color: "text-green-500" },
] as const;

const PRIORITY_DOT: Record<string, string> = {
  critical: "bg-red-500",
  high: "bg-orange-400",
  normal: "bg-blue-400",
  low: "bg-slate-300",
};

const LABEL_BAR: Record<string, string> = {
  red: "bg-red-500",
  yellow: "bg-yellow-400",
  green: "bg-green-500",
  blue: "bg-blue-500",
};

type Task = {
  id: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  queue: string;
  label: string | null;
  ownerId: number | null;
  linkedCaseId: number | null;
  dueAt: Date | null;
  archived: number;
  archivedAt: Date | null;
  [key: string]: any;
};

export default function TaskBoard() {
  const utils = trpc.useUtils();
  const [showArchived, setShowArchived] = useState(false);

  const { data: tasks, isLoading } = trpc.management.tasks.list.useQuery(
    showArchived ? { includeArchived: true } : undefined
  );
  const { data: archivedTasks, isLoading: archivedLoading } = trpc.management.tasks.listArchived.useQuery(
    undefined,
    { enabled: showArchived }
  );
  const { data: team } = trpc.management.team.list.useQuery();
  const updateTask = trpc.management.tasks.update.useMutation({
    onSuccess: () => utils.management.tasks.list.invalidate(),
  });
  const createTask = trpc.management.tasks.create.useMutation({
    onSuccess: () => {
      utils.management.tasks.list.invalidate();
      setShowCreate(false);
      setNewTitle("");
      toast.success("Task created");
    },
  });
  const archiveTask = trpc.management.tasks.archive.useMutation({
    onSuccess: () => {
      utils.management.tasks.list.invalidate();
      utils.management.tasks.listArchived.invalidate();
      toast.success("Task archived");
    },
  });
  const unarchiveTask = trpc.management.tasks.unarchive.useMutation({
    onSuccess: () => {
      utils.management.tasks.list.invalidate();
      utils.management.tasks.listArchived.invalidate();
      toast.success("Task restored from archive");
    },
  });

  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterQueue, setFilterQueue] = useState<string>("all");
  const [filterAssignee, setFilterAssignee] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [newPriority, setNewPriority] = useState<"critical" | "high" | "normal" | "low">("normal");
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const tasksByStatus = useMemo(() => {
    const PRIORITY_ORDER: Record<string, number> = {
      critical: 0,
      high: 1,
      normal: 2,
      low: 3,
    };
    const LABEL_ORDER: Record<string, number> = {
      red: 0,
      yellow: 1,
      blue: 2,
      green: 3,
    };
    const query = searchQuery.toLowerCase().trim();
    return COLUMNS.map((col) => ({
      ...col,
      tasks: (tasks || [])
        .filter((t: Task) => t.status === col.key)
        .filter((t: Task) => !t.archived) // Don't show archived in kanban
        .filter((t: Task) => filterPriority === "all" || t.priority === filterPriority)
        .filter((t: Task) => filterQueue === "all" || t.queue === filterQueue)
        .filter((t: Task) => {
          if (filterAssignee === "all") return true;
          if (filterAssignee === "unassigned") return !t.ownerId;
          return t.ownerId === Number(filterAssignee);
        })
        .filter((t: Task) => {
          if (!query) return true;
          return (
            t.title.toLowerCase().includes(query) ||
            (t.description && t.description.toLowerCase().includes(query))
          );
        })
        .sort((a: Task, b: Task) => {
          const aLabel = a.label ? (LABEL_ORDER[a.label] ?? 99) : 99;
          const bLabel = b.label ? (LABEL_ORDER[b.label] ?? 99) : 99;
          if (aLabel !== bLabel) return aLabel - bLabel;
          const aPri = PRIORITY_ORDER[a.priority] ?? 2;
          const bPri = PRIORITY_ORDER[b.priority] ?? 2;
          return aPri - bPri;
        }),
    }));
  }, [tasks, filterPriority, filterQueue, filterAssignee, searchQuery]);

  // Filter archived tasks by search query
  const filteredArchivedTasks = useMemo(() => {
    if (!archivedTasks) return [];
    const query = searchQuery.toLowerCase().trim();
    if (!query) return archivedTasks;
    return archivedTasks.filter(
      (t: Task) =>
        t.title.toLowerCase().includes(query) ||
        (t.description && t.description.toLowerCase().includes(query))
    );
  }, [archivedTasks, searchQuery]);

  const totalActive = useMemo(() => {
    return tasksByStatus.reduce((sum, col) => sum + col.tasks.length, 0);
  }, [tasksByStatus]);

  function handleMoveTask(taskId: number, newStatus: string) {
    updateTask.mutate(
      { id: taskId, status: newStatus as any },
      {
        onSuccess: () => {
          toast.success(`Moved to "${COLUMNS.find((c) => c.key === newStatus)?.label}"`);
        },
      }
    );
  }

  function handleArchiveTask(taskId: number) {
    archiveTask.mutate({ id: taskId });
  }

  function handleUnarchiveTask(taskId: number) {
    unarchiveTask.mutate({ id: taskId });
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-slate-200 rounded w-48" />
        <div className="flex gap-3 overflow-x-auto">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="w-64 h-96 bg-slate-200 rounded-lg shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Task Board</h1>
          <p className="text-sm text-slate-500 mt-1">
            {showArchived
              ? `${filteredArchivedTasks.length} archived task${filteredArchivedTasks.length !== 1 ? "s" : ""}`
              : `${totalActive} active task${totalActive !== 1 ? "s" : ""}${searchQuery ? " matching search" : ""}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={showArchived ? "default" : "outline"}
            onClick={() => setShowArchived(!showArchived)}
            className="gap-1"
          >
            <Archive className="w-3.5 h-3.5" />
            {showArchived ? "Back to Board" : "Archived"}
          </Button>
          {!showArchived && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className={`gap-1 ${showFilters || filterPriority !== "all" || filterQueue !== "all" || filterAssignee !== "all" ? "border-blue-300 text-blue-700" : ""}`}
              >
                <Filter className="w-3.5 h-3.5" />
                {(filterPriority !== "all" || filterQueue !== "all" || filterAssignee !== "all") ? "Filtered" : "Filter"}
              </Button>
              <Button
                size="sm"
                onClick={() => setShowCreate(true)}
                className="gap-1"
              >
                <Plus className="w-4 h-4" /> New Task
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search tasks by title or description..."
          className="w-full pl-10 pr-10 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Bar */}
      {showFilters && !showArchived && (
        <div className="flex items-center gap-3 flex-wrap bg-white border border-slate-200 rounded-lg px-4 py-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-500">Priority:</label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="text-xs border border-slate-200 rounded px-2 py-1"
            >
              <option value="all">All</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-500">Queue:</label>
            <select
              value={filterQueue}
              onChange={(e) => setFilterQueue(e.target.value)}
              className="text-xs border border-slate-200 rounded px-2 py-1"
            >
              <option value="all">All</option>
              <option value="general">General</option>
              <option value="case_rescue">Case Rescue</option>
              <option value="security_compliance">Security</option>
              <option value="approval_required">Approval Required</option>
              <option value="vendor_gestor">Vendor Gestor</option>
              <option value="vendor_translator">Vendor Translator</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-500">Assignee:</label>
            <select
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
              className="text-xs border border-slate-200 rounded px-2 py-1"
            >
              <option value="all">All</option>
              <option value="unassigned">Unassigned</option>
              {(team || []).map((m) => (
                <option key={m.id} value={m.id.toString()}>{m.name || `User #${m.id}`}</option>
              ))}
            </select>
          </div>
          {(filterPriority !== "all" || filterQueue !== "all" || filterAssignee !== "all") && (
            <button
              onClick={() => { setFilterPriority("all"); setFilterQueue("all"); setFilterAssignee("all"); }}
              className="text-xs text-blue-600 hover:text-blue-800 underline"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Create Task Dialog */}
      {showCreate && !showArchived && (
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-700">Create Task</h3>
            <button onClick={() => setShowCreate(false)}>
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Task title..."
              className="flex-1 text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => {
                if (e.key === "Enter" && newTitle.trim()) {
                  createTask.mutate({ title: newTitle.trim(), priority: newPriority });
                }
              }}
            />
            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value as any)}
              className="text-sm border border-slate-200 rounded px-2 py-2"
            >
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>
            <Button
              size="sm"
              onClick={() => {
                if (newTitle.trim()) {
                  createTask.mutate({ title: newTitle.trim(), priority: newPriority });
                }
              }}
              disabled={!newTitle.trim() || createTask.isPending}
            >
              Add
            </Button>
          </div>
        </div>
      )}

      {/* Archived View */}
      {showArchived ? (
        <div className="space-y-2">
          {archivedLoading ? (
            <div className="animate-pulse space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-slate-200 rounded-lg" />
              ))}
            </div>
          ) : filteredArchivedTasks.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-lg">
              <Archive className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">
                {searchQuery ? "No archived tasks match your search" : "No archived tasks"}
              </p>
            </div>
          ) : (
            filteredArchivedTasks.map((task: Task) => {
              const owner = (team || []).find((m) => m.id === task.ownerId);
              return (
                <div
                  key={task.id}
                  className="bg-white border border-slate-200 rounded-lg p-4 flex items-center justify-between hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        PRIORITY_DOT[task.priority] || "bg-slate-300"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800 truncate">{task.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                          {task.status.replace(/_/g, " ")}
                        </span>
                        {task.queue !== "general" && (
                          <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                            {task.queue.replace(/_/g, " ")}
                          </span>
                        )}
                        {owner && (
                          <span className="text-[10px] text-slate-500 flex items-center gap-1">
                            <User className="w-2.5 h-2.5" />
                            {owner.name || "Unknown"}
                          </span>
                        )}
                        {task.archivedAt && (
                          <span className="text-[10px] text-slate-400">
                            Archived {formatDate(task.archivedAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUnarchiveTask(task.id)}
                    disabled={unarchiveTask.isPending}
                    className="gap-1 shrink-0 ml-3"
                  >
                    <ArchiveRestore className="w-3.5 h-3.5" />
                    Restore
                  </Button>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Kanban Board */
        <div className="flex gap-3 overflow-x-auto pb-4">
          {tasksByStatus.map((col) => (
            <KanbanColumn
              key={col.key}
              column={col}
              team={team || []}
              onCardClick={(id) => setSelectedTaskId(id)}
              onMoveTask={handleMoveTask}
              onArchiveTask={handleArchiveTask}
            />
          ))}
        </div>
      )}

      {/* Task Detail Side Panel */}
      <TaskDetail
        taskId={selectedTaskId}
        open={selectedTaskId !== null}
        onClose={() => setSelectedTaskId(null)}
      />
    </div>
  );
}

function KanbanColumn({
  column,
  team,
  onCardClick,
  onMoveTask,
  onArchiveTask,
}: {
  column: { key: string; label: string; icon: typeof Circle; color: string; tasks: Task[] };
  team: { id: number; name: string | null; role: string }[];
  onCardClick: (taskId: number) => void;
  onMoveTask: (taskId: number, newStatus: string) => void;
  onArchiveTask: (taskId: number) => void;
}) {
  const Icon = column.icon;

  return (
    <div className="w-64 shrink-0 rounded-lg bg-slate-100">
      <div className="p-3 border-b border-slate-200 flex items-center gap-2">
        <Icon className={`w-3 h-3 ${column.color}`} />
        <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
          {column.label}
        </span>
        <span className="ml-auto text-xs text-slate-400 font-medium bg-slate-200 px-1.5 py-0.5 rounded-full">
          {column.tasks.length}
        </span>
      </div>
      <div className="p-2 space-y-2 max-h-[calc(100vh-240px)] overflow-y-auto min-h-[80px]">
        {column.tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            team={team}
            currentStatus={column.key}
            onCardClick={onCardClick}
            onMoveTask={onMoveTask}
            onArchiveTask={onArchiveTask}
          />
        ))}
        {column.tasks.length === 0 && (
          <p className="text-xs text-slate-400 text-center py-6 border-2 border-dashed border-slate-200 rounded-md">
            No tasks
          </p>
        )}
      </div>
    </div>
  );
}

function TaskCard({
  task,
  team,
  currentStatus,
  onCardClick,
  onMoveTask,
  onArchiveTask,
}: {
  task: Task;
  team: { id: number; name: string | null; role: string }[];
  currentStatus: string;
  onCardClick: (taskId: number) => void;
  onMoveTask: (taskId: number, newStatus: string) => void;
  onArchiveTask: (taskId: number) => void;
}) {
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const moveButtonRef = useRef<HTMLButtonElement>(null);
  const owner = team.find((m) => m.id === task.ownerId);

  return (
    <div className="relative group">
      <div
        onClick={() => onCardClick(task.id)}
        className="bg-white rounded-md border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer overflow-hidden"
      >
        {/* Colour label bar at top of card */}
        {task.label && (
          <div className={`h-1.5 w-full ${LABEL_BAR[task.label] || ""}`} />
        )}
        <div className="p-3">
          <div className="flex items-start gap-2">
            <div
              className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                PRIORITY_DOT[task.priority] || "bg-slate-300"
              }`}
            />
            <p className="text-xs font-medium text-slate-800 line-clamp-2 flex-1">
              {task.title}
            </p>
          </div>
          <div className="flex items-center gap-1 mt-2 flex-wrap">
            {task.queue !== "general" && (
              <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                {task.queue.replace(/_/g, " ")}
              </span>
            )}
            {task.linkedCaseId && (
              <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
                Case #{task.linkedCaseId}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between mt-2">
            {owner ? (
              <span className="text-[10px] text-slate-500 truncate max-w-[100px] flex items-center gap-1">
                <User className="w-2.5 h-2.5" />
                {owner.name || "Unknown"}
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 italic">Unassigned</span>
            )}
            {task.dueAt && (
              <span
                className={`text-[10px] ${
                  new Date(task.dueAt) < new Date()
                    ? "text-red-600 font-medium"
                    : "text-slate-400"
                }`}
              >
                {formatDate(task.dueAt)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons — visible on hover */}
      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onArchiveTask(task.id);
          }}
          className="w-6 h-6 bg-white border border-slate-200 rounded flex items-center justify-center hover:bg-slate-50 hover:border-slate-300 shadow-sm"
          title="Archive task"
        >
          <Archive className="w-3 h-3 text-slate-500" />
        </button>
        <button
          ref={moveButtonRef}
          onClick={(e) => {
            e.stopPropagation();
            setShowMoveMenu(!showMoveMenu);
          }}
          className="w-6 h-6 bg-white border border-slate-200 rounded flex items-center justify-center hover:bg-slate-50 hover:border-slate-300 shadow-sm"
          title="Move to..."
        >
          <MoveRight className="w-3 h-3 text-slate-500" />
        </button>
      </div>

      {/* Move-to dropdown menu — uses fixed positioning to avoid overflow clipping */}
      {showMoveMenu && (
        <>
          <div
            className="fixed inset-0 z-[9998]"
            onClick={() => setShowMoveMenu(false)}
          />
          <MoveToDropdown
            currentStatus={currentStatus}
            onMoveTask={(newStatus) => {
              onMoveTask(task.id, newStatus);
              setShowMoveMenu(false);
            }}
            onClose={() => setShowMoveMenu(false)}
            triggerRef={moveButtonRef}
          />
        </>
      )}
    </div>
  );
}

function MoveToDropdown({
  currentStatus,
  onMoveTask,
  onClose,
  triggerRef,
}: {
  currentStatus: string;
  onMoveTask: (newStatus: string) => void;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number; maxHeight: number }>({ top: 0, left: 0, maxHeight: 280 });

  useEffect(() => {
    // Use requestAnimationFrame to ensure DOM is painted before measuring
    const frame = requestAnimationFrame(() => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const spaceBelow = viewportHeight - rect.bottom - 8;
      const spaceAbove = rect.top - 8;

      let top: number;
      let maxHeight: number;

      if (spaceBelow >= 200) {
        // Enough space below — open downward
        top = rect.bottom + 4;
        maxHeight = Math.min(280, spaceBelow - 4);
      } else if (spaceAbove >= 200) {
        // Open upward
        maxHeight = Math.min(280, spaceAbove - 4);
        top = rect.top - maxHeight - 4;
      } else {
        // Neither direction has enough space — center in viewport with scroll
        maxHeight = Math.min(280, viewportHeight - 32);
        top = Math.max(16, (viewportHeight - maxHeight) / 2);
      }

      // Align right edge with button right edge, but keep within viewport
      let left = rect.right - 140;
      if (left < 8) left = 8;
      if (left + 140 > viewportWidth - 8) left = viewportWidth - 148;

      setPosition({ top, left, maxHeight });
    });
    return () => cancelAnimationFrame(frame);
  }, [triggerRef]);

  return (
    <div
      ref={dropdownRef}
      className="fixed z-[9999] bg-white border border-slate-200 rounded-lg shadow-lg py-1 min-w-[140px] overflow-y-auto"
      style={{ top: position.top, left: position.left, maxHeight: position.maxHeight }}
    >
      <p className="text-[10px] text-slate-400 uppercase tracking-wide px-3 py-1 font-semibold">
        Move to...
      </p>
      {COLUMNS.filter((c) => c.key !== currentStatus).map((col) => {
        const Icon = col.icon;
        return (
          <button
            key={col.key}
            onClick={(e) => {
              e.stopPropagation();
              onMoveTask(col.key);
            }}
            className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
          >
            <Icon className={`w-3 h-3 ${col.color}`} />
            {col.label}
          </button>
        );
      })}
    </div>
  );
}
