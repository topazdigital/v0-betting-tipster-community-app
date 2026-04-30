import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import {
  getCompetitionBySlug,
  joinCompetition,
  hasUserJoined,
} from '@/lib/competitions-store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Sign in to join a competition.' },
      { status: 401 },
    );
  }

  const comp = getCompetitionBySlug(slug);
  if (!comp) {
    return NextResponse.json({ success: false, error: 'Competition not found' }, { status: 404 });
  }

  const userName =
    (user as unknown as { displayName?: string; username?: string; email?: string }).displayName
    || (user as unknown as { username?: string; email?: string }).username
    || (user as unknown as { email?: string }).email
    || `user_${user.userId}`;

  const result = joinCompetition(comp.id, user.userId, userName);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 });
  }
  return NextResponse.json({
    success: true,
    alreadyJoined: result.alreadyJoined,
    participantCount: result.participantCount,
  });
}

// Lightweight GET so the UI can show "Joined ✓" on page load.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const comp = getCompetitionBySlug(slug);
  if (!comp) {
    return NextResponse.json({ success: false, error: 'Competition not found' }, { status: 404 });
  }
  const user = await getCurrentUser();
  return NextResponse.json({
    success: true,
    joined: user ? hasUserJoined(comp.id, user.userId) : false,
  });
}
