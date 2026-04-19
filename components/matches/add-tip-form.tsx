"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Lock, Send, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface AddTipFormProps {
  matchId: string
  homeTeam: string
  awayTeam: string
  onSubmit?: (data: TipFormData) => void
  isPremiumUser?: boolean
}

interface TipFormData {
  prediction: string
  odds: number
  stake: number
  confidence: number
  analysis: string
  isPremium: boolean
}

const PREDICTION_OPTIONS = [
  { value: "home_win", label: "Home Win" },
  { value: "draw", label: "Draw" },
  { value: "away_win", label: "Away Win" },
  { value: "btts_yes", label: "Both Teams to Score - Yes" },
  { value: "btts_no", label: "Both Teams to Score - No" },
  { value: "over_1_5", label: "Over 1.5 Goals" },
  { value: "under_1_5", label: "Under 1.5 Goals" },
  { value: "over_2_5", label: "Over 2.5 Goals" },
  { value: "under_2_5", label: "Under 2.5 Goals" },
  { value: "over_3_5", label: "Over 3.5 Goals" },
  { value: "under_3_5", label: "Under 3.5 Goals" },
  { value: "home_draw", label: "Double Chance - Home/Draw" },
  { value: "away_draw", label: "Double Chance - Away/Draw" },
  { value: "home_away", label: "Double Chance - Home/Away" },
  { value: "ht_home", label: "Half Time - Home Win" },
  { value: "ht_draw", label: "Half Time - Draw" },
  { value: "ht_away", label: "Half Time - Away Win" },
]

export function AddTipForm({ 
  matchId, 
  homeTeam, 
  awayTeam, 
  onSubmit,
  isPremiumUser = false 
}: AddTipFormProps) {
  const [prediction, setPrediction] = useState("")
  const [odds, setOdds] = useState("")
  const [stake, setStake] = useState(3)
  const [confidence, setConfidence] = useState([70])
  const [analysis, setAnalysis] = useState("")
  const [isPremium, setIsPremium] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (!prediction) newErrors.prediction = "Please select a prediction"
    if (!odds || parseFloat(odds) < 1.01) newErrors.odds = "Odds must be at least 1.01"
    if (parseFloat(odds) > 100) newErrors.odds = "Odds seem too high"
    if (analysis.length < 20) newErrors.analysis = "Analysis must be at least 20 characters"
    if (analysis.length > 500) newErrors.analysis = "Analysis must be under 500 characters"
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validate()) return

    setIsSubmitting(true)
    
    const data: TipFormData = {
      prediction,
      odds: parseFloat(odds),
      stake,
      confidence: confidence[0],
      analysis,
      isPremium: isPremiumUser && isPremium,
    }

    try {
      if (onSubmit) {
        await onSubmit(data)
      }
      // Reset form
      setPrediction("")
      setOdds("")
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
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Prediction */}
          <div className="space-y-2">
            <Label htmlFor="prediction">
              Prediction <span className="text-destructive">*</span>
            </Label>
            <Select value={prediction} onValueChange={setPrediction}>
              <SelectTrigger className={cn(errors.prediction && "border-destructive")}>
                <SelectValue placeholder="Select your prediction" />
              </SelectTrigger>
              <SelectContent>
                {PREDICTION_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.prediction && (
              <p className="text-xs text-destructive">{errors.prediction}</p>
            )}
          </div>

          {/* Odds */}
          <div className="space-y-2">
            <Label htmlFor="odds">
              Odds <span className="text-destructive">*</span>
            </Label>
            <Input
              id="odds"
              type="number"
              step="0.01"
              min="1.01"
              placeholder="e.g., 1.85"
              value={odds}
              onChange={(e) => setOdds(e.target.value)}
              className={cn(errors.odds && "border-destructive")}
            />
            {errors.odds && (
              <p className="text-xs text-destructive">{errors.odds}</p>
            )}
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

          {/* Warning */}
          <div className="flex items-start gap-2 rounded-lg bg-warning/10 p-3 text-sm">
            <AlertCircle className="mt-0.5 h-4 w-4 text-warning" />
            <p className="text-muted-foreground">
              Your tip will be visible to the community and will affect your tipster statistics. 
              Make sure you&apos;ve analyzed the match thoroughly.
            </p>
          </div>

          {/* Submit */}
          <Button 
            type="submit" 
            className="w-full gap-2"
            disabled={isSubmitting}
          >
            <Send className="h-4 w-4" />
            {isSubmitting ? "Submitting..." : "Submit Tip"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
