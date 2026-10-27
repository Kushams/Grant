import type { Metadata } from "next";
import { ContentPage } from "@/components/content/prose";
import { LinkButton } from "@/components/ui/button";

export const metadata: Metadata = { title: "Accessibility" };

export default function Accessibility() {
  return (
    <ContentPage draftPolicy eyebrow="Accessibility" title="Accessibility statement" intro="We want everyone to be able to find and apply for opportunities.">
      <h2>Our aim</h2>
      <p>We are building this platform to follow WCAG 2.2 level AA practices wherever feasible. This is an aim, not a certification: this platform has not yet had a formal third-party accessibility audit.</p>
      <h2>What we have built in</h2>
      <ul>
        <li>Semantic page structure, a “skip to main content” link and clearly labelled navigation landmarks.</li>
        <li>Full keyboard operation with visible focus indicators.</li>
        <li>Labelled form fields, clear validation messages and screen-reader announcements for results.</li>
        <li>Colour contrast chosen to meet AA, and status shown with text — never colour alone.</li>
        <li>Responsive layouts for mobile, tablet and desktop, and tables that scroll rather than break.</li>
        <li>Reduced-motion support.</li>
      </ul>
      <h2>Known limitations</h2>
      <ul>
        <li>No formal audit or assistive-technology test matrix has been completed yet.</li>
        <li>Some dashboard tables are wide and rely on horizontal scrolling on small screens.</li>
      </ul>
      <h2>Tell us about a barrier</h2>
      <p>If something is hard to use, please tell us through the contact form and choose the topic “Accessibility”. We will record it in the support queue. No official accessibility contact address has been confirmed yet.</p>
      <div className="not-prose mt-4"><LinkButton href="/contact">Report an accessibility issue</LinkButton></div>
    </ContentPage>
  );
}
