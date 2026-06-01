/**
 * StickyMobileCta — fixed-bottom CTA that appears on scroll, mobile only.
 *
 * Pages that use this must add `pb-24 md:pb-8` (or similar) to their main
 * container so the last card isn't hidden under the sticky bar. Never paired
 * with another sticky bar. See docs/ui-component-rules.md and
 * .claude/skills/spf-mobile-cx-accessibility/SKILL.md.
 */
import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StickyMobileCtaProps {
  label: string;
  onClick?: () => void;
  href?: string;
  icon?: LucideIcon;
  showAfterScrollPx?: number;
  caption?: string;
  className?: string;
}

export function StickyMobileCta({
  label,
  onClick,
  href,
  icon: Icon,
  showAfterScrollPx = 300,
  caption,
  className,
}: StickyMobileCtaProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > showAfterScrollPx);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [showAfterScrollPx]);

  if (!visible) return null;

  const inner = (
    <>
      {label}
      {Icon && <Icon className="ml-2 w-4 h-4" aria-hidden="true" />}
    </>
  );

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-3 z-50 md:hidden",
        "pb-[calc(0.75rem+env(safe-area-inset-bottom))]",
        className,
      )}
    >
      {href ? (
        <a
          href={href}
          onClick={onClick}
          className="flex items-center justify-center w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm py-3 rounded-lg"
        >
          {inner}
        </a>
      ) : (
        <Button
          size="lg"
          className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm py-5 rounded-lg"
          onClick={onClick}
        >
          {inner}
        </Button>
      )}
      {caption && (
        <p className="text-[10px] text-muted-foreground text-center mt-1">{caption}</p>
      )}
    </div>
  );
}
