import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import {
  getOAuthConfig,
  saveOAuthConfig,
  maskedOAuthConfig,
  type OAuthAllConfig,
} from '@/lib/oauth-config-store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'admin' && (user.role as string) !== 'super_admin')) return null;
  return user;
}

export async function GET() {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const cfg = await getOAuthConfig();
  return NextResponse.json({ config: maskedOAuthConfig(cfg) });
}

export async function PUT(req: Request) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as Partial<OAuthAllConfig>;
  const saved = await saveOAuthConfig(body);
  return NextResponse.json({ config: maskedOAuthConfig(saved) });
}
