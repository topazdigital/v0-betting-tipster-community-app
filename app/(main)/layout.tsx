"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Home, Calendar, Trophy, Users, BarChart3, Radio, Bookmark,
  Menu, X, Search, Bell, Settings, LogIn, LogOut, ChevronDown,
  Star, Wallet, User
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { ThemeToggle } from "@/components/theme-toggle"
import { BottomNav } from "@/components/layout/bottom-nav"
import { useMatchStats } from "@/lib/hooks/use-matches"

// ✅ FIX: import correct export and alias it
import { ALL_SPORTS as SPORTS_LIST, getSportIcon } from "@/lib/sports-data"

const mainNavItems: Array<{ href: string; label: string; icon: typeof Home; badgeKey?: 'live' | 'today' }> = [
  { href: "/", label: "Home", icon: Home },
  { href: "/live", label: "Live", icon: Radio, badgeKey: 'live' },
  { href: "/matches", label: "Matches", icon: Calendar, badgeKey: 'today' },
  { href: "/tipsters", label: "Tipsters", icon: Users },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/competitions", label: "Competitions", icon: Star },
  { href: "/bookmakers", label: "Bookmakers", icon: Wallet },
  { href: "/results", label: "Results", icon: BarChart3 },
]

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, isAuthenticated, logout, isLoading } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showSports, setShowSports] = useState(true)
  const stats = useMatchStats()

  return (
    <div className="min-h-screen bg-background">
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 transform border-r border-border bg-card transition-transform lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold">
              BT
            </div>
            <span className="text-lg font-bold">BetTips Pro</span>
          </Link>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="space-y-1 p-3">
          {mainNavItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </div>
                {item.badgeKey && (() => {
                  const count = item.badgeKey === 'live' ? stats.live : stats.today
                  if (!count) return null
                  return (
                    <span className={cn(
                      "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold",
                      isActive ? "bg-white/20 text-white" : (item.badgeKey === 'live' ? "bg-red-500 text-white" : "bg-primary text-primary-foreground")
                    )}>
                      {count}
                    </span>
                  )
                })()}
              </Link>
            )
          })}
        </nav>

        {/* Sports */}
        <div className="border-t border-border p-3">
          <button 
            onClick={() => setShowSports(!showSports)}
            className="flex w-full items-center justify-between px-3 py-2 text-sm font-semibold text-muted-foreground"
          >
            Sports
            <ChevronDown className={cn("h-4 w-4 transition-transform", showSports && "rotate-180")} />
          </button>

          {showSports && (
            <div className="mt-1 max-h-64 space-y-0.5 overflow-y-auto">
              {SPORTS_LIST?.slice(0, 15).map((sport) => (
                <Link
                  key={sport.id}
                  href={`/matches?sport=${sport.slug}`}
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <span>{getSportIcon(sport.slug)}</span>
                  {sport.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Admin - only visible for admin users */}
        {isAuthenticated && user?.role === 'admin' && (
          <div className="absolute bottom-0 left-0 right-0 border-t border-border p-3">
            <Link href="/admin" className="flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-muted rounded-lg text-primary">
              <Settings className="h-5 w-5" />
              Admin Panel
            </Link>
          </div>
        )}
      </aside>

      {/* Main */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-card px-4">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>

          <div className="relative hidden flex-1 max-w-md md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search..." className="pl-9" />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Bookmark className="h-5 w-5" />
            </Button>
            
            {isLoading ? (
              <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
            ) : isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                      {user.displayName?.charAt(0).toUpperCase() || user.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span className="hidden sm:inline">{user.displayName || user.username}</span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="p-2">
                    <p className="font-medium">{user.displayName || user.username}</p>
                    <p className="text-xs text-muted-foreground">@{user.username}</p>
                    {user.balance !== undefined && (
                      <p className="mt-1 font-mono text-sm text-success">
                        KES {user.balance?.toLocaleString() || '0'}
                      </p>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">
                      <User className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/tips">
                      My Tips
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/wallet">
                      Wallet
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {user.role === 'admin' && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="text-primary">
                          <Settings className="mr-2 h-4 w-4" />
                          Admin Panel
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={logout} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">Login</Link>
                </Button>
                <Button size="sm" className="hidden md:flex gap-2" asChild>
                  <Link href="/register">
                    <LogIn className="h-4 w-4" />
                    Sign Up
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </header>

        <main className="p-4 pb-20 md:pb-4">{children}</main>
        
        {/* Mobile Bottom Navigation */}
        <BottomNav />
      </div>
    </div>
  )
}
