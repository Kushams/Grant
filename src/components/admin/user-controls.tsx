"use client";

import { ActionForm } from "@/components/ui/action-form";
import { SelectField, TextField } from "@/components/ui/form";
import { changeRoleAction, createStaffAction, setActiveAction } from "@/app/actions/admin";

export function CreateStaffForm() {
  return (
    <ActionForm action={createStaffAction} submitLabel="Create staff account" pendingLabel="Creating…" className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Name" name="name" required />
        <TextField label="Email" name="email" type="email" required hint="Use a fictional .test address for demos." />
        <SelectField label="Role" name="role" required options={[{ value: "REVIEWER", label: "Reviewer" }, { value: "ADMIN", label: "Administrator" }]} />
        <TextField label="Initial password" name="password" type="password" autoComplete="new-password" required hint="10+ characters with letters and numbers. Hashed before storage." />
      </div>
    </ActionForm>
  );
}

export function RoleForm({ id, role }: { id: string; role: string }) {
  return (
    <ActionForm action={changeRoleAction} submitLabel="Change" size="sm" variant="outline" hidden={{ id }} className="flex flex-wrap items-end gap-2">
      <SelectField label="Role" name="role" defaultValue={role} options={[{ value: "REVIEWER", label: "Reviewer" }, { value: "ADMIN", label: "Administrator" }]} />
    </ActionForm>
  );
}

export function ActiveForm({ id, active }: { id: string; active: boolean }) {
  return (
    <ActionForm action={setActiveAction} submitLabel={active ? "Deactivate" : "Reactivate"} size="sm" variant={active ? "danger" : "secondary"} hidden={{ id, active: String(!active) }} className="space-y-1">
      <span className="sr-only">Account status toggle</span>
    </ActionForm>
  );
}
