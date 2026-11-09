import { db, type Db, type Tx } from "../db";
import type { Actor } from "../permissions";

type Client = Db | Tx;

export type AuditInput = {
  actor: Pick<Actor, "id" | "role" | "name"> | null; // null = system
  action: string; // e.g. "application.status_changed"
  entityType: string;
  entityId: string;
  summary: string;
  before?: unknown;
  after?: unknown;
  reason?: string | null;
};

const MAX = 6000;
const ser = (v: unknown): string | null => {
  if (v === undefined || v === null) return null;
  const s = JSON.stringify(v);
  return s.length > MAX ? s.slice(0, MAX) + "…" : s;
};

/**
 * Append-only: this module only ever INSERTs. There is intentionally no update/delete
 * function, and SQLite triggers (see the init migration) reject UPDATE/DELETE.
 * Never put secrets, password hashes or session tokens in `before`/`after`.
 */
export async function recordAudit(input: AuditInput, client: Client = db): Promise<void> {
  await client.auditLog.create({
    data: {
      actorId: input.actor?.id ?? null,
      actorRole: input.actor?.role ?? "SYSTEM",
      actorName: input.actor?.name ?? "System",
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      summary: input.summary,
      before: ser(input.before),
      after: ser(input.after),
      reason: input.reason ?? null,
    },
  });
}

export type AuditFilters = { q?: string; action?: string; entityType?: string; page?: number; pageSize?: number };

export async function listAudit(f: AuditFilters = {}) {
  const pageSize = Math.min(Math.max(f.pageSize ?? 25, 1), 100);
  const page = Math.max(f.page ?? 1, 1);
  const where = {
    ...(f.action ? { action: { startsWith: f.action } } : {}),
    ...(f.entityType ? { entityType: f.entityType } : {}),
    ...(f.q
      ? { OR: [{ summary: { contains: f.q } }, { entityId: { contains: f.q } }, { actorName: { contains: f.q } }] }
      : {}),
  };
  const [rows, total] = await Promise.all([
    db.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
    db.auditLog.count({ where }),
  ]);
  return { rows, total, page, pageSize, pages: Math.max(1, Math.ceil(total / pageSize)) };
}
