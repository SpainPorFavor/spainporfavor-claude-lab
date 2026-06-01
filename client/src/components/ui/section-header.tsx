/**
 * SectionHeader — title + optional eyebrow + optional subtitle.
 *
 * Used inside marketing pages and inside cards to introduce a section.
 * One <h1> per page; everything else uses <h2> or <h3>. See
 * docs/ui-component-rules.md.
 */
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  as?: "h1" | "h2" | "h3";
  align?: "left" | "center";
  className?: string;
}

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  as = "h2",
  align = "left",
  className,
}: SectionHeaderProps) {
  const Heading = as;
  const alignClass = align === "center" ? "text-center" : "text-left";
  const titleSize =
    as === "h1" ? "text-2xl md:text-3xl font-extrabold" :
    as === "h2" ? "text-xl md:text-2xl font-bold" :
    "text-base md:text-lg font-semibold";

  return (
    <header className={cn(alignClass, className)}>
      {eyebrow && (
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
          {eyebrow}
        </p>
      )}
      <Heading className={cn("font-display text-[#1A2332]", titleSize)}>
        {title}
      </Heading>
      {subtitle && (
        <p className="text-sm text-muted-foreground mt-1.5">{subtitle}</p>
      )}
    </header>
  );
}
