'use client';

import { useState } from 'react';
import { 
  Search, 
  Star, 
  ExternalLink, 
  Shield, 
  Gift, 
  Smartphone,
  Globe,
  Check,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SidebarNew } from '@/components/layout/sidebar-new';
import { cn } from '@/lib/utils';

// Extended bookmaker data
const bookmakers = [
  {
    id: 1,
    name: 'Bet365',
    slug: 'bet365',
    logo: 'B365',
    rating: 4.8,
    bonus: 'Up to $200 in Bet Credits',
    bonusCode: 'BET365NEW',
    affiliateUrl: 'https://bet365.com',
    regions: ['UK', 'EU', 'AU'],
    features: ['Live Streaming', 'Cash Out', 'Bet Builder', 'Mobile App'],
    minDeposit: 10,
    paymentMethods: ['Visa', 'Mastercard', 'PayPal', 'Skrill'],
    pros: ['Excellent live streaming', 'Wide market coverage', 'Competitive odds'],
    cons: ['Limited crypto options'],
    featured: true,
    established: 2000,
  },
  {
    id: 2,
    name: 'Betway',
    slug: 'betway',
    logo: 'BW',
    rating: 4.6,
    bonus: '100% up to KES 5,000',
    bonusCode: 'BETWAY100',
    affiliateUrl: 'https://betway.com',
    regions: ['UK', 'KE', 'NG', 'GH'],
    features: ['Quick Payouts', 'Mobile App', 'Live Betting', 'Virtual Sports'],
    minDeposit: 100,
    paymentMethods: ['M-Pesa', 'Airtel Money', 'Visa', 'Mastercard'],
    pros: ['Great for African markets', 'M-Pesa support', 'Fast withdrawals'],
    cons: ['Limited streaming'],
    featured: true,
    established: 2006,
  },
  {
    id: 3,
    name: '1xBet',
    slug: '1xbet',
    logo: '1X',
    rating: 4.4,
    bonus: '100% up to $130',
    bonusCode: '1XBONUS',
    affiliateUrl: 'https://1xbet.com',
    regions: ['KE', 'NG', 'GH', 'EU', 'AS'],
    features: ['Crypto Betting', 'Live Streaming', 'Accumulator Bonus', 'Mobile App'],
    minDeposit: 1,
    paymentMethods: ['M-Pesa', 'Bitcoin', 'Visa', 'Skrill', 'Neteller'],
    pros: ['Huge market selection', 'Crypto support', 'Low minimum deposit'],
    cons: ['Complex interface'],
    featured: true,
    established: 2007,
  },
  {
    id: 4,
    name: 'Sportybet',
    slug: 'sportybet',
    logo: 'SB',
    rating: 4.5,
    bonus: '300% First Deposit Bonus',
    bonusCode: 'SPORTY300',
    affiliateUrl: 'https://sportybet.com',
    regions: ['KE', 'NG', 'GH'],
    features: ['Quick Registration', 'Mobile App', 'Live Betting', 'Jackpots'],
    minDeposit: 50,
    paymentMethods: ['M-Pesa', 'Airtel Money', 'Bank Transfer'],
    pros: ['Best for African players', 'Simple interface', 'Great jackpots'],
    cons: ['Limited international markets'],
    featured: true,
    established: 2017,
  },
  {
    id: 5,
    name: 'Betika',
    slug: 'betika',
    logo: 'BK',
    rating: 4.3,
    bonus: '50% First Deposit Bonus',
    bonusCode: 'BETIKA50',
    affiliateUrl: 'https://betika.com',
    regions: ['KE'],
    features: ['Shabiki Jackpot', 'Mobile App', 'Live Betting', 'Virtual Games'],
    minDeposit: 49,
    paymentMethods: ['M-Pesa', 'Airtel Money'],
    pros: ['Kenya focused', 'Popular jackpots', 'Easy to use'],
    cons: ['Kenya only'],
    featured: true,
    established: 2016,
  },
  {
    id: 6,
    name: 'William Hill',
    slug: 'william-hill',
    logo: 'WH',
    rating: 4.7,
    bonus: 'Bet $10 Get $30 in Free Bets',
    bonusCode: 'WHBONUS',
    affiliateUrl: 'https://williamhill.com',
    regions: ['UK', 'EU'],
    features: ['Live Streaming', 'Cash Out', 'Bet Builder', 'Horse Racing'],
    minDeposit: 10,
    paymentMethods: ['Visa', 'Mastercard', 'PayPal', 'Skrill'],
    pros: ['Trusted brand', 'Excellent racing', 'Great promotions'],
    cons: ['Geo-restricted'],
    featured: true,
    established: 1934,
  },
  {
    id: 7,
    name: 'DraftKings',
    slug: 'draftkings',
    logo: 'DK',
    rating: 4.6,
    bonus: '$1,000 Deposit Bonus',
    bonusCode: 'DKBONUS',
    affiliateUrl: 'https://draftkings.com',
    regions: ['US'],
    features: ['Fantasy Sports', 'Live Betting', 'Same Game Parlays', 'Mobile App'],
    minDeposit: 5,
    paymentMethods: ['PayPal', 'Visa', 'Mastercard', 'Bank Transfer'],
    pros: ['Best US sportsbook', 'Fantasy integration', 'Great promos'],
    cons: ['US only'],
    featured: true,
    established: 2012,
  },
  {
    id: 8,
    name: 'Betfair',
    slug: 'betfair',
    logo: 'BF',
    rating: 4.5,
    bonus: 'Up to $20 in Free Bets',
    bonusCode: 'FAIRBET',
    affiliateUrl: 'https://betfair.com',
    regions: ['UK', 'EU', 'AU'],
    features: ['Betting Exchange', 'Cash Out', 'Live Streaming', 'Same Game Multi'],
    minDeposit: 10,
    paymentMethods: ['Visa', 'Mastercard', 'PayPal', 'Skrill'],
    pros: ['Unique exchange model', 'Best odds', 'Lay betting'],
    cons: ['Complex for beginners'],
    featured: true,
    established: 2000,
  },
];

const regions = [
  { value: 'all', label: 'All Regions' },
  { value: 'KE', label: 'Kenya' },
  { value: 'NG', label: 'Nigeria' },
  { value: 'UK', label: 'United Kingdom' },
  { value: 'US', label: 'United States' },
  { value: 'EU', label: 'Europe' },
  { value: 'AU', label: 'Australia' },
];

export default function BookmakersPage() {
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('all');
  const [sortBy, setSortBy] = useState('rating');

  const filteredBookmakers = bookmakers
    .filter(b => {
      if (search) {
        return b.name.toLowerCase().includes(search.toLowerCase());
      }
      return true;
    })
    .filter(b => {
      if (regionFilter !== 'all') {
        return b.regions.includes(regionFilter);
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'rating': return b.rating - a.rating;
        case 'name': return a.name.localeCompare(b.name);
        case 'bonus': return b.minDeposit - a.minDeposit;
        default: return b.rating - a.rating;
      }
    });

  return (
    <div className="flex">
      <SidebarNew />
      <div className="flex-1 overflow-hidden">
        <div className="mx-auto max-w-5xl px-4 py-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
              <Globe className="h-7 w-7 text-primary" />
              Bookmakers
            </h1>
            <p className="text-sm text-muted-foreground">
              Compare and find the best betting sites with exclusive bonuses
            </p>
          </div>

          {/* Filters */}
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search bookmakers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger className="w-40">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Region" />
              </SelectTrigger>
              <SelectContent>
                {regions.map(region => (
                  <SelectItem key={region.value} value={region.value}>
                    {region.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">Top Rated</SelectItem>
                <SelectItem value="name">Name A-Z</SelectItem>
                <SelectItem value="bonus">Best Bonus</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results */}
          <div className="mb-4 text-sm text-muted-foreground">
            {filteredBookmakers.length} bookmaker{filteredBookmakers.length !== 1 ? 's' : ''} found
          </div>

          {/* Bookmakers Grid */}
          <div className="grid gap-6">
            {filteredBookmakers.map((bookie, index) => (
              <div 
                key={bookie.id}
                className={cn(
                  'rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-lg',
                  index === 0 && 'border-primary/30 bg-gradient-to-r from-primary/5 to-transparent'
                )}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  {/* Logo and basic info */}
                  <div className="flex items-start gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-primary text-xl font-bold text-primary-foreground">
                      {bookie.logo}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold">{bookie.name}</h3>
                        {index === 0 && (
                          <Badge variant="default" className="bg-gradient-to-r from-warning to-warning/80">
                            <Star className="mr-1 h-3 w-3" />
                            Top Rated
                          </Badge>
                        )}
                        {bookie.featured && index !== 0 && (
                          <Badge variant="secondary">Featured</Badge>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={cn(
                                'h-4 w-4',
                                i < Math.floor(bookie.rating) 
                                  ? 'fill-warning text-warning' 
                                  : 'text-muted'
                              )} 
                            />
                          ))}
                        </div>
                        <span className="font-semibold">{bookie.rating}</span>
                        <span className="text-sm text-muted-foreground">
                          Est. {bookie.established}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {bookie.regions.map(region => (
                          <Badge key={region} variant="outline" className="text-xs">
                            {region}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Bonus */}
                  <div className="flex-1 sm:text-right">
                    <div className="rounded-lg bg-success/10 p-3 sm:inline-block">
                      <div className="flex items-center gap-2 sm:justify-end">
                        <Gift className="h-5 w-5 text-success" />
                        <span className="font-bold text-success">Welcome Bonus</span>
                      </div>
                      <div className="mt-1 text-lg font-bold">{bookie.bonus}</div>
                      {bookie.bonusCode && (
                        <div className="mt-1 font-mono text-xs text-muted-foreground">
                          Code: {bookie.bonusCode}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {bookie.features.map(feature => (
                    <div key={feature} className="flex items-center gap-1.5 text-sm">
                      <Check className="h-4 w-4 text-success" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Payment Methods */}
                <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Payment:</span>
                  {bookie.paymentMethods.slice(0, 4).map(method => (
                    <Badge key={method} variant="secondary" className="text-xs">
                      {method}
                    </Badge>
                  ))}
                  {bookie.paymentMethods.length > 4 && (
                    <span className="text-muted-foreground">
                      +{bookie.paymentMethods.length - 4} more
                    </span>
                  )}
                </div>

                {/* Pros and Cons */}
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <div className="mb-2 text-sm font-medium text-success">Pros</div>
                    <ul className="space-y-1">
                      {bookie.pros.map(pro => (
                        <li key={pro} className="flex items-start gap-1.5 text-sm">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                          {pro}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="mb-2 text-sm font-medium text-destructive">Cons</div>
                    <ul className="space-y-1">
                      {bookie.cons.map(con => (
                        <li key={con} className="flex items-start gap-1.5 text-sm text-muted-foreground">
                          <span className="mt-0.5 h-4 w-4 shrink-0 text-center text-destructive">-</span>
                          {con}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* CTA */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                  <div className="text-sm text-muted-foreground">
                    Min. deposit: <span className="font-semibold text-foreground">${bookie.minDeposit}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" asChild>
                      <a href={bookie.affiliateUrl} target="_blank" rel="noopener noreferrer">
                        <Shield className="mr-2 h-4 w-4" />
                        Read Review
                      </a>
                    </Button>
                    <Button asChild>
                      <a href={bookie.affiliateUrl} target="_blank" rel="noopener noreferrer">
                        Visit Site
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
