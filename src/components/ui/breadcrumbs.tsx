import Link from "next/link";

type Crumb = { label: string; href?: string };

/** Breadcrumb trail. Emits schema.org BreadcrumbList only when NEXT_PUBLIC_SITE_URL is configured (we never guess a domain). */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  const jsonLd = site ? {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: items.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.label, ...(c.href ? { item: `${site}${c.href}` } : {}) })),
  } : null;
  return (
    <nav aria-label="Breadcrumb" className="mb-4 text-sm text-ink-600">
      {jsonLd ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} /> : null}
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((c, i) => (
          <li key={c.label} className="flex items-center gap-2">
            {c.href ? <Link href={c.href} className="underline hover:text-ink-900">{c.label}</Link> : <span aria-current="page" className="text-ink-800">{c.label}</span>}
            {i < items.length - 1 ? <span aria-hidden="true">/</span> : null}
          </li>
        ))}
      </ol>
    </nav>
  );
}
