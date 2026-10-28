import type { Metadata } from "next";
import { Spot } from "@/components/graphics/spots";
import { ContentPage } from "@/components/content/prose";
import { ORG } from "@/config/organization";

export const metadata: Metadata = { title: "Privacy notice" };

export default function Privacy() {
  return (
    <ContentPage icon={<Spot name="lock" className="size-16" />} draftPolicy eyebrow="Policies" title="Privacy notice" intro="How this platform handles personal information.">
      <h2>Who is responsible</h2>
      <p>{ORG.legalName} is the controller of data collected through this platform. Privacy questions and requests: <a href={`mailto:${ORG.supportEmail}`}>{ORG.supportEmail}</a>. Registration details and a postal address will be added when confirmed.</p>
      <h2>What we collect</h2>
      <ul>
        <li><strong>Application form:</strong> the details you enter — such as your name, contact details, country, what the funding is for, the amount you request and a short budget — and your consent record.</li>
        <li><strong>Support messages</strong> you send us through the contact form or by email.</li>
        <li><strong>Staff records:</strong> notes and the status of your application, and any award record, entered by authorized staff.</li>
      </ul>
      <h2>What we do not collect</h2>
      <p>We do not ask for government ID numbers, tax numbers, bank account details, payment-card data, wallet or cryptocurrency details, or passwords for other services. This platform does not currently accept file uploads.</p>
      <h2>How we use it</h2>
      <ul>
        <li>To receive and review your application and to contact you about it, using the details you gave us.</li>
        <li>To let authorized staff review applications and record decisions.</li>
        <li>To keep an audit trail of sensitive actions for accountability and security.</li>
      </ul>
      <h2>Who can see it</h2>
      <p>Only authorized {ORG.name} staff can see what you submit. We do not sell personal data.</p>
      <h2>Notifications</h2>
      <p>The platform currently sends <strong>no emails or SMS</strong>. Notifications appear only inside the site.</p>
      <h2>Retention, rights and contact</h2>
      <p>Retention periods, your rights under applicable law and the privacy contact are <strong>to be confirmed</strong> by the organization and legal counsel before any public launch.</p>
      <p><em>Version: {ORG.policyVersion}</em></p>
    </ContentPage>
  );
}
