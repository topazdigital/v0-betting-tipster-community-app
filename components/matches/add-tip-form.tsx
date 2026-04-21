"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Lock, Send, AlertCircle, Check, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface MarketOdds {
  key: string
  name: string
  outcomes: Array<{
    name: string
    price: number
  }>
}

interface AddTipFormProps {
  matchId: string
  homeTeam: string
  awayTeam: string
  odds?: {
    home: number
    draw?: number
    away: number
  }
  markets?: MarketOdds[]
  onSubmit?: (data: TipFormData) => void
  isPremiumUser?: boolean
}

interface TipFormData {
  prediction: string
  predictionLabel: string
  odds: number
  stake: number
  confidence: number
  analysis: string
  isPremium: boolean
  marketKey: string
}

// Generate comprehensive markets from basic odds - now using seeded random for consistency
function generateMarketsFromOdds(
  homeTeam: string,
  awayTeam: string,
  baseOdds?: { home: number; draw?: number; away: number }
): MarketOdds[] {
  const home = baseOdds?.home || 2.1
  const draw = baseOdds?.draw || 3.4
  const away = baseOdds?.away || 3.2
  
  // Use team names for consistent seeding
  const hashCode = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  };
  
  const seed = hashCode(homeTeam + awayTeam);
  const seededRandom = (offset: number) => ((seed + offset) % 100) / 100;

  return [
    {
      key: 'h2h',
      name: 'Match Result (1X2)',
      outcomes: [
        { name: `${homeTeam} Win`, price: home },
        { name: 'Draw', price: draw },
        { name: `${awayTeam} Win`, price: away },
      ]
    },
    {
      key: 'double_chance',
      name: 'Double Chance',
      outcomes: [
        { name: `${homeTeam} or Draw`, price: Math.round((1 / (1/home + 1/draw)) * 100) / 100 },
        { name: `${awayTeam} or Draw`, price: Math.round((1 / (1/away + 1/draw)) * 100) / 100 },
        { name: `${homeTeam} or ${awayTeam}`, price: Math.round((1 / (1/home + 1/away)) * 100) / 100 },
      ]
    },
    {
      key: 'btts',
      name: 'Both Teams to Score',
      outcomes: [
        { name: 'Yes', price: Math.round((1.7 + seededRandom(1) * 0.3) * 100) / 100 },
        { name: 'No', price: Math.round((2.0 + seededRandom(2) * 0.3) * 100) / 100 },
      ]
    },
    {
      key: 'over_under_1_5',
      name: 'Over/Under 1.5 Goals',
      outcomes: [
        { name: 'Over 1.5', price: Math.round((1.35 + seededRandom(3) * 0.2) * 100) / 100 },
        { name: 'Under 1.5', price: Math.round((2.8 + seededRandom(4) * 0.4) * 100) / 100 },
      ]
    },
    {
      key: 'over_under_2_5',
      name: 'Over/Under 2.5 Goals',
      outcomes: [
        { name: 'Over 2.5', price: Math.round((1.8 + seededRandom(5) * 0.4) * 100) / 100 },
        { name: 'Under 2.5', price: Math.round((1.95 + seededRandom(6) * 0.3) * 100) / 100 },
      ]
    },
    {
      key: 'over_under_3_5',
      name: 'Over/Under 3.5 Goals',
      outcomes: [
        { name: 'Over 3.5', price: Math.round((2.3 + seededRandom(7) * 0.5) * 100) / 100 },
        { name: 'Under 3.5', price: Math.round((1.55 + seededRandom(8) * 0.2) * 100) / 100 },
      ]
    },
    {
      key: 'ht_result',
      name: 'Half Time Result',
      outcomes: [
        { name: `${homeTeam} HT`, price: Math.round((home * 1.4) * 100) / 100 },
        { name: 'Draw HT', price: Math.round((draw * 0.75) * 100) / 100 },
        { name: `${awayTeam} HT`, price: Math.round((away * 1.4) * 100) / 100 },
      ]
    },
    {
      key: 'correct_score',
      name: 'Correct Score',
      outcomes: [
        { name: '1-0', price: Math.round((6.5 + seededRandom(9) * 2) * 100) / 100 },
        { name: '2-0', price: Math.round((8 + seededRandom(10) * 3) * 100) / 100 },
        { name: '2-1', price: Math.round((8.5 + seededRandom(11) * 3) * 100) / 100 },
        { name: '0-0', price: Math.round((10 + seededRandom(12) * 4) * 100) / 100 },
        { name: '1-1', price: Math.round((6 + seededRandom(13) * 2) * 100) / 100 },
        { name: '0-1', price: Math.round((9 + seededRandom(14) * 3) * 100) / 100 },
        { name: '0-2', price: Math.round((12 + seededRandom(15) * 4) * 100) / 100 },
        { name: '1-2', price: Math.round((11 + seededRandom(16) * 4) * 100) / 100 },
        { name: '2-2', price: Math.round((12 + seededRandom(17) * 5) * 100) / 100 },
        { name: '3-0', price: Math.round((15 + seededRandom(18) * 5) * 100) / 100 },
        { name: '3-1', price: Math.round((14 + seededRandom(19) * 5) * 100) / 100 },
      ]
    },
    {
      key: 'first_goal',
      name: 'First Team to Score',
      outcomes: [
        { name: homeTeam, price: Math.round((1.8 + seededRandom(20) * 0.3) * 100) / 100 },
        { name: awayTeam, price: Math.round((2.1 + seededRandom(21) * 0.4) * 100) / 100 },
        { name: 'No Goal', price: Math.round((9 + seededRandom(22) * 3) * 100) / 100 },
      ]
    },
    {
      key: 'handicap',
      name: 'Asian Handicap',
      outcomes: [
        { name: `${homeTeam} -1`, price: Math.round((home * 1.6) * 100) / 100 },
        { name: `${awayTeam} +1`, price: Math.round((away * 0.7) * 100) / 100 },
        { name: `${homeTeam} -2`, price: Math.round((home * 2.5) * 100) / 100 },
        { name: `${awayTeam} +2`, price: Math.round((away * 0.5) * 100) / 100 },
      ]
    },
  ]
}

export function AddTipForm({ 
  matchId, 
  homeTeam, 
  awayTeam, 
  odds,
  markets: providedMarkets,
  onSubmit,
  isPremiumUser = false 
}: AddTipFormProps) {
  const [selectedMarketKey, setSelectedMarketKey] = useState<string>("")
  const [selectedOutcome, setSelectedOutcome] = useState<{ name: string; price: number } | null>(null)
  const [stake, setStake] = useState(3)
  const [confidence, setConfidence] = useState([70])
  const [analysis, setAnalysis] = useState("")
  const [isPremium, setIsPremium] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Generate or use provided markets
  const allMarkets = useMemo(() => {
    if (providedMarkets && providedMarkets.length > 0) {
      return providedMarkets
    }
    return generateMarketsFromOdds(homeTeam, awayTeam, odds)
  }, [providedMarkets, homeTeam, awayTeam, odds])

  // Get selected market
  const selectedMarket = allMarkets.find(m => m.key === selectedMarketKey)

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (!selectedOutcome) newErrors.prediction = "Please select a prediction from the markets"
    if (analysis.length < 20) newErrors.analysis = "Analysis must be at least 20 characters"
    if (analysis.length > 500) newErrors.analysis = "Analysis must be under 500 characters"
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSelectOutcome = (market: MarketOdds, outcome: { name: string; price: number }) => {
    setSelectedMarketKey(market.key)
    setSelectedOutcome(outcome)
    // Clear any prediction errors
    setErrors(prev => ({ ...prev, prediction: "" }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validate() || !selectedOutcome) return

    setIsSubmitting(true)
    
    const data: TipFormData = {
      prediction: `${selectedMarketKey}:${selectedOutcome.name}`,
      predictionLabel: selectedOutcome.name,
      odds: selectedOutcome.price,
      stake,
      confidence: confidence[0],
      analysis,
      isPremium: isPremiumUser && isPremium,
      marketKey: selectedMarketKey,
    }

    try {
      if (onSubmit) {
        await onSubmit(data)
      }
      // Reset form
      setSelectedMarketKey("")
      setSelectedOutcome(null)
      setStake(3)
      setConfidence([70])
      setAnalysis("")
      setIsPremium(false)
    } catch (error) {
      console.error("Failed to submit tip:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Add Your Tip</CardTitle>
        <p className="text-sm text-muted-foreground">
          Select a market and outcome - odds are auto-filled
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Selected Prediction Display */}
          {selectedOutcome && (
            <div className="rounded-lg border-2 border-primary bg-primary/5 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    {selectedMarket?.name}
                  </p>
                  <p className="text-lg font-semibold text-foreground">
                    {selectedOutcome.name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Odds</p>
                  <p className="text-2xl font-bold text-primary">
                    {selectedOutcome.price.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Market Selection */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              Select Market & Prediction <span className="text-destructive">*</span>
              {errors.prediction && (
                <span className="text-xs text-destructive">{errors.prediction}</span>
              )}
            </Label>
            
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {allMarkets.map((market) => (
                <div key={market.key} className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {market.name}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {market.outcomes.map((outcome) => {
                      const isSelected = selectedMarketKey === market.key && 
                                       selectedOutcome?.name === outcome.name
                      return (
                        <button
                          key={`${market.key}-${outcome.name}`}
                          type="button"
                          onClick={() => handleSelectOutcome(market, outcome)}
                          className={cn(
                            "relative flex flex-col items-center rounded-lg border-2 px-4 py-2 text-sm transition-all min-w-[90px]",
                            isSelected
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border hover:border-primary/50 hover:bg-muted"
                          )}
                        >
                          {isSelected && (
                            <Check className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-primary text-white p-0.5" />
                          )}
                          <span className="font-medium text-xs text-center line-clamp-2">
                            {outcome.name}
                          </span>
                          <span className={cn(
                            "font-bold text-base",
                            isSelected ? "text-primary" : "text-foreground"
                          )}>
                            {outcome.price.toFixed(2)}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stake */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Stake (Confidence Level)</Label>
              <span className="text-sm font-semibold">{stake}/5</span>
            </div>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStake(s)}
                  className={cn(
                    "flex-1 rounded-lg border-2 py-2 text-sm font-medium transition-all",
                    stake === s
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted hover:border-primary/50"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              1 = Low confidence, 5 = High confidence
            </p>
          </div>

          {/* Confidence Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Confidence Percentage</Label>
              <span className="text-sm font-semibold">{confidence[0]}%</span>
            </div>
            <Slider
              value={confidence}
              onValueChange={setConfidence}
              max={100}
              min={50}
              step={5}
              className="py-2"
            />
          </div>

          {/* Analysis */}
          <div className="space-y-2">
            <Label htmlFor="analysis">
              Analysis <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="analysis"
              placeholder="Share your reasoning for this prediction..."
              value={analysis}
              onChange={(e) => setAnalysis(e.target.value)}
              rows={4}
              className={cn(errors.analysis && "border-destructive")}
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              {errors.analysis ? (
                <p className="text-destructive">{errors.analysis}</p>
              ) : (
                <span>Min 20 characters</span>
              )}
              <span>{analysis.length}/500</span>
            </div>
          </div>

          {/* Premium Toggle */}
          {isPremiumUser && (
            <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-3">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-warning" />
                <div>
                  <p className="text-sm font-medium">Premium Tip</p>
                  <p className="text-xs text-muted-foreground">
                    Only subscribers can view the full analysis
                  </p>
                </div>
              </div>
              <Switch
                checked={isPremium}
                onCheckedChange={setIsPremium}
              />
            </div>
          )}

          {/* Potential Returns Preview */}
          {selectedOutcome && (
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                <span className="text-sm text-muted-foreground">Potential return (10 units):</span>
              </div>
              <span className="font-semibold text-emerald-500">
                {(10 * selectedOutcome.price).toFixed(2)} units
              </span>
            </div>
          )}

          {/* Warning */}
          <div className="flex items-start gap-2 rounded-lg bg-warning/10 p-3 text-sm">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <p className="text-muted-foreground">
              Your tip will be visible to the community and will affect your tipster statistics. 
              Make sure you&apos;ve analyzed the match thoroughly.
            </p>
          </div>

          {/* Submit */}
          <Button 
            type="submit" 
            className="w-full gap-2"
            disabled={isSubmitting || !selectedOutcome}
          >
            <Send className="h-4 w-4" />
            {isSubmitting ? "Submitting..." : selectedOutcome ? `Submit Tip @ ${selectedOutcome.price.toFixed(2)}` : "Select a prediction"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
