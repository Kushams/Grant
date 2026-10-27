import type { ReactNode } from "react";

/** Eyebrow-with-rule heading (pattern adapted from the World Bridge Meridian site). */
export function SectionHeading({ eyebrow, title, description, align = "left", id, tone = "light", className = "" }: { eyebrow?: string; title: ReactNode; description?: ReactNode; align?: "left" | "center"; id?: string; tone?: "light" | "dark"; className?: string }) {
  const center = align === "center";
  return (
    <div className={`max-w-2xl ${center ? "mx-auto text-center" : ""} ${className}`}>
      {eyebrow ? (
        <p className={`mb-3 flex items-center gap-3 text-xs font-bold uppercase tracking-wider ${tone === "dark" ? "text-teal-200" : "text-violet-300"} ${center ? "justify-center" : ""}`}>
          <span aria-hidden="true" className={`h-px w-8 ${tone === "dark" ? "bg-teal-200/60" : "bg-teal-700/50"}`} />{eyebrow}
        </p>
      ) : null}
      <h2 id={id} className={`text-3xl font-medium tracking-tight sm:text-4xl ${tone === "dark" ? "text-white" : ""}`}>{title}</h2>
      {description ? <p className={`mt-3 text-base ${tone === "dark" ? "text-white/80" : "text-ink-600"}`}>{description}</p> : null}
    </div>
  );
}
