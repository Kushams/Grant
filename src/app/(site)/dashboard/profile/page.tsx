import type { Metadata } from "next";
import { requireApplicant } from "@/lib/auth/session";
import { getIndividualProfile, listOrganizationsForUser } from "@/lib/services/users";
import { IndividualProfileForm, OrganizationProfileForm } from "@/components/dashboard/profile-forms";
import { Card, CardBody } from "@/components/ui/card";
import { Alert, PageHeader, ProgressBar } from "@/components/ui/misc";
import { individualCompletion, organizationCompletion } from "@/lib/validation/profile";
import { parseList } from "@/lib/json";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const user = await requireApplicant("/dashboard/profile");
  const sp = await searchParams;
  if (user.role === "INDIVIDUAL_APPLICANT") {
    const p = (await getIndividualProfile(user.id))!;
    const interests = parseList(p.interests);
    const c = individualCompletion({ ...p, interests });
    return (
      <div>
        <PageHeader title="My profile" description="Only what’s needed for your applications. Never enter ID numbers or bank details." />
        {sp.welcome ? <Alert tone="ok" className="mb-6" title="Account created">Complete your profile so you’re ready to apply.</Alert> : null}
        <Card className="mb-6"><CardBody><ProgressBar label="Profile completion" value={c.percent} />{c.missing.length ? <p className="mt-2 text-sm text-ink-600">Still to add: {c.missing.join(", ")}.</p> : null}</CardBody></Card>
        <Card><CardBody><IndividualProfileForm profile={{ ...p, interests }} /></CardBody></Card>
      </div>
    );
  }
  const orgs = await listOrganizationsForUser(user.id);
  const org = orgs[0];
  return (
    <div>
      <PageHeader title="Organization profile" description="Public-facing details about your organization." />
      {sp.welcome ? <Alert tone="ok" className="mb-6" title="Account created">Complete your organization profile so you’re ready to apply.</Alert> : null}
      {!org ? <Alert tone="warn" title="No organization found">Your account has no organization membership.</Alert> : (
        <>
          <Card className="mb-6"><CardBody>
            <ProgressBar label="Profile completion" value={organizationCompletion({ ...org, sectors: parseList(org.sectors) }).percent} />
            <p className="mt-3 text-xs text-ink-600">Access to this organization is granted by explicit membership (you are the {org.membershipRole.toLowerCase()}). Inviting additional team members is not implemented in this first version.</p>
          </CardBody></Card>
          <Card><CardBody><OrganizationProfileForm org={{ ...org, sectors: parseList(org.sectors) }} /></CardBody></Card>
        </>
      )}
    </div>
  );
}
