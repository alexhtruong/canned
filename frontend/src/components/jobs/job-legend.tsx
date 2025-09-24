import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Info, Server, Clock, Zap } from "lucide-react"

export function JobLegend() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Info className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">How Job Monitoring Works</CardTitle>
        </div>
        <CardDescription>Understanding the cron-based notification system</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-primary/10 p-2 mt-0.5">
              <Server className="h-4 w-4 text-primary" />
            </div>
            <div className="space-y-1">
              <h4 className="font-medium text-sm">External Cron Runner</h4>
              <p className="text-sm text-muted-foreground">
                Jobs are executed by an external cron service that pings this application at scheduled times to send
                notifications.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-yellow-100 dark:bg-yellow-900 p-2 mt-0.5">
              <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="space-y-1">
              <h4 className="font-medium text-sm">Job Scheduling</h4>
              <p className="text-sm text-muted-foreground">
                Jobs are automatically scheduled based on assignment due dates and your notification preferences (48h,
                24h, etc.).
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-green-100 dark:bg-green-900 p-2 mt-0.5">
              <Zap className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <div className="space-y-1">
              <h4 className="font-medium text-sm">Retry Logic</h4>
              <p className="text-sm text-muted-foreground">
                Failed jobs are automatically retried up to 3 times with exponential backoff to handle temporary issues.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t space-y-3">
          <h4 className="font-medium text-sm">Job Status Legend</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Due</Badge>
              <span className="text-sm text-muted-foreground">Scheduled to run</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Running</Badge>
              <span className="text-sm text-muted-foreground">Currently executing</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Done</Badge>
              <span className="text-sm text-muted-foreground">Successfully completed</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Error</Badge>
              <span className="text-sm text-muted-foreground">Failed after retries</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
