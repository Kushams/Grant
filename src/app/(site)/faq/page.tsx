import type { Metadata } from "next";
import { ContentPage } from "@/components/content/prose";
import { FAQ } from "@/content/faq";
import { Accordion } from "@/components/ui/accordion";
import { LinkButton } from "@/components/ui/button";

export const metadata: Metadata = { title: "Frequently asked questions" };

export default function FaqPage() {
  return (
    <ContentPage wide eyebrow="Help" title="Frequently asked questions" intro="Straight answers about applying, tracking and staying safe.">
      <Accordion className="max-w-3xl" items={FAQ.map((f) => ({ title: f.q, content: <p>{f.a}</p> }))} />
      <p className="mt-8 text-ink-700">Still stuck? <LinkButton href="/contact" variant="outline" size="sm" className="ml-2">Contact support</LinkButton></p>
    </ContentPage>
  );
}
