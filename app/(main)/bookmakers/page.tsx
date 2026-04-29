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
        <div className="mx-auto max-w-5xl px-3 py-3">
          {/* Header */}
          <div className="mb-4">
            <h1 className="flex items-center gap-1.5 text-lg font-bold text-foreground">
              <Globe className="h-5 w-5 text-primary" />
              Bookmakers
            </h1>
            <p className="text-xs text-muted-foreground">
              Compare and find the best betting sites with exclusive bonuses
            </p>
          </div>

          {/* Filters */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search bookmakers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-8 text-xs"
              />
            </div>

            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger className="h-8 w-36 text-xs">
                <Filter className="mr-1.5 h-3 w-3" />
                <SelectValue placeholder="Region" />
              </SelectTrigger>
              <SelectContent>
                {regions.map(region => (
                  <SelectItem key={region.value} value={region.value} className="text-xs">
                    {region.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-8 w-32 text-xs">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating" className="text-xs">Top Rated</SelectItem>
                <SelectItem value="name" className="text-xs">Name A-Z</SelectItem>
                <SelectItem value="bonus" className="text-xs">Best Bonus</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results */}
          <div className="mb-2 text-[11px] text-muted-foreground uppercase tracking-wider">
            {filteredBookmakers.length} bookmaker{filteredBookmakers.length !== 1 ? 's' : ''} found
          </div>

          {/* Bookmakers Grid */}
          <div className="grid gap-2">
            {filteredBookmakers.map((bookie, index) => (
              <div 
                key={bookie.id}
                className={cn(
                  'rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-md',
                  index === 0 && 'border-primary/20 bg-gradient-to-r from-primary/5 to-transparent'
                )}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                  {/* Logo and basic info */}
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary text-lg font-bold text-primary-foreground">
                      {bookie.logo}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-base font-bold">{bookie.name}</h3>
                        {index === 0 && (
                          <Badge variant="default" className="h-4 bg-gradient-to-r from-warning to-warning/80 text-[9px] px-1.5">
                            <Star className="mr-0.5 h-2.5 w-2.5" />
                            Top Rated
                          </Badge>
                        )}
                        {bookie.featured && index !== 0 && (
                          <Badge variant="secondary" className="h-4 text-[9px] px-1.5">Featured</Badge>
                        )}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={cn(
                                'h-3 w-3',
                                i < Math.floor(bookie.rating) 
                                  ? 'fill-warning text-warning' 
                                  : 'text-muted'
                              )} 
                            />
                          ))}
                        </div>
                        <span className="text-xs font-bold">{bookie.rating}</span>
                        <span className="text-[10px] text-muted-foreground">
                          Est. {bookie.established}
                        </span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {bookie.regions.map(region => (
                          <Badge key={region} variant="outline" className="h-3.5 px-1 text-[8px] uppercase">
                            {region}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Bonus */}
                  <div className="flex-1 sm:text-right">
                    <div className="rounded-lg bg-success/10 p-2 sm:inline-block">
                      <div className="flex items-center gap-1.5 sm:justify-end">
                        <Gift className="h-3.5 w-3.5 text-success" />
                        <span className="text-[10px] font-bold text-success uppercase">Welcome Bonus</span>
                      </div>
                      <div className="mt-0.5 text-sm font-bold">{bookie.bonus}</div>
                      {bookie.bonusCode && (
                        <div className="mt-0.5 font-mono text-[9px] text-muted-foreground uppercase">
                          Code: {bookie.bonusCode}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                  {bookie.features.map(feature => (
                    <div key={feature} className="flex items-center gap-1 text-[11px]">
                      <Check className="h-3 w-3 text-success" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Payment Methods */}
                <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[10px]">
                  <span className="text-muted-foreground font-medium">PAYMENT:</span>
                  {bookie.paymentMethods.slice(0, 4).map(method => (
                    <Badge key={method} variant="secondary" className="h-4 px-1.5 text-[9px]">
                      {method}
                    </Badge>
                  ))}
                  {bookie.paymentMethods.length > 4 && (
                    <span className="text-muted-foreground">
                      +{bookie.paymentMethods.length - 4}
                    </span>
                  )}
                </div>

                {/* Pros and Cons */}
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <div className="mb-1 text-[10px] font-bold text-success uppercase tracking-wider">Pros</div>
                    <ul className="space-y-0.5">
                      {bookie.pros.map(pro => (
                        <li key={pro} className="flex items-start gap-1 text-[11px]">
                          <Check className="mt-0.5 h-3 w-3 shrink-0 text-success" />
                          {pro}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="mb-1 text-[10px] font-bold text-destructive uppercase tracking-wider">Cons</div>
                    <ul className="space-y-0.5">
                      {bookie.cons.map(con => (
                        <li key={con} className="flex items-start gap-1 text-[11px] text-muted-foreground">
                          <span className="mt-0.5 h-3 w-3 shrink-0 text-center text-destructive leading-none">-</span>
                          {con}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* CTA */}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                  <div className="text-[10px] text-muted-foreground">
                    Min. deposit: <span className="font-bold text-foreground">${bookie.minDeposit}</span>
                  </div>
                  <div className="flex gap-1.5">
                    <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                      <a href={bookie.affiliateUrl} target="_blank" rel="noopener noreferrer">
                        <Shield className="mr-1.5 h-3.5 w-3.5" />
                        Review
                      </a>
                    </Button>
                    <Button size="sm" className="h-7 text-xs px-4" asChild>
                      <a href={bookie.affiliateUrl} target="_blank" rel="noopener noreferrer">
                        Visit Site
                        <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
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
