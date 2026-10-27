import type { Metadata } from "next";
import { ContentPage } from "@/components/content/prose";
import { NO_FEE_STATEMENT, NO_GUARANTEE_STATEMENT, ORG } from "@/config/organization";

export const metadata: Metadata = { title: "Terms of use (draft)" };

export default function Terms() {
  return (
    <ContentPage draftPolicy eyebrow="Policies" title="Terms of use (draft)" intro="Draft terms for using this prototype platform.">
      <h2>1. About these terms</h2>
      <p>These draft terms describe how the {ORG.name} prototype is intended to be used. The legal entity, governing law and jurisdiction are <strong>to be confirmed</strong>.</p>
      <h2>2. What this platform is</h2>
      <p>{ORG.name} is an independent platform. It is not a government agency and does not operate an official government programme. Participation in any opportunity depends on that opportunity’s own verified terms.</p>
      <h2>3. Demonstration content</h2>
      <p>All opportunities currently shown are fictional demonstrations labelled “DEMO — NOT A LIVE FUNDING OPPORTUNITY”. No funding, award or payment is available from them.</p>
      <h2>4. No guarantee</h2>
      <p>{NO_GUARANTEE_STATEMENT}</p>
      <h2>5. Fees</h2>
      <p>{NO_FEE_STATEMENT} The prototype does not collect any payment.</p>
      <h2>6. Awards and disbursements</h2>
      <p>Where staff record an award or a disbursement, it is an administrative record entered by authorized personnel. The platform does not transfer funds or verify bank transfers; any real payment would follow a separately approved, secure financial process.</p>
      <h2>7. Your responsibilities</h2>
      <ul>
        <li>Provide accurate information and keep your sign-in details private.</li>
        <li>Do not submit sensitive data such as ID numbers or bank details.</li>
        <li>Do not attempt to access other users’ records or disrupt the service.</li>
      </ul>
      <h2>8. Changes</h2>
      <p>These terms are a draft and will change before any public launch.</p>
      <p><em>Version: {ORG.policyVersion}</em></p>
    </ContentPage>
  );
}
