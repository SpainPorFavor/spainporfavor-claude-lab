/**
 * EmptyState — icon + headline + body + CTA, for full-page or inline empties.
 *
 * Use when the user lands on a surface that has nothing to show yet (no
 * application linked, no documents uploaded, etc.). See
 * docs/ui-component-rules.md.
 */
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateCta {
  label: string;
  onClick?: () => void;
  href?: string;
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  body: string;
  cta?: EmptyStateCta;
  secondaryCta?: EmptyStateCta;
  className?: string;
}

function CtaButton({ cta, primary }: { cta: EmptyStateCta; primary: boolean }) {
  const baseClass = primary
    ? "bg-amber-500 hover:bg-amber-600 text-white"
    : "";
  if (cta.href) {
    return (
      <a
        href={cta.href}
        onClick={cta.onClick}
        className={cn(
          "inline-flex items-center justify-center rounded-md text-sm font-semibold px-4 py-2",
          primary ? baseClass : "text-amber-600 hover:text-amber-700 underline underline-offset-2",
        )}
      >
        {cta.label}
      </a>
    );
  }
  return (
    <Button onClick={cta.onClick} variant={primary ? "default" : "outline"} className={baseClass}>
      {cta.label}
    </Button>
  );
}

export function EmptyState({ icon: Icon, title, body, cta, secondaryCta, className }: EmptyStateProps) {
  return (
    <div className={cn("text-center max-w-md mx-auto p-8", className)}>
      <Icon className="h-12 w-12 text-gray-400 mx-auto mb-4" aria-hidden="true" />
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
      <p className="text-gray-600 mb-6">{body}</p>
      {(cta || secondaryCta) && (
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {cta && <CtaButton cta={cta} primary />}
          {secondaryCta && <CtaButton cta={secondaryCta} primary={false} />}
        </div>
      )}
    </div>
  );
}
