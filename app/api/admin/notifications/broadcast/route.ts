import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import {
  createNotification,
  listEmailSubscribers,
  listPushSubscriptions,
  listAllUserIds,
} from '@/lib/notification-store';
import { sendBulkMail } from '@/lib/mailer';

export const dynamic = 'force-dynamic';

interface BroadcastBody {
  title: string;
  body: string;
  link?: string;
  audience?: 'all' | 'push' | 'email';
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const data = (await req.json().catch(() => ({}))) as Partial<BroadcastBody>;
  const title = (data.title || '').trim();
  const body = (data.body || '').trim();
  if (!title || !body) {
    return NextResponse.json({ error: 'title and body are required' }, { status: 400 });
  }
  const audience = data.audience ?? 'all';

  let count = 0;

  // In-app notifications for ALL registered users
  if (audience === 'all' || audience === 'push') {
    // Get all registered user IDs (falls back to push-subscriber user IDs when no DB)
    const allUserIds = await listAllUserIds();
    // Also include any push-subscriber user IDs not already in the list
    const pushSubs = await listPushSubscriptions();
    const pushUserIds = pushSubs.map((s) => s.userId).filter((id): id is number => !!id);
    const userIds = Array.from(new Set([...allUserIds, ...pushUserIds]));
    for (const uid of userIds) {
      await createNotification({
        userId: uid,
        type: 'admin_broadcast',
        title,
        content: body,
        link: data.link ?? null,
        channel: 'inapp',
      });
      count++;
    }
  }

  let emailResult: { sent: number; failed: number; skipped?: boolean } | null = null;
  if (audience === 'all' || audience === 'email') {
    const emailSubs = (await listEmailSubscribers()).filter((s) => s.active);
    const recipients = emailSubs.map((s) => s.email);
    const html = `<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#fff;color:#111">
        <h1 style="margin:0 0 12px;font-size:22px">${escapeHtml(title)}</h1>
        <div style="font-size:15px;line-height:1.5;color:#333">${escapeHtml(body).replace(/\n/g, '<br/>')}</div>
        ${data.link ? `<p style="margin-top:24px"><a href="${escapeAttr(data.link)}" style="background:#10B981;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;display:inline-block">Open</a></p>` : ''}
        <hr style="margin:32px 0;border:none;border-top:1px solid #eee"/>
        <p style="font-size:11px;color:#999">You received this because you subscribed to Betcheza updates.</p>
      </div>`;
    emailResult = await sendBulkMail(recipients, title, html, body);
    count += emailResult.sent;
  }

  return NextResponse.json({ ok: true, count, audience, email: emailResult });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '"' ? '&quot;' : '&#39;'
  );
}
function escapeAttr(s: string): string {
  return escapeHtml(s);
}
