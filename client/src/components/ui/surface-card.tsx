/**
 * SurfaceCard — the canonical white card pattern.
 *
 * Use this instead of re-typing
 *   bg-white rounded-xl shadow-sm border border-gray-100 p-6
 * in every page. See docs/ui-component-rules.md for the full API.
 */
import { forwardRef, type ComponentPropsWithoutRef, type ElementType, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type SurfaceCardVariant = "default" | "highlighted" | "success" | "muted";
type SurfaceCardPadding = "none" | "sm" | "md" | "lg";

interface SurfaceCardProps extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  variant?: SurfaceCardVariant;
  padding?: SurfaceCardPadding;
  as?: ElementType;
  children: ReactNode;
}

const VARIANT_CLASSES: Record<SurfaceCardVariant, string> = {
  default: "border-gray-100",
  highlighted: "border-amber-200 ring-1 ring-amber-100/60",
  success: "border-emerald-200",
  muted: "border-gray-100 opacity-70",
};

const PADDING_CLASSES: Record<SurfaceCardPadding, string> = {
  none: "p-0",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export const SurfaceCard = forwardRef<HTMLDivElement, SurfaceCardProps>(function SurfaceCard(
  { variant = "default", padding = "md", as, className, children, ...rest },
  ref,
) {
  const Component = (as ?? "div") as ElementType;
  return (
    <Component
      ref={ref}
      className={cn(
        "bg-white rounded-xl shadow-sm border",
        VARIANT_CLASSES[variant],
        PADDING_CLASSES[padding],
        className,
      )}
      {...rest}
    >
      {children}
    </Component>
  );
});
