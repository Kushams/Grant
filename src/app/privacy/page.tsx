import type { Metadata } from "next";
import { ContentPage } from "@/components/content/prose";
import { ORG } from "@/config/organization";

export const metadata: Metadata = { title: "Privacy notice (draft)" };

export default function Privacy() {
  return (
    <ContentPage draftPolicy eyebrow="Policies" title="Privacy notice (draft)" intro="How this prototype handles personal information.">
      <h2>Who is responsible</h2>
      <p>{ORG.name} is the intended controller of data collected through this platform. The legal entity name, registration details, address and data-protection contact <strong>have not been confirmed</strong> and are intentionally not shown.</p>
      <h2>What we collect</h2>
      <ul>
        <li><strong>Account data:</strong> name, email address and a securely hashed password.</li>
        <li><strong>Profile data:</strong> country, city, optional phone number, applicant category, background and interests; for organizations, organization name, type, location, public contact email, website and description.</li>
        <li><strong>Application data:</strong> your answers, status history, messages with reviewers and any award or planned-disbursement records linked to your application.</li>
        <li><strong>Support messages</strong> you send us, and your consent records.</li>
      </ul>
      <h2>What we do not collect</h2>
      <p>We do not ask for government ID numbers, tax numbers, bank account details, payment-card data, wallet or cryptocurrency details, or passwords for other services. This prototype does not accept file uploads.</p>
      <h2>How we use it</h2>
      <ul>
        <li>To run your account and let you prepare, submit and track applications.</li>
        <li>To let authorized staff review applications and record decisions.</li>
        <li>To keep an audit trail of sensitive actions for accountability and security.</li>
      </ul>
      <h2>Who can see it</h2>
      <p>You can see your own records. Reviewers see the applications assigned to them. Administrators can see applications, awards and support requests. Internal reviewer notes are not visible to you. We do not sell personal data.</p>
      <h2>Notifications</h2>
      <p>The prototype sends <strong>no emails or SMS</strong>. Notifications appear only inside the site.</p>
      <h2>Retention, rights and contact</h2>
      <p>Retention periods, your rights under applicable law and the privacy contact are <strong>to be confirmed</strong> by the organization and legal counsel before any public launch.</p>
      <p><em>Version: {ORG.policyVersion}</em></p>
    </ContentPage>
  );
}
