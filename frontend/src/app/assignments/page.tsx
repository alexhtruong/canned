"use client"

import { useState, useMemo, useEffect } from "react"
import { TopNav } from "@/components/layout/top-nav"
import { BreadcrumbNav } from "@/components/layout/breadcrumb-nav"
import { AssignmentFilters } from "@/components/assignments/assignment-filters"
import { AssignmentCard } from "@/components/assignments/assignment-card"
import { AssignmentTable } from "@/components/assignments/assignment-table"
import { EmptyState } from "@/components/dashboard/empty-state"
import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { FileText, Grid, List, RefreshCw } from "lucide-react"
import type { DateRange } from "react-day-picker"
import { toast } from "sonner"

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

// TODO: UPDATE
const availableCourses = [
  { id: "1", code: "CPE-365", name: "Database Systems" },
  { id: "2", code: "CPE-308", name: "Software Engineering" },
  { id: "3", code: "CPE-466", name: "Knowledge Discovery from Data" },
  { id: "4", code: "CPE-349", name: "Design & Analysis of Algorithms" },
  { id: "5", code: "CPE-357", name: "Systems Programming" },
]

export default function AssignmentsPage() {
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards")
  const [searchValue, setSearchValue] = useState("")
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [courseFilter, setCourseFilter] = useState<string[]>([])
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRange | undefined>()
  const [subscribedOnlyFilter, setSubscribedOnlyFilter] = useState(false)

  const fetchAssignments = async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL
    try {
      const response = await fetch(`${apiUrl}/assignments?canvas_user_id=1`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log(data)
      return data
    } catch (e) {
      console.error(e);
    }
  };

  const transformAssignments = (data: any[]) => {
    return data.map((assignment: any) => {
      const courseCodeAndName = assignment.course_name.split(" - ", 2)
      const courseCode = courseCodeAndName[0];
      const courseName = courseCodeAndName[1];

      return {
        id: assignment.id.toString(),
        name: assignment.name,
        courseCode: courseCode,
        courseName: courseName,
        dueDate: assignment.due_at,
        submitted: assignment.submission.submitted_at ? true : false,
        points: assignment.points_possible,
        canvasUrl: assignment.html_url,
        description: assignment.description
      }
    });
  }

  useEffect(() => {
    const loadAssignments = async () => {
      const assignments = await fetchAssignments()
      if (assignments) {
        setAssignments(transformAssignments(assignments))
      } else {
        setAssignments([])
      }
    }
    loadAssignments()
  }, []);
  
  // Filter assignments
  const filteredAssignments = useMemo(() => {
    return assignments.filter((assignment) => {
      // Search filter
      const matchesSearch =
        searchValue === "" ||
        assignment.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        assignment.courseCode.toLowerCase().includes(searchValue.toLowerCase()) ||
        assignment.courseName.toLowerCase().includes(searchValue.toLowerCase())

      // Status filter
      const now = new Date()
      const dueDate = new Date(assignment.dueDate)
      const isPastDue = dueDate < now
      const isDueSoon = dueDate > now && dueDate.getTime() - now.getTime() < 48 * 60 * 60 * 1000

      let matchesStatus = true
      if (statusFilter) {
        switch (statusFilter) {
          case "due-soon":
            matchesStatus = isDueSoon && !assignment.submitted
            break
          case "past-due":
            matchesStatus = isPastDue && !assignment.submitted
            break
          case "submitted":
            matchesStatus = assignment.submitted
            break
          case "unsubmitted":
            matchesStatus = !assignment.submitted
            break
        }
      }

      // Course filter
      const matchesCourse = courseFilter.length === 0 || courseFilter.includes(assignment.courseCode)

      // Date range filter
      const matchesDateRange =
        !dateRangeFilter ||
        !dateRangeFilter.from ||
        (dueDate >= dateRangeFilter.from && (!dateRangeFilter.to || dueDate <= dateRangeFilter.to))

      // Subscribed only filter
      const matchesSubscribed = !subscribedOnlyFilter /*|| assignment.courseSubscribed */

      return matchesSearch && matchesStatus && matchesCourse && matchesDateRange && matchesSubscribed
    })
  }, [assignments, searchValue, statusFilter, courseFilter, dateRangeFilter, subscribedOnlyFilter])

  const handleNotifyTest = (assignmentId: string) => {
    const assignment = assignments.find((a) => a.id === assignmentId)
    toast.success("Test notification sent", {
      description: `Sent test notification for "${assignment?.name}"`,
    })
  }

  const handleCreateReminder = (assignmentId: string) => {
    const assignment = assignments.find((a) => a.id === assignmentId)
    toast.success("Reminder created", {
      description: `Created manual reminder for "${assignment?.name}"`,
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
              <h1 className="text-3xl font-bold tracking-tight text-balance">Assignments</h1>
              <p className="text-muted-foreground text-pretty">Track and manage your Canvas assignments</p>
            </div>
            <div className="flex items-center gap-2">
              <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as any)}>
                <ToggleGroupItem value="cards" aria-label="Card view">
                  <Grid className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="table" aria-label="Table view">
                  <List className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>
              <Button variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync
              </Button>
            </div>
          </div>

          {/* Filters */}
          <AssignmentFilters
            onSearchChange={setSearchValue}
            onStatusFilter={setStatusFilter}
            onCourseFilter={setCourseFilter}
            onDateRangeFilter={setDateRangeFilter}
            onSubscribedOnlyFilter={setSubscribedOnlyFilter}
            searchValue={searchValue}
            statusFilter={statusFilter}
            courseFilter={courseFilter}
            dateRangeFilter={dateRangeFilter}
            subscribedOnlyFilter={subscribedOnlyFilter}
            availableCourses={availableCourses}
          />

          {/* Assignment List */}
          {filteredAssignments.length > 0 ? (
            viewMode === "cards" ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredAssignments.map((assignment) => (
                  <AssignmentCard
                    key={assignment.id}
                    assignment={assignment}
                    onNotifyTest={handleNotifyTest}
                    onCreateReminder={handleCreateReminder}
                  />
                ))}
              </div>
            ) : (
              <AssignmentTable
                assignments={filteredAssignments}
                onNotifyTest={handleNotifyTest}
                onCreateReminder={handleCreateReminder}
              />
            )
          ) : (
            <div className="rounded-2xl border bg-card shadow-sm">
              <EmptyState
                icon={FileText}
                title="No assignments found"
                description="No assignments match your current filters. Try adjusting your search or filters, or sync from Canvas to load your assignments."
                actionLabel="Sync from Canvas"
                onAction={() => console.log("Sync from Canvas")}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
