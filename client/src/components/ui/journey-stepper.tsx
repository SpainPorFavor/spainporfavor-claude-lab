/**
 * JourneyStepper — the 5-step activation tracker.
 *
 * The activation contract (docs/funnel-map.md) is canonical: five steps,
 * always five. Statuses are complete | current | next | goal. Renders
 * horizontal on desktop, vertical on mobile (or forced via orientation).
 *
 * Step shape mirrors activationRouteConfig.ts so pages can pass route configs
 * directly without remapping. See docs/ui-component-rules.md.
 */
import { useEffect } from "react";
import { CheckCircle2, Circle, Upload } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type JourneyStepStatus = "complete" | "current" | "next" | "goal";

export interface JourneyStepCta {
  label: string;
  onClick?: () => void;
  href?: string;
  icon?: LucideIcon;
}

export interface JourneyStep {
  label: string;
  body: string;
  status: JourneyStepStatus;
  cta?: JourneyStepCta;
  note?: string;
}

interface JourneyStepperProps {
  title?: string;
  steps: JourneyStep[];
  orientation?: "auto" | "horizontal" | "vertical";
  className?: string;
}

function StatusLabel({ status }: { status: JourneyStepStatus }) {
  const label =
    status === "complete" ? "Complete" :
    status === "current" ? "Current" :
    status === "goal" ? "Goal" : "Next";
  const colour =
    status === "complete" ? "text-emerald-600 bg-emerald-50" :
    status === "current" ? "text-amber-700 bg-amber-50" :
    "text-gray-500 bg-gray-50";
  return (
    <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium", colour)}>
      {label}
    </span>
  );
}

function StepIcon({ status, index }: { status: JourneyStepStatus; index: number }) {
  if (status === "complete") {
    return (
      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
        <CheckCircle2 className="w-5 h-5 text-emerald-600" aria-hidden="true" />
      </div>
    );
  }
  if (status === "current") {
    return (
      <div className="w-8 h-8 rounded-full bg-amber-100 border-2 border-amber-400 flex items-center justify-center">
        <span className="text-xs font-bold text-amber-700">{index + 1}</span>
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
      <Circle className="w-4 h-4 text-gray-400" aria-hidden="true" />
    </div>
  );
}

function StepCtaButton({ cta }: { cta: JourneyStepCta }) {
  const Icon = cta.icon ?? Upload;
  if (cta.href) {
    return (
      <a
        href={cta.href}
        onClick={cta.onClick}
        className="inline-flex items-center mt-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-md px-3 py-1.5"
      >
        {cta.label}
        <Icon className="ml-1.5 w-3.5 h-3.5" aria-hidden="true" />
      </a>
    );
  }
  return (
    <Button
      size="sm"
      className="mt-2 bg-amber-500 hover:bg-amber-600 text-white text-xs"
      onClick={cta.onClick}
    >
      {cta.label}
      <Icon className="ml-1.5 w-3.5 h-3.5" aria-hidden="true" />
    </Button>
  );
}

function HorizontalStepper({ steps }: { steps: JourneyStep[] }) {
  // Determine how far the emerald connector should extend (fraction of completed steps).
  const completedCount = steps.filter((s) => s.status === "complete").length;
  const connectorPct = steps.length > 1
    ? Math.max(0, Math.min(1, (completedCount - 0.5) / (steps.length - 1)))
    : 0;

  return (
    <div className="flex items-start justify-between relative">
      <div className="absolute top-5 left-[10%] right-[10%] h-0.5 bg-gray-200 z-0" />
      <div
        className="absolute top-5 left-[10%] h-0.5 bg-emerald-400 z-0"
        style={{ width: `${connectorPct * 80}%` }}
      />
      {steps.map((step, i) => (
        <div
          key={i}
          className="flex flex-col items-center text-center w-1/5 relative z-10"
          {...(step.status === "current" ? { "aria-current": "step" } : {})}
        >
          <StepIcon status={step.status} index={i} />
          <p className="text-xs font-semibold text-[#1A2332] mt-2 leading-tight">{step.label}</p>
          <span className={cn(
            "text-[10px] mt-0.5 font-medium",
            step.status === "complete" ? "text-emerald-600" :
            step.status === "current" ? "text-amber-600" :
            "text-gray-400",
          )}>
            {step.status === "complete" ? "Complete" :
             step.status === "current" ? "Current" :
             step.status === "goal" ? "Goal" : "Next"}
          </span>
        </div>
      ))}
    </div>
  );
}

function VerticalStepper({ steps }: { steps: JourneyStep[] }) {
  return (
    <div>
      {steps.map((step, i) => (
        <div
          key={i}
          className="flex gap-4 relative"
          {...(step.status === "current" ? { "aria-current": "step" } : {})}
        >
          {i < steps.length - 1 && (
            <div className={cn(
              "absolute left-[15px] top-10 bottom-0 w-0.5",
              i < steps.findIndex((s) => s.status === "current") ? "bg-emerald-300" :
              i === steps.findIndex((s) => s.status === "current") - 1 ? "bg-gradient-to-b from-emerald-300 to-gray-200" :
              "bg-gray-200",
            )} />
          )}
          <div className="shrink-0 pt-1">
            <StepIcon status={step.status} index={i} />
          </div>
          <div className="pb-6 pt-0.5">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-[#1A2332]">{step.label}</p>
              <StatusLabel status={step.status} />
            </div>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed max-w-sm">{step.body}</p>
            {step.cta && <StepCtaButton cta={step.cta} />}
            {step.note && (
              <p className="text-[11px] text-muted-foreground mt-1.5 italic">{step.note}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export function JourneyStepper({ title, steps, orientation = "auto", className }: JourneyStepperProps) {
  useEffect(() => {
    if (steps.length !== 5 && typeof console !== "undefined") {
      console.warn(
        `[JourneyStepper] expected 5 steps (the canonical activation contract). Got ${steps.length}.`,
      );
    }
  }, [steps.length]);

  return (
    <section className={className}>
      {title && (
        <h2 className="font-display text-lg font-bold text-[#1A2332] text-center mb-6">{title}</h2>
      )}
      {orientation !== "vertical" && (
        <div className={orientation === "horizontal" ? "block" : "hidden md:block"}>
          <HorizontalStepper steps={steps} />
        </div>
      )}
      {orientation !== "horizontal" && (
        <div className={orientation === "vertical" ? "block" : "md:hidden"}>
          <VerticalStepper steps={steps} />
        </div>
      )}
    </section>
  );
}
