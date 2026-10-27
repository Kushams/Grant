import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth/session";
import { listUsers } from "@/lib/services/users";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Alert, PageHeader } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { Table, TableWrap, Td, Th } from "@/components/ui/table";
import { ActiveForm, CreateStaffForm, RoleForm } from "@/components/admin/user-controls";
import { ROLE_LABELS, type Role } from "@/lib/constants";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Users and roles" };

export default async function Users() {
  const me = await requirePermission("users:manage", "/admin/users");
  const users = await listUsers({ id: me.id, role: me.role, name: me.name });
  return (
    <div className="space-y-8">
      <PageHeader title="Users & roles" description="Manage demo staff accounts. Every change is audited and revokes active sessions where relevant." />
      <Alert tone="info" title="Scope">Roles can be switched between Reviewer and Administrator. Applicants register themselves and can be deactivated but not promoted. You cannot change or deactivate your own account.</Alert>
      <TableWrap label="User accounts"><Table>
        <thead><tr><Th>Name</Th><Th>Email</Th><Th>Role</Th><Th>Status</Th><Th>Created</Th><Th>Manage</Th></tr></thead>
        <tbody>{users.map((u) => {
          const staff = u.role === "REVIEWER" || u.role === "ADMIN";
          const self = u.id === me.id;
          return (
            <tr key={u.id}>
              <Td className="font-medium">{u.name}{u.isDemo ? <Badge tone="warn" className="ml-2">demo</Badge> : null}</Td>
              <Td>{u.email}</Td><Td>{ROLE_LABELS[u.role as Role]}</Td>
              <Td>{u.isActive ? <Badge tone="ok">Active</Badge> : <Badge tone="bad">Deactivated</Badge>}</Td>
              <Td className="whitespace-nowrap">{formatDate(u.createdAt)}</Td>
              <Td>{self ? <span className="text-xs text-ink-600">This is you</span> : <div className="flex flex-wrap items-start gap-3">{staff ? <RoleForm id={u.id} role={u.role} /> : null}<ActiveForm id={u.id} active={u.isActive} /></div>}</Td>
            </tr>);
        })}</tbody>
      </Table></TableWrap>
      <Card><CardHeader title="Create a staff account" /><CardBody><CreateStaffForm /></CardBody></Card>
    </div>
  );
}
