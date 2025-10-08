"use client"

import { TopNav } from "@/components/layout/top-nav"
import { BreadcrumbNav } from "@/components/layout/breadcrumb-nav"
import { NotificationSettings } from "@/components/preferences/notification-settings"
import { CanvasConnection } from "@/components/preferences/canvas-connection"
import { DataManagement } from "@/components/preferences/data-management"

export default function PreferencesPage() {
  const handleNotificationSave = (settings: any) => {
    console.log("Saving notification settings:", settings)
  }

  const handleCanvasSave = (settings: any) => {
    console.log("Saving Canvas settings:", settings)
  }

  const handleSync = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      const response = await fetch(`${apiUrl}/canvas/sync?canvas_user_id=1`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch courses: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(data)
    } catch (e) {
      console.error(e);
    }
  }

  const handleRescheduleJobs = () => {
    console.log("Rescheduling notification jobs")
  }

  const handleClearCache = () => {
    console.log("Clearing cache")
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="container py-6">
        <BreadcrumbNav />
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-balance">Preferences</h1>
            <p className="text-muted-foreground text-pretty">
              Configure your notification settings, Canvas connection, and data management
            </p>
          </div>

          {/* Settings Cards */}
          <div className="space-y-8">
            <NotificationSettings onSave={handleNotificationSave} />
            <CanvasConnection onSave={handleCanvasSave} />
            <DataManagement
              onSync={handleSync}
              onRescheduleJobs={handleRescheduleJobs}
              onClearCache={handleClearCache}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
