import { NextResponse } from 'next/server';
import { getSiteSettings } from '@/lib/site-settings';

export const dynamic = 'force-dynamic';

/**
 * Public, safe-to-read subset of site settings — used by client components
 * (header logo, theme color, etc). No secrets are exposed here.
 */
export async function GET() {
  const s = await getSiteSettings();
  return NextResponse.json({
    siteName: s.site_name,
    siteDescription: s.site_description,
    logoUrl: s.logo_url,
    logoDarkUrl: s.logo_dark_url,
    faviconUrl: s.favicon_url,
    primaryColor: s.primary_color,
    googleAnalyticsId: s.google_analytics_id,
    facebookPixelId: s.facebook_pixel_id,
    twoFactorEnabled: s.twofa_enabled === 'true',
    twoFactorMethod: s.twofa_method,
  });
}
