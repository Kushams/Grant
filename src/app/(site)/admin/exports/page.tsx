import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth/session";
import { EXPORT_LABELS, EXPORT_TYPES } from "@/lib/services/exports";
import { Card, CardBody } from "@/components/ui/card";
import { Alert, PageHeader } from "@/components/ui/misc";
import { buttonClasses } from "@/components/ui/button";

export const metadata: Metadata = { title: "CSV exports" };

export default async function Exports() {
  await requirePermission("export:run", "/admin/exports");
  return (
    <div>
      <PageHeader title="CSV exports" description="Authorized, non-sensitive exports. Every download is recorded in the audit log." />
      <Alert tone="info" className="mb-6" title="What exports never contain">Passwords, sessions, internal notes, email addresses and message bodies are excluded. Cells that could execute as spreadsheet formulas are neutralised.</Alert>
      <ul className="grid gap-4 md:grid-cols-2">
        {EXPORT_TYPES.map((t) => (
          <li key={t}><Card className="h-full"><CardBody className="flex h-full flex-col justify-between gap-4">
            <div><h2 className="font-sans text-lg font-bold tracking-normal">{EXPORT_LABELS[t].title}</h2><p className="mt-1 text-sm text-ink-700">{EXPORT_LABELS[t].description}</p></div>
            <a href={`/admin/export/${t}`} download className={buttonClasses("primary", "md", "self-start")}>Download CSV<span className="sr-only">: {EXPORT_LABELS[t].title}</span></a>
          </CardBody></Card></li>
        ))}
      </ul>
    </div>
  );
}
