"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, Clock, Phone } from "lucide-react"

interface NotificationSettingsProps {
  onSave: (settings: NotificationSettings) => void
  initialSettings?: NotificationSettings
}

interface NotificationSettings {
  phone: string
  smsEnabled: boolean
  quietHoursStart: string
  quietHoursEnd: string
  timezone: string
  reminderWindows: string[]
  customOffset: number
}

const timezones = [
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
]

const defaultReminderWindows = ["48h", "24h", "12h", "6h", "2h", "1h"]

export function NotificationSettings({ onSave, initialSettings }: NotificationSettingsProps) {
  const [settings, setSettings] = useState<NotificationSettings>(
    initialSettings || {
      phone: "",
      smsEnabled: true,
      quietHoursStart: "22:00",
      quietHoursEnd: "08:00",
      timezone: "America/Los_Angeles",
      reminderWindows: ["48h", "24h"],
      customOffset: 4,
    },
  )

  const [hasChanges, setHasChanges] = useState(false)

  const updateSetting = <K extends keyof NotificationSettings>(key: K, value: NotificationSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const handleReminderWindowToggle = (window: string) => {
    const newWindows = settings.reminderWindows.includes(window)
      ? settings.reminderWindows.filter((w) => w !== window)
      : [...settings.reminderWindows, window]
    updateSetting("reminderWindows", newWindows)
  }

  const handleSave = () => {
    onSave(settings)
    setHasChanges(false)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <CardTitle>Notification Settings</CardTitle>
        </div>
        <CardDescription>Configure how and when you receive assignment reminders</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Phone Number */}
        <div className="space-y-2">
          <Label htmlFor="phone" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Phone Number
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+1 (555) 123-4567"
            value={settings.phone}
            onChange={(e) => updateSetting("phone", e.target.value)}
            className="font-mono"
          />
          <p className="text-sm text-muted-foreground">Enter your phone number in E.164 format for SMS notifications</p>
        </div>

        {/* SMS Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>SMS Notifications</Label>
            <p className="text-sm text-muted-foreground">Receive assignment reminders via SMS</p>
          </div>
          <Switch checked={settings.smsEnabled} onCheckedChange={(checked) => updateSetting("smsEnabled", checked)} />
        </div>

        {/* Timezone */}
        <div className="space-y-2">
          <Label>Timezone</Label>
          <Select value={settings.timezone} onValueChange={(value) => updateSetting("timezone", value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timezones.map((tz) => (
                <SelectItem key={tz} value={tz}>
                  {tz.replace("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Quiet Hours */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <Label>Quiet Hours</Label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quiet-start">Start Time</Label>
              <Input
                id="quiet-start"
                type="time"
                value={settings.quietHoursStart}
                onChange={(e) => updateSetting("quietHoursStart", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quiet-end">End Time</Label>
              <Input
                id="quiet-end"
                type="time"
                value={settings.quietHoursEnd}
                onChange={(e) => updateSetting("quietHoursEnd", e.target.value)}
              />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">No notifications will be sent during these hours</p>
        </div>

        {/* Reminder Windows */}
        <div className="space-y-4">
          <Label>Reminder Windows</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {defaultReminderWindows.map((window) => (
              <div key={window} className="flex items-center space-x-2">
                <Checkbox
                  id={window}
                  checked={settings.reminderWindows.includes(window)}
                  onCheckedChange={() => handleReminderWindowToggle(window)}
                />
                <Label htmlFor={window} className="text-sm font-normal cursor-pointer">
                  {window} before
                </Label>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            Select when you want to receive reminders before assignments are due
          </p>
        </div>

        {/* Custom Offset */}
        <div className="space-y-2">
          <Label htmlFor="custom-offset">Custom Reminder (hours)</Label>
          <div className="flex items-center gap-2">
            <Input
              id="custom-offset"
              type="number"
              min="1"
              max="168"
              value={settings.customOffset}
              onChange={(e) => updateSetting("customOffset", Number.parseInt(e.target.value) || 0)}
              className="w-24"
            />
            <span className="text-sm text-muted-foreground">hours before due date</span>
          </div>
        </div>

        {/* Active Reminders Preview */}
        {settings.reminderWindows.length > 0 && (
          <div className="space-y-2">
            <Label>Active Reminders</Label>
            <div className="flex flex-wrap gap-2">
              {settings.reminderWindows.map((window) => (
                <Badge key={window} variant="secondary">
                  {window} before
                </Badge>
              ))}
              {settings.customOffset > 0 && <Badge variant="secondary">{settings.customOffset}h before</Badge>}
            </div>
          </div>
        )}

        {/* Save Button */}
        {hasChanges && (
          <div className="pt-4 border-t">
            <Button onClick={handleSave} className="w-full sm:w-auto">
              Save Notification Settings
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
