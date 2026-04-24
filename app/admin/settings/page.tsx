"use client"

import { useState, useEffect } from "react"
import { Save, Globe, Bell, Shield, Palette, Database, Loader2, CheckCircle2, AlertCircle, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Settings {
  site_name: string
  site_description: string
  maintenance_mode: string
  registration_enabled: string
  email_verification: string
  tipsters_auto_approval: string
  comments_moderation: string
  max_predictions_per_day: string
  min_odds_allowed: string
  max_odds_allowed: string
  notify_new_user: string
  notify_new_prediction: string
  notify_new_comment: string
  primary_color: string
  default_theme: string
  google_analytics_id: string
  facebook_pixel_id: string
}

const defaultSettings: Settings = {
  site_name: "Betcheza",
  site_description: "Your trusted betting tips community",
  maintenance_mode: "false",
  registration_enabled: "true",
  email_verification: "true",
  tipsters_auto_approval: "false",
  comments_moderation: "true",
  max_predictions_per_day: "10",
  min_odds_allowed: "1.2",
  max_odds_allowed: "50",
  notify_new_user: "true",
  notify_new_prediction: "true",
  notify_new_comment: "false",
  primary_color: "#10B981",
  default_theme: "light",
  google_analytics_id: "",
  facebook_pixel_id: ""
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState("")

  // Load settings on mount
  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch('/api/admin/settings')
        if (response.ok) {
          const data = await response.json()
          setSettings({ ...defaultSettings, ...data.settings })
        }
      } catch (error) {
        console.error('Failed to load settings:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadSettings()
  }, [])

  // Save settings
  const handleSave = async () => {
    setIsSaving(true)
    setSaveStatus('idle')
    setErrorMessage("")
    
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings })
      })
      
      if (response.ok) {
        setSaveStatus('success')
        setTimeout(() => setSaveStatus('idle'), 3000)
      } else {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save')
      }
    } catch (error) {
      setSaveStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  const updateSetting = (key: keyof Settings, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const toggleSetting = (key: keyof Settings) => {
    setSettings(prev => ({
      ...prev,
      [key]: prev[key] === 'true' ? 'false' : 'true'
    }))
  }

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your application settings</p>
        </div>
        <Button 
          className="gap-2" 
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saveStatus === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-success" />
          ) : saveStatus === 'error' ? (
            <AlertCircle className="h-4 w-4 text-destructive" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isSaving ? 'Saving...' : saveStatus === 'success' ? 'Saved!' : saveStatus === 'error' ? 'Error' : 'Save Changes'}
        </Button>
      </div>

      {errorMessage && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          {errorMessage}
        </div>
      )}

      <Tabs defaultValue="general" className="space-y-3">
        <TabsList className="grid w-full grid-cols-2 md:w-auto md:grid-cols-6">
          <TabsTrigger value="general" className="gap-2">
            <Globe className="h-4 w-4" /> General
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" /> Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="predictions" className="gap-2">
            <Database className="h-4 w-4" /> Predictions
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="h-4 w-4" /> Appearance
          </TabsTrigger>
          <TabsTrigger value="seo" className="gap-2">
            <Search className="h-4 w-4" /> SEO
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Configure basic site information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input 
                    id="siteName" 
                    value={settings.site_name}
                    onChange={(e) => updateSetting('site_name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siteDescription">Site Description</Label>
                  <Input 
                    id="siteDescription" 
                    value={settings.site_description}
                    onChange={(e) => updateSetting('site_description', e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <p className="font-medium">Maintenance Mode</p>
                  <p className="text-sm text-muted-foreground">Put the site in maintenance mode</p>
                </div>
                <Switch 
                  checked={settings.maintenance_mode === 'true'}
                  onCheckedChange={() => toggleSetting('maintenance_mode')}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Configure security and authentication options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <p className="font-medium">User Registration</p>
                  <p className="text-sm text-muted-foreground">Allow new users to register</p>
                </div>
                <Switch 
                  checked={settings.registration_enabled === 'true'}
                  onCheckedChange={() => toggleSetting('registration_enabled')}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <p className="font-medium">Email Verification</p>
                  <p className="text-sm text-muted-foreground">Require email verification for new accounts</p>
                </div>
                <Switch 
                  checked={settings.email_verification === 'true'}
                  onCheckedChange={() => toggleSetting('email_verification')}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <p className="font-medium">Tipsters Auto-Approval</p>
                  <p className="text-sm text-muted-foreground">Automatically approve new tipster applications</p>
                </div>
                <Switch 
                  checked={settings.tipsters_auto_approval === 'true'}
                  onCheckedChange={() => toggleSetting('tipsters_auto_approval')}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <p className="font-medium">Comments Moderation</p>
                  <p className="text-sm text-muted-foreground">Moderate comments before publishing</p>
                </div>
                <Switch 
                  checked={settings.comments_moderation === 'true'}
                  onCheckedChange={() => toggleSetting('comments_moderation')}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure admin notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <p className="font-medium">New User Notifications</p>
                  <p className="text-sm text-muted-foreground">Get notified when a new user registers</p>
                </div>
                <Switch 
                  checked={settings.notify_new_user === 'true'}
                  onCheckedChange={() => toggleSetting('notify_new_user')}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <p className="font-medium">New Prediction Notifications</p>
                  <p className="text-sm text-muted-foreground">Get notified when a prediction is posted</p>
                </div>
                <Switch 
                  checked={settings.notify_new_prediction === 'true'}
                  onCheckedChange={() => toggleSetting('notify_new_prediction')}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <p className="font-medium">New Comment Notifications</p>
                  <p className="text-sm text-muted-foreground">Get notified when a comment is posted</p>
                </div>
                <Switch 
                  checked={settings.notify_new_comment === 'true'}
                  onCheckedChange={() => toggleSetting('notify_new_comment')}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Predictions Settings */}
        <TabsContent value="predictions">
          <Card>
            <CardHeader>
              <CardTitle>Predictions Settings</CardTitle>
              <CardDescription>Configure prediction rules and limits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="maxPredictions">Max Predictions Per Day</Label>
                  <Input 
                    id="maxPredictions" 
                    type="number"
                    value={settings.max_predictions_per_day}
                    onChange={(e) => updateSetting('max_predictions_per_day', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minOdds">Minimum Odds Allowed</Label>
                  <Input 
                    id="minOdds" 
                    type="number"
                    step="0.1"
                    value={settings.min_odds_allowed}
                    onChange={(e) => updateSetting('min_odds_allowed', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxOdds">Maximum Odds Allowed</Label>
                  <Input 
                    id="maxOdds" 
                    type="number"
                    step="0.1"
                    value={settings.max_odds_allowed}
                    onChange={(e) => updateSetting('max_odds_allowed', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>Customize the look and feel</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="primaryColor">Primary Color</Label>
                <div className="flex gap-2">
                  <Input 
                    id="primaryColor" 
                    type="color"
                    value={settings.primary_color}
                    onChange={(e) => updateSetting('primary_color', e.target.value)}
                    className="h-10 w-20 cursor-pointer p-1"
                  />
                  <Input 
                    value={settings.primary_color}
                    onChange={(e) => updateSetting('primary_color', e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <p className="font-medium">Dark Mode Default</p>
                  <p className="text-sm text-muted-foreground">Use dark mode as the default theme</p>
                </div>
                <Switch 
                  checked={settings.default_theme === 'dark'}
                  onCheckedChange={(checked) => updateSetting('default_theme', checked ? 'dark' : 'light')}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO Settings */}
        <TabsContent value="seo">
          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
              <CardDescription>Configure search engine optimization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="googleAnalytics">Google Analytics ID</Label>
                <Input 
                  id="googleAnalytics" 
                  placeholder="G-XXXXXXXXXX"
                  value={settings.google_analytics_id}
                  onChange={(e) => updateSetting('google_analytics_id', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Enter your Google Analytics 4 measurement ID</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="facebookPixel">Facebook Pixel ID</Label>
                <Input 
                  id="facebookPixel" 
                  placeholder="XXXXXXXXXXXXXXXX"
                  value={settings.facebook_pixel_id}
                  onChange={(e) => updateSetting('facebook_pixel_id', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Enter your Facebook Pixel ID for conversion tracking</p>
              </div>
              <div className="rounded-lg border border-border p-4 bg-muted/50">
                <h4 className="font-medium mb-2">SEO Templates</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Default SEO templates are applied automatically to matches, leagues, and teams.
                  You can customize individual pages from their respective admin sections.
                </p>
                <Button variant="outline" size="sm" asChild>
                  <a href="/admin/seo">Manage SEO Templates</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
