import type { Metadata } from "next";
import { isPlaceholderEmail } from "@/lib/auth/access-code";
import { getCurrentUser } from "@/lib/auth/session";
import { ContactForm } from "@/components/content/contact-form";
import { Spot } from "@/components/graphics/spots";
import { ContentPage } from "@/components/content/prose";
import { ORG } from "@/config/organization";
import { Alert } from "@/components/ui/misc";
import { Card, CardBody } from "@/components/ui/card";

export const metadata: Metadata = { title: "Contact and support" };

export default async function Contact({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const [user, sp] = await Promise.all([getCurrentUser(), searchParams]);
  return (
    <ContentPage icon={<Spot name="envelope" className="size-16" />} wide eyebrow="Support" title="Contact and support" intro="Ask a question, report a suspicious offer, or tell us about an accessibility barrier.">
      <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        <Card><CardBody><ContactForm defaults={{ name: user?.name, email: isPlaceholderEmail(user?.email) ? "" : user?.email, ref: sp.ref, emailOptional: isPlaceholderEmail(user?.email) }} /></CardBody></Card>
        <aside className="space-y-4">
          <Alert tone="info" title="How messages are handled">
            Your message is saved to a support queue that staff can read. <strong>Replies appear in the site</strong>; signed-in users see them on their dashboard.
          </Alert>
          <Alert tone="info" title="Email us">
            <a className="font-semibold underline" href={`mailto:${ORG.supportEmail}`}>{ORG.supportEmail}</a> is our only official email address. Be wary of anyone claiming to be us from another channel.
          </Alert>
        </aside>
      </div>
    </ContentPage>
  );
}
