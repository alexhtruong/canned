import { TopNav } from "@/components/layout/top-nav"
import { BreadcrumbNav } from "@/components/layout/breadcrumb-nav"
import { StatCard } from "@/components/dashboard/stat-card"
import { AssignmentTimeline } from "@/components/dashboard/assignment-timeline"
import { AlertTriangle, CheckCircle, Clock, RefreshCw } from "lucide-react"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="container py-6">
        <BreadcrumbNav />
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-balance">Dashboard</h1>
            <p className="text-muted-foreground text-pretty">Monitor your Canvas assignments and notification status</p>
          </div>

          {/* Status Summary Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <StatCard
              title="Due Soon & Unsubmitted"
              value={3}
              subtitle="Assignments need attention"
              icon={AlertTriangle}
              variant="danger"
            />
            <StatCard title="Due Soon & Submitted" value={7} subtitle="On track" icon={CheckCircle} variant="success" />
            <StatCard
              title="Past Due (Unsubmitted)"
              value={1}
              subtitle="Needs immediate attention"
              icon={Clock}
              variant="warning"
            />
          </div>

          {/* Assignment Timeline */}
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <AssignmentTimeline />
          </div>

          {/* Quick Actions */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <RefreshCw className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Last Sync</h3>
                  <p className="text-sm text-muted-foreground">2 hours ago</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-100 dark:bg-green-900 p-2">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-medium">Notifications</h3>
                  <p className="text-sm text-muted-foreground">All systems operational</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
