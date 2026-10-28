import type { Metadata } from "next";
import { ContentPage } from "@/components/content/prose";
import { FAQ } from "@/content/faq";
import { Accordion } from "@/components/ui/accordion";
import { NetworkBanner } from "@/components/graphics/network-banner";
import { Spot } from "@/components/graphics/spots";
import { LinkButton } from "@/components/ui/button";

export const metadata: Metadata = { title: "FAQ & staying safe" };

export default function FaqPage() {
  return (
    <ContentPage wide icon={<Spot name="question" className="size-16" />} eyebrow="Help" title="FAQ & staying safe" intro="Straight answers about applying, and how to protect yourself from fake offers.">
      <NetworkBanner className="mb-8 h-24 w-full rounded-2xl" />
      <Accordion className="max-w-3xl" items={FAQ.map((f) => ({ title: f.q, content: <p>{f.a}</p> }))} />
      <div id="safety" className="prose-nen mt-14 scroll-mt-24">
        <h2 className="flex items-center gap-3"><Spot name="shield" className="size-11" tone="blue" />Staying safe</h2>
        <p>Genuine funding programmes do not charge you to receive money.</p>
        <h3 className="flex items-center gap-2"><Spot name="clock" className="size-8" tone="blue" />Red flags</h3>
        <ul>
          <li>Requests for an <strong>upfront payment</strong> — to “release”, “unlock”, “clear”, “insure” or “deliver” funds, or to “guarantee” approval.</li>
          <li>Any <strong>outside agent</strong> who promises or guarantees a grant for a fee.</li>
          <li>Requests for gift cards, cryptocurrency, wire transfers or mobile-money to a personal account.</li>
          <li>Requests for your <strong>passwords, one-time codes or PINs</strong>, or for unnecessary sensitive data such as ID numbers or bank statements.</li>
          <li>Promises of guaranteed funding, or pressure to act within hours.</li>
          <li>Messages from free email accounts or social media claiming to be an official body.</li>
        </ul>
        <h3 className="flex items-center gap-2"><Spot name="check" className="size-8" tone="blue" />Our commitments</h3>
        <ul>
          <li>Applying is free, and we never ask you to pay a fee to receive an award.</li>
          <li>This site has no checkout or payment page and never asks for card, bank, wallet or cryptocurrency details.</li>
          <li>We will not ask for sensitive information by social media or personal messaging apps.</li>
        </ul>
        <h3 className="flex items-center gap-2"><Spot name="mail" className="size-8" tone="blue" />If you are targeted</h3>
        <ol>
          <li>Stop communicating and do not send money or personal data.</li>
          <li>Keep screenshots and any reference numbers.</li>
          <li>Tell us through the contact form (topic “Reporting a suspicious offer”) and report it to your local consumer-protection or police authority.</li>
          <li>If you shared a password, change it everywhere you use it. If you paid, contact your bank immediately.</li>
        </ol>
      </div>
      <p className="mt-8 text-ink-700">Still stuck? <LinkButton href="/contact" variant="outline" size="sm" className="ml-2">Contact support</LinkButton></p>
    </ContentPage>
  );
}
