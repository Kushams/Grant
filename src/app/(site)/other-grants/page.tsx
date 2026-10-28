import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/content/prose";
import { NetworkBanner } from "@/components/graphics/network-banner";
import { Alert } from "@/components/ui/misc";
import { EXTERNAL_CATEGORIES, EXTERNAL_GRANTS } from "@/content/external-grants";

export const metadata: Metadata = {
  title: "Other grants",
  description: "Grant programmes run by other organizations — healthcare, education, family, small business and more — with links to each official site.",
};

export default function OtherGrants() {
  return (
    <ContentPage wide eyebrow="Directory" title="Other grants" intro="Programmes run by other organizations. NEN does not offer, fund or decide these — we point you to the official source.">
      <NetworkBanner className="mb-8 h-28 w-full rounded-2xl" />
      <Alert tone="info" className="mb-8 max-w-3xl" title="Read this first">
        Each programme has its own rules and its own official application. Many grants are for organizations rather than individuals. Never pay an outside agent to “guarantee” a grant — official programmes do not charge to apply. If anyone asks you for money, first confirm with that programme’s own customer service, using the contact details on its official site, before paying anything.
      </Alert>
      <div className="space-y-12">
        {EXTERNAL_CATEGORIES.map((cat) => {
          const items = EXTERNAL_GRANTS.filter((g) => g.category === cat);
          if (!items.length) return null;
          return (
            <section key={cat} aria-labelledby={`c-${cat}`}>
              <h2 id={`c-${cat}`} className="mb-4 text-2xl font-semibold">{cat}</h2>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((g) => (
                  <li key={g.slug} className="relative rounded-xl border border-ink-200 bg-white p-5 shadow-[var(--shadow-card)] hover:shadow-md">
                    <p className="text-xs font-semibold uppercase tracking-wider text-ink-600">{g.by}</p>
                    <h3 className="mt-1 text-lg font-semibold"><Link href={`/other-grants/${g.slug}`} className="after:absolute after:inset-0 hover:underline">{g.name}</Link></h3>
                    <p className="mt-2 text-sm text-ink-700">{g.summary}</p>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </ContentPage>
  );
}
