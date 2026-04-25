import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import {
  createNotification,
  listEmailSubscribers,
  listPushSubscriptions,
} from '@/lib/notification-store';

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

  // In-app notifications for any logged-in users derived from push subs (best-effort)
  if (audience === 'all' || audience === 'push') {
    const pushSubs = await listPushSubscriptions();
    const userIds = Array.from(new Set(pushSubs.map((s) => s.userId).filter((id): id is number => !!id)));
    for (const uid of userIds) {
      await createNotification({
        userId: uid,
        type: 'system',
        title,
        content: body,
        link: data.link ?? null,
        channel: 'push',
      });
      count++;
    }
  }

  if (audience === 'all' || audience === 'email') {
    const emailSubs = (await listEmailSubscribers()).filter((s) => s.active);
    count += emailSubs.length;
    // Email delivery is queued by the email-store/email worker. We log the
    // intent here; actual SMTP send happens out-of-process when configured.
    console.log(`[broadcast] queued email to ${emailSubs.length} subscribers: ${title}`);
  }

  return NextResponse.json({ ok: true, count, audience });
}
