"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, RotateCcw, Trash2, Eye, Clock, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

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

interface JobTableProps {
  jobs: Job[]
  onRequeue: (jobId: string) => void
  onDelete: (jobId: string) => void
  onViewDetails: (jobId: string) => void
}

const statusStyles = {
  due: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  running: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  done: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  error: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
}

export function JobTable({ jobs, onRequeue, onDelete, onViewDetails }: JobTableProps) {
  const [processingJobs, setProcessingJobs] = useState<Set<string>>(new Set())

  const handleRequeue = async (jobId: string) => {
    setProcessingJobs((prev) => new Set([...prev, jobId]))
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      onRequeue(jobId)
      toast.success("Job Requeued", {
        description: "The job has been added back to the queue",
      })
    } catch {
      toast.error("Requeue Failed", {
        description: "Unable to requeue the job. Please try again.",
      })
    } finally {
      setProcessingJobs((prev) => {
        const newSet = new Set(prev)
        newSet.delete(jobId)
        return newSet
      })
    }
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return {
      utc: format(date, "MMM d, yyyy HH:mm 'UTC'"),
      local: format(date, "MMM d, yyyy h:mm a"),
    }
  }

  if (jobs.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center">
        <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No jobs found</h3>
        <p className="text-muted-foreground">No jobs match the current filter</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Job ID</TableHead>
            <TableHead>Assignment</TableHead>
            <TableHead>Run At</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Attempts</TableHead>
            <TableHead>Last Error</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job) => {
            const runAtTime = formatDateTime(job.runAt)
            const isProcessing = processingJobs.has(job.id)

            return (
              <TableRow key={job.id}>
                <TableCell>
                  <code className="text-xs bg-muted px-2 py-1 rounded font-mono">{job.id.slice(0, 8)}</code>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium text-pretty">{job.assignmentName}</div>
                    <Badge variant="outline" className="text-xs font-mono">
                      {job.courseCode}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="text-sm cursor-help">
                          <div>{format(new Date(job.runAt), "MMM d, HH:mm")}</div>
                          <div className="text-xs text-muted-foreground">UTC</div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="space-y-1">
                          <div>UTC: {runAtTime.utc}</div>
                          <div>Local: {runAtTime.local}</div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell>
                  <Badge className={cn("text-xs", statusStyles[job.status])}>
                    {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <span className="text-sm">{job.attempts}</span>
                    <span className="text-xs text-muted-foreground">/ {job.maxAttempts}</span>
                    {job.attempts >= job.maxAttempts && job.status === "error" && (
                      <AlertCircle className="h-3 w-3 text-red-500 ml-1" />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {job.lastError ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="text-sm text-red-600 dark:text-red-400 truncate max-w-[200px] cursor-help">
                            {job.lastError}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[300px]">
                          <p className="text-sm">{job.lastError}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => onViewDetails(job.id)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" disabled={isProcessing}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onViewDetails(job.id)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        {(job.status === "error" || job.status === "done") && (
                          <DropdownMenuItem onClick={() => handleRequeue(job.id)} disabled={isProcessing}>
                            <RotateCcw className="h-4 w-4 mr-2" />
                            {isProcessing ? "Requeuing..." : "Requeue"}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => onDelete(job.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
