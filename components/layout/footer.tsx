'use client';

import Link from 'next/link';
import useSWR from 'swr';
import {
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Linkedin,
  Send,
  MessageCircle,
  Music2,
  Github,
  Twitch,
  type LucideIcon,
} from 'lucide-react';

interface SocialLink {
  platform: string;
  url: string;
  handle?: string;
  enabled?: boolean;
}

interface PublicSettings {
  siteName?: string;
  siteDescription?: string;
  socialLinks?: SocialLink[];
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const PLATFORM_META: Record<string, { label: string; icon: LucideIcon }> = {
  twitter: { label: 'Twitter / X', icon: Twitter },
  x: { label: 'X', icon: Twitter },
  facebook: { label: 'Facebook', icon: Facebook },
  instagram: { label: 'Instagram', icon: Instagram },
  youtube: { label: 'YouTube', icon: Youtube },
  tiktok: { label: 'TikTok', icon: Music2 },
  telegram: { label: 'Telegram', icon: Send },
  whatsapp: { label: 'WhatsApp', icon: MessageCircle },
  linkedin: { label: 'LinkedIn', icon: Linkedin },
  discord: { label: 'Discord', icon: MessageCircle },
  github: { label: 'GitHub', icon: Github },
  twitch: { label: 'Twitch', icon: Twitch },
};

function SocialIcons({
  links,
  size = 'md',
}: {
  links: SocialLink[];
  size?: 'sm' | 'md' | 'lg';
}) {
  if (!links || links.length === 0) return null;
  const dims =
    size === 'lg'
      ? 'h-11 w-11'
      : size === 'sm'
        ? 'h-8 w-8'
        : 'h-9 w-9';
  const iconSize = size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';
  return (
    <div className="flex flex-wrap items-center gap-2">
      {links.map((link) => {
        const meta = PLATFORM_META[link.platform.toLowerCase()];
        const Icon = meta?.icon ?? MessageCircle;
        const label = meta?.label ?? link.platform;
        return (
          <a
            key={link.platform + link.url}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${label}${link.handle ? ` (${link.handle})` : ''}`}
            title={link.handle ? `${label} — ${link.handle}` : label}
            className={cn(
              'inline-flex items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:border-primary hover:bg-primary/10 hover:text-primary',
              dims,
            )}
          >
            <Icon className={iconSize} />
          </a>
        );
      })}
    </div>
  );
}

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

export function Footer() {
  const { data } = useSWR<PublicSettings>('/api/site-settings', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  });
  const siteName = data?.siteName || 'Betcheza';
  const description =
    data?.siteDescription ||
    'Your trusted betting tips community. Get expert predictions, track your performance, and compete with other tipsters.';
  const socialLinks = (data?.socialLinks ?? []).filter(
    (l) => l.enabled !== false && l.url,
  );

  return (
    <footer className="border-t border-border bg-card pb-20 md:pb-0">
      {/* Promoted "Follow us" social bar — sits above the footer columns */}
      {socialLinks.length > 0 && (
        <div className="border-b border-border bg-muted/40">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-4 sm:flex-row">
            <div className="text-center sm:text-left">
              <p className="text-sm font-semibold text-foreground">
                Join our sports betting community
              </p>
              <p className="text-xs text-muted-foreground">
                Follow {siteName} on your favourite social network
              </p>
            </div>
            <SocialIcons links={socialLinks} size="lg" />
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <span className="font-mono text-lg font-bold text-primary-foreground">B</span>
              </div>
              <span className="font-semibold text-foreground">{siteName}</span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground">{description}</p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">Quick Links</h3>
            <nav className="flex flex-col gap-2">
              <Link href="/matches" className="text-sm text-muted-foreground hover:text-foreground">
                Matches
              </Link>
              <Link href="/results" className="text-sm text-muted-foreground hover:text-foreground">
                Results
              </Link>
              <Link href="/tipsters" className="text-sm text-muted-foreground hover:text-foreground">
                Tipsters
              </Link>
              <Link href="/leaderboard" className="text-sm text-muted-foreground hover:text-foreground">
                Leaderboard
              </Link>
              <Link href="/competitions" className="text-sm text-muted-foreground hover:text-foreground">
                Competitions
              </Link>
            </nav>
          </div>

          {/* Support */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">Support</h3>
            <nav className="flex flex-col gap-2">
              <Link href="/help" className="text-sm text-muted-foreground hover:text-foreground">
                Help Center
              </Link>
              <Link href="/faq" className="text-sm text-muted-foreground hover:text-foreground">
                FAQ
              </Link>
              <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground">
                Contact Us
              </Link>
              <Link
                href="/responsible-gambling"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Responsible Gambling
              </Link>
            </nav>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">Legal</h3>
            <nav className="flex flex-col gap-2">
              <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">
                Terms of Service
              </Link>
              <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
                Privacy Policy
              </Link>
              <Link href="/cookies" className="text-sm text-muted-foreground hover:text-foreground">
                Cookie Policy
              </Link>
            </nav>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} {siteName}. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            18+ | Gamble Responsibly | BeGambleAware.org
          </p>
        </div>
      </div>
    </footer>
  );
}
