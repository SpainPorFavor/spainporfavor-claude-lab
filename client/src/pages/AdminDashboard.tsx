import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { sanitizeAIFeedback } from "@/lib/sanitize";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Shield,
  Users,
  FileText,
  Loader2,
  Plus,
  Eye,
  ArrowLeft,
  RefreshCw,
  Mail,
  Send,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { isPaidVisaProduct } from "@shared/visaRoutes";

const STATUS_COLORS: Record<string, string> = {
  onboarding: "bg-blue-100 text-blue-700",
  collecting_documents: "bg-amber-100 text-amber-700",
  ready_for_gestor: "bg-green-100 text-green-700",
  with_gestor: "bg-purple-100 text-purple-700",
  submitted: "bg-indigo-100 text-indigo-700",
  approved: "bg-green-200 text-green-800",
  rejected: "bg-red-100 text-red-700",
};

const CASE_STATUSES = [
  "onboarding",
  "collecting_documents",
  "ready_for_gestor",
  "with_gestor",
  "submitted",
  "approved",
  "rejected",
] as const;

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"cases" | "review" | "create" | "escalations" | "emails">("cases");
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-8">
          <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Access Required</h1>
          <p className="text-gray-600 mb-6">Sign in with an admin account to access this page.</p>
          <Button onClick={() => { window.location.href = getLoginUrl(); }}>
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-8">
          <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">You don't have admin permissions.</p>
          <a href="/" className="text-amber-600 hover:underline">Return to homepage</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="h-5 w-5" />
            </a>
            <h1 className="text-lg font-semibold text-gray-900">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">{user.name}</span>
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Admin</span>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit mb-6">
          <button
            onClick={() => { setActiveTab("cases"); setSelectedCaseId(null); }}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === "cases" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Users className="h-4 w-4 inline mr-1.5" />
            All Cases
          </button>
          <button
            onClick={() => setActiveTab("review")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === "review" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <AlertCircle className="h-4 w-4 inline mr-1.5" />
            Review Queue
          </button>
          <button
            onClick={() => setActiveTab("create")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === "create" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Plus className="h-4 w-4 inline mr-1.5" />
            Create Case
          </button>
          <button
            onClick={() => setActiveTab("escalations")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === "escalations" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <AlertCircle className="h-4 w-4 inline mr-1.5" />
            Escalations
          </button>
          <button
            onClick={() => setActiveTab("emails")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === "emails" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <FileText className="h-4 w-4 inline mr-1.5" />
            Email Queue
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-8">
        {activeTab === "cases" && !selectedCaseId && <CaseListView onSelectCase={setSelectedCaseId} />}
        {activeTab === "cases" && selectedCaseId && (
          <CaseDetailView caseId={selectedCaseId} onBack={() => setSelectedCaseId(null)} />
        )}
        {activeTab === "review" && <ReviewQueueView />}
        {activeTab === "create" && <CreateCaseView onCreated={() => setActiveTab("cases")} />}
        {activeTab === "escalations" && <EscalationQueueView />}
        {activeTab === "emails" && <EmailQueueView />}
      </div>
    </div>
  );
}

// ============================================================
// CASE LIST VIEW
// ============================================================

function CaseListView({ onSelectCase }: { onSelectCase: (id: number) => void }) {
  const { data: cases, isLoading, refetch } = trpc.portal.adminGetAllCases.useQuery();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!cases || cases.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600">No cases yet. Create one or wait for a payment to come through.</p>
      </div>
    );
  }

  const filteredCases = statusFilter === "all"
    ? cases
    : cases.filter((c: any) => c.status === statusFilter);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <p className="text-sm text-gray-600">{filteredCases.length} of {cases.length} cases</p>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-gray-300 rounded-md px-2 py-1"
          >
            <option value="all">All Statuses</option>
            <option value="onboarding">Onboarding</option>
            <option value="collecting_documents">Collecting Documents</option>
            <option value="ready_for_gestor">Ready for Gestor</option>
            <option value="with_gestor">With Gestor</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <Button variant="ghost" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>

      {filteredCases.map((c: any) => (
        <div
          key={c.id}
          className="bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 transition-colors cursor-pointer"
          onClick={() => onSelectCase(c.id)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{c.clientName}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[c.status] || ""}`}>
                    {c.status.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">
                  {c.clientEmail} · {c.visaType.replace(/-/g, " ")} · #{c.id}
                </p>
              </div>
            </div>
            <Eye className="h-4 w-4 text-gray-400" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// CASE DETAIL VIEW (Admin)
// ============================================================

function CaseDetailView({ caseId, onBack }: { caseId: number; onBack: () => void }) {
  const { data: caseData, isLoading, refetch } = trpc.portal.adminGetCase.useQuery({ caseId });
  const { data: gestors } = trpc.portal.adminListGestors.useQuery();
  const updateStatus = trpc.portal.adminUpdateCaseStatus.useMutation({
    onSuccess: () => {
      toast.success("Status updated");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });
  const assignGestor = trpc.portal.adminAssignGestor.useMutation({
    onSuccess: () => {
      toast.success("Gestor assigned");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });
  const overrideValidation = trpc.portal.adminOverrideValidation.useMutation({
    onSuccess: () => {
      toast.success("Validation overridden");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const [overrideUploadId, setOverrideUploadId] = useState<number | null>(null);
  const [overrideFeedback, setOverrideFeedback] = useState("");
  const [overrideStatus, setOverrideStatus] = useState<"pass" | "needs_revision">("pass");

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!caseData) {
    return <p className="text-gray-600">Case not found.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h2 className="text-lg font-semibold">Case #{caseData.id} — {caseData.clientName}</h2>
      </div>

      {/* Case info */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Email</span>
            <p className="font-medium">{caseData.clientEmail}</p>
          </div>
          <div>
            <span className="text-gray-500">Visa Type</span>
            <p className="font-medium">{caseData.visaType}</p>
          </div>
          <div>
            <span className="text-gray-500">Nationality</span>
            <p className="font-medium">{caseData.nationality || "—"}</p>
          </div>
          <div>
            <span className="text-gray-500">Dependents</span>
            <p className="font-medium">{caseData.dependents}</p>
          </div>
        </div>

        {/* Status change */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Status:</span>
            <select
              value={caseData.status}
              onChange={(e) => {
                updateStatus.mutate({ caseId: caseData.id, status: e.target.value as any });
              }}
              className="text-sm border border-gray-300 rounded-md px-2 py-1"
            >
              {CASE_STATUSES.map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Gestor:</span>
            <select
              value={caseData.gestorId?.toString() || ""}
              onChange={(e) => {
                const val = e.target.value;
                assignGestor.mutate({ caseId: caseData.id, gestorId: val ? parseInt(val) : null });
              }}
              className="text-sm border border-gray-300 rounded-md px-2 py-1"
            >
              <option value="">Unassigned</option>
              {gestors?.map((g: any) => (
                <option key={g.id} value={g.id.toString()}>{g.name || g.email || `Gestor #${g.id}`}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Document Progress</span>
          <span className="text-sm text-gray-600">
            {caseData.progress.completed}/{caseData.progress.total}
          </span>
        </div>
        <Progress value={caseData.progress.percentage} className="h-2" />
      </div>

      {/* Documents */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">Documents</h3>
        {caseData.slots.map((slot: any) => (
          <div key={slot.id} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm text-gray-900">{slot.label}</p>
                <p className="text-xs text-gray-500">{slot.documentType}</p>
              </div>
              {slot.latestUpload ? (
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    slot.latestUpload.validationStatus === "pass" ? "bg-green-100 text-green-700" :
                    slot.latestUpload.validationStatus === "needs_revision" ? "bg-amber-100 text-amber-700" :
                    slot.latestUpload.validationStatus === "manual_override" ? "bg-purple-100 text-purple-700" :
                    "bg-gray-100 text-gray-600"
                  }`}>
                    {slot.latestUpload.validationStatus}
                  </span>
                  {(slot.latestUpload.validationStatus === "unclear" || slot.latestUpload.validationStatus === "needs_revision") && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setOverrideUploadId(slot.latestUpload.id);
                        setOverrideFeedback("");
                        setOverrideStatus("pass");
                      }}
                    >
                      Override
                    </Button>
                  )}
                </div>
              ) : (
                <span className="text-xs text-gray-400">No upload</span>
              )}
            </div>

            {/* AI Feedback */}
            {slot.latestUpload?.aiFeedback && (
              <div className="mt-2 text-xs text-gray-600 bg-gray-50 rounded p-2">
                <strong>AI:</strong> {sanitizeAIFeedback(slot.latestUpload.aiFeedback).feedback}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Override Modal */}
      {overrideUploadId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Override Validation</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">New Status</label>
                <select
                  value={overrideStatus}
                  onChange={(e) => setOverrideStatus(e.target.value as any)}
                  className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="pass">Pass (Approve)</option>
                  <option value="needs_revision">Needs Revision</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Feedback for Client</label>
                <textarea
                  value={overrideFeedback}
                  onChange={(e) => setOverrideFeedback(e.target.value)}
                  placeholder="Optional message to show the client..."
                  className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm h-20"
                />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setOverrideUploadId(null)} className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    overrideValidation.mutate({
                      uploadId: overrideUploadId,
                      status: overrideStatus,
                      feedback: overrideFeedback || (overrideStatus === "pass" ? "Manually approved by admin." : "Please revise this document."),
                    });
                    setOverrideUploadId(null);
                  }}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Confirm Override
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// REVIEW QUEUE VIEW
// ============================================================

function ReviewQueueView() {
  const { data: uploads, isLoading, refetch } = trpc.portal.adminGetReviewQueue.useQuery();
  const overrideValidation = trpc.portal.adminOverrideValidation.useMutation({
    onSuccess: () => {
      toast.success("Review completed");
      refetch();
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!uploads || uploads.length === 0) {
    return (
      <div className="text-center py-12">
        <CheckCircle2 className="h-12 w-12 text-green-400 mx-auto mb-4" />
        <p className="text-gray-600">No documents pending manual review. All clear!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600 mb-4">{uploads.length} documents need manual review</p>
      {uploads.map((upload: any) => (
        <div key={upload.id} className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm text-gray-900">{upload.fileName}</p>
              <p className="text-xs text-gray-500">
                Upload #{upload.id} · Slot #{upload.slotId} · {new Date(upload.uploadedAt).toLocaleDateString()}
              </p>
              {upload.aiFeedback && (
                <p className="text-xs text-gray-600 mt-1">
                  AI: {sanitizeAIFeedback(upload.aiFeedback).feedback}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => {
                  overrideValidation.mutate({
                    uploadId: upload.id,
                    status: "needs_revision",
                    feedback: "This document needs to be revised. Please re-upload.",
                  });
                }}
              >
                Reject
              </Button>
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => {
                  overrideValidation.mutate({
                    uploadId: upload.id,
                    status: "pass",
                    feedback: "Manually approved by our team.",
                  });
                }}
              >
                Approve
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// CREATE CASE VIEW
// ============================================================

function CreateCaseView({ onCreated }: { onCreated: () => void }) {
  const createCase = trpc.portal.adminCreateCase.useMutation({
    onSuccess: (data) => {
      toast.success(`Case #${data.caseId} created successfully`);
      onCreated();
    },
    onError: (err) => toast.error(err.message),
  });

  const [form, setForm] = useState({
    visaType: "digital-nomad-visa",
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    nationality: "",
    dependents: 0,
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Narrow visaType to PaidVisaProduct before sending. The server's zod
    // schema rejects unknown values, so this is also belt-and-braces on the
    // client side. See shared/visaRoutes.ts.
    if (!isPaidVisaProduct(form.visaType)) {
      toast.error("Please select a valid visa type.");
      return;
    }
    createCase.mutate({
      ...form,
      visaType: form.visaType,
      dependents: Number(form.dependents),
    });
  };

  return (
    <div className="max-w-lg">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Create New Case</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700">Visa Type</label>
          <select
            value={form.visaType}
            onChange={(e) => setForm({ ...form, visaType: e.target.value })}
            className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="digital-nomad-visa">Digital Nomad Visa (DNV)</option>
            <option value="non-lucrative-visa">Non-Lucrative Visa (NLV)</option>
            <option value="student-visa">Student Visa</option>
            <option value="work-visa">Work Visa</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Client Name *</label>
          <input
            type="text"
            value={form.clientName}
            onChange={(e) => setForm({ ...form, clientName: e.target.value })}
            required
            className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Client Email *</label>
          <input
            type="email"
            value={form.clientEmail}
            onChange={(e) => setForm({ ...form, clientEmail: e.target.value })}
            required
            className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Phone</label>
          <input
            type="tel"
            value={form.clientPhone}
            onChange={(e) => setForm({ ...form, clientPhone: e.target.value })}
            className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Nationality</label>
          <input
            type="text"
            value={form.nationality}
            onChange={(e) => setForm({ ...form, nationality: e.target.value })}
            className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Number of Dependents</label>
          <input
            type="number"
            min="0"
            value={form.dependents}
            onChange={(e) => setForm({ ...form, dependents: parseInt(e.target.value) || 0 })}
            className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm h-20"
            placeholder="Internal notes about this case..."
          />
        </div>

        <Button
          type="submit"
          disabled={createCase.isPending || !form.clientName || !form.clientEmail}
          className="w-full bg-amber-500 hover:bg-amber-600 text-white"
        >
          {createCase.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          Create Case
        </Button>
      </form>
    </div>
  );
}

// ============================================================
// ESCALATION QUEUE VIEW
// ============================================================

function EscalationQueueView() {
  const { data: tickets, isLoading, refetch } = trpc.portalChat.getEscalations.useQuery({ status: "open" });
  const resolveEscalation = trpc.portalChat.resolveEscalation.useMutation({
    onSuccess: () => {
      toast.success("Escalation resolved — Laura will relay your response to the client.");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const [respondingId, setRespondingId] = useState<number | null>(null);
  const [responseText, setResponseText] = useState("");

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!tickets || tickets.length === 0) {
    return (
      <div className="text-center py-12">
        <CheckCircle2 className="h-12 w-12 text-green-400 mx-auto mb-4" />
        <p className="text-gray-600">No open escalations. Laura is handling everything.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 mb-4">
        {tickets.length} question{tickets.length !== 1 ? "s" : ""} Laura couldn't answer — your response will be relayed through her.
      </p>

      {tickets.map((ticket: any) => (
        <div key={ticket.id} className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              {/* Client info */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                  Needs Response
                </span>
                {ticket.clientName && (
                  <span className="text-xs text-gray-500">
                    {ticket.clientName} · Case #{ticket.caseId}
                  </span>
                )}
              </div>

              {/* The question */}
              <p className="text-sm text-gray-900 font-medium mb-1">Client asked:</p>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 mb-2">
                "{ticket.question}"
              </p>

              {/* AI context */}
              {ticket.aiContext && (
                <p className="text-xs text-gray-500 italic">
                  Context: {ticket.aiContext}
                </p>
              )}

              <p className="text-xs text-gray-400 mt-2">
                {new Date(ticket.createdAt).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Response form */}
          {respondingId === ticket.id ? (
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Your answer (Laura will rephrase and deliver naturally):
                </label>
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Type your answer here. Laura will relay it in her own voice..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm h-24 resize-none"
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    if (responseText.trim()) {
                      resolveEscalation.mutate({ ticketId: ticket.id, response: responseText });
                      setRespondingId(null);
                      setResponseText("");
                    }
                  }}
                  disabled={resolveEscalation.isPending || !responseText.trim()}
                  className="bg-amber-500 hover:bg-amber-600 text-white"
                >
                  {resolveEscalation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Send via Laura
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => { setRespondingId(null); setResponseText(""); }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setRespondingId(ticket.id)}
              >
                Respond
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================================
// EMAIL QUEUE VIEW
// ============================================================

function EmailQueueView() {
  const { data: emails, isLoading, refetch } = trpc.portal.adminGetEmailQueue.useQuery();
  const markSent = trpc.portal.adminMarkEmailsSent.useMutation({
    onSuccess: () => {
      toast.success("Emails marked as sent.");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!emails || emails.length === 0) {
    return (
      <div className="text-center py-12">
        <Mail className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600">No queued emails. All caught up!</p>
      </div>
    );
  }

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === emails.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(emails.map((e: any) => e.id));
    }
  };

  const TYPE_COLORS: Record<string, string> = {
    welcome: "bg-green-100 text-green-700",
    document_validated: "bg-blue-100 text-blue-700",
    document_needs_revision: "bg-amber-100 text-amber-700",
    status_update: "bg-indigo-100 text-indigo-700",
    requerimiento: "bg-red-100 text-red-700",
    resolution: "bg-purple-100 text-purple-700",
    expiry_warning: "bg-orange-100 text-orange-700",
    inactivity_nudge: "bg-yellow-100 text-yellow-700",
    milestone: "bg-teal-100 text-teal-700",
  };

  return (
    <div className="space-y-4">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {emails.length} email{emails.length !== 1 ? "s" : ""} queued for review
        </p>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={selectAll}
          >
            {selectedIds.length === emails.length ? "Deselect All" : "Select All"}
          </Button>
          <Button
            size="sm"
            onClick={() => {
              if (selectedIds.length === 0) {
                toast.error("Select at least one email to mark as sent.");
                return;
              }
              markSent.mutate({ emailIds: selectedIds });
              setSelectedIds([]);
            }}
            disabled={markSent.isPending || selectedIds.length === 0}
            className="bg-amber-500 hover:bg-amber-600 text-white"
          >
            {markSent.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Mark Sent ({selectedIds.length})
          </Button>
          <Button size="sm" variant="ghost" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Email list */}
      {emails.map((email: any) => (
        <div
          key={email.id}
          className={`bg-white rounded-xl border p-4 transition-colors ${
            selectedIds.includes(email.id) ? "border-amber-400 bg-amber-50/30" : "border-gray-200"
          }`}
        >
          <div className="flex items-start gap-3">
            {/* Checkbox */}
            <input
              type="checkbox"
              checked={selectedIds.includes(email.id)}
              onChange={() => toggleSelect(email.id)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
            />

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[email.emailType] || "bg-gray-100 text-gray-700"}`}>
                  {email.emailType.replace(/_/g, " ")}
                </span>
                {email.caseId && (
                  <span className="text-xs text-gray-500">Case #{email.caseId}</span>
                )}
                <span className="text-xs text-gray-400">
                  {new Date(email.createdAt).toLocaleString()}
                </span>
              </div>

              <p className="text-sm font-medium text-gray-900 truncate">
                {email.subject}
              </p>
              <p className="text-xs text-gray-500 truncate">
                To: {email.recipientName ? `${email.recipientName} <${email.recipientEmail}>` : email.recipientEmail}
              </p>

              {/* Expandable body */}
              <button
                onClick={() => setExpandedId(expandedId === email.id ? null : email.id)}
                className="mt-2 text-xs text-amber-600 hover:text-amber-700 flex items-center gap-1"
              >
                {expandedId === email.id ? (
                  <>
                    <ChevronUp className="h-3 w-3" /> Hide body
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3" /> Preview body
                  </>
                )}
              </button>

              {expandedId === email.id && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                    {email.body}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
