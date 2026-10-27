import type { Metadata } from "next";
import { ContentPage } from "@/components/content/prose";
import { LinkButton } from "@/components/ui/button";
import { NO_FEE_STATEMENT } from "@/config/organization";

export const metadata: Metadata = { title: "Fraud prevention" };

export default function Fraud() {
  return (
    <ContentPage draftPolicy eyebrow="Stay safe" title="Fraud prevention" intro="Genuine funding programmes do not charge you to receive money. Here is how to protect yourself.">
      <h2>Before you trust an offer</h2>
      <ul>
        <li><strong>Verify the source.</strong> Check who is really offering the opportunity and read the full programme terms.</li>
        <li><strong>Read the official terms.</strong> Eligibility, dates, award structure and any charges must be stated in the programme terms before you proceed.</li>
        <li><strong>Check the channel.</strong> We will not ask you for sensitive information by social media or personal messaging apps.</li>
      </ul>
      <h2>Red flags</h2>
      <ul>
        <li>Requests for an <strong>unexplained upfront payment</strong> — for example to “release”, “unlock”, “clear”, “insure” or “deliver” funds, or to “guarantee” approval.</li>
        <li>Requests for gift cards, cryptocurrency, wire transfers or mobile-money to a personal account.</li>
        <li>Requests for your <strong>passwords, one-time codes or PINs</strong>.</li>
        <li>Requests for <strong>unnecessary sensitive data</strong> such as government ID numbers, full bank statements or card numbers.</li>
        <li>Promises of guaranteed funding, or pressure to act within hours.</li>
        <li>Messages from free email accounts claiming to be an official body.</li>
      </ul>
      <h2>Our commitments</h2>
      <ul>
        <li>{NO_FEE_STATEMENT}</li>
        <li>This site never asks for card, bank, wallet or cryptocurrency details and has no checkout or payment page.</li>
        <li>Staff will never ask you to pay a fee to receive an award.</li>
        <li>Award and payment statuses shown to you are records entered by authorized staff — they are not payment-provider confirmations.</li>
      </ul>
      <h2>What to do if you are targeted</h2>
      <ol>
        <li>Stop communicating and do not send money or personal data.</li>
        <li>Keep screenshots and any reference numbers.</li>
        <li>Report it to us using the contact form (choose “Reporting a suspicious offer”), and to your local consumer-protection or police authority.</li>
        <li>If you shared a password, change it everywhere you use it. If you made a payment, contact your bank immediately.</li>
      </ol>
      <div className="not-prose mt-6"><LinkButton href="/contact">Report a suspicious offer</LinkButton></div>
    </ContentPage>
  );
}
