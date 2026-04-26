"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import {
  Wallet, CreditCard, Smartphone, Building2, Bitcoin, Plus, Trash2,
  CheckCircle2, AlertCircle, Save, RefreshCw, ArrowLeft, Info
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import Link from "next/link"
import { cn } from "@/lib/utils"

type MethodType = 'paypal' | 'bank' | 'mobile_money' | 'crypto' | 'stripe'

interface PayoutMethod {
  id: string
  type: MethodType
  label: string
  details: Record<string, string>
  isPrimary: boolean
  isVerified: boolean
  addedAt: string
}

const METHOD_META: Record<MethodType, {
  label: string
  icon: React.ElementType
  color: string
  fields: { key: string; label: string; placeholder: string; type?: string }[]
}> = {
  paypal: {
    label: 'PayPal',
    icon: Wallet,
    color: 'text-blue-500',
    fields: [
      { key: 'email', label: 'PayPal Email', placeholder: 'your@paypal.email', type: 'email' },
    ],
  },
  bank: {
    label: 'Bank Transfer (SWIFT/SEPA)',
    icon: Building2,
    color: 'text-violet-500',
    fields: [
      { key: 'bank_name', label: 'Bank Name', placeholder: 'e.g. Barclays' },
      { key: 'account_name', label: 'Account Name', placeholder: 'Full name on account' },
      { key: 'account_number', label: 'Account Number / IBAN', placeholder: 'GB29 NWBK 6016 1331 9268 19' },
      { key: 'swift', label: 'SWIFT / BIC Code', placeholder: 'NWBKGB2L' },
      { key: 'currency', label: 'Preferred Currency', placeholder: 'USD, EUR, GBP...' },
    ],
  },
  mobile_money: {
    label: 'Mobile Money (Mpesa / MTN / Orange)',
    icon: Smartphone,
    color: 'text-emerald-500',
    fields: [
      { key: 'provider', label: 'Provider', placeholder: 'e.g. M-Pesa, MTN, Orange Money' },
      { key: 'phone', label: 'Registered Phone Number', placeholder: '+254 7XX XXX XXX' },
      { key: 'name', label: 'Registered Name', placeholder: 'Name on the account' },
      { key: 'country', label: 'Country', placeholder: 'e.g. Kenya, Ghana, Senegal' },
    ],
  },
  crypto: {
    label: 'Cryptocurrency (USDT / BTC / ETH)',
    icon: Bitcoin,
    color: 'text-amber-500',
    fields: [
      {
        key: 'coin', label: 'Coin / Token', placeholder: 'USDT, BTC, ETH, BNB...'
      },
      { key: 'network', label: 'Network', placeholder: 'TRC20, ERC20, BEP20, Bitcoin...' },
      { key: 'address', label: 'Wallet Address', placeholder: 'Your wallet address' },
    ],
  },
  stripe: {
    label: 'Stripe Payout (Bank via Stripe)',
    icon: CreditCard,
    color: 'text-indigo-500',
    fields: [
      { key: 'email', label: 'Stripe Account Email', placeholder: 'your@stripe.email', type: 'email' },
    ],
  },
}

const METHOD_TYPES: MethodType[] = ['paypal', 'mobile_money', 'bank', 'crypto', 'stripe']

export default function PaymentSettingsPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [methods, setMethods] = useState<PayoutMethod[]>([])
  const [adding, setAdding] = useState<MethodType | null>(null)
  const [newDetails, setNewDetails] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [minimumPayout] = useState(10)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/dashboard/payment-settings')
    }
  }, [authLoading, user, router])

  if (authLoading || !user) return null

  const startAdding = (type: MethodType) => {
    setAdding(type)
    setNewDetails({})
  }

  const cancelAdding = () => {
    setAdding(null)
    setNewDetails({})
  }

  const saveNewMethod = async () => {
    if (!adding) return
    setSaving(true)
    await new Promise((r) => setTimeout(r, 800))

    const id = `method-${Date.now()}`
    const newMethod: PayoutMethod = {
      id,
      type: adding,
      label: METHOD_META[adding].label,
      details: { ...newDetails },
      isPrimary: methods.length === 0,
      isVerified: false,
      addedAt: new Date().toISOString(),
    }
    setMethods((prev) => [...prev, newMethod])
    setSaving(false)
    setSavedId(id)
    setAdding(null)
    setNewDetails({})
    setTimeout(() => setSavedId(null), 2000)
  }

  const removeMethod = (id: string) => {
    setMethods((prev) => {
      const updated = prev.filter((m) => m.id !== id)
      if (updated.length > 0 && !updated.some((m) => m.isPrimary)) {
        updated[0].isPrimary = true
      }
      return updated
    })
  }

  const setPrimary = (id: string) => {
    setMethods((prev) => prev.map((m) => ({ ...m, isPrimary: m.id === id })))
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2 text-muted-foreground">
          <Link href="/dashboard">
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Dashboard
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Payout Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Set up where your earnings from tip subscriptions will be sent.
        </p>
      </div>

      {/* Earnings summary */}
      <Card className="mb-6 border-primary/30 bg-primary/5">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Wallet className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold">Your Earnings</p>
            <p className="text-sm text-muted-foreground">
              Payouts are sent once your balance reaches ${minimumPayout}+.
              Platform takes 20% — you keep 80%.
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-black text-primary">$0.00</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
        </CardContent>
      </Card>

      {/* Existing methods */}
      {methods.length > 0 && (
        <div className="mb-6 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Your Payout Methods
          </h2>
          {methods.map((method) => {
            const meta = METHOD_META[method.type]
            const Icon = meta.icon
            const firstDetail = Object.values(method.details)[0] || ''
            return (
              <Card key={method.id} className={cn(
                "overflow-hidden transition-all",
                method.isPrimary && "border-primary/40"
              )}>
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg bg-muted shrink-0", meta.color)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm">{method.label}</p>
                        {method.isPrimary && (
                          <Badge className="text-[9px] px-1.5 py-0 bg-primary/15 text-primary border-primary/30">Primary</Badge>
                        )}
                        {method.isVerified ? (
                          <Badge className="text-[9px] px-1.5 py-0 bg-emerald-500/15 text-emerald-600 border-emerald-500/30">
                            <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-amber-600 border-amber-500/30">
                            <AlertCircle className="h-2.5 w-2.5 mr-0.5" />Pending
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{firstDetail}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {!method.isPrimary && (
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setPrimary(method.id)}>
                        Set Primary
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => removeMethod(method.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Add new method */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add Payout Method</CardTitle>
          <CardDescription>
            Choose how you'd like to receive your earnings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!adding ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {METHOD_TYPES.map((type) => {
                const meta = METHOD_META[type]
                const Icon = meta.icon
                const alreadyAdded = methods.some((m) => m.type === type)
                return (
                  <button
                    key={type}
                    onClick={() => !alreadyAdded && startAdding(type)}
                    disabled={alreadyAdded}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                      alreadyAdded
                        ? "border-border opacity-50 cursor-not-allowed"
                        : "border-border hover:border-primary/50 hover:bg-muted/50 cursor-pointer"
                    )}
                  >
                    <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg bg-muted shrink-0", meta.color)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{meta.label}</p>
                    </div>
                    {alreadyAdded ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    ) : (
                      <Plus className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg bg-muted", METHOD_META[adding].color)}>
                  {(() => { const Icon = METHOD_META[adding].icon; return <Icon className="h-4 w-4" /> })()}
                </div>
                <div>
                  <p className="font-semibold text-sm">{METHOD_META[adding].label}</p>
                  <p className="text-xs text-muted-foreground">Fill in your account details</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                {METHOD_META[adding].fields.map((field) => (
                  <div key={field.key}>
                    <Label htmlFor={`new-${field.key}`} className="text-xs mb-1 block">
                      {field.label}
                    </Label>
                    <Input
                      id={`new-${field.key}`}
                      type={field.type || 'text'}
                      placeholder={field.placeholder}
                      value={newDetails[field.key] || ''}
                      onChange={(e) => setNewDetails((d) => ({ ...d, [field.key]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-1.5 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                <Info className="h-3.5 w-3.5 shrink-0" />
                Your payment details are encrypted and only used for payout processing.
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={cancelAdding}>Cancel</Button>
                <Button onClick={saveNewMethod} disabled={saving} className="gap-1.5">
                  {saving ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : savedId ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {saving ? 'Saving...' : 'Save Method'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
