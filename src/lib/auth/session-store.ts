/** DB-only session logic (no Next.js imports) so it is directly testable. */
import { createHash, randomBytes } from "node:crypto";
import { db, type Db } from "../db";
import type { Role } from "../constants";

export const SESSION_COOKIE = "nen_session";
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const hashToken = (token: string): string => createHash("sha256").update(token).digest("hex");

export type SessionUser = { id: string; email: string; name: string; role: Role };

export async function createSession(userId: string, client: Db = db): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await client.session.create({ data: { tokenHash: hashToken(token), userId, expiresAt } });
  return { token, expiresAt };
}

/** Returns the user for a valid, unexpired session whose account is still active. */
export async function validateSessionToken(token: string | undefined | null, client: Db = db): Promise<SessionUser | null> {
  if (!token) return null;
  const row = await client.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { select: { id: true, email: true, name: true, role: true, isActive: true } } },
  });
  if (!row) return null;
  if (row.expiresAt.getTime() < Date.now()) {
    await client.session.delete({ where: { id: row.id } }).catch(() => undefined);
    return null;
  }
  if (!row.user.isActive) return null;
  const { isActive: _isActive, ...user } = row.user;
  void _isActive;
  return { ...user, role: user.role as Role };
}

export async function destroySession(token: string | undefined | null, client: Db = db): Promise<void> {
  if (!token) return;
  await client.session.deleteMany({ where: { tokenHash: hashToken(token) } });
}

export async function destroyAllSessionsForUser(userId: string, client: Db = db): Promise<void> {
  await client.session.deleteMany({ where: { userId } });
}
