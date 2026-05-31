import { formatDate, formatDateTime } from "@/lib/utils";
/**
 * TaskDetail — Trello-style side panel for a task.
 * Shows full task info with inline editing for title/description,
 * status change dropdown, colour label picker, assignment dropdown,
 * due date picker, comments thread, and file attachments.
 * Opens as a Sheet (slide-in from right).
 */
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState, useRef, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  MessageSquare,
  Paperclip,
  Send,
  Trash2,
  Download,
  Tag,
  Clock,
  FileText,
  Image,
  File,
  X,
  Loader2,
  Calendar,
  UserCircle,
  Pencil,
  Check,
  ArrowRightLeft,
  Archive,
} from "lucide-react";

const LABEL_COLORS = [
  { key: "red", bg: "bg-red-500", ring: "ring-red-300", name: "Red" },
  { key: "yellow", bg: "bg-yellow-400", ring: "ring-yellow-200", name: "Yellow" },
  { key: "green", bg: "bg-green-500", ring: "ring-green-300", name: "Green" },
  { key: "blue", bg: "bg-blue-500", ring: "ring-blue-300", name: "Blue" },
] as const;

const STATUSES = [
  { key: "new", label: "New" },
  { key: "todo", label: "To Do" },
  { key: "doing", label: "Doing" },
  { key: "blocked", label: "Blocked" },
  { key: "waiting_client", label: "Waiting Client" },
  { key: "waiting_vendor", label: "Waiting Vendor" },
  { key: "needs_review", label: "Needs Review" },
  { key: "done", label: "Done" },
] as const;

const PRIORITIES = [
  { key: "critical", label: "Critical", dot: "bg-red-500" },
  { key: "high", label: "High", dot: "bg-orange-400" },
  { key: "normal", label: "Normal", dot: "bg-blue-400" },
  { key: "low", label: "Low", dot: "bg-slate-300" },
] as const;

type TaskDetailProps = {
  taskId: number | null;
  open: boolean;
  onClose: () => void;
};

export default function TaskDetail({ taskId, open, onClose }: TaskDetailProps) {
  const utils = trpc.useUtils();
  const { user } = useAuth();

  const { data, isLoading } = trpc.management.tasks.getDetail.useQuery(
    { id: taskId! },
    { enabled: !!taskId && open }
  );

  const { data: team } = trpc.management.team.list.useQuery();

  const updateTask = trpc.management.tasks.update.useMutation({
    onSuccess: () => {
      utils.management.tasks.getDetail.invalidate({ id: taskId! });
      utils.management.tasks.list.invalidate();
    },
  });

  const addComment = trpc.management.tasks.addComment.useMutation({
    onSuccess: () => {
      utils.management.tasks.getDetail.invalidate({ id: taskId! });
      setCommentText("");
      toast.success("Comment added");
    },
  });

  const deleteComment = trpc.management.tasks.deleteComment.useMutation({
    onSuccess: () => {
      utils.management.tasks.getDetail.invalidate({ id: taskId! });
      toast.success("Comment deleted");
    },
  });

  const addAttachment = trpc.management.tasks.addAttachment.useMutation({
    onSuccess: () => {
      utils.management.tasks.getDetail.invalidate({ id: taskId! });
      toast.success("File attached");
    },
  });

  const deleteAttachment = trpc.management.tasks.deleteAttachment.useMutation({
    onSuccess: () => {
      utils.management.tasks.getDetail.invalidate({ id: taskId! });
      toast.success("Attachment removed");
    },
  });

  const archiveTask = trpc.management.tasks.archive.useMutation({
    onSuccess: () => {
      utils.management.tasks.list.invalidate();
      utils.management.tasks.listArchived.invalidate();
      toast.success("Task archived");
      onClose();
    },
  });

  const [commentText, setCommentText] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Inline editing state
  const [editingTitle, setEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editingDesc, setEditingDesc] = useState(false);
  const [editDesc, setEditDesc] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);
  const descInputRef = useRef<HTMLTextAreaElement>(null);

  // Reset editing state when task changes
  useEffect(() => {
    setEditingTitle(false);
    setEditingDesc(false);
  }, [taskId]);

  function handleSaveTitle() {
    if (!taskId || !editTitle.trim()) return;
    updateTask.mutate({ id: taskId, title: editTitle.trim() });
    setEditingTitle(false);
    toast.success("Title updated");
  }

  function handleSaveDescription() {
    if (!taskId) return;
    updateTask.mutate({ id: taskId, description: editDesc.trim() || undefined });
    setEditingDesc(false);
    toast.success("Description updated");
  }

  function handleStatusChange(status: string) {
    if (!taskId) return;
    updateTask.mutate({ id: taskId, status: status as any });
    const label = STATUSES.find((s) => s.key === status)?.label;
    toast.success(`Status changed to "${label}"`);
  }

  function handlePriorityChange(priority: string) {
    if (!taskId) return;
    updateTask.mutate({ id: taskId, priority: priority as any });
    const label = PRIORITIES.find((p) => p.key === priority)?.label;
    toast.success(`Priority set to "${label}"`);
  }

  function handleLabelChange(label: string | null) {
    if (!taskId) return;
    updateTask.mutate({ id: taskId, label: label as any });
  }

  function handleAssigneeChange(ownerId: number | null) {
    if (!taskId) return;
    updateTask.mutate({ id: taskId, ownerId });
    const name = ownerId ? team?.find((m) => m.id === ownerId)?.name : null;
    toast.success(ownerId ? `Assigned to ${name || "team member"}` : "Unassigned");
  }

  function handleDueDateChange(dateStr: string) {
    if (!taskId) return;
    if (!dateStr) {
      updateTask.mutate({ id: taskId, dueAt: null });
      toast.success("Due date removed");
    } else {
      updateTask.mutate({ id: taskId, dueAt: new Date(dateStr) });
      toast.success(`Due date set to ${formatDate(dateStr)}`);
    }
  }

  function handleAddComment() {
    if (!taskId || !commentText.trim()) return;
    addComment.mutate({ taskId, content: commentText.trim() });
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !taskId) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size exceeds 10MB limit");
      return;
    }

    setUploading(true);
    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);

      await addAttachment.mutateAsync({
        taskId,
        fileName: file.name,
        fileData: base64,
        mimeType: file.type || "application/octet-stream",
        fileSize: file.size,
      });
    } catch (err: any) {
      toast.error(err?.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function getFileIcon(mimeType: string | null) {
    if (!mimeType) return <File className="w-4 h-4" />;
    if (mimeType.startsWith("image/")) return <Image className="w-4 h-4 text-purple-500" />;
    if (mimeType === "application/pdf") return <FileText className="w-4 h-4 text-red-500" />;
    return <File className="w-4 h-4 text-slate-500" />;
  }

  function formatFileSize(bytes: number | null) {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function formatDateForInput(date: Date | null | undefined): string {
    if (!date) return "";
    const d = new Date(date);
    return d.toISOString().split("T")[0];
  }

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-0">
        <SheetDescription className="sr-only">Task details and editing panel</SheetDescription>
        {isLoading || !data ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* Header with editable title */}
            <SheetHeader className="p-5 pb-3 border-b border-slate-200">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  {editingTitle ? (
                    <div className="flex items-center gap-2">
                      <SheetTitle className="sr-only">{editTitle || "Edit task"}</SheetTitle>
                      <input
                        ref={titleInputRef}
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveTitle();
                          if (e.key === "Escape") setEditingTitle(false);
                        }}
                        className="flex-1 text-lg font-semibold border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                      <button onClick={handleSaveTitle} className="text-green-600 hover:text-green-700">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={() => setEditingTitle(false)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <SheetTitle
                      className="text-lg font-semibold text-slate-900 leading-tight cursor-pointer hover:text-blue-700 group flex items-center gap-2"
                      onClick={() => {
                        setEditTitle(data.task.title);
                        setEditingTitle(true);
                      }}
                    >
                      {data.task.title}
                      <Pencil className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                    </SheetTitle>
                  )}

                  {/* Editable description */}
                  {editingDesc ? (
                    <div className="mt-2">
                      <textarea
                        ref={descInputRef}
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSaveDescription();
                          if (e.key === "Escape") setEditingDesc(false);
                        }}
                        placeholder="Add a description..."
                        className="w-full text-sm border border-blue-300 rounded px-2 py-1.5 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[60px]"
                        autoFocus
                      />
                      <div className="flex gap-2 mt-1">
                        <Button size="sm" variant="default" className="h-7 text-xs" onClick={handleSaveDescription}>
                          Save
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingDesc(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p
                      className="text-sm text-slate-500 mt-1 cursor-pointer hover:text-blue-600 group flex items-center gap-1"
                      onClick={() => {
                        setEditDesc(data.task.description || "");
                        setEditingDesc(true);
                      }}
                    >
                      {data.task.description || (
                        <span className="italic text-slate-400">Click to add description...</span>
                      )}
                      <Pencil className="w-3 h-3 text-slate-300 group-hover:text-blue-500 transition-colors" />
                    </p>
                  )}
                </div>
              </div>
            </SheetHeader>

            {/* Status + Priority Row */}
            <div className="px-5 py-3 border-b border-slate-100 flex flex-wrap gap-3">
              {/* Status dropdown */}
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs font-medium text-slate-600">Status:</span>
                <select
                  value={data.task.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="text-xs border border-slate-200 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 font-medium"
                >
                  {STATUSES.map((s) => (
                    <option key={s.key} value={s.key}>{s.label}</option>
                  ))}
                </select>
              </div>

              {/* Priority dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-600">Priority:</span>
                <select
                  value={data.task.priority}
                  onChange={(e) => handlePriorityChange(e.target.value)}
                  className="text-xs border border-slate-200 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 font-medium"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p.key} value={p.key}>{p.label}</option>
                  ))}
                </select>
              </div>

              {data.task.queue !== "general" && (
                <span className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-600">
                  {data.task.queue.replace(/_/g, " ")}
                </span>
              )}
            </div>

            {/* Assignment & Due Date Section */}
            <div className="px-5 py-3 border-b border-slate-100 space-y-3">
              {/* Assignee Dropdown */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 w-20 shrink-0">
                  <UserCircle className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs font-medium text-slate-600">Assign:</span>
                </div>
                <select
                  value={data.task.ownerId ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    handleAssigneeChange(val ? Number(val) : null);
                  }}
                  className="flex-1 text-sm border border-slate-200 rounded-md px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
                >
                  <option value="">Unassigned</option>
                  {(team || []).map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name || `User #${member.id}`} ({member.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Due Date Picker */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 w-20 shrink-0">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs font-medium text-slate-600">Due:</span>
                </div>
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="date"
                    value={formatDateForInput(data.task.dueAt)}
                    onChange={(e) => handleDueDateChange(e.target.value)}
                    className={`flex-1 text-sm border rounded-md px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      data.task.dueAt && new Date(data.task.dueAt) < new Date()
                        ? "border-red-300 text-red-600"
                        : "border-slate-200 text-slate-700"
                    }`}
                  />
                  {data.task.dueAt && (
                    <button
                      onClick={() => handleDueDateChange("")}
                      className="text-slate-400 hover:text-slate-600"
                      title="Clear due date"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {data.task.dueAt && new Date(data.task.dueAt) < new Date() && (
                  <span className="text-[10px] text-red-600 font-medium">Overdue</span>
                )}
              </div>
            </div>

            {/* Archive Button */}
            <div className="px-5 py-3 border-b border-slate-100">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-slate-600 hover:text-amber-700 hover:border-amber-300"
                onClick={() => {
                  if (taskId) archiveTask.mutate({ id: taskId });
                }}
                disabled={archiveTask.isPending}
              >
                <Archive className="w-3.5 h-3.5" />
                Archive Task
              </Button>
            </div>

            {/* Label Picker */}
            <div className="px-5 py-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs font-medium text-slate-600">Label:</span>
                <div className="flex items-center gap-1.5 ml-2">
                  {LABEL_COLORS.map((lbl) => (
                    <button
                      key={lbl.key}
                      onClick={() => handleLabelChange(data.task.label === lbl.key ? null : lbl.key)}
                      className={`w-6 h-6 rounded-md ${lbl.bg} transition-all hover:scale-110 ${
                        data.task.label === lbl.key
                          ? `ring-2 ${lbl.ring} scale-110`
                          : "opacity-60 hover:opacity-100"
                      }`}
                      title={lbl.name}
                    />
                  ))}
                  {data.task.label && (
                    <button
                      onClick={() => handleLabelChange(null)}
                      className="text-xs text-slate-400 hover:text-slate-600 ml-1"
                      title="Remove label"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Attachments Section */}
            <div className="px-5 py-3 border-b border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs font-medium text-slate-600">
                    Attachments ({data.attachments.length})
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  ) : (
                    <Paperclip className="w-3 h-3 mr-1" />
                  )}
                  Add file
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.xls,.xlsx,.csv,.txt"
                />
              </div>

              {data.attachments.length > 0 && (
                <div className="space-y-1.5">
                  {data.attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center gap-2 p-2 rounded-md bg-slate-50 hover:bg-slate-100 group"
                    >
                      {getFileIcon(att.mimeType)}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-700 truncate">
                          {att.fileName}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {formatFileSize(att.size)} · {att.uploaderName || "Unknown"}
                        </p>
                      </div>
                      <a
                        href={att.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Download"
                      >
                        <Download className="w-3.5 h-3.5 text-slate-400 hover:text-blue-500" />
                      </a>
                      <button
                        onClick={() => deleteAttachment.mutate({ id: att.id })}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Comments Section */}
            <div className="flex-1 flex flex-col px-5 py-3 min-h-0">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs font-medium text-slate-600">
                  Comments ({data.comments.length})
                </span>
              </div>

              {/* Comments list */}
              <div className="flex-1 overflow-y-auto space-y-3 mb-3 max-h-[300px]">
                {data.comments.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-4">
                    No comments yet. Be the first to add one.
                  </p>
                )}
                {data.comments.map((comment) => (
                  <div key={comment.id} className="group">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-medium text-slate-700">
                        {comment.authorName || "Unknown"}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatDateTime(comment.createdAt)}
                      </span>
                      {(comment.authorId === user?.id) && (
                        <button
                          onClick={() => deleteComment.mutate({ id: comment.id })}
                          className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto"
                          title="Delete comment"
                        >
                          <Trash2 className="w-3 h-3 text-slate-400 hover:text-red-500" />
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap pl-0">
                      {comment.content}
                    </p>
                  </div>
                ))}
              </div>

              {/* Add comment input */}
              <div className="flex items-end gap-2 pt-2 border-t border-slate-100">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1 text-sm border border-slate-200 rounded-md px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[60px] max-h-[120px]"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      handleAddComment();
                    }
                  }}
                />
                <Button
                  size="sm"
                  onClick={handleAddComment}
                  disabled={!commentText.trim() || addComment.isPending}
                  className="h-9"
                >
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Press Ctrl+Enter to send
              </p>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
