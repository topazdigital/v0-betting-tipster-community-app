import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-border bg-card pb-20 md:pb-0">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <span className="font-mono text-lg font-bold text-primary-foreground">B</span>
              </div>
              <span className="font-semibold text-foreground">Betcheza</span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground">
              Your trusted betting tips community. Get expert predictions, track your performance, and compete with other tipsters.
            </p>
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
              <Link href="/responsible-gambling" className="text-sm text-muted-foreground hover:text-foreground">
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
            &copy; {new Date().getFullYear()} Betcheza. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            18+ | Gamble Responsibly | BeGambleAware.org
          </p>
        </div>
      </div>
    </footer>
  );
}
