/**
 * NextBestAction — the single-action "what to do next" card.
 *
 * Renders a title, description, and an optional primary CTA. Used on /portal
 * to push the user toward the next-priority document, and on
 * /application-success to push toward step-3 upload.
 *
 * See docs/ui-component-rules.md for the full API.
 */
import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SurfaceCard } from "@/components/ui/surface-card";
import { cn } from "@/lib/utils";

interface NextBestActionCta {
  label: string;
  onClick?: () => void;
  href?: string;
}

interface NextBestActionProps {
  title: string;
  description: string;
  cta?: NextBestActionCta;
  icon?: LucideIcon;
  tone?: "default" | "urgent" | "success";
  className?: string;
}

const TONE_RING: Record<NonNullable<NextBestActionProps["tone"]>, string> = {
  default: "",
  urgent: "border-red-200 ring-1 ring-red-100/60",
  success: "border-emerald-200",
};

export function NextBestAction({
  title,
  description,
  cta,
  icon: Icon = ChevronRight,
  tone = "default",
  className,
}: NextBestActionProps) {
  return (
    <SurfaceCard className={cn(TONE_RING[tone], className)} padding="md">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
          <Icon className="h-4 w-4 text-amber-600" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">{title}</p>
          <p className="text-sm text-gray-600 mt-0.5">{description}</p>
        </div>
        {cta && (
          <div className="shrink-0">
            {cta.href ? (
              <a
                href={cta.href}
                onClick={cta.onClick}
                className="inline-flex items-center justify-center rounded-md text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5"
              >
                {cta.label}
              </a>
            ) : (
              <Button
                size="sm"
                onClick={cta.onClick}
                className="bg-amber-500 hover:bg-amber-600 text-white"
              >
                {cta.label}
              </Button>
            )}
          </div>
        )}
      </div>
    </SurfaceCard>
  );
}
