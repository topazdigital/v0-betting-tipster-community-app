import type { Metadata } from 'next';
import { getSiteSettings } from '@/lib/site-settings';

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings();
  const title = `AI Predictor · ${s.site_name}`;
  const description = `Free AI-powered match predictions on ${s.site_name}. Get probability-based picks across football, basketball, tennis, and more — updated continuously from real bookmaker odds.`;
  return {
    title,
    description,
    openGraph: { title, description, type: 'website' },
    twitter: { title, description, card: 'summary_large_image' },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
