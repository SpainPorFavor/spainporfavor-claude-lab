/**
 * Gestor Dashboard — Case queue, document view, structured actions.
 * Gestores only see cases assigned to them.
 */

import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  Loader2,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  Send,
  AlertTriangle,
  ChevronLeft,
  Shield,
  Calendar,
  User,
  Globe,
  Flag,
} from "lucide-react";
import { Streamdown } from "streamdown";

type ViewMode = "queue" | "detail";

export default function GestorDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>("queue");
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center max-w-md p-8">
          <Shield className="h-12 w-12 text-slate-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Gestor Portal</h1>
          <p className="text-slate-600 mb-6">Sign in to access your case queue.</p>
          <Button onClick={() => { window.location.href = getLoginUrl(); }}>Sign In</Button>
        </div>
      </div>
    );
  }

  if (user.role !== "gestor" && user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center max-w-md p-8">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h1>
          <p className="text-slate-600">You don't have Gestor access. Contact admin for permissions.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {viewMode === "detail" && (
              <button
                onClick={() => { setViewMode("queue"); setSelectedCaseId(null); }}
                className="text-slate-500 hover:text-slate-700"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            <h1 className="text-lg font-semibold text-slate-900">
              {viewMode === "queue" ? "My Cases" : "Case Detail"}
            </h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <User className="h-4 w-4" />
            <span>{user.name || user.email}</span>
          </div>
        </div>
      </header>

      {viewMode === "queue" ? (
        <CaseQueue
          onSelectCase={(id) => {
            setSelectedCaseId(id);
            setViewMode("detail");
          }}
        />
      ) : selectedCaseId ? (
        <CaseDetail caseId={selectedCaseId} onBack={() => { setViewMode("queue"); setSelectedCaseId(null); }} />
      ) : null}
    </div>
  );
}

// ============================================================
// CASE QUEUE
// ============================================================

function CaseQueue({ onSelectCase }: { onSelectCase: (id: number) => void }) {
  const { data: cases = [], isLoading } = trpc.gestor.getMyCases.useQuery();

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      </div>
    );
  }

  if (cases.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-slate-700 mb-2">No cases assigned</h2>
          <p className="text-slate-500">Cases will appear here when assigned to you by admin.</p>
        </div>
      </div>
    );
  }

  const statusOrder = ["ready_for_gestor", "with_gestor", "submitted", "onboarding", "collecting_documents", "approved", "rejected"];
  const sortedCases = [...cases].sort((a, b) => {
    return statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status);
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="grid gap-4">
        {sortedCases.map((c: any) => (
          <button
            key={c.id}
            onClick={() => onSelectCase(c.id)}
            className="w-full text-left bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`h-3 w-3 rounded-full ${getStatusDotColor(c.status)}`} />
                <div>
                  <h3 className="font-medium text-slate-900">{c.clientName}</h3>
                  <p className="text-sm text-slate-500">
                    {c.visaType.replace(/-/g, " ").replace(/\b\w/g, (ch: string) => ch.toUpperCase())}
                    {c.nationality && ` · ${c.nationality}`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusBadge(c.status)}`}>
                  {getStatusLabel(c.status)}
                </span>
                <p className="text-xs text-slate-400 mt-1">
                  Updated {new Date(c.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// CASE DETAIL
// ============================================================

function CaseDetail({ caseId, onBack }: { caseId: number; onBack: () => void }) {
  const { data, isLoading, refetch } = trpc.gestor.getCaseDetail.useQuery({ caseId });
  const [activeTab, setActiveTab] = useState<"documents" | "actions" | "history">("documents");

  if (isLoading || !data) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      {/* Case header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{data.clientName}</h2>
            <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
              <span className="flex items-center gap-1">
                <Globe className="h-4 w-4" />
                {data.visaType.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
              </span>
              {data.nationality && (
                <span className="flex items-center gap-1">
                  <Flag className="h-4 w-4" />
                  {data.nationality}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Created {new Date(data.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          <span className={`text-sm font-medium px-3 py-1.5 rounded-full ${getStatusBadge(data.status)}`}>
            {getStatusLabel(data.status)}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
        {(["documents", "actions", "history"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "documents" && <DocumentsTab slots={data.slots} caseId={caseId} refetch={refetch} />}
      {activeTab === "actions" && <ActionsTab caseId={caseId} currentStatus={data.status} refetch={refetch} />}
      {activeTab === "history" && <HistoryTab history={data.statusHistory} requerimientos={data.requerimientos} />}
    </div>
  );
}

// ============================================================
// DOCUMENTS TAB
// ============================================================

function DocumentsTab({ slots, caseId, refetch }: { slots: any[]; caseId: number; refetch: () => void }) {
  const rejectDoc = trpc.gestor.rejectDocument.useMutation({ onSuccess: () => refetch() });
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  return (
    <div className="space-y-3">
      {slots.map((slot: any) => {
        const latest = slot.latestUpload;
        return (
          <div key={slot.id} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="h-4 w-4 text-slate-400" />
                  <h4 className="font-medium text-slate-900 text-sm">{slot.label}</h4>
                  {slot.isRequired === 1 && (
                    <span className="text-[10px] text-red-500 font-medium uppercase">Required</span>
                  )}
                </div>
                {latest && (
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`flex items-center gap-1 text-xs ${getValidationColor(latest.validationStatus)}`}>
                      {getValidationIcon(latest.validationStatus)}
                      {latest.validationStatus}
                    </span>
                    <a
                      href={`/api/documents/${latest.id}`}
                      target="_blank"
                      rel="noopener"
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Download className="h-3 w-3" />
                      {latest.fileName}
                    </a>
                  </div>
                )}
              </div>

              {latest && latest.validationStatus !== "needs_revision" && (
                <div className="shrink-0">
                  {rejectingId === latest.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Reason..."
                        className="text-xs px-2 py-1 border border-slate-200 rounded w-48"
                      />
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          if (rejectReason.trim()) {
                            rejectDoc.mutate({ uploadId: latest.id, caseId, reason: rejectReason });
                            setRejectingId(null);
                            setRejectReason("");
                          }
                        }}
                        disabled={rejectDoc.isPending}
                      >
                        Reject
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { setRejectingId(null); setRejectReason(""); }}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setRejectingId(latest.id)}>
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Reject
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// ACTIONS TAB
// ============================================================

function ActionsTab({ caseId, currentStatus, refetch }: { caseId: number; currentStatus: string; refetch: () => void }) {
  const logSubmission = trpc.gestor.logSubmission.useMutation({ onSuccess: () => refetch() });
  const createRequerimiento = trpc.gestor.createRequerimiento.useMutation({ onSuccess: () => refetch() });
  const logResolution = trpc.gestor.logResolution.useMutation({ onSuccess: () => refetch() });

  const [submissionRef, setSubmissionRef] = useState("");
  const [submissionVia, setSubmissionVia] = useState<"mercurio" | "consulate" | "other">("mercurio");
  const [reqDescription, setReqDescription] = useState("");
  const [reqDocs, setReqDocs] = useState("");
  const [reqDeadline, setReqDeadline] = useState("");
  const [resolutionType, setResolutionType] = useState<"approved" | "denied" | "silencio_administrativo">("approved");
  const [resolutionReason, setResolutionReason] = useState("");

  return (
    <div className="space-y-6">
      {/* Log Submission */}
      {(currentStatus === "with_gestor" || currentStatus === "ready_for_gestor") && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <Send className="h-4 w-4" />
            Log Submission
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Submitted via</label>
              <select
                value={submissionVia}
                onChange={(e) => setSubmissionVia(e.target.value as any)}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg"
              >
                <option value="mercurio">Mercurio Platform</option>
                <option value="consulate">Consulate</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Reference number</label>
              <input
                type="text"
                value={submissionRef}
                onChange={(e) => setSubmissionRef(e.target.value)}
                placeholder="Optional"
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
          </div>
          <Button
            className="mt-3"
            onClick={() => {
              logSubmission.mutate({ caseId, submittedVia: submissionVia, submissionReference: submissionRef || undefined });
              setSubmissionRef("");
            }}
            disabled={logSubmission.isPending}
          >
            {logSubmission.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Mark as Submitted
          </Button>
        </div>
      )}

      {/* Create Requerimiento */}
      {currentStatus === "submitted" && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Log Requerimiento
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Description (Spanish OK)</label>
              <textarea
                value={reqDescription}
                onChange={(e) => setReqDescription(e.target.value)}
                placeholder="What did the government request?"
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg resize-none h-20"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Documents needed (one per line)</label>
              <textarea
                value={reqDocs}
                onChange={(e) => setReqDocs(e.target.value)}
                placeholder="Updated bank statement&#10;Proof of address in Spain"
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg resize-none h-16"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Deadline</label>
              <input
                type="date"
                value={reqDeadline}
                onChange={(e) => setReqDeadline(e.target.value)}
                className="text-sm px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
            <Button
              onClick={() => {
                const docs = reqDocs.split("\n").filter(d => d.trim());
                if (reqDescription.trim() && docs.length > 0) {
                  createRequerimiento.mutate({
                    caseId,
                    description: reqDescription,
                    documentsNeeded: docs,
                    deadline: reqDeadline || undefined,
                  });
                  setReqDescription("");
                  setReqDocs("");
                  setReqDeadline("");
                }
              }}
              disabled={createRequerimiento.isPending}
            >
              {createRequerimiento.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create Requerimiento
            </Button>
          </div>
        </div>
      )}

      {/* Log Resolution */}
      {currentStatus === "submitted" && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Log Resolution
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Result</label>
              <select
                value={resolutionType}
                onChange={(e) => setResolutionType(e.target.value as any)}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg"
              >
                <option value="approved">Approved</option>
                <option value="denied">Denied</option>
                <option value="silencio_administrativo">Silencio Administrativo (Approved by silence)</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Reason / Notes</label>
              <input
                type="text"
                value={resolutionReason}
                onChange={(e) => setResolutionReason(e.target.value)}
                placeholder="Optional"
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
            <Button
              variant={resolutionType === "denied" ? "destructive" : "default"}
              onClick={() => {
                logResolution.mutate({ caseId, type: resolutionType, reason: resolutionReason || undefined });
                setResolutionReason("");
              }}
              disabled={logResolution.isPending}
            >
              {logResolution.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Log Resolution
            </Button>
          </div>
        </div>
      )}

      {/* No actions available */}
      {currentStatus !== "with_gestor" && currentStatus !== "ready_for_gestor" && currentStatus !== "submitted" && (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <p className="text-slate-500 text-sm">No actions available for current case status: <strong>{currentStatus}</strong></p>
        </div>
      )}
    </div>
  );
}

// ============================================================
// HISTORY TAB
// ============================================================

function HistoryTab({ history, requerimientos }: { history: any[]; requerimientos: any[] }) {
  return (
    <div className="space-y-4">
      {requerimientos.length > 0 && (
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-5">
          <h3 className="font-semibold text-amber-900 mb-3">Requerimientos</h3>
          <div className="space-y-3">
            {requerimientos.map((req: any) => (
              <div key={req.id} className="bg-white rounded-lg p-3 border border-amber-100">
                <p className="text-sm text-slate-800">{req.description}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                  <span className={`px-2 py-0.5 rounded-full ${req.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
                    {req.status}
                  </span>
                  {req.deadline && <span>Deadline: {new Date(req.deadline).toLocaleDateString()}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-900 mb-3">Status History</h3>
        <div className="space-y-3">
          {history.map((entry: any) => (
            <div key={entry.id} className="flex items-start gap-3 text-sm">
              <div className="h-2 w-2 rounded-full bg-slate-300 mt-2 shrink-0" />
              <div>
                <p className="text-slate-700">
                  <span className="font-medium">{entry.fromStatus}</span>
                  {" → "}
                  <span className="font-medium">{entry.toStatus}</span>
                </p>
                {entry.note && <p className="text-xs text-slate-500 mt-0.5">{entry.note}</p>}
                <p className="text-xs text-slate-400 mt-0.5">{new Date(entry.changedAt).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// HELPERS
// ============================================================

function getStatusDotColor(status: string): string {
  const colors: Record<string, string> = {
    ready_for_gestor: "bg-green-500",
    with_gestor: "bg-purple-500",
    submitted: "bg-indigo-500",
    onboarding: "bg-blue-400",
    collecting_documents: "bg-amber-500",
    approved: "bg-green-600",
    rejected: "bg-red-500",
  };
  return colors[status] || "bg-slate-400";
}

function getStatusBadge(status: string): string {
  const badges: Record<string, string> = {
    ready_for_gestor: "bg-green-50 text-green-700 border border-green-200",
    with_gestor: "bg-purple-50 text-purple-700 border border-purple-200",
    submitted: "bg-indigo-50 text-indigo-700 border border-indigo-200",
    onboarding: "bg-blue-50 text-blue-700 border border-blue-200",
    collecting_documents: "bg-amber-50 text-amber-700 border border-amber-200",
    approved: "bg-green-50 text-green-700 border border-green-200",
    rejected: "bg-red-50 text-red-700 border border-red-200",
  };
  return badges[status] || "bg-slate-50 text-slate-700";
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    ready_for_gestor: "Ready for Review",
    with_gestor: "In Progress",
    submitted: "Submitted",
    onboarding: "Onboarding",
    collecting_documents: "Collecting Docs",
    approved: "Approved",
    rejected: "Rejected",
  };
  return labels[status] || status;
}

function getValidationColor(status: string): string {
  const colors: Record<string, string> = {
    pass: "text-green-600",
    needs_revision: "text-amber-600",
    unclear: "text-slate-500",
    pending: "text-blue-500",
    manual_override: "text-purple-600",
  };
  return colors[status] || "text-slate-500";
}

function getValidationIcon(status: string) {
  switch (status) {
    case "pass":
    case "manual_override":
      return <CheckCircle2 className="h-3 w-3" />;
    case "needs_revision":
      return <AlertCircle className="h-3 w-3" />;
    default:
      return <Clock className="h-3 w-3" />;
  }
}
