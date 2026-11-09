/**
 * Notification service abstraction.
 *
 * Only the in-app channel is implemented. The `NotificationChannel` interface is the seam
 * for real providers (email/SMS/push) later: add a class, register it in `channels`, and
 * configure credentials explicitly. NOTHING external is sent today — the prototype never
 * claims an email or SMS went out.
 */
import { db, type Db, type Tx } from "../db";

type Client = Db | Tx;

export type NotificationPayload = {
  userId: string;
  type: string;
  title: string;
  body: string;
  href?: string;
};

export interface NotificationChannel {
  readonly name: string;
  send(payload: NotificationPayload, client: Client): Promise<void>;
}

class InAppChannel implements NotificationChannel {
  readonly name = "in-app";
  async send(p: NotificationPayload, client: Client) {
    await client.notification.create({
      data: { userId: p.userId, type: p.type, title: p.title, body: p.body, href: p.href ?? null },
    });
  }
}

// Future: register EmailChannel / SmsChannel here once a provider is approved & configured.
const channels: NotificationChannel[] = [new InAppChannel()];

export async function notify(payload: NotificationPayload, client: Client = db): Promise<void> {
  for (const ch of channels) await ch.send(payload, client);
}

export async function notifyMany(userIds: string[], payload: Omit<NotificationPayload, "userId">, client: Client = db) {
  for (const userId of new Set(userIds)) await notify({ ...payload, userId }, client);
}

export async function notifyAdmins(payload: Omit<NotificationPayload, "userId">, client: Client = db) {
  const admins = await client.user.findMany({ where: { role: "ADMIN", isActive: true }, select: { id: true } });
  await notifyMany(admins.map((a) => a.id), payload, client);
}

export async function unreadCount(userId: string): Promise<number> {
  return db.notification.count({ where: { userId, readAt: null } });
}

export async function listNotifications(userId: string, opts: { unreadOnly?: boolean; take?: number } = {}) {
  return db.notification.findMany({
    where: { userId, ...(opts.unreadOnly ? { readAt: null } : {}) },
    orderBy: { createdAt: "desc" },
    take: opts.take ?? 100,
  });
}

/** Only touches rows owned by `userId`, so a forged notification id cannot affect others. */
export async function markRead(userId: string, id: string) {
  await db.notification.updateMany({ where: { id, userId, readAt: null }, data: { readAt: new Date() } });
}
export async function markAllRead(userId: string) {
  await db.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
}
