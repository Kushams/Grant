import type { Metadata } from "next";
import { Spot } from "@/components/graphics/spots";
import { ContentPage } from "@/components/content/prose";
import { NO_FEE_STATEMENT, NO_GUARANTEE_STATEMENT, ORG } from "@/config/organization";

export const metadata: Metadata = { title: "Terms of use" };

export default function Terms() {
  return (
    <ContentPage icon={<Spot name="document" className="size-16" />} draftPolicy eyebrow="Policies" title="Terms of use" intro="Terms for using this platform.">
      <h2>1. Who we are</h2>
      <p>This site is run by {ORG.legalName} (“NEN”). NEN is an independent company. It is not a government agency and does not operate an official government programme. You can reach us at <a href={`mailto:${ORG.supportEmail}`}>{ORG.supportEmail}</a>. The state of registration and governing law are <strong>to be confirmed</strong>.</p>
      <h2>2. Using this site</h2>
      <p>You may browse the site, create an account and apply to programmes listed here. Provide accurate information, keep your sign-in details (passkey and access code) private, and do not attempt to access other people’s records or disrupt the service.</p>
      <h2>3. Applying and decisions</h2>
      <p>Applying is free. An application is a request for consideration, not a promise of funding. For the General Opportunity Fund you request the amount you need, within the range stated on the programme page, and explain how it would be used. NEN’s Board of Directors decides each application and may approve the amount requested, approve a different amount, or decline. {NO_GUARANTEE_STATEMENT}</p>
      <h2>4. Awards and payment</h2>
      <ul>
        <li>An award exists only after NEN approves it in writing and the recipient accepts the written award terms.</li>
        <li>Approved awards are paid <strong>by cheque</strong> made out to the approved recipient. Another method is used only if it is stated in the written award terms and is lawful.</li>
        <li>Before payment NEN may need to confirm the recipient’s identity through a secure process. NEN does not ask for sensitive information through social media or personal messaging apps.</li>
        <li>This site does not take payments of any kind.</li>
      </ul>
      <h2>5. Use of funds and reporting</h2>
      <p>Funds must be used only for the purpose approved in the award terms. Changes need NEN’s written approval. Recipients may be asked for a short report on how the funds were used. If funds are misused or an application contained false information, NEN may withdraw the award and ask for funds to be returned, as the award terms describe.</p>
      <h2>6. Fees</h2>
      <p>{NO_FEE_STATEMENT} NEN never charges a fee to apply or to receive an award, and no one working for NEN may ask you to pay one. If anyone asks you for money in NEN’s name, do not pay — tell us at {ORG.supportEmail}.</p>
      <h2>7. Where the General Opportunity Fund is available</h2>
      <p>The General Opportunity Fund is open to applicants worldwide, <strong>except applicants located in Africa</strong>. NEN may also decline or be unable to pay an application where the law, sanctions or banking rules prevent it.</p>
      <h2>8. Changes</h2>
      <p>These terms may change. The version in force is the one shown on this page.</p>
      <p><em>Version: {ORG.policyVersion}</em></p>
      <h2 id="accessibility">Accessibility</h2>
      <p>We aim to follow WCAG 2.2 level AA practices wherever feasible: keyboard operation with visible focus, labelled form fields, sufficient colour contrast, reduced-motion support and responsive layouts. This is an aim, not a certification, and no formal third-party audit has been completed yet. If something is hard to use, tell us through the <a href="/contact">contact form</a> (topic “Accessibility”).</p>
    </ContentPage>
  );
}
