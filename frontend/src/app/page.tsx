"use client"
import { TopNav } from "@/components/layout/top-nav"
import { BreadcrumbNav } from "@/components/layout/breadcrumb-nav"
import { StatCard } from "@/components/dashboard/stat-card"
import { AssignmentTimeline } from "@/components/dashboard/assignment-timeline"
import { AlertTriangle, CheckCircle, Clock, RefreshCw } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { fetchAssignments, transformAssignments } from "@/lib/api/assignments"

interface Assignment {
  id: string
  name: string
  courseCode: string
  courseName: string
  graded: boolean
  dueDate: string
  submitted: boolean
  points: number
  canvasUrl: string
  description?: string
}

export default function DashboardPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const loadAssignments = async () => {
      setIsLoading(true);
      const data = await fetchAssignments();
      if (data) {
        setAssignments(transformAssignments(data));
      } else {
        setAssignments([]);
      }
      setIsLoading(false);
    };
    loadAssignments();
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const dueSoonThreshold = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48 hours
    
    return {
      dueSoonUnsubmitted: assignments.filter(a => {
        const dueDate = new Date(a.dueDate);
        return !a.submitted && dueDate > now && dueDate <= dueSoonThreshold
      }).length,

      dueSoonSubmitted: assignments.filter(a => {
        const dueDate = new Date(a.dueDate);
        return a.submitted && dueDate > now && dueDate <= dueSoonThreshold
      }).length,

      pastDueUnsubmitted: assignments.filter(a => {
        const dueDate = new Date(a.dueDate);
        return !a.submitted && dueDate < now;
      }).length,
    };
  }, [assignments]);

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
              value={stats.dueSoonUnsubmitted}
              subtitle="Assignments need attention"
              icon={AlertTriangle}
              variant="danger"
            />
            <StatCard 
              title="Due Soon & Submitted" 
              value={stats.dueSoonSubmitted} 
              subtitle="On track" 
              icon={CheckCircle} 
              variant="success"
            />
            <StatCard
              title="Past Due (Unsubmitted)"
              value={stats.pastDueUnsubmitted}
              subtitle="Needs immediate attention"
              icon={Clock}
              variant="warning"
            />
          </div>

          {/* Assignment Timeline */}
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <AssignmentTimeline 
              assignments={assignments}
              isLoading={isLoading}
            />
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
