import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("rounded-[var(--radius-card)] border border-ink-200 bg-surface shadow-[var(--shadow-card)]", className)} {...props} />;
}
export function CardBody({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("p-5 sm:p-6", className)} {...props} />;
}
export function CardHeader({ title, description, action, as: H = "h2" }: { title: ReactNode; description?: ReactNode; action?: ReactNode; as?: "h2" | "h3" }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-ink-100 px-5 py-4 sm:px-6">
      <div>
        <H className="font-sans text-base font-bold tracking-normal text-white">{title}</H>
        {description ? <p className="mt-0.5 text-sm text-ink-600">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
