"use client";

import { saveIndividualProfileAction, saveOrganizationProfileAction } from "@/app/actions/applicant";
import { useActionForm } from "@/lib/use-action-form";
import { FormMessage, SelectField, SubmitButton, TextArea, TextField, fe } from "@/components/ui/form";
import { APPLICANT_TYPE_LABELS, INDIVIDUAL_CATEGORIES, ORGANIZATION_TYPES, PROGRAMME_CATEGORIES } from "@/lib/constants";

function Interests({ name, selected, legend }: { name: string; selected: string[]; legend: string }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold text-ink-900">{legend}</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {PROGRAMME_CATEGORIES.map((c) => (
          <label key={c} className="flex items-center gap-2 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm">
            <input type="checkbox" name={name} value={c} defaultChecked={selected.includes(c)} className="size-4 accent-teal-700" />{c}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function IndividualProfileForm({ profile }: { profile: { fullName: string; country: string | null; city: string | null; phone: string | null; applicantCategory: string; background: string | null; interests: string[] } }) {
  const { state, onSubmit, pending } = useActionForm(saveIndividualProfileAction);
  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <FormMessage state={state} />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="Full name" name="fullName" defaultValue={profile.fullName} required error={fe(state, "fullName")} />
        <SelectField label="Applicant category" name="applicantCategory" defaultValue={profile.applicantCategory} required error={fe(state, "applicantCategory")}
          options={INDIVIDUAL_CATEGORIES.map((c) => ({ value: c, label: APPLICANT_TYPE_LABELS[c] }))} hint="Entrepreneurs are building or launching a venture." />
        <TextField label="Country or region" name="country" defaultValue={profile.country ?? ""} required error={fe(state, "country")} />
        <TextField label="City or locality" name="city" defaultValue={profile.city ?? ""} error={fe(state, "city")} />
        <TextField label="Phone number (optional)" name="phone" type="tel" defaultValue={profile.phone ?? ""} error={fe(state, "phone")} hint="Optional. Only add it if you want programmes to be able to reach you." />
      </div>
      <TextArea label="Background or experience" name="background" defaultValue={profile.background ?? ""} error={fe(state, "background")} hint="A few sentences. Please don’t include ID numbers or financial details." />
      <Interests name="interests" selected={profile.interests} legend="Areas of interest" />
      <SubmitButton pending={pending} size="lg">Save profile</SubmitButton>
    </form>
  );
}

export function OrganizationProfileForm({ org }: { org: { id: string; name: string; type: string; country: string | null; city: string | null; contactEmail: string | null; phone: string | null; website: string | null; description: string | null; sectors: string[] } }) {
  const { state, onSubmit, pending } = useActionForm(saveOrganizationProfileAction);
  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <input type="hidden" name="organizationId" value={org.id} />
      <FormMessage state={state} />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="Organization name" name="name" defaultValue={org.name} required error={fe(state, "name")} />
        <SelectField label="Organization type" name="type" defaultValue={org.type} required error={fe(state, "type")} options={ORGANIZATION_TYPES.map((t) => ({ value: t, label: APPLICANT_TYPE_LABELS[t] }))} />
        <TextField label="Country or region" name="country" defaultValue={org.country ?? ""} required error={fe(state, "country")} />
        <TextField label="City or locality" name="city" defaultValue={org.city ?? ""} error={fe(state, "city")} />
        <TextField label="Public contact email" name="contactEmail" type="email" defaultValue={org.contactEmail ?? ""} required error={fe(state, "contactEmail")} hint="Shown to reviewers as the organization’s contact." />
        <TextField label="Phone number (optional)" name="phone" type="tel" defaultValue={org.phone ?? ""} error={fe(state, "phone")} />
        <TextField label="Website (optional)" name="website" type="url" defaultValue={org.website ?? ""} error={fe(state, "website")} placeholder="https://" />
      </div>
      <TextArea label="Short description" name="description" defaultValue={org.description ?? ""} error={fe(state, "description")} />
      <Interests name="sectors" selected={org.sectors} legend="Sector or programme interests" />
      <p className="text-sm text-ink-600">No registration numbers, tax IDs or financial documents are requested in this prototype. Any verification requirement would be set by a verified programme and approved first.</p>
      <SubmitButton pending={pending} size="lg">Save organization profile</SubmitButton>
    </form>
  );
}
