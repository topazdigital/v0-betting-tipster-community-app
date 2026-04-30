import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { setUserRoleOverride } from '@/lib/user-role-overrides';
import {
  getApplication,
  reviewApplication,
} from '@/lib/tipster-applications-store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface Ctx { params: Promise<{ id: string }> }

/**
 * PATCH { decision: 'approve' | 'reject', note?, grantVerified? }
 *
 * Admin (or anyone with admin.users.role permission) approves or rejects an
 * application. Approval flips the user's role to `tipster` immediately.
 */
export async function PATCH(request: NextRequest, ctx: Ctx) {
  const me = await getCurrentUser();
  if (!me || !hasPermission(me.role, 'admin.users.role')) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const { id } = await ctx.params;
  const body = await request.json().catch(() => ({} as Record<string, unknown>));
  const decision = body.decision === 'approve' ? 'approve' : body.decision === 'reject' ? 'reject' : null;
  if (!decision) {
    return NextResponse.json({ error: 'invalid decision' }, { status: 400 });
  }
  const note = typeof body.note === 'string' ? body.note : undefined;
  const grantVerified = !!body.grantVerified;

  const existing = await getApplication(id);
  if (!existing) {
    return NextResponse.json({ error: 'application not found' }, { status: 404 });
  }
  if (existing.status !== 'pending') {
    return NextResponse.json(
      { error: `Application is already ${existing.status}.` },
      { status: 400 },
    );
  }

  const updated = await reviewApplication(id, {
    reviewerId: me.userId,
    decision,
    note,
    grantVerified,
  });
  if (!updated) {
    return NextResponse.json({ error: 'review failed' }, { status: 500 });
  }

  // On approval — promote the user's role so they can post tips immediately.
  if (decision === 'approve') {
    setUserRoleOverride(updated.userId, 'tipster');
  }

  return NextResponse.json({ application: updated });
}
