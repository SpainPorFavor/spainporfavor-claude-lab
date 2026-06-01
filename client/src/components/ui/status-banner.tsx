/**
 * StatusBanner — coloured banner with icon + title + body.
 *
 * Used at the top of /portal to communicate case state, and optionally on
 * /application-success for non-default states. See docs/ui-component-rules.md.
 */
import type { LucideIcon } from "lucide-react";
import { CheckCircle2, Clock, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export type StatusBannerStatus =
  | "collecting"
  | "under_review"
  | "action_required"
  | "ready_for_gestor"
  | "completed";

interface StatusBannerProps {
  status: StatusBannerStatus;
  title: string;
  body: string;
  icon?: LucideIcon;
  className?: string;
}

interface StatusVisual {
  bg: string;
  border: string;
  text: string;
  icon: LucideIcon;
  ariaRole: "status" | "alert";
}

const STATUS_VISUALS: Record<StatusBannerStatus, StatusVisual> = {
  collecting: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    icon: Info,
    ariaRole: "status",
  },
  under_review: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    icon: Clock,
    ariaRole: "status",
  },
  action_required: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
    icon: AlertTriangle,
    ariaRole: "alert",
  },
  ready_for_gestor: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    icon: AlertCircle,
    ariaRole: "status",
  },
  completed: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    icon: CheckCircle2,
    ariaRole: "status",
  },
};

export function StatusBanner({ status, title, body, icon, className }: StatusBannerProps) {
  const visual = STATUS_VISUALS[status];
  const Icon = icon ?? visual.icon;

  return (
    <div
      role={visual.ariaRole}
      aria-live="polite"
      className={cn("rounded-xl border p-5", visual.bg, visual.border, className)}
    >
      <div className="flex items-center gap-3">
        <Icon className={cn("h-5 w-5 shrink-0", visual.text)} aria-hidden="true" />
        <div>
          <h2 className={cn("text-sm font-semibold uppercase tracking-wider", visual.text)}>
            {title}
          </h2>
          <p className="text-sm text-gray-700 mt-0.5">{body}</p>
        </div>
      </div>
    </div>
  );
}
