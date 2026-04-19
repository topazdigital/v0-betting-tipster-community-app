"use client"

import { useState } from "react"
import { Save, Globe, Bell, Shield, Palette, Database, Mail, Key } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    siteName: "BetTips Pro",
    siteDescription: "Professional betting tips and predictions",
    maintenanceMode: false,
    registrationEnabled: true,
    emailVerification: true,
    tipstersAutoApproval: false,
    commentsModeration: true,
    maxPredictionsPerDay: 10,
    minOddsAllowed: 1.2,
    maxOddsAllowed: 50,
    notifyNewUser: true,
    notifyNewPrediction: true,
    notifyNewComment: false,
    primaryColor: "#10B981",
    darkMode: true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your application settings</p>
        </div>
        <Button className="gap-2">
          <Save className="h-4 w-4" /> Save Changes
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:w-auto md:grid-cols-5">
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
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Configure basic site information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input 
                    id="siteName" 
                    value={settings.siteName}
                    onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siteDescription">Site Description</Label>
                  <Input 
                    id="siteDescription" 
                    value={settings.siteDescription}
                    onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <p className="font-medium">Maintenance Mode</p>
                  <p className="text-sm text-muted-foreground">Put the site in maintenance mode</p>
                </div>
                <Switch 
                  checked={settings.maintenanceMode}
                  onCheckedChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
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
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <p className="font-medium">User Registration</p>
                  <p className="text-sm text-muted-foreground">Allow new users to register</p>
                </div>
                <Switch 
                  checked={settings.registrationEnabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, registrationEnabled: checked })}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <p className="font-medium">Email Verification</p>
                  <p className="text-sm text-muted-foreground">Require email verification for new accounts</p>
                </div>
                <Switch 
                  checked={settings.emailVerification}
                  onCheckedChange={(checked) => setSettings({ ...settings, emailVerification: checked })}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <p className="font-medium">Tipsters Auto-Approval</p>
                  <p className="text-sm text-muted-foreground">Automatically approve new tipster applications</p>
                </div>
                <Switch 
                  checked={settings.tipstersAutoApproval}
                  onCheckedChange={(checked) => setSettings({ ...settings, tipstersAutoApproval: checked })}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <p className="font-medium">Comments Moderation</p>
                  <p className="text-sm text-muted-foreground">Moderate comments before publishing</p>
                </div>
                <Switch 
                  checked={settings.commentsModeration}
                  onCheckedChange={(checked) => setSettings({ ...settings, commentsModeration: checked })}
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
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <p className="font-medium">New User Notifications</p>
                  <p className="text-sm text-muted-foreground">Get notified when a new user registers</p>
                </div>
                <Switch 
                  checked={settings.notifyNewUser}
                  onCheckedChange={(checked) => setSettings({ ...settings, notifyNewUser: checked })}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <p className="font-medium">New Prediction Notifications</p>
                  <p className="text-sm text-muted-foreground">Get notified when a prediction is posted</p>
                </div>
                <Switch 
                  checked={settings.notifyNewPrediction}
                  onCheckedChange={(checked) => setSettings({ ...settings, notifyNewPrediction: checked })}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <p className="font-medium">New Comment Notifications</p>
                  <p className="text-sm text-muted-foreground">Get notified when a comment is posted</p>
                </div>
                <Switch 
                  checked={settings.notifyNewComment}
                  onCheckedChange={(checked) => setSettings({ ...settings, notifyNewComment: checked })}
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
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="maxPredictions">Max Predictions Per Day</Label>
                  <Input 
                    id="maxPredictions" 
                    type="number"
                    value={settings.maxPredictionsPerDay}
                    onChange={(e) => setSettings({ ...settings, maxPredictionsPerDay: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minOdds">Minimum Odds Allowed</Label>
                  <Input 
                    id="minOdds" 
                    type="number"
                    step="0.1"
                    value={settings.minOddsAllowed}
                    onChange={(e) => setSettings({ ...settings, minOddsAllowed: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxOdds">Maximum Odds Allowed</Label>
                  <Input 
                    id="maxOdds" 
                    type="number"
                    step="0.1"
                    value={settings.maxOddsAllowed}
                    onChange={(e) => setSettings({ ...settings, maxOddsAllowed: Number(e.target.value) })}
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
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="primaryColor">Primary Color</Label>
                <div className="flex gap-2">
                  <Input 
                    id="primaryColor" 
                    type="color"
                    value={settings.primaryColor}
                    onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                    className="h-10 w-20 cursor-pointer p-1"
                  />
                  <Input 
                    value={settings.primaryColor}
                    onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
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
                  checked={settings.darkMode}
                  onCheckedChange={(checked) => setSettings({ ...settings, darkMode: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
