"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { RefreshCw, Database, Trash2, Calendar, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface DataManagementProps {
  onSync: () => void
  onRescheduleJobs: () => void
  onClearCache: () => void
}

export function DataManagement({ onSync, onRescheduleJobs, onClearCache }: DataManagementProps) {
  const { toast } = useToast()
  const [isSyncing, setIsSyncing] = useState(false)
  const [isRescheduling, setIsRescheduling] = useState(false)
  const [isClearing, setIsClearing] = useState(false)

  const handleSync = async () => {
    setIsSyncing(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 3000))
      onSync()
      toast({
        title: "Sync Complete",
        description: "Successfully synced courses and assignments from Canvas",
      })
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Unable to sync data from Canvas. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSyncing(false)
    }
  }

  const handleRescheduleJobs = async () => {
    setIsRescheduling(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      onRescheduleJobs()
      toast({
        title: "Jobs Rescheduled",
        description: "All pending notification jobs have been rescheduled",
      })
    } catch (error) {
      toast({
        title: "Reschedule Failed",
        description: "Unable to reschedule jobs. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsRescheduling(false)
    }
  }

  const handleClearCache = async () => {
    setIsClearing(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      onClearCache()
      toast({
        title: "Cache Cleared",
        description: "All cached data has been cleared successfully",
      })
    } catch (error) {
      toast({
        title: "Clear Failed",
        description: "Unable to clear cache. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsClearing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          <CardTitle>Data Management</CardTitle>
        </div>
        <CardDescription>Manage your Canvas data synchronization and system maintenance</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sync Status */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Canvas Synchronization</h4>
              <p className="text-sm text-muted-foreground">Last synced 2 hours ago</p>
            </div>
            <Badge variant="secondary">Up to date</Badge>
          </div>

          <Button onClick={handleSync} disabled={isSyncing} className="w-full sm:w-auto">
            <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "Syncing..." : "Sync Now"}
          </Button>

          <Alert>
            <RefreshCw className="h-4 w-4" />
            <AlertDescription>
              Syncing will fetch the latest courses, assignments, and due dates from Canvas. This may take a few
              minutes.
            </AlertDescription>
          </Alert>
        </div>

        {/* Job Management */}
        <div className="space-y-4">
          <div>
            <h4 className="font-medium">Notification Jobs</h4>
            <p className="text-sm text-muted-foreground">Manage scheduled notification jobs</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={handleRescheduleJobs} disabled={isRescheduling} variant="outline">
              <Calendar className={`h-4 w-4 mr-2 ${isRescheduling ? "animate-pulse" : ""}`} />
              {isRescheduling ? "Rescheduling..." : "Reschedule Jobs"}
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            Reschedule all pending notification jobs based on current assignment due dates and your notification
            preferences.
          </p>
        </div>

        {/* Cache Management */}
        <div className="space-y-4">
          <div>
            <h4 className="font-medium">Cache Management</h4>
            <p className="text-sm text-muted-foreground">Clear cached data to resolve sync issues</p>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground bg-transparent"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Cache
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Clear Cache
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This will clear all cached course and assignment data. You'll need to sync from Canvas again to
                  restore your data. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleClearCache}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={isClearing}
                >
                  {isClearing ? "Clearing..." : "Clear Cache"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Warning: Clearing cache will remove all locally stored data. Use this only if you're experiencing sync
              issues.
            </AlertDescription>
          </Alert>
        </div>

        {/* System Stats */}
        <div className="space-y-3 pt-4 border-t">
          <h4 className="font-medium text-sm">System Information</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Courses:</span>
              <span className="ml-2 font-medium">5</span>
            </div>
            <div>
              <span className="text-muted-foreground">Assignments:</span>
              <span className="ml-2 font-medium">23</span>
            </div>
            <div>
              <span className="text-muted-foreground">Pending Jobs:</span>
              <span className="ml-2 font-medium">8</span>
            </div>
            <div>
              <span className="text-muted-foreground">Cache Size:</span>
              <span className="ml-2 font-medium">2.4 MB</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
