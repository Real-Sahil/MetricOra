import type { ComponentType, ReactNode } from "react";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";

/**
 * The one empty state for lists and panels: an icon tile, what is missing, why
 * it matters or how to fill it, and (as children) the action that fixes it.
 */
export function EmptyState({
  icon: Icon,
  figure,
  title,
  description,
  children,
}: {
  icon?: ComponentType<{ className?: string }>;
  /** A line figure shown instead of the icon tile (see PlotFigure). */
  figure?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <Empty className="border-0 py-12">
      <EmptyHeader>
        {figure ? <div className="mx-auto mb-2 w-full max-w-[220px]">{figure}</div> : Icon && (
          <EmptyMedia variant="icon">
            <Icon aria-hidden="true" />
          </EmptyMedia>
        )}
        <EmptyTitle>{title}</EmptyTitle>
        {description && <EmptyDescription>{description}</EmptyDescription>}
      </EmptyHeader>
      {children && <EmptyContent>{children}</EmptyContent>}
    </Empty>
  );
}
