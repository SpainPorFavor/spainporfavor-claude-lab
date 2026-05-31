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
  Upload,
  FileText,
  Shield,
  ArrowLeft,
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Lock,
  Eye,
  MessageCircle,
  AlertTriangle,
  Info,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import DocumentUploadModal from "@/components/DocumentUploadModal";
import PortalChat from "@/components/PortalChat";
import { getCockpitConfig, type DocumentGroup, type CockpitRouteConfig } from "./portalCockpitConfig";

// ============================================================
// VALIDATION STATUS CONFIG
// ============================================================
const VALIDATION_STATUS_CONFIG: Record<string, { icon: typeof CheckCircle2; color: string; bgColor: string; label: string }> = {
  pass: { icon: CheckCircle2, color: "text-green-600", bgColor: "bg-green-50", label: "Approved" },
  needs_revision: { icon: AlertCircle, color: "text-red-600", bgColor: "bg-red-50", label: "Needs Action" },
  unclear: { icon: Clock, color: "text-amber-600", bgColor: "bg-amber-50", label: "Under Review" },
  pending: { icon: Clock, color: "text-blue-500", bgColor: "bg-blue-50", label: "Under Review" },
  manual_override: { icon: Shield, color: "text-green-600", bgColor: "bg-green-50", label: "Approved" },
};

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function Portal() {
  const { user, loading: authLoading } = useAuth();
  const { data: caseData, isLoading, refetch } = trpc.portal.getMyCase.useQuery(undefined, {
    enabled: !!user,
    refetchInterval: 15000,
  });

  const [uploadSlotId, setUploadSlotId] = useState<number | null>(null);
  const [uploadSlotLabel, setUploadSlotLabel] = useState("");

  // Route config based on visa type
  const config = useMemo(() => getCockpitConfig(caseData?.visaType), [caseData?.visaType]);

  // Privacy acknowledgement state
  const hasAcknowledgedPrivacy = !!caseData?.privacyAcknowledgedAt;

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
          <Shield className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Client Portal</h1>
          <p className="text-gray-600 mb-6">
            Sign in to access your application dashboard, upload documents, and track progress.
          </p>
          <Button
            onClick={() => { window.location.href = getLoginUrl("/portal"); }}
            className="bg-amber-500 hover:bg-amber-600 text-white"
          >
            Sign In to Continue
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading your application...</p>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return <NoCaseView userEmail={user.email || ""} refetch={refetch} />;
  }

  // ── Compute document stats ──
  const totalSlots = caseData.slots.length;
  const requiredSlots = caseData.slots.filter((s: any) => s.isRequired === 1);
  const approvedSlots = caseData.slots.filter((s: any) => {
    const vs = s.latestUpload?.validationStatus;
    return vs === "pass" || vs === "manual_override";
  });
  const underReviewSlots = caseData.slots.filter((s: any) => {
    const vs = s.latestUpload?.validationStatus;
    return vs === "pending" || vs === "unclear";
  });
  const needsActionSlots = caseData.slots.filter((s: any) => {
    return s.latestUpload?.validationStatus === "needs_revision";
  });
  const missingSlots = caseData.slots.filter((s: any) => !s.latestUpload && s.isRequired === 1);

  // ── Dynamic status ──
  const getStatusCopy = () => {
    if (needsActionSlots.length > 0) return config.statusCopy.actionRequired;
    if (approvedSlots.length === totalSlots && totalSlots > 0) return config.statusCopy.completed;
    if (caseData.status === "ready_for_gestor" || caseData.status === "with_gestor") return config.statusCopy.readyForGestor;
    if (missingSlots.length === 0 && totalSlots > 0) return config.statusCopy.underReview;
    return config.statusCopy.collecting;
  };
  const statusCopy = getStatusCopy();

  // ── Next-best-action: priority order ──
  const getNextAction = () => {
    // 1. Rejected documents needing replacement
    const rejectedSlot = caseData.slots.find((s: any) => s.latestUpload?.validationStatus === "needs_revision");
    if (rejectedSlot) {
      return {
        text: `Fix: ${rejectedSlot.label}`,
        description: config.nextBestActionCopy.actionRequired,
        slot: rejectedSlot,
      };
    }
    // 2. Required missing documents
    const nextMissing = caseData.slots.find((s: any) => s.isRequired === 1 && !s.latestUpload);
    if (nextMissing) {
      const uploadCount = caseData.slots.filter((s: any) => s.latestUpload).length;
      return {
        text: `Next: Upload your ${nextMissing.label}`,
        description: uploadCount === 0
          ? config.nextBestActionCopy.noUploads
          : config.nextBestActionCopy.someUploads,
        slot: nextMissing,
      };
    }
    // 3. All uploaded but not all approved
    if (approvedSlots.length < totalSlots) {
      return {
        text: "Documents under review",
        description: config.nextBestActionCopy.allUploaded,
        slot: null,
      };
    }
    // 4. All approved
    return {
      text: "All documents approved",
      description: config.nextBestActionCopy.allApproved,
      slot: null,
    };
  };
  const nextAction = getNextAction();

  // ── Status banner color ──
  const getStatusColor = () => {
    if (needsActionSlots.length > 0) return { text: "text-red-700", bg: "bg-red-50 border-red-200" };
    if (approvedSlots.length === totalSlots && totalSlots > 0) return { text: "text-green-700", bg: "bg-green-50 border-green-200" };
    if (missingSlots.length === 0 && totalSlots > 0) return { text: "text-amber-700", bg: "bg-amber-50 border-amber-200" };
    return { text: "text-blue-700", bg: "bg-blue-50 border-blue-200" };
  };
  const statusColor = getStatusColor();

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-8">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="h-5 w-5" />
            </a>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">My Application</h1>
              <p className="text-xs text-gray-500">
                {config.routeLabel} · Case {config.routePrefix}-{String(caseData.id).padStart(3, "0")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
        {/* SECTION 2: Status Banner */}
        <div className={`rounded-xl border p-5 ${statusColor.bg}`}>
          <div className="flex items-center gap-3">
            {needsActionSlots.length > 0 ? (
              <AlertTriangle className={`h-5 w-5 ${statusColor.text} shrink-0`} />
            ) : approvedSlots.length === totalSlots && totalSlots > 0 ? (
              <CheckCircle2 className={`h-5 w-5 ${statusColor.text} shrink-0`} />
            ) : (
              <Info className={`h-5 w-5 ${statusColor.text} shrink-0`} />
            )}
            <div>
              <h2 className={`text-sm font-semibold uppercase tracking-wider ${statusColor.text}`}>
                {statusCopy.title}
              </h2>
              <p className="text-sm text-gray-700 mt-0.5">{statusCopy.body}</p>
            </div>
          </div>
        </div>

        {/* SECTION 3: Next Best Action */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
              <ChevronRight className="h-4 w-4 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">{nextAction.text}</p>
              <p className="text-sm text-gray-600 mt-0.5">{nextAction.description}</p>
            </div>
            {nextAction.slot && hasAcknowledgedPrivacy && (
              <Button
                size="sm"
                className="bg-amber-500 hover:bg-amber-600 text-white shrink-0"
                onClick={() => {
                  setUploadSlotId(nextAction.slot!.id);
                  setUploadSlotLabel(nextAction.slot!.label);
                }}
              >
                <Upload className="h-3.5 w-3.5 mr-1" />
                {needsActionSlots.length > 0 ? "Replace" : "Upload"}
              </Button>
            )}
          </div>
        </div>

        {/* SECTION 4: Progress Summary */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-gray-700">Document Progress</h2>
            <span className="text-sm font-semibold text-gray-900">
              {caseData.progress.percentage}%
            </span>
          </div>
          <Progress value={caseData.progress.percentage} className="h-2 mb-3" />
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
            <span className="text-green-600 font-medium">{approvedSlots.length} approved</span>
            <span className="text-amber-600 font-medium">{underReviewSlots.length} under review</span>
            <span className="text-gray-500 font-medium">{missingSlots.length} missing</span>
            {needsActionSlots.length > 0 && (
              <span className="text-red-600 font-medium">{needsActionSlots.length} need action</span>
            )}
          </div>
        </div>

        {/* SECTION 5: Privacy Acknowledgement Gate */}
        {!hasAcknowledgedPrivacy && (
          <PrivacyAcknowledgement
            caseId={caseData.id}
            config={config}
            onAcknowledged={() => refetch()}
          />
        )}

        {/* Privacy accepted note (collapsed) */}
        {hasAcknowledgedPrivacy && caseData.privacyAcknowledgedAt && (
          <div className="text-xs text-gray-400 flex items-center gap-1.5 px-1">
            <Lock className="h-3 w-3" />
            <span>
              Privacy notice accepted on {new Date(caseData.privacyAcknowledgedAt).toLocaleDateString()}.
            </span>
          </div>
        )}

        {/* SECTION 6: Document Checklist — grouped by route config */}
        {hasAcknowledgedPrivacy && (
          <DocumentChecklist
            slots={caseData.slots}
            groups={config.documentGroups}
            onUpload={(slotId, label) => {
              setUploadSlotId(slotId);
              setUploadSlotLabel(label);
            }}
          />
        )}

        {/* Help Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
          <MessageCircle className="h-5 w-5 text-amber-500 mx-auto mb-2" />
          <p className="text-sm text-gray-600">{config.helpText}</p>
          <p className="text-xs text-gray-400 mt-1">
            Your documents are uploaded securely and are only available to authorised case staff involved in your application.
          </p>
        </div>
      </div>

      {/* Mobile Sticky CTA */}
      {hasAcknowledgedPrivacy && nextAction.slot && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 md:hidden z-30">
          <Button
            className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3"
            onClick={() => {
              setUploadSlotId(nextAction.slot!.id);
              setUploadSlotLabel(nextAction.slot!.label);
            }}
          >
            <Upload className="h-4 w-4 mr-2" />
            {needsActionSlots.length > 0 ? `Fix: ${nextAction.slot.label}` : `Upload: ${nextAction.slot.label}`}
          </Button>
        </div>
      )}

      {/* Laura Chat Widget */}
      <PortalChat />

      {/* Upload Modal */}
      {uploadSlotId && (
        <DocumentUploadModal
          slotId={uploadSlotId}
          slotLabel={uploadSlotLabel}
          onClose={() => {
            setUploadSlotId(null);
            setUploadSlotLabel("");
          }}
          onSuccess={() => {
            setUploadSlotId(null);
            setUploadSlotLabel("");
            refetch();
          }}
        />
      )}
    </div>
  );
}

// ============================================================
// PRIVACY ACKNOWLEDGEMENT
// ============================================================
function PrivacyAcknowledgement({
  caseId,
  config,
  onAcknowledged,
}: {
  caseId: number;
  config: CockpitRouteConfig;
  onAcknowledged: () => void;
}) {
  const [accepted, setAccepted] = useState(false);
  const [aiOptIn, setAiOptIn] = useState(true);

  const acknowledgeMutation = trpc.portal.acknowledgePrivacy.useMutation({
    onSuccess: () => onAcknowledged(),
  });

  return (
    <div className="bg-white rounded-xl border-2 border-amber-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
          <Lock className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-900">Before you upload documents</h2>
          <p className="text-xs text-gray-500">Required before uploading</p>
        </div>
      </div>

      <p className="text-sm text-gray-700 mb-4">{config.privacyIntro}</p>

      <ul className="space-y-2 mb-4">
        {config.privacyBullets.map((bullet, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
            <Shield className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
            <span>{bullet}</span>
          </li>
        ))}
      </ul>

      <p className="text-xs text-gray-500 mb-5">
        Some documents may include sensitive information. Your documents are stored securely and accessed only by authorised case staff or approved service providers involved in your case.
      </p>

      {/* Required acknowledgement checkbox */}
      <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:border-amber-300 cursor-pointer mb-3">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
        />
        <span className="text-sm text-gray-700">
          I acknowledge that SpainPorFavor will process my uploaded documents to provide my application service, including document review, preparation, and case support.
        </span>
      </label>

      {/* Optional AI validation checkbox */}
      <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 cursor-pointer mb-5">
        <input
          type="checkbox"
          checked={aiOptIn}
          onChange={(e) => setAiOptIn(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <div>
          <span className="text-sm text-gray-700">
            Use AI pre-checks to help detect blurry, incomplete, or incorrectly formatted documents before human review
            <span className="text-xs text-gray-500 ml-1">(recommended, optional)</span>
          </span>
          <p className="text-xs text-gray-500 mt-0.5">
            AI pre-checks help catch simple upload issues faster. Final document review is completed by the SpainPorFavor team.
          </p>
        </div>
      </label>

      <Button
        className="w-full bg-amber-500 hover:bg-amber-600 text-white"
        disabled={!accepted || acknowledgeMutation.isPending}
        onClick={() => acknowledgeMutation.mutate({ caseId, aiValidationOptIn: aiOptIn })}
      >
        {acknowledgeMutation.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Shield className="h-4 w-4 mr-2" />
        )}
        Continue to Document Checklist
      </Button>

      {acknowledgeMutation.error && (
        <p className="text-sm text-red-600 mt-2">{acknowledgeMutation.error.message}</p>
      )}

      <div className="flex items-center justify-center gap-3 mt-4 text-xs text-gray-400">
        <a href="/privacy" className="underline hover:text-gray-600">Privacy Policy</a>
        <span>·</span>
        <a href="mailto:support@spainporfavor.com" className="underline hover:text-gray-600">Contact Support</a>
      </div>
    </div>
  );
}

// ============================================================
// DOCUMENT CHECKLIST (Grouped)
// ============================================================
function DocumentChecklist({
  slots,
  groups,
  onUpload,
}: {
  slots: any[];
  groups: DocumentGroup[];
  onUpload: (slotId: number, label: string) => void;
}) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    // Auto-expand groups that have action-needed or missing documents
    const actionGroups = groups.filter((g) => {
      const groupSlots = getGroupSlots(slots, g);
      return groupSlots.some((s) => 
        s.latestUpload?.validationStatus === "needs_revision" || 
        (s.isRequired === 1 && !s.latestUpload)
      );
    });
    if (actionGroups.length > 0) return new Set(actionGroups.map(g => g.id));
    return new Set([groups[0]?.id].filter(Boolean));
  });

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-900">Your Document Checklist</h2>

      {groups.map((group) => {
        const groupSlots = getGroupSlots(slots, group);
        if (groupSlots.length === 0) return null;

        const isExpanded = expandedGroups.has(group.id);
        const completedInGroup = groupSlots.filter((s) => {
          const vs = s.latestUpload?.validationStatus;
          return vs === "pass" || vs === "manual_override";
        }).length;
        const allComplete = completedInGroup === groupSlots.length;
        const hasAction = groupSlots.some((s) => s.latestUpload?.validationStatus === "needs_revision");

        return (
          <div key={group.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Group Header */}
            <button
              onClick={() => toggleGroup(group.id)}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{group.icon}</span>
                <div className="text-left">
                  <h3 className="text-sm font-medium text-gray-900">{group.title}</h3>
                  <p className="text-xs text-gray-500">{group.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {hasAction && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                    Action needed
                  </span>
                )}
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  allComplete
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-600"
                }`}>
                  {completedInGroup}/{groupSlots.length}
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                />
              </div>
            </button>

            {/* Group Slots */}
            {isExpanded && (
              <div className="border-t border-gray-100 divide-y divide-gray-100">
                {groupSlots.map((slot) => (
                  <DocumentSlotCard
                    key={slot.id}
                    slot={slot}
                    onUpload={() => onUpload(slot.id, slot.label)}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Ungrouped slots (catch-all) */}
      {(() => {
        const allGroupedTypes = groups.flatMap((g) => g.documentTypes);
        const ungrouped = slots.filter(
          (s) => !allGroupedTypes.includes(s.documentType) && (groups[0]?.documentTypes.length > 0)
        );
        if (ungrouped.length === 0) return null;
        return (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4">
              <h3 className="text-sm font-medium text-gray-900">Other Documents</h3>
            </div>
            <div className="border-t border-gray-100 divide-y divide-gray-100">
              {ungrouped.map((slot) => (
                <DocumentSlotCard
                  key={slot.id}
                  slot={slot}
                  onUpload={() => onUpload(slot.id, slot.label)}
                />
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// Helper to get slots for a group
function getGroupSlots(slots: any[], group: DocumentGroup) {
  if (group.documentTypes.length === 0) return slots; // catch-all
  return slots.filter((s) => group.documentTypes.includes(s.documentType));
}

// ============================================================
// DOCUMENT SLOT CARD (Expandable with requirements)
// ============================================================
function DocumentSlotCard({ slot, onUpload }: { slot: any; onUpload: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const latestUpload = slot.latestUpload;
  const validationConfig = latestUpload
    ? VALIDATION_STATUS_CONFIG[latestUpload.validationStatus] || VALIDATION_STATUS_CONFIG.pending
    : null;

  // Determine CTA label
  const getCtaLabel = () => {
    if (!latestUpload) return "Upload";
    if (latestUpload.validationStatus === "needs_revision") return "Replace";
    if (latestUpload.validationStatus === "pass" || latestUpload.validationStatus === "manual_override") return "View";
    return "Re-upload";
  };

  const ctaLabel = getCtaLabel();
  const isApproved = latestUpload?.validationStatus === "pass" || latestUpload?.validationStatus === "manual_override";
  const isMissing = !latestUpload;

  return (
    <div className="px-5 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="h-4 w-4 text-gray-400 shrink-0" />
            <h4 className="text-sm font-medium text-gray-900 truncate">{slot.label}</h4>
            {slot.isRequired === 1 ? (
              <span className="text-[10px] text-red-500 font-medium uppercase">Required</span>
            ) : (
              <span className="text-[10px] text-gray-400 font-medium uppercase">Optional</span>
            )}
          </div>
          <p className="text-xs text-gray-500 mb-2 line-clamp-2">{slot.description}</p>

          {/* Requirement badges / tags */}
          <div className="flex flex-wrap gap-1.5">
            {slot.apostilleRequired === 1 && (
              <span className="text-[10px] px-1.5 py-0.5 bg-orange-50 text-orange-700 rounded border border-orange-200">
                Apostille may be needed
              </span>
            )}
            {slot.translationRequired === 1 && (
              <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200">
                Translation may be needed
              </span>
            )}
            {slot.validityDays && (
              <span className="text-[10px] px-1.5 py-0.5 bg-gray-50 text-gray-600 rounded border border-gray-200">
                Valid within {slot.validityDays} days
              </span>
            )}
          </div>

          {/* AI Feedback for needs_revision */}
          {latestUpload?.aiFeedback && latestUpload.validationStatus === "needs_revision" && (
            <div className="mt-2 text-xs px-3 py-2 rounded text-red-700 bg-red-50 border border-red-200">
              <span className="font-medium">Issue: </span>
              {sanitizeAIFeedback(latestUpload.aiFeedback).feedback}
            </div>
          )}

          {/* Expandable requirements section */}
          {slot.requirementsText && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-2 text-xs text-amber-600 hover:text-amber-700 flex items-center gap-1"
            >
              <Eye className="h-3 w-3" />
              {expanded ? "Hide requirements" : "View requirements"}
            </button>
          )}
          {expanded && slot.requirementsText && (
            <div className="mt-2 text-xs text-gray-600 bg-gray-50 rounded-lg p-3 border border-gray-100">
              {slot.requirementsText}
            </div>
          )}
        </div>

        {/* Status + Action */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          {latestUpload ? (
            <>
              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${validationConfig?.bgColor}`}>
                {validationConfig && <validationConfig.icon className={`h-3.5 w-3.5 ${validationConfig.color}`} />}
                <span className={`text-xs font-medium ${validationConfig?.color}`}>{validationConfig?.label}</span>
              </div>
              {!isApproved && (
                <Button size="sm" variant="outline" className="text-xs h-7" onClick={onUpload}>
                  <Upload className="h-3 w-3 mr-1" />
                  {ctaLabel}
                </Button>
              )}
            </>
          ) : (
            <Button
              size="sm"
              className="bg-amber-500 hover:bg-amber-600 text-white text-xs h-7"
              onClick={onUpload}
            >
              <Upload className="h-3 w-3 mr-1" />
              Upload
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// NO CASE VIEW
// ============================================================
function NoCaseView({ userEmail, refetch }: { userEmail: string; refetch: () => void }) {
  const claimCase = trpc.portal.claimCase.useMutation({
    onSuccess: () => refetch(),
  });
  const [email, setEmail] = useState(userEmail);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md p-8">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">No Application Found</h1>
        <p className="text-gray-600 mb-6">
          We couldn't find an active application linked to your account. If you've already purchased, enter the email you used at checkout to link your application.
        </p>

        <div className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email used at checkout"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
          <Button
            onClick={() => claimCase.mutate({ email })}
            disabled={claimCase.isPending || !email}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white"
          >
            {claimCase.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Link My Application
          </Button>
          {claimCase.error && (
            <p className="text-sm text-red-600">{claimCase.error.message}</p>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Haven't purchased yet?{" "}
            <a href="/" className="text-amber-600 hover:underline">
              Start your application
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
