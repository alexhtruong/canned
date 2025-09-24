"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Clock, ExternalLink, MoreHorizontal, CheckCircle, AlertCircle, Store as Snooze } from "lucide-react"
import { cn } from "@/lib/utils"

interface Assignment {
  id: string
  name: string
  courseCode: string
  courseName: string
  dueDate: string
  dueTime: string
  submitted: boolean
  canvasUrl: string
  points?: number
}

interface TimelineDay {
  date: string
  dayName: string
  assignments: Assignment[]
}

// Mock data - in real app this would come from API
const mockTimelineData: TimelineDay[] = [
  {
    date: "2024-01-15",
    dayName: "Today",
    assignments: [
      {
        id: "1",
        name: "Database Design Project Phase 2",
        courseCode: "CPE-365",
        courseName: "Database Systems",
        dueDate: "2024-01-15",
        dueTime: "11:59 PM",
        submitted: false,
        canvasUrl: "#",
        points: 100,
      },
      {
        id: "2",
        name: "React Component Library Documentation",
        courseCode: "CPE-308",
        courseName: "Software Engineering",
        dueDate: "2024-01-15",
        dueTime: "11:59 PM",
        submitted: true,
        canvasUrl: "#",
        points: 50,
      },
    ],
  },
  {
    date: "2024-01-16",
    dayName: "Tomorrow",
    assignments: [
      {
        id: "3",
        name: "Machine Learning Midterm",
        courseCode: "CPE-466",
        courseName: "Knowledge Discovery",
        dueDate: "2024-01-16",
        dueTime: "2:00 PM",
        submitted: false,
        canvasUrl: "#",
        points: 200,
      },
    ],
  },
  {
    date: "2024-01-18",
    dayName: "Thursday",
    assignments: [
      {
        id: "4",
        name: "Algorithm Analysis Report",
        courseCode: "CPE-349",
        courseName: "Design & Analysis of Algorithms",
        dueDate: "2024-01-18",
        dueTime: "11:59 PM",
        submitted: false,
        canvasUrl: "#",
        points: 75,
      },
    ],
  },
]

export function AssignmentTimeline() {
  const [snoozedItems, setSnoozedItems] = useState<Set<string>>(new Set())

  const handleSnooze = (assignmentId: string) => {
    setSnoozedItems((prev) => new Set([...prev, assignmentId]))
  }

  const handleMarkDone = (assignmentId: string) => {
    // In real app, this would update the assignment status
    console.log("Marking as done:", assignmentId)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Upcoming Timeline</h2>
          <p className="text-sm text-muted-foreground">Next 7 days of assignments</p>
        </div>
        <Button variant="outline" size="sm">
          <Clock className="h-4 w-4 mr-2" />
          Sync from Canvas
        </Button>
      </div>

      <div className="space-y-6">
        {mockTimelineData.map((day) => (
          <div key={day.date} className="space-y-3">
            <div className="flex items-center gap-3">
              <h3 className="font-medium text-foreground">{day.dayName}</h3>
              <div className="h-px flex-1 bg-border" />
              <span className="text-sm text-muted-foreground">{day.date}</span>
            </div>

            <div className="space-y-3">
              {day.assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className={cn(
                    "rounded-xl border bg-card p-4 shadow-sm transition-all hover:shadow-md",
                    snoozedItems.has(assignment.id) && "opacity-60",
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="font-mono text-xs">
                          {assignment.courseCode}
                        </Badge>
                        <Badge
                          variant={assignment.submitted ? "default" : "destructive"}
                          className={cn(
                            "text-xs",
                            assignment.submitted
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
                          )}
                        >
                          {assignment.submitted ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Submitted
                            </>
                          ) : (
                            <>
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Unsubmitted
                            </>
                          )}
                        </Badge>
                      </div>

                      <div>
                        <h4 className="font-medium text-foreground text-pretty">{assignment.name}</h4>
                        <p className="text-sm text-muted-foreground">{assignment.courseName}</p>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Due {assignment.dueTime}
                        </span>
                        {assignment.points && <span>{assignment.points} points</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <a href={assignment.canvasUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleSnooze(assignment.id)}>
                            <Snooze className="h-4 w-4 mr-2" />
                            Snooze today
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleMarkDone(assignment.id)}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark as done
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
