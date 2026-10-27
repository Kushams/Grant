import type { Metadata } from "next";
import { ContentPage } from "@/components/content/prose";
import { FAQ } from "@/content/faq";
import { LinkButton } from "@/components/ui/button";

export const metadata: Metadata = { title: "Frequently asked questions" };

export default function FaqPage() {
  return (
    <ContentPage wide eyebrow="Help" title="Frequently asked questions" intro="Straight answers about applying, tracking and staying safe.">
      <div className="max-w-3xl divide-y divide-ink-200 rounded-xl border border-ink-200 bg-white shadow-[var(--shadow-card)]">
        {FAQ.map((f) => (
          <details key={f.q} className="group p-5"><summary className="cursor-pointer text-base font-semibold text-ink-900">{f.q}</summary><p className="mt-3 text-ink-700">{f.a}</p></details>
        ))}
      </div>
      <p className="mt-8 text-ink-700">Still stuck? <LinkButton href="/contact" variant="outline" size="sm" className="ml-2">Contact support</LinkButton></p>
    </ContentPage>
  );
}
