import { formatDate } from "@/lib/utils";
/**
 * Leads Management — Filterable table of all prospects
 * with summary stats, search, and click-to-detail.
 */
import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import {
  Search,
  X,
  Filter,
  Users,
  TrendingUp,
  UserPlus,
  UserCheck,
  Mail,
  Phone,
  Globe,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import LeadDetail from "./LeadDetail";

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  new: { label: "New", bg: "bg-blue-100", text: "text-blue-700" },
  contacted: { label: "Contacted", bg: "bg-amber-100", text: "text-amber-700" },
  engaged: { label: "Engaged", bg: "bg-purple-100", text: "text-purple-700" },
  qualified: { label: "Qualified", bg: "bg-teal-100", text: "text-teal-700" },
  converted: { label: "Converted", bg: "bg-green-100", text: "text-green-700" },
  lost: { label: "Lost", bg: "bg-slate-100", text: "text-slate-500" },
};

const SOURCE_LABELS: Record<string, string> = {
  quiz: "Quiz",
  "free-assessment": "Free Assessment",
  chat: "Chat",
  "exit-intent": "Exit Intent",
};

type Lead = {
  id: number;
  email: string;
  source: string;
  nationality: string | null;
  visaType: string | null;
  name: string | null;
  phone: string | null;
  whatsappOptIn: number;
  situation: string | null;
  status: string;
  notes: string | null;
  linkedCaseId: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export default function Leads() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterSource, setFilterSource] = useState<string>("all");
  const [filterVisa, setFilterVisa] = useState<string>("all");
  const [filterNationality, setFilterNationality] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);

  // Build server-side filter input
  const filterInput = useMemo(() => {
    const input: any = {};
    if (filterStatus !== "all") input.status = filterStatus;
    if (filterSource !== "all") input.source = filterSource;
    if (filterVisa !== "all") input.visaType = filterVisa;
    if (filterNationality !== "all") input.nationality = filterNationality;
    if (searchQuery.trim()) input.search = searchQuery.trim();
    return Object.keys(input).length > 0 ? input : undefined;
  }, [filterStatus, filterSource, filterVisa, filterNationality, searchQuery]);

  const { data: leadsList, isLoading } = trpc.management.leads.list.useQuery(filterInput);
  const { data: stats } = trpc.management.leads.stats.useQuery();

  // Extract unique values for filter dropdowns
  const filterOptions = useMemo(() => {
    if (!leadsList) return { sources: [], visaTypes: [], nationalities: [] };
    const sources = Array.from(new Set(leadsList.map((l: Lead) => l.source))).sort();
    const visaTypes = Array.from(new Set(leadsList.map((l: Lead) => l.visaType).filter(Boolean))).sort();
    const nationalities = Array.from(new Set(leadsList.map((l: Lead) => l.nationality).filter(Boolean))).sort();
    return { sources, visaTypes, nationalities };
  }, [leadsList]);

  const hasActiveFilters = filterStatus !== "all" || filterSource !== "all" || filterVisa !== "all" || filterNationality !== "all";

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-slate-200 rounded w-48" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-200 rounded-lg" />
          ))}
        </div>
        <div className="h-96 bg-slate-200 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Leads</h1>
          <p className="text-sm text-slate-500 mt-1">
            {leadsList?.length || 0} prospect{(leadsList?.length || 0) !== 1 ? "s" : ""}
            {searchQuery || hasActiveFilters ? " matching filters" : ""}
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className={`gap-1 ${showFilters || hasActiveFilters ? "border-blue-300 text-blue-700" : ""}`}
        >
          <Filter className="w-3.5 h-3.5" />
          {hasActiveFilters ? "Filtered" : "Filter"}
        </Button>
      </div>

      {/* Summary Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            icon={<Users className="w-4 h-4 text-blue-600" />}
            label="Total Leads"
            value={stats.total}
            bg="bg-blue-50"
          />
          <StatCard
            icon={<UserPlus className="w-4 h-4 text-green-600" />}
            label="This Week"
            value={stats.thisWeek}
            bg="bg-green-50"
          />
          <StatCard
            icon={<UserCheck className="w-4 h-4 text-teal-600" />}
            label="Converted"
            value={stats.converted}
            bg="bg-teal-50"
          />
          <StatCard
            icon={<TrendingUp className="w-4 h-4 text-amber-600" />}
            label="Conversion Rate"
            value={`${stats.conversionRate}%`}
            bg="bg-amber-50"
          />
        </div>
      )}

      {/* Source breakdown pills */}
      {stats && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-slate-500">By source:</span>
          {Object.entries(stats.bySource).map(([source, count]) => (
            <span
              key={source}
              className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full"
            >
              {SOURCE_LABELS[source] || source}: {count as number}
            </span>
          ))}
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by email or name..."
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
      {showFilters && (
        <div className="flex items-center gap-3 flex-wrap bg-white border border-slate-200 rounded-lg px-4 py-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-500">Status:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs border border-slate-200 rounded px-2 py-1"
            >
              <option value="all">All</option>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-500">Source:</label>
            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              className="text-xs border border-slate-200 rounded px-2 py-1"
            >
              <option value="all">All</option>
              {filterOptions.sources.map((s) => (
                <option key={s} value={s}>{SOURCE_LABELS[s as string] || s}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-500">Visa:</label>
            <select
              value={filterVisa}
              onChange={(e) => setFilterVisa(e.target.value)}
              className="text-xs border border-slate-200 rounded px-2 py-1"
            >
              <option value="all">All</option>
              {filterOptions.visaTypes.map((v) => (
                <option key={v as string} value={v as string}>{v as string}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-500">Nationality:</label>
            <select
              value={filterNationality}
              onChange={(e) => setFilterNationality(e.target.value)}
              className="text-xs border border-slate-200 rounded px-2 py-1"
            >
              <option value="all">All</option>
              {filterOptions.nationalities.map((n) => (
                <option key={n as string} value={n as string}>{(n as string).toUpperCase()}</option>
              ))}
            </select>
          </div>
          {hasActiveFilters && (
            <button
              onClick={() => {
                setFilterStatus("all");
                setFilterSource("all");
                setFilterVisa("all");
                setFilterNationality("all");
              }}
              className="text-xs text-blue-600 hover:text-blue-800 underline"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Leads Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Contact
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Source
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Visa Interest
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Nationality
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {(!leadsList || leadsList.length === 0) ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p>{searchQuery || hasActiveFilters ? "No leads match your filters" : "No leads captured yet"}</p>
                  </td>
                </tr>
              ) : (
                leadsList.map((lead: Lead) => {
                  const statusCfg = STATUS_CONFIG[lead.status] || STATUS_CONFIG.new;
                  return (
                    <tr
                      key={lead.id}
                      onClick={() => setSelectedLeadId(lead.id)}
                      className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-600 shrink-0">
                            {(lead.name || lead.email).charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            {lead.name && (
                              <p className="text-sm font-medium text-slate-800 truncate">{lead.name}</p>
                            )}
                            <div className="flex items-center gap-1.5">
                              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                              <p className="text-xs text-slate-500 truncate">{lead.email}</p>
                            </div>
                            {lead.phone && (
                              <div className="flex items-center gap-1.5">
                                <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                <p className="text-xs text-slate-400">{lead.phone}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                          {SOURCE_LABELS[lead.source] || lead.source}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {lead.visaType ? (
                          <span className="text-xs text-slate-700">{lead.visaType}</span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Not specified</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {lead.nationality ? (
                          <div className="flex items-center gap-1">
                            <Globe className="w-3 h-3 text-slate-400" />
                            <span className="text-xs text-slate-700">{lead.nationality.toUpperCase()}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${statusCfg.bg} ${statusCfg.text}`}>
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-slate-500">{formatDate(lead.createdAt)}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lead Detail Side Panel */}
      <LeadDetail
        leadId={selectedLeadId}
        open={selectedLeadId !== null}
        onClose={() => setSelectedLeadId(null)}
      />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  bg: string;
}) {
  return (
    <div className={`${bg} rounded-lg p-4`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs font-medium text-slate-600">{label}</span>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
