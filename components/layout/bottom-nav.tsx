'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, TrendingUp, Trophy, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/matches', label: 'Matches', icon: Calendar },
  { href: '/tipsters', label: 'Tips', icon: TrendingUp },
  { href: '/leaderboard', label: 'Ranks', icon: Trophy },
  { href: '/dashboard', label: 'Profile', icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  // Don't show on admin pages
  if (pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card pb-safe md:hidden">
      <div className="grid h-16 grid-cols-5">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className={cn('h-5 w-5', isActive && 'text-primary')} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
