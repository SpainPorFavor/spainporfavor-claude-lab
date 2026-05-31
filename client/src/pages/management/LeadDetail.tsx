import { formatDate } from "@/lib/utils";
/**
 * Lead Detail Side Panel — shows full lead profile,
 * status management, notes, chat transcript with Laura,
 * and linked case information.
 */
import { trpc } from "@/lib/trpc";
import { useState, useEffect, useRef } from "react";
import {
  X,
  Mail,
  Phone,
  Globe,
  MessageSquare,
  FileText,
  Save,
  ExternalLink,
  User,
  Clock,
  Briefcase,
  StickyNote,
  MessageCircle,
  Link2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  new: { label: "New", bg: "bg-blue-100", text: "text-blue-700" },
  contacted: { label: "Contacted", bg: "bg-amber-100", text: "text-amber-700" },
  engaged: { label: "Engaged", bg: "bg-purple-100", text: "text-purple-700" },
  qualified: { label: "Qualified", bg: "bg-teal-100", text: "text-teal-700" },
  converted: { label: "Converted", bg: "bg-green-100", text: "text-green-700" },
  lost: { label: "Lost", bg: "bg-slate-100", text: "text-slate-500" },
};

const NATIONALITY_LABELS: Record<string, string> = {
  us: "United States",
  uk: "United Kingdom",
  ca: "Canada",
  au: "Australia",
  eu: "EU Citizen",
  other: "Other",
};

const SOURCE_LABELS: Record<string, string> = {
  quiz: "Homepage Quiz",
  "free-assessment": "Free Assessment Form",
  chat: "AI Chat",
  "exit-intent": "Exit Intent Popup",
};

interface LeadDetailProps {
  leadId: number | null;
  open: boolean;
  onClose: () => void;
}

export default function LeadDetail({ leadId, open, onClose }: LeadDetailProps) {
  const utils = trpc.useUtils();
  const [notes, setNotes] = useState("");
  const [notesDirty, setNotesDirty] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "chat" | "notes">("profile");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = trpc.management.leads.getDetail.useQuery(
    { id: leadId! },
    { enabled: !!leadId }
  );

  const updateStatusMutation = trpc.management.leads.updateStatus.useMutation({
    onSuccess: () => {
      utils.management.leads.getDetail.invalidate({ id: leadId! });
      utils.management.leads.list.invalidate();
      utils.management.leads.stats.invalidate();
      toast.success("Status updated");
    },
  });

  const updateNotesMutation = trpc.management.leads.updateNotes.useMutation({
    onSuccess: () => {
      utils.management.leads.getDetail.invalidate({ id: leadId! });
      setNotesDirty(false);
      toast.success("Notes saved");
    },
  });

  const convertToCaseMutation = trpc.management.leads.convertToCase.useMutation({
    onSuccess: (data) => {
      utils.management.leads.getDetail.invalidate({ id: leadId! });
      utils.management.leads.list.invalidate();
      utils.management.leads.stats.invalidate();
      toast.success(`Case #${data.caseId} created successfully`);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to convert lead to case");
    },
  });

  // Sync notes from server
  useEffect(() => {
    if (data?.lead?.notes !== undefined) {
      setNotes(data.lead.notes || "");
      setNotesDirty(false);
    }
  }, [data?.lead?.notes]);

  // Reset tab when opening new lead
  useEffect(() => {
    if (leadId) setActiveTab("profile");
  }, [leadId]);

  // Scroll chat to bottom
  useEffect(() => {
    if (activeTab === "chat" && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeTab, data?.chatMessages]);

  if (!open) return null;

  const lead = data?.lead;
  const chatMessages = data?.chatMessages || [];
  const linkedCase = data?.linkedCase;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white z-50 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            {lead && (
              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-sm font-semibold text-slate-600">
                {(lead.name || lead.email).charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                {isLoading ? "Loading..." : lead?.name || lead?.email || "Lead"}
              </h2>
              {lead?.name && (
                <p className="text-xs text-slate-500">{lead.email}</p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 shrink-0">
          {[
            { key: "profile" as const, label: "Profile", icon: User },
            { key: "chat" as const, label: `Chat (${chatMessages.length})`, icon: MessageCircle },
            { key: "notes" as const, label: "Notes", icon: StickyNote },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${
                activeTab === key
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-5 space-y-4 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-2/3" />
              <div className="h-4 bg-slate-200 rounded w-1/2" />
              <div className="h-20 bg-slate-200 rounded" />
            </div>
          ) : lead ? (
            <>
              {/* Profile Tab */}
              {activeTab === "profile" && (
                <div className="p-5 space-y-5">
                  {/* Status */}
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">
                      Status
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                        <button
                          key={key}
                          onClick={() =>
                            updateStatusMutation.mutate({ id: lead.id, status: key as any })
                          }
                          disabled={updateStatusMutation.isPending}
                          className={`text-xs font-medium px-3 py-1.5 rounded-full transition-all ${
                            lead.status === key
                              ? `${cfg.bg} ${cfg.text} ring-2 ring-offset-1 ring-current`
                              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                          }`}
                        >
                          {cfg.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">
                      Contact Information
                    </label>
                    <div className="space-y-2">
                      <InfoRow icon={<Mail className="w-3.5 h-3.5" />} label="Email" value={lead.email} />
                      {lead.phone && (
                        <InfoRow icon={<Phone className="w-3.5 h-3.5" />} label="Phone" value={lead.phone} />
                      )}
                      {lead.nationality && (
                        <InfoRow
                          icon={<Globe className="w-3.5 h-3.5" />}
                          label="Nationality"
                          value={NATIONALITY_LABELS[lead.nationality] || lead.nationality.toUpperCase()}
                        />
                      )}
                      {lead.whatsappOptIn === 1 && (
                        <InfoRow
                          icon={<MessageSquare className="w-3.5 h-3.5" />}
                          label="WhatsApp"
                          value="Opted in"
                        />
                      )}
                    </div>
                  </div>

                  {/* Visa Interest */}
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">
                      Visa Interest
                    </label>
                    {lead.visaType ? (
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-sm text-slate-700">{lead.visaType}</span>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400 italic">Not specified</p>
                    )}
                  </div>

                  {/* Source & Timing */}
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">
                      Source & Timing
                    </label>
                    <div className="space-y-2">
                      <InfoRow
                        icon={<FileText className="w-3.5 h-3.5" />}
                        label="Source"
                        value={SOURCE_LABELS[lead.source] || lead.source}
                      />
                      <InfoRow
                        icon={<Clock className="w-3.5 h-3.5" />}
                        label="Captured"
                        value={formatDate(lead.createdAt)}
                      />
                    </div>
                  </div>

                  {/* Situation (from free assessment) */}
                  {lead.situation && (
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">
                        Situation (from assessment)
                      </label>
                      <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3 leading-relaxed">
                        {lead.situation}
                      </p>
                    </div>
                  )}

                  {/* Linked Case */}
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">
                      Linked Case
                    </label>
                    {linkedCase ? (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <Link2 className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">
                            Case #{linkedCase.id} — {linkedCase.visaType}
                          </span>
                        </div>
                        <p className="text-xs text-green-600 mt-1">
                          Status: {linkedCase.status} · Created {formatDate(linkedCase.createdAt)}
                        </p>
                      </div>
                    ) : (
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                        <p className="text-sm text-slate-400 italic mb-3">No case linked — prospect hasn't converted yet</p>
                        <Button
                          size="sm"
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => convertToCaseMutation.mutate({ id: leadId! })}
                          disabled={convertToCaseMutation.isPending}
                        >
                          {convertToCaseMutation.isPending ? "Creating case..." : "Convert to Case"}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Chat Tab */}
              {activeTab === "chat" && (
                <div className="p-5">
                  {chatMessages.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="text-sm text-slate-400">No chat history with Laura</p>
                      <p className="text-xs text-slate-400 mt-1">
                        This lead entered via {SOURCE_LABELS[lead.source] || lead.source}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs text-slate-500 mb-3">
                        {chatMessages.length} message{chatMessages.length !== 1 ? "s" : ""} in conversation
                      </p>
                      {chatMessages.map((msg: any) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${
                              msg.role === "user"
                                ? "bg-blue-600 text-white rounded-br-md"
                                : "bg-slate-100 text-slate-800 rounded-bl-md"
                            }`}
                          >
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                            <p
                              className={`text-[10px] mt-1 ${
                                msg.role === "user" ? "text-blue-200" : "text-slate-400"
                              }`}
                            >
                              {msg.role === "assistant" ? "Laura" : "Prospect"} ·{" "}
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>
                  )}
                </div>
              )}

              {/* Notes Tab */}
              {activeTab === "notes" && (
                <div className="p-5 space-y-3">
                  <p className="text-xs text-slate-500">
                    Add internal notes about this lead — follow-up reminders, call outcomes, etc.
                  </p>
                  <textarea
                    value={notes}
                    onChange={(e) => {
                      setNotes(e.target.value);
                      setNotesDirty(true);
                    }}
                    placeholder="e.g., Spoke to John on 15 May — waiting on criminal record cert, follow up in 2 weeks..."
                    className="w-full h-48 text-sm border border-slate-200 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <Button
                    size="sm"
                    onClick={() =>
                      updateNotesMutation.mutate({ id: lead.id, notes })
                    }
                    disabled={!notesDirty || updateNotesMutation.isPending}
                    className="gap-1"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {updateNotesMutation.isPending ? "Saving..." : "Save Notes"}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="p-5 text-center text-slate-400">Lead not found</div>
          )}
        </div>
      </div>
    </>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-slate-400">{icon}</span>
      <span className="text-xs text-slate-500 w-20 shrink-0">{label}</span>
      <span className="text-sm text-slate-700">{value}</span>
    </div>
  );
}
