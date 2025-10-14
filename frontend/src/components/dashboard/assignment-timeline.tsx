"use client"

import { useState, useMemo } from "react"
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
  submitted: boolean
  canvasUrl: string
  points?: number
}

interface TimelineDay {
  date: string
  dayName: string
  assignments: Assignment[]
}

interface AssignmentTimelineProps {
  assignments: Assignment[];
  isLoading?: boolean;
}

function getDayName(dateString: string): string {
  // Parse date as local time, not UTC
  const [year, month, day] = dateString.split('-').map(Number);
  const compareDate = new Date(year, month - 1, day); // Month is 0-indexed
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  compareDate.setHours(0, 0, 0, 0);
  
  const diffTime = compareDate.getTime() - today.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  
  // Return day of week for other days
  return compareDate.toLocaleDateString('en-US', { weekday: 'long' });
}


function groupAssignmentsByDate(assignments: Assignment[]): TimelineDay[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const maxDate = new Date(today);
  maxDate.setDate(today.getDate() + 14); // 7 days from today
  
  // Filter to only assignments in the next 7 days
  const upcomingAssignments = assignments.filter(a => {
    const dueDate = new Date(a.dueDate);
    return dueDate >= today && dueDate < maxDate;
  });
  
  // Group by date
  const grouped = upcomingAssignments.reduce((acc, assignment) => {
    const date = assignment.dueDate.split('T')[0]; // Get YYYY-MM-DD
    
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(assignment);
    return acc;
  }, {} as Record<string, Assignment[]>);
  
  // Convert to array and sort by date
  return Object.entries(grouped)
    .map(([date, dayAssignments]) => ({
      date,
      dayName: getDayName(date),
      assignments: dayAssignments.sort((a, b) => 
        new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      ),
    }))
    .sort((a, b) => {
      // Sort by actual date, parsing as local time
      const [yearA, monthA, dayA] = a.date.split('-').map(Number);
      const [yearB, monthB, dayB] = b.date.split('-').map(Number);
      const dateA = new Date(yearA, monthA - 1, dayA);
      const dateB = new Date(yearB, monthB - 1, dayB);
      return dateA.getTime() - dateB.getTime();
    });
}

export function AssignmentTimeline({ assignments, isLoading = false }: AssignmentTimelineProps) {
  const [snoozedItems, setSnoozedItems] = useState<Set<string>>(new Set())
  
  // Transform assignments into timeline format
  const timelineData = useMemo(() => {
    if (!assignments.length) return [];
    
    // Filter to only future/today assignments (let groupAssignmentsByDate handle 7-day limit)
    const upcomingAssignments = assignments.filter(a => {
      const dueDate = new Date(a.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return dueDate >= today;
    });
    
    return groupAssignmentsByDate(upcomingAssignments);
  }, [assignments])

  const handleSnooze = (assignmentId: string) => {
    setSnoozedItems((prev) => new Set([...prev, assignmentId]))
  }

  const handleMarkDone = (assignmentId: string) => {
    // In real app, this would update the assignment status
    console.log("Marking as done:", assignmentId)
  }
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Upcoming Timeline</h2>
            <p className="text-sm text-muted-foreground">Next 14 days of assignments</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <Clock className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }
  
  if (!timelineData.length) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Upcoming Timeline</h2>
            <p className="text-sm text-muted-foreground">Next 14 days of assignments</p>
          </div>
        </div>
        <div className="rounded-xl border bg-muted/50 p-8 text-center">
          <p className="text-sm text-muted-foreground">No upcoming assignments in the next 14 days</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Upcoming Timeline</h2>
          <p className="text-sm text-muted-foreground">Next 14 days of assignments</p>
        </div>
        <Button variant="outline" size="sm">
          <Clock className="h-4 w-4 mr-2" />
          Sync from Canvas
        </Button>
      </div>

      <div className="space-y-6">
        {timelineData.map((day) => (
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
                          Due {new Date(assignment.dueDate).toLocaleTimeString('en-US', { 
                            hour: 'numeric', 
                            minute: '2-digit',
                            hour12: true 
                          })}
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
