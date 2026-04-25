import type { Metadata } from "next"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Trophy, Users, Brain, ShieldCheck, Globe2, BarChart3,
  Target, Sparkles, TrendingUp, MessageCircle, Star,
} from "lucide-react"

export const metadata: Metadata = {
  title: "About Betcheza — Africa's Sports Tipster Community",
  description:
    "Betcheza is a transparent sports tipster platform for African bettors. Verified tipsters, real bookmaker odds, AI-assisted predictions, and tracked performance across football, basketball, tennis and more.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About Betcheza",
    description:
      "Verified tipsters, real bookmaker odds, AI predictions and tracked performance.",
    url: "/about",
  },
}

const STATS = [
  { label: "Live matches every day", value: "600+" },
  { label: "Sports leagues covered", value: "120+" },
  { label: "Countries served", value: "20+" },
  { label: "Bookmakers compared", value: "30+" },
]

const FEATURES = [
  {
    icon: Trophy,
    title: "Verified tipster leaderboard",
    body: "Every tipster's record is tracked publicly — win rate, ROI, streak and stake-weighted profit. No editing history.",
  },
  {
    icon: Brain,
    title: "AI co-pilot for every match",
    body: "Our AI generates predictions across 1X2, Double Chance, BTTS, Over/Under, Half-Time and more — and auto-marks them won/lost when the match ends.",
  },
  {
    icon: BarChart3,
    title: "Real bookmaker odds",
    body: "We pull live prices from licensed bookmakers and show the best odds, so you always know who pays the most for your pick.",
  },
  {
    icon: Globe2,
    title: "Local leagues, global coverage",
    body: "From the Kenyan Premier League and CAF competitions to the Champions League, NBA and ATP — we cover what you actually bet on.",
  },
  {
    icon: ShieldCheck,
    title: "No fake selections",
    body: "Tips are time-stamped before kickoff and locked. You see what was posted, when, and how it settled.",
  },
  {
    icon: Users,
    title: "A real community",
    body: "Follow tipsters, comment on tips, join discussions and learn from people who win — not just the loudest voices.",
  },
]

const VALUES = [
  {
    icon: Target,
    title: "Transparency first",
    body: "Win and lose, every result is visible. We don't quietly delete losing slips.",
  },
  {
    icon: Sparkles,
    title: "Quality over noise",
    body: "We rank tipsters by long-term ROI and stake discipline, not who shouts loudest on social media.",
  },
  {
    icon: TrendingUp,
    title: "Built for serious bettors",
    body: "Stake sizing, confidence levels, market depth and bankroll tools — Betcheza is for people who treat betting like a craft.",
  },
]

export default function AboutPage() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-10 space-y-12">
      {/* Hero */}
      <section className="text-center space-y-4">
        <Badge className="bg-primary/10 text-primary border-primary/20">About Betcheza</Badge>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight">
          Betting tips that<br />
          <span className="bg-gradient-to-r from-primary via-fuchsia-500 to-violet-500 bg-clip-text text-transparent">
            actually keep score.
          </span>
        </h1>
        <p className="mx-auto max-w-2xl text-base md:text-lg text-muted-foreground">
          Betcheza is a sports tipster platform built for African bettors. We pair verified
          community tipsters with real bookmaker odds and an AI engine that predicts — and
          then auto-marks — every match across the world&apos;s biggest leagues.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button asChild size="lg" className="gap-2">
            <Link href="/matches">
              <Trophy className="h-4 w-4" />Today&apos;s matches
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="gap-2">
            <Link href="/tipsters">
              <Star className="h-4 w-4" />Browse tipsters
            </Link>
          </Button>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {STATS.map((s) => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl md:text-3xl font-black text-primary">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Story */}
      <section className="space-y-3">
        <h2 className="text-2xl font-bold">Our story</h2>
        <Card>
          <CardContent className="p-6 space-y-3 text-sm md:text-base text-muted-foreground leading-relaxed">
            <p>
              Betcheza started in Nairobi with a simple frustration: every &quot;sure win&quot;
              channel on Telegram was deleting losing slips and screenshotting only the winners.
              We wanted a place where tipsters had to live with their record — good and bad —
              and where the odds you see are the odds you can actually get from a real bookmaker.
            </p>
            <p>
              So we built it. Every tip on Betcheza is locked at submission time. Every result
              is settled by our system the moment the match ends. Every tipster has a public
              ROI you can scroll back through, week by week. No selective memory, no &quot;edit&quot;
              button on yesterday&apos;s slip.
            </p>
            <p>
              We pair this with an AI prediction engine that looks at form, head-to-head, market
              odds and team news — and posts its picks publicly so you can hold it accountable
              too.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Features */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">What you get with Betcheza</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <Card key={title} className="border-border/50">
              <CardContent className="p-5 flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold">{title}</p>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{body}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">What we believe</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {VALUES.map(({ icon: Icon, title, body }) => (
            <Card key={title} className="border-border/50">
              <CardContent className="p-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-fuchsia-500/10 text-fuchsia-500 mb-3">
                  <Icon className="h-4 w-4" />
                </div>
                <p className="font-semibold">{title}</p>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Responsible gambling */}
      <section>
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-5 flex gap-4 items-start">
            <ShieldCheck className="h-6 w-6 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-700 dark:text-amber-400">
                Bet responsibly
              </p>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                Betting involves risk. Only stake what you can afford to lose. Betcheza
                publishes tips and analysis for entertainment and information — we are not a
                bookmaker and we don&apos;t accept wagers. If betting stops being fun, please
                seek help from a qualified support service in your country.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* CTA */}
      <section className="rounded-2xl border border-border/50 bg-gradient-to-br from-primary/8 via-transparent to-fuchsia-500/8 p-8 text-center space-y-4">
        <h2 className="text-2xl md:text-3xl font-black">Ready to bet smarter?</h2>
        <p className="mx-auto max-w-xl text-sm md:text-base text-muted-foreground">
          Join Betcheza, follow the top-ranked tipsters in your favourite league, and start
          tracking every pick you make.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
          <Button asChild size="lg">
            <Link href="/register">Create free account</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="gap-2">
            <Link href="/leaderboard">
              <MessageCircle className="h-4 w-4" />See the leaderboard
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
