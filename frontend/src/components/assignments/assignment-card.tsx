"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Clock, ExternalLink, MoreHorizontal, Bell, CheckCircle, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

interface Assignment {
  id: string
  name: string
  courseCode: string
  courseName: string
  dueDate: string
  submitted: boolean
  points: number
  canvasUrl: string
  description?: string
}

interface AssignmentCardProps {
  assignment: Assignment
  onNotifyTest: (assignmentId: string) => void
  onCreateReminder: (assignmentId: string) => void
}

export function AssignmentCard({ assignment, onNotifyTest, onCreateReminder }: AssignmentCardProps) {
  const dueDate = new Date(assignment.dueDate)
  const now = new Date()
  const isPastDue = dueDate < now
  const isDueSoon = dueDate > now && dueDate.getTime() - now.getTime() < 48 * 60 * 60 * 1000 // 48 hours

  const getStatusVariant = () => {
    if (assignment.submitted) return "success"
    if (isPastDue) return "danger"
    if (isDueSoon) return "warning"
    return "default"
  }

  const getStatusIcon = () => {
    if (assignment.submitted) return CheckCircle
    if (isPastDue || isDueSoon) return AlertTriangle
    return Clock
  }

  const StatusIcon = getStatusIcon()

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="font-mono text-xs">
                {assignment.courseCode}
              </Badge>
              <Badge
                variant={getStatusVariant() as any}
                className={cn(
                  "text-xs flex items-center gap-1",
                  assignment.submitted && "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
                  isPastDue && "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
                  isDueSoon && "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
                )}
              >
                <StatusIcon className="h-3 w-3" />
                {assignment.submitted ? "Submitted" : isPastDue ? "Past Due" : isDueSoon ? "Due Soon" : "Upcoming"}
              </Badge>
            </div>
            <h3 className="font-semibold text-foreground text-pretty">{assignment.name}</h3>
            <p className="text-sm text-muted-foreground">{assignment.courseName}</p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onNotifyTest(assignment.id)}>
                <Bell className="h-4 w-4 mr-2" />
                Test notification
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onCreateReminder(assignment.id)}>
                <Clock className="h-4 w-4 mr-2" />
                Create reminder
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href={assignment.canvasUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in Canvas
                </a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Details */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Due {format(dueDate, "MMM d, yyyy 'at' h:mm a")}</span>
            </div>
            <span className="font-medium">{assignment.points} points</span>
          </div>

          {assignment.description && (
            <p className="text-sm text-muted-foreground text-pretty line-clamp-2">{assignment.description}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t">
          <Button variant="outline" size="sm" onClick={() => onNotifyTest(assignment.id)}>
            <Bell className="h-4 w-4 mr-2" />
            Test notify
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={assignment.canvasUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Canvas
            </a>
          </Button>
        </div>
      </div>
    </div>
  )
}
