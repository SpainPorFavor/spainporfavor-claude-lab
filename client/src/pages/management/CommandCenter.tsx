/**
 * Executive Command Center — Screen 1
 * Go/No-Go readiness, red issues, revenue, priorities at a glance.
 */
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  Rocket,
  Users,
  TrendingUp,
  Database,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

export default function CommandCenter() {
  const { data: summary, isLoading } = trpc.management.executive.summary.useQuery();
  const { data: backupStatus } = trpc.management.backup.status.useQuery();
  const utils = trpc.useUtils();
  const triggerBackup = trpc.management.backup.trigger.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success(`Backup complete — stored as ${result.key}`);
      } else {
        toast.error(`Backup failed: ${result.error || "Unknown error"}`);
      }
      utils.management.backup.status.invalidate();
    },
    onError: (err) => {
      toast.error(`Backup failed: ${err.message}`);
    },
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-slate-200 rounded w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!summary) return null;

  const canGoLive = summary.canGoLive;

  return (
    <div className="space-y-8">
      {/* Header with Go/No-Go */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Command Center</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time operational overview
          </p>
        </div>
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
            canGoLive
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {canGoLive ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <XCircle className="w-4 h-4" />
          )}
          {canGoLive ? "GO LIVE READY" : "NOT READY"}
        </div>
      </div>

      {/* Critical Alerts */}
      {(summary.redBlackRisks > 0 || summary.overdueTasks > 0 || summary.blockedIntegrations > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-red-800 flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4" />
            Requires Immediate Attention
          </h3>
          <ul className="space-y-1 text-sm text-red-700">
            {summary.redBlackRisks > 0 && (
              <li>
                {summary.redBlackRisks} red/black risk{summary.redBlackRisks > 1 ? "s" : ""} unresolved
              </li>
            )}
            {summary.overdueTasks > 0 && (
              <li>
                {summary.overdueTasks} task{summary.overdueTasks > 1 ? "s" : ""} overdue
              </li>
            )}
            {summary.blockedIntegrations > 0 && (
              <li>
                {summary.blockedIntegrations} integration{summary.blockedIntegrations > 1 ? "s" : ""} blocked
              </li>
            )}
          </ul>
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Clock className="w-5 h-5 text-blue-600" />}
          label="Open Tasks"
          value={summary.totalOpenTasks}
          subtext={`${summary.criticalTasks} critical`}
          accent={summary.criticalTasks > 0 ? "red" : "blue"}
        />
        <StatCard
          icon={<Shield className="w-5 h-5 text-amber-600" />}
          label="Unresolved Risks"
          value={summary.unresolvedRisks}
          subtext={`${summary.redBlackRisks} red/black`}
          accent={summary.redBlackRisks > 0 ? "red" : "amber"}
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5 text-green-600" />}
          label="Active Cases"
          value={summary.activeCases}
          subtext="In pipeline"
          accent="green"
        />
        <StatCard
          icon={<Users className="w-5 h-5 text-purple-600" />}
          label="Vendor Tasks"
          value={summary.pendingVendorAssignments}
          subtext={`${summary.overdueVendorAssignments} overdue`}
          accent={summary.overdueVendorAssignments > 0 ? "red" : "purple"}
        />
        <StatCard
          icon={<Rocket className="w-5 h-5 text-indigo-600" />}
          label="Integrations"
          value={`${summary.readyIntegrations}/${summary.totalIntegrations}`}
          subtext={`${summary.requiredIntegrationsNotReady} required not ready`}
          accent={summary.requiredIntegrationsNotReady > 0 ? "amber" : "green"}
        />
        <StatCard
          icon={<AlertTriangle className="w-5 h-5 text-orange-600" />}
          label="Blocked Tasks"
          value={summary.blockedTasks}
          subtext="Need unblocking"
          accent={summary.blockedTasks > 0 ? "red" : "green"}
        />
        <StatCard
          icon={<CheckCircle2 className="w-5 h-5 text-teal-600" />}
          label="Approvals Waiting"
          value={summary.approvalQueueCount}
          subtext="John's queue"
          accent={summary.approvalQueueCount > 0 ? "amber" : "green"}
        />
        <StatCard
          icon={<Clock className="w-5 h-5 text-rose-600" />}
          label="Overdue Tasks"
          value={summary.overdueTasks}
          subtext="Past due date"
          accent={summary.overdueTasks > 0 ? "red" : "green"}
        />
      </div>

      {/* Quick Status Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">
            Launch Readiness
          </h3>
          <div className="space-y-2">
            <ReadinessRow
              label={summary.redBlackRisks === 0 ? "Critical risks resolved" : `${summary.redBlackRisks} critical risk${summary.redBlackRisks > 1 ? "s" : ""} unresolved`}
              ok={summary.redBlackRisks === 0}
            />
            <ReadinessRow
              label={summary.requiredIntegrationsNotReady === 0 ? "Required integrations ready" : `${summary.requiredIntegrationsNotReady} required integration${summary.requiredIntegrationsNotReady > 1 ? "s" : ""} not ready`}
              ok={summary.requiredIntegrationsNotReady === 0}
            />
            <ReadinessRow
              label={summary.blockedIntegrations === 0 ? "No blocked integrations" : `${summary.blockedIntegrations} integration${summary.blockedIntegrations > 1 ? "s" : ""} blocked`}
              ok={summary.blockedIntegrations === 0}
            />
            <ReadinessRow
              label={summary.overdueTasks === 0 ? "No overdue tasks" : `${summary.overdueTasks} task${summary.overdueTasks > 1 ? "s" : ""} overdue`}
              ok={summary.overdueTasks === 0}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">
            Team Workload
          </h3>
          <div className="space-y-3 text-sm text-slate-600">
            <div className="flex justify-between">
              <span>Total open tasks</span>
              <span className="font-medium text-slate-900">{summary.totalOpenTasks}</span>
            </div>
            <div className="flex justify-between">
              <span>Critical priority</span>
              <span className="font-medium text-red-600">{summary.criticalTasks}</span>
            </div>
            <div className="flex justify-between">
              <span>Pending vendor work</span>
              <span className="font-medium text-slate-900">{summary.pendingVendorAssignments}</span>
            </div>
            <div className="flex justify-between">
              <span>Approval queue</span>
              <span className="font-medium text-slate-900">{summary.approvalQueueCount}</span>
            </div>
          </div>
        </div>

        {/* Backup Status Card */}
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Database className="w-4 h-4 text-slate-500" />
              Backup Status
            </h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => triggerBackup.mutate()}
              disabled={triggerBackup.isPending}
            >
              <RefreshCw className={`w-3 h-3 mr-1 ${triggerBackup.isPending ? "animate-spin" : ""}`} />
              {triggerBackup.isPending ? "Running..." : "Run Now"}
            </Button>
          </div>
          {backupStatus?.lastBackupAt ? (
            <div className="space-y-3 text-sm text-slate-600">
              <div className="flex justify-between">
                <span>Last backup</span>
                <span className="font-medium text-slate-900">
                  {new Date(backupStatus.lastBackupAt).toLocaleString("en-GB", {
                    day: "2-digit", month: "2-digit", year: "numeric",
                    hour: "2-digit", minute: "2-digit"
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Status</span>
                <span className={`font-medium ${backupStatus.lastBackupSuccess ? "text-green-600" : "text-red-600"}`}>
                  {backupStatus.lastBackupSuccess ? "Healthy" : "Failed"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Tables / Rows</span>
                <span className="font-medium text-slate-900">
                  {backupStatus.tableCount} tables, {backupStatus.totalRows?.toLocaleString()} rows
                </span>
              </div>
              <div className="flex justify-between">
                <span>Next backup</span>
                <span className="font-medium text-slate-900">
                  {backupStatus.nextBackupAt
                    ? new Date(backupStatus.nextBackupAt).toLocaleString("en-GB", {
                        day: "2-digit", month: "2-digit", year: "numeric",
                        hour: "2-digit", minute: "2-digit"
                      })
                    : "Scheduled"}
                </span>
              </div>
              {backupStatus.lastBackupError && (
                <div className="bg-red-50 text-red-700 text-xs rounded p-2 mt-2">
                  Error: {backupStatus.lastBackupError}
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-slate-500">
              <p>No backups yet. First backup runs 10 minutes after server start.</p>
              <p className="mt-2 text-xs text-slate-400">Daily automatic backups to S3 (7-day rolling retention)</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  subtext,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  subtext: string;
  accent: "blue" | "green" | "amber" | "red" | "purple" | "indigo" | "teal" | "orange" | "rose";
}) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <div className="flex items-center gap-3 mb-2">
        {icon}
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
          {label}
        </span>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className={`text-xs mt-1 ${accent === "red" ? "text-red-600" : "text-slate-500"}`}>
        {subtext}
      </p>
    </div>
  );
}

function ReadinessRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {ok ? (
        <CheckCircle2 className="w-4 h-4 text-green-500" />
      ) : (
        <XCircle className="w-4 h-4 text-red-500" />
      )}
      <span className={ok ? "text-slate-600" : "text-red-700 font-medium"}>
        {label}
      </span>
    </div>
  );
}
