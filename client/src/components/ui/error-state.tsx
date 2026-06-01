/**
 * ErrorState — icon + headline + body + retry CTA + support link.
 *
 * For full-page or inline error states. Always offers a real next step
 * (retry or support). See docs/ui-component-rules.md and
 * .claude/skills/spf-mobile-cx-accessibility/SKILL.md ("no 'Oops! Try again.'").
 */
import { AlertTriangle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title: string;
  body: string;
  onRetry?: () => void;
  icon?: LucideIcon;
  supportEmail?: string;
  subject?: string;
  className?: string;
}

export function ErrorState({
  title,
  body,
  onRetry,
  icon: Icon = AlertTriangle,
  supportEmail = "support@spainporfavor.com",
  subject,
  className,
}: ErrorStateProps) {
  const mailto = subject
    ? `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}`
    : `mailto:${supportEmail}`;
  return (
    <div className={cn("text-center max-w-md mx-auto p-8", className)} role="alert">
      <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-6">
        <Icon className="w-8 h-8 text-amber-600" aria-hidden="true" />
      </div>
      <h1 className="font-display text-2xl font-bold mb-3 text-[#1A2332]">{title}</h1>
      <p className="text-muted-foreground mb-6">{body}</p>
      <div className="flex flex-col gap-3 items-stretch">
        {onRetry && (
          <Button onClick={onRetry} size="lg" variant="outline">
            Try again
          </Button>
        )}
        <a
          href={mailto}
          className="text-sm text-muted-foreground underline underline-offset-2"
        >
          Contact support
        </a>
      </div>
    </div>
  );
}
