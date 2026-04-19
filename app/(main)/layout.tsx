"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Home, Calendar, Trophy, Users, BarChart3, Radio, Bookmark,
  Menu, X, Search, Bell, Settings, LogIn, ChevronDown,
  Star, Wallet
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

// ✅ FIX: import correct export and alias it
import { ALL_SPORTS as SPORTS_LIST } from "@/lib/sports-data"

const mainNavItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/live", label: "Live", icon: Radio, badge: "12" },
  { href: "/matches", label: "Matches", icon: Calendar },
  { href: "/tipsters", label: "Tipsters", icon: Users },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/competitions", label: "Competitions", icon: Star },
  { href: "/bookmakers", label: "Bookmakers", icon: Wallet },
  { href: "/results", label: "Results", icon: BarChart3 },
]

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showSports, setShowSports] = useState(true)

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
                {item.badge && (
                  <span className={cn(
                    "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold",
                    isActive ? "bg-white/20 text-white" : "bg-red-500 text-white"
                  )}>
                    {item.badge}
                  </span>
                )}
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
                  href={`/matches?sport=${sport.id}`}
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <span>{sport.icon}</span>
                  {sport.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Admin */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-border p-3">
          <Link href="/admin" className="flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-muted rounded-lg">
            <Settings className="h-5 w-5" />
            Admin Panel
          </Link>
        </div>
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
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Bookmark className="h-5 w-5" />
            </Button>
            <Button className="hidden md:flex gap-2">
              <LogIn className="h-4 w-4" />
              Sign In
            </Button>
          </div>
        </header>

        <main className="p-4">{children}</main>
      </div>
    </div>
  )
}