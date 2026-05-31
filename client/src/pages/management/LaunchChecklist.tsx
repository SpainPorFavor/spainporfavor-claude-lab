import { formatDate } from "@/lib/utils";
/**
 * Launch Checklist — Screen 8
 * Integration readiness tracker: Stripe, Gestor API, WhatsApp, GDPR, etc.
 */
import { trpc } from "@/lib/trpc";
import {
  Rocket,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Circle,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

const STATUS_CONFIG: Record<
  string,
  { icon: React.ReactNode; bg: string; text: string; label: string }
> = {
  ready: {
    icon: <CheckCircle2 className="w-4 h-4 text-green-600" />,
    bg: "bg-green-50",
    text: "text-green-700",
    label: "Ready",
  },
  not_configured: {
    icon: <Circle className="w-4 h-4 text-slate-400" />,
    bg: "bg-slate-50",
    text: "text-slate-600",
    label: "Not Configured",
  },
  warning: {
    icon: <AlertTriangle className="w-4 h-4 text-amber-600" />,
    bg: "bg-amber-50",
    text: "text-amber-700",
    label: "Warning",
  },
  blocked: {
    icon: <XCircle className="w-4 h-4 text-red-600" />,
    bg: "bg-red-50",
    text: "text-red-700",
    label: "Blocked",
  },
};

export default function LaunchChecklist() {
  const utils = trpc.useUtils();
  const { data: integrations, isLoading } =
    trpc.management.integrations.list.useQuery();
  const upsert = trpc.management.integrations.upsert.useMutation({
    onSuccess: () => {
      utils.management.integrations.list.invalidate();
      toast.success("Integration updated");
    },
  });

  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-slate-200 rounded w-64" />
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-16 bg-slate-200 rounded-lg" />
        ))}
      </div>
    );
  }

  const required = integrations?.filter((i) => i.requiredForLaunch === 1) || [];
  const optional = integrations?.filter((i) => i.requiredForLaunch !== 1) || [];
  const readyCount = integrations?.filter((i) => i.status === "ready").length || 0;
  const totalRequired = required.length;
  const requiredReady = required.filter((i) => i.status === "ready").length;

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Rocket className="w-6 h-6 text-indigo-600" />
            Launch Checklist
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Integration readiness for go-live
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowAdd(true)}
          className="gap-1"
        >
          <Plus className="w-4 h-4" /> Add Integration
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">
            Required Integrations
          </span>
          <span className="text-sm font-bold text-slate-900">
            {requiredReady}/{totalRequired} ready
          </span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${
              requiredReady === totalRequired
                ? "bg-green-500"
                : "bg-blue-500"
            }`}
            style={{
              width: totalRequired > 0
                ? `${(requiredReady / totalRequired) * 100}%`
                : "0%",
            }}
          />
        </div>
        {requiredReady === totalRequired && totalRequired > 0 && (
          <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            All required integrations are ready for launch
          </p>
        )}
      </div>

      {/* Add Integration */}
      {showAdd && (
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Integration name (e.g., Stripe Payments)"
              className="flex-1 text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button
              size="sm"
              onClick={() => {
                if (newName.trim()) {
                  upsert.mutate({
                    integrationName: newName.trim(),
                    status: "not_configured",
                    requiredForLaunch: true,
                  });
                  setNewName("");
                  setShowAdd(false);
                }
              }}
              disabled={!newName.trim()}
            >
              Add
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAdd(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Required Integrations */}
      {required.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            Required for Launch ({required.length})
          </h2>
          {required.map((item) => (
            <IntegrationRow
              key={item.id}
              item={item}
              onStatusChange={(status) =>
                upsert.mutate({
                  integrationName: item.integrationName,
                  status: status as any,
                  requiredForLaunch: true,
                })
              }
            />
          ))}
        </div>
      )}

      {/* Optional Integrations */}
      {optional.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            Optional ({optional.length})
          </h2>
          {optional.map((item) => (
            <IntegrationRow
              key={item.id}
              item={item}
              onStatusChange={(status) =>
                upsert.mutate({
                  integrationName: item.integrationName,
                  status: status as any,
                  requiredForLaunch: false,
                })
              }
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {integrations?.length === 0 && (
        <div className="text-center py-12">
          <Rocket className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-slate-700">
            No integrations tracked yet
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Add integrations to track their readiness for launch.
          </p>
        </div>
      )}
    </div>
  );
}

function IntegrationRow({
  item,
  onStatusChange,
}: {
  item: any;
  onStatusChange: (status: string) => void;
}) {
  const config = STATUS_CONFIG[item.status] || STATUS_CONFIG.not_configured;

  return (
    <div className={`border border-slate-200 rounded-lg p-4 ${config.bg}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          {config.icon}
          <div>
            <p className="text-sm font-medium text-slate-800">
              {item.integrationName}
            </p>
            {item.notes && (
              <p className="text-xs text-slate-500 mt-0.5">{item.notes}</p>
            )}
            {item.lastCheckedAt && (
              <p className="text-xs text-slate-400 mt-0.5">
                Last checked: {formatDate(item.lastCheckedAt)}
              </p>
            )}
          </div>
        </div>
        <select
          value={item.status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="text-xs border border-slate-200 rounded px-2 py-1 bg-white"
        >
          <option value="not_configured">Not Configured</option>
          <option value="warning">Warning</option>
          <option value="blocked">Blocked</option>
          <option value="ready">Ready</option>
        </select>
      </div>
    </div>
  );
}
