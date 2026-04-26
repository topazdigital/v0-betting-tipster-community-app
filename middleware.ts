import { NextResponse, type NextRequest } from 'next/server';

/**
 * Edge middleware that:
 *   1. Applies admin-managed URL rewrites (redirects).
 *   2. Forwards the current pathname as `x-pathname` so the root layout can
 *      compute per-page SEO metadata via `generateMetadata`.
 *
 * Rewrites are fetched from the public /api/site-settings/rewrites endpoint
 * with a short edge-cache so we never hit the DB layer here (the edge
 * runtime can't load Node-only modules like mysql2).
 */

interface CachedRewrites {
  rules: Array<{ source: string; destination: string; permanent?: boolean }>;
  ts: number;
}

const TTL_MS = 30_000;
let cache: CachedRewrites | null = null;

async function loadRewrites(origin: string): Promise<CachedRewrites['rules']> {
  if (cache && Date.now() - cache.ts < TTL_MS) return cache.rules;
  try {
    const res = await fetch(`${origin}/api/site-settings/rewrites`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      cache = { rules: [], ts: Date.now() };
      return [];
    }
    const data = (await res.json()) as { rewrites?: CachedRewrites['rules'] };
    cache = { rules: Array.isArray(data.rewrites) ? data.rewrites : [], ts: Date.now() };
    return cache.rules;
  } catch {
    cache = { rules: [], ts: Date.now() };
    return [];
  }
}

export async function middleware(req: NextRequest) {
  const { pathname, search, origin } = req.nextUrl;

  if (
    !pathname.startsWith('/_next') &&
    !pathname.startsWith('/api') &&
    !pathname.startsWith('/static') &&
    !/\.[a-zA-Z0-9]{1,5}$/.test(pathname)
  ) {
    const rules = await loadRewrites(origin);
    for (const rule of rules) {
      const dest = matchRewrite(pathname, rule.source, rule.destination);
      if (dest) {
        const url = req.nextUrl.clone();
        url.pathname = dest;
        url.search = search;
        return NextResponse.redirect(url, rule.permanent ? 308 : 307);
      }
    }
  }

  const res = NextResponse.next();
  res.headers.set('x-pathname', pathname);
  return res;
}

function matchRewrite(pathname: string, source: string, destination: string): string | null {
  if (!source.startsWith('/')) return null;
  if (source.endsWith('/*')) {
    const prefix = source.slice(0, -1);
    if (!pathname.startsWith(prefix)) return null;
    const rest = pathname.slice(prefix.length);
    if (destination.endsWith('/*')) return destination.slice(0, -1) + rest;
    return destination;
  }
  return pathname === source ? destination : null;
}

export const config = {
  matcher: ['/((?!_next/|api/|.*\\..*).*)'],
};
