import { NextRequest, NextResponse } from 'next/server';
import { subscribeEmail } from '@/lib/notification-store';

export const dynamic = 'force-dynamic';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const email = (body.email || '').toString().trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });
  }
  const topics = Array.isArray(body.topics) && body.topics.length > 0
    ? body.topics.map((t: unknown) => String(t)).slice(0, 12)
    : ['daily_tips'];
  const countryCode = body.countryCode ? String(body.countryCode).toUpperCase().slice(0, 8) : null;
  const row = await subscribeEmail({ email, topics, countryCode });
  return NextResponse.json({
    success: true,
    id: row.id,
    unsubscribeUrl: `/api/email/unsubscribe?token=${row.unsubscribeToken}`,
  });
}
