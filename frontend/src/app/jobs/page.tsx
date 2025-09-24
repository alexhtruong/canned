"use client"

import { useState, useMemo } from "react"
import { TopNav } from "@/components/layout/top-nav"
import { BreadcrumbNav } from "@/components/layout/breadcrumb-nav"
import { JobStatusTabs } from "@/components/jobs/job-status-tabs"
import { JobTable } from "@/components/jobs/job-table"
import { JobLegend } from "@/components/jobs/job-legend"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Job {
  id: string
  assignmentName: string
  courseCode: string
  runAt: string
  status: "due" | "running" | "done" | "error"
  attempts: number
  maxAttempts: number
  lastError?: string
  createdAt: string
  completedAt?: string
}

// Mock data
const mockJobs: Job[] = [
  {
    id: "job_001",
    assignmentName: "Database Design Project Phase 2",
    courseCode: "CPE-365",
    runAt: "2024-01-15T21:59:00Z",
    status: "due",
    attempts: 0,
    maxAttempts: 3,
    createdAt: "2024-01-13T10:00:00Z",
  },
  {
    id: "job_002",
    assignmentName: "React Component Library Documentation",
    courseCode: "CPE-308",
    runAt: "2024-01-15T11:59:00Z",
    status: "running",
    attempts: 1,
    maxAttempts: 3,
    createdAt: "2024-01-13T10:00:00Z",
  },
  {
    id: "job_003",
    assignmentName: "Machine Learning Midterm",
    courseCode: "CPE-466",
    runAt: "2024-01-14T12:00:00Z",
    status: "done",
    attempts: 1,
    maxAttempts: 3,
    createdAt: "2024-01-12T10:00:00Z",
    completedAt: "2024-01-14T12:00:30Z",
  },
  {
    id: "job_004",
    assignmentName: "Algorithm Analysis Report",
    courseCode: "CPE-349",
    runAt: "2024-01-16T21:59:00Z",
    status: "error",
    attempts: 3,
    maxAttempts: 3,
    lastError: "SMS delivery failed: Invalid phone number format",
    createdAt: "2024-01-14T10:00:00Z",
  },
  {
    id: "job_005",
    assignmentName: "Systems Programming Lab 3",
    courseCode: "CPE-357",
    runAt: "2024-01-08T21:59:00Z",
    status: "error",
    attempts: 2,
    maxAttempts: 3,
    lastError: "Canvas API rate limit exceeded",
    createdAt: "2024-01-06T10:00:00Z",
  },
  {
    id: "job_006",
    assignmentName: "Web Development Final Project",
    courseCode: "CPE-308",
    runAt: "2024-01-20T09:00:00Z",
    status: "due",
    attempts: 0,
    maxAttempts: 3,
    createdAt: "2024-01-13T10:00:00Z",
  },
  {
    id: "job_007",
    assignmentName: "Database Optimization Assignment",
    courseCode: "CPE-365",
    runAt: "2024-01-12T15:30:00Z",
    status: "done",
    attempts: 1,
    maxAttempts: 3,
    createdAt: "2024-01-10T10:00:00Z",
    completedAt: "2024-01-12T15:30:15Z",
  },
]

export default function JobsPage() {
  const { toast } = useToast()
  const [jobs, setJobs] = useState<Job[]>(mockJobs)
  const [activeTab, setActiveTab] = useState("due")
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Filter jobs by status
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => job.status === activeTab)
  }, [jobs, activeTab])

  // Calculate job counts
  const jobCounts = useMemo(() => {
    return {
      due: jobs.filter((job) => job.status === "due").length,
      running: jobs.filter((job) => job.status === "running").length,
      done: jobs.filter((job) => job.status === "done").length,
      errors: jobs.filter((job) => job.status === "error").length,
    }
  }, [jobs])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))
      toast({
        title: "Jobs Refreshed",
        description: "Job status has been updated from the cron runner",
      })
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Unable to refresh job status. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleRequeue = (jobId: string) => {
    setJobs((prev) =>
      prev.map((job) =>
        job.id === jobId
          ? {
              ...job,
              status: "due" as const,
              attempts: 0,
              lastError: undefined,
              runAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes from now
            }
          : job,
      ),
    )
  }

  const handleDelete = (jobId: string) => {
    setJobs((prev) => prev.filter((job) => job.id !== jobId))
    toast({
      title: "Job Deleted",
      description: "The job has been removed from the queue",
    })
  }

  const handleViewDetails = (jobId: string) => {
    const job = jobs.find((j) => j.id === jobId)
    toast({
      title: "Job Details",
      description: `Viewing details for job ${job?.id} - ${job?.assignmentName}`,
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="container py-6">
        <BreadcrumbNav />
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-balance">Job Monitoring</h1>
              <p className="text-muted-foreground text-pretty">Monitor notification job status and execution</p>
            </div>
            <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>

          {/* Job Status Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <JobStatusTabs jobCounts={jobCounts} activeTab={activeTab}>
              <TabsContent value="due" className="space-y-4">
                <JobTable
                  jobs={filteredJobs}
                  onRequeue={handleRequeue}
                  onDelete={handleDelete}
                  onViewDetails={handleViewDetails}
                />
              </TabsContent>
              <TabsContent value="running" className="space-y-4">
                <JobTable
                  jobs={filteredJobs}
                  onRequeue={handleRequeue}
                  onDelete={handleDelete}
                  onViewDetails={handleViewDetails}
                />
              </TabsContent>
              <TabsContent value="done" className="space-y-4">
                <JobTable
                  jobs={filteredJobs}
                  onRequeue={handleRequeue}
                  onDelete={handleDelete}
                  onViewDetails={handleViewDetails}
                />
              </TabsContent>
              <TabsContent value="errors" className="space-y-4">
                <JobTable
                  jobs={filteredJobs}
                  onRequeue={handleRequeue}
                  onDelete={handleDelete}
                  onViewDetails={handleViewDetails}
                />
              </TabsContent>
            </JobStatusTabs>
          </Tabs>

          {/* Legend */}
          <JobLegend />
        </div>
      </main>
    </div>
  )
}
