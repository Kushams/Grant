import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import type { Actor } from "@/lib/permissions";
import type { Role } from "@/lib/constants";
import { saveOpportunity, setOpportunityStatus } from "@/lib/services/opportunities";
import { registerUser } from "@/lib/services/users";

let n = 0;
export const uid = () => `${Date.now().toString(36)}${(n++).toString(36)}`;

export async function makeStaff(role: "ADMIN" | "REVIEWER", name = `${role} ${uid()}`): Promise<Actor> {
  const u = await db.user.create({
    data: { email: `${role.toLowerCase()}-${uid()}@example.test`, name, role, passwordHash: await hashPassword("Test-Passw0rd1") },
  });
  return { id: u.id, role: role as Role, name };
}

export async function makeApplicant(kind: "INDIVIDUAL" | "ORGANIZATION" = "INDIVIDUAL", over: { orgType?: string } = {}): Promise<Actor & { email: string }> {
  const email = `applicant-${uid()}@example.test`;
  const { userId, role } = await registerUser({
    name: "Test Person",
    email,
    password: "Test-Passw0rd1",
    confirmPassword: "Test-Passw0rd1",
    accountType: kind === "INDIVIDUAL" ? "INDIVIDUAL_APPLICANT" : "ORGANIZATION_APPLICANT",
    organizationName: kind === "ORGANIZATION" ? "Test Org Ltd" : undefined,
    organizationType: kind === "ORGANIZATION" ? over.orgType ?? "NONPROFIT" : undefined,
    consentPrivacy: true,
  });
  if (kind === "INDIVIDUAL") {
    await db.individualProfile.update({ where: { userId }, data: { country: "Testland", city: "Test City" } });
  } else {
    const m = await db.organizationMembership.findFirst({ where: { userId } });
    await db.organizationProfile.update({ where: { id: m!.organizationId }, data: { country: "Testland", contactEmail: "org@example.test" } });
  }
  return { id: userId, role: role as Role, name: "Test Person", email };
}

export function baseOpportunityInput(over: Record<string, unknown> = {}) {
  return {
    title: `Test Programme ${uid()}`,
    shortDescription: "A fictional programme used by the test-suite.",
    description: "A fictional programme used by the automated tests. Not a live funding opportunity.",
    category: "Education & skills",
    applicantTypes: ["INDIVIDUAL", "ENTREPRENEUR", "NONPROFIT"],
    eligibleRegions: ["Africa"],
    keywords: ["test"],
    fundingSpecified: true,
    currency: "USD",
    minAmount: "1000.00",
    maxAmount: "5000.00",
    awardType: "Grant (cash)",
    eligibilityCriteria: ["Be fictional"],
    deadline: "2999-01-01",
    questions: [
      { key: "story", label: "Tell us your story", type: "LONG_TEXT", required: true, section: "GENERAL", options: [] },
      { key: "size", label: "Team size", type: "SINGLE_CHOICE", required: false, section: "GENERAL", options: ["1", "2-5", "6+"] },
      { key: "purpose", label: "Purpose of the request", type: "LONG_TEXT", required: true, section: "PROJECT", options: [] },
    ],
    ...over,
  };
}

/** Creates and publishes a DEMO opportunity as the given admin. */
export async function makePublishedOpportunity(admin: Actor, over: Record<string, unknown> = {}) {
  const saved = await saveOpportunity(admin, null, baseOpportunityInput(over), "DEMO");
  await setOpportunityStatus(admin, saved.id, "PUBLISHED");
  return db.opportunity.findUniqueOrThrow({ where: { id: saved.id } });
}
