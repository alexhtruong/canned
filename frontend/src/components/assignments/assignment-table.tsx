"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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

interface AssignmentTableProps {
  assignments: Assignment[]
  onNotifyTest: (assignmentId: string) => void
  onCreateReminder: (assignmentId: string) => void
}

export function AssignmentTable({ assignments, onNotifyTest, onCreateReminder }: AssignmentTableProps) {
  const getStatusInfo = (assignment: Assignment) => {
    const dueDate = new Date(assignment.dueDate)
    const now = new Date()
    const isPastDue = dueDate < now
    const isDueSoon = dueDate > now && dueDate.getTime() - now.getTime() < 48 * 60 * 60 * 1000

    if (assignment.submitted) {
      return {
        label: "Submitted",
        icon: CheckCircle,
        className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      }
    }
    if (isPastDue) {
      return {
        label: "Past Due",
        icon: AlertTriangle,
        className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      }
    }
    if (isDueSoon) {
      return {
        label: "Due Soon",
        icon: AlertTriangle,
        className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      }
    }
    return {
      label: "Upcoming",
      icon: Clock,
      className: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    }
  }

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Assignment</TableHead>
            <TableHead>Course</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Points</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assignments.map((assignment) => {
            const statusInfo = getStatusInfo(assignment)
            const StatusIcon = statusInfo.icon

            return (
              <TableRow key={assignment.id}>
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium text-pretty">{assignment.name}</div>
                    {assignment.description && (
                      <div className="text-sm text-muted-foreground line-clamp-1">{assignment.description}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <Badge variant="outline" className="font-mono text-xs">
                      {assignment.courseCode}
                    </Badge>
                    <div className="text-sm text-muted-foreground">{assignment.courseName}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {format(new Date(assignment.dueDate), "MMM d, yyyy")}
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(assignment.dueDate), "h:mm a")}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={cn("text-xs flex items-center gap-1 w-fit", statusInfo.className)}>
                    <StatusIcon className="h-3 w-3" />
                    {statusInfo.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="font-medium">{assignment.points}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" asChild>
                      <a href={assignment.canvasUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
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
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
