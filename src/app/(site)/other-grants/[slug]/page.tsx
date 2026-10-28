import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { ORG } from "@/config/organization";
import { Alert, PageHeader } from "@/components/ui/misc";
import { buttonClasses } from "@/components/ui/button";
import { externalGrantBySlug } from "@/content/external-grants";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const g = externalGrantBySlug((await params).slug);
  return { title: g ? g.name : "Other grants" };
}

export default async function ExternalGrantPage({ params }: { params: Promise<{ slug: string }> }) {
  const g = externalGrantBySlug((await params).slug);
  if (!g) notFound();
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <p className="mb-4 text-sm"><Link href="/other-grants" className="font-semibold text-navy-800 underline">← All other grants</Link></p>
      <PageHeader eyebrow={g.category} title={g.name} description={g.summary} />
      <Alert tone="warn" className="mt-2" title={`This grant is offered by ${g.by}, not by ${ORG.name}`}>
        {ORG.name} does not run, fund, endorse or decide this programme, and cannot tell you whether you qualify. To apply you will go to the official site, where you register and apply with them directly.
      </Alert>
      <dl className="mt-6 space-y-3 rounded-xl border border-ink-200 bg-white p-5 text-sm shadow-[var(--shadow-card)]">
        <div><dt className="font-semibold text-ink-900">Offered by</dt><dd className="text-ink-700">{g.by}</dd></div>
        <div><dt className="font-semibold text-ink-900">Generally for</dt><dd className="text-ink-700">{g.audience}</dd></div>
        <div><dt className="font-semibold text-ink-900">Official page</dt><dd className="break-all text-ink-700">{g.url}</dd></div>
        <div><dt className="font-semibold text-ink-900">Link last checked</dt><dd className="text-ink-700">{new Date(g.checked).toLocaleDateString("en-GB", { dateStyle: "long" })}</dd></div>
      </dl>
      <ul className="mt-6 list-disc space-y-1 pl-5 text-sm text-ink-700">
        <li>Apply only on the official site. Official programmes do not charge to apply.</li>
        <li>Do not pay anyone who promises or “guarantees” this grant, and do not send personal documents to anyone who contacted you first.</li>
        <li>Check the address in your browser matches the official page above.</li>
      </ul>
      <a href={g.url} target="_blank" rel="noopener noreferrer nofollow" className={buttonClasses("primary", "lg", "mt-8")}>
        Continue to the official site <ExternalLink className="size-4" aria-hidden="true" />
      </a>
    </div>
  );
}
