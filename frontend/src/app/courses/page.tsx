"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { TopNav } from "@/components/layout/top-nav"
import { BreadcrumbNav } from "@/components/layout/breadcrumb-nav"
import { CourseFilters } from "@/components/courses/course-filters"
import { CourseRow } from "@/components/courses/course-row"
import { BulkActions } from "@/components/courses/bulk-actions"
import { EmptyState } from "@/components/dashboard/empty-state"
import { Button } from "@/components/ui/button"
import { BookOpen, RefreshCw } from "lucide-react"

interface Course {
  id: string
  code: string
  name: string
  term: string
  status: "active" | "completed" | "upcoming"
  subscribed: boolean
  assignmentCount: number
  canvasUrl: string
}

// Mock data - in real app this would come from API
const mockCourses: Course[] = [
  {
    id: "1",
    code: "CPE-365",
    name: "Database Systems",
    term: "Fall 2024",
    status: "active",
    subscribed: true,
    assignmentCount: 8,
    canvasUrl: "#",
  },
  {
    id: "2",
    code: "CPE-308",
    name: "Software Engineering",
    term: "Fall 2024",
    status: "active",
    subscribed: true,
    assignmentCount: 12,
    canvasUrl: "#",
  },
  {
    id: "3",
    code: "CPE-466",
    name: "Knowledge Discovery from Data",
    term: "Fall 2024",
    status: "active",
    subscribed: false,
    assignmentCount: 6,
    canvasUrl: "#",
  },
  {
    id: "4",
    code: "CPE-349",
    name: "Design & Analysis of Algorithms",
    term: "Fall 2024",
    status: "active",
    subscribed: true,
    assignmentCount: 10,
    canvasUrl: "#",
  },
  {
    id: "5",
    code: "CPE-357",
    name: "Systems Programming",
    term: "Winter 2024",
    status: "completed",
    subscribed: false,
    assignmentCount: 15,
    canvasUrl: "#",
  },
]

export default function CoursesPage() {
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>(mockCourses)
  const [searchValue, setSearchValue] = useState("")
  const [termFilter, setTermFilter] = useState<string | null>(null)
  const [subscribedFilter, setSubscribedFilter] = useState<boolean | null>(null)
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(new Set())

  // Filter courses based on search and filters
  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesSearch =
        searchValue === "" ||
        course.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        course.code.toLowerCase().includes(searchValue.toLowerCase())

      const matchesTerm = termFilter === null || course.term === termFilter
      const matchesSubscribed = subscribedFilter === null || course.subscribed === subscribedFilter

      return matchesSearch && matchesTerm && matchesSubscribed
    })
  }, [courses, searchValue, termFilter, subscribedFilter])

  const handleSubscriptionChange = (courseId: string, subscribed: boolean) => {
    setCourses((prev) => prev.map((course) => (course.id === courseId ? { ...course, subscribed } : course)))
  }

  const handleViewAssignments = (courseId: string) => {
    router.push(`/assignments?course=${courseId}`)
  }

  const handleSelectAll = () => {
    setSelectedCourses(new Set(filteredCourses.map((course) => course.id)))
  }

  const handleSelectNone = () => {
    setSelectedCourses(new Set())
  }

  const handleBulkSubscribe = () => {
    setCourses((prev) =>
      prev.map((course) => (selectedCourses.has(course.id) ? { ...course, subscribed: true } : course)),
    )
    setSelectedCourses(new Set())
  }

  const handleBulkUnsubscribe = () => {
    setCourses((prev) =>
      prev.map((course) => (selectedCourses.has(course.id) ? { ...course, subscribed: false } : course)),
    )
    setSelectedCourses(new Set())
  }

  const isAllSelected = selectedCourses.size === filteredCourses.length && filteredCourses.length > 0
  const isIndeterminate = selectedCourses.size > 0 && selectedCourses.size < filteredCourses.length

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="container py-6">
        <BreadcrumbNav />
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-balance">Courses</h1>
              <p className="text-muted-foreground text-pretty">Manage your Canvas course subscriptions</p>
            </div>
            <Button variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Sync from Canvas
            </Button>
          </div>

          {/* Filters */}
          <CourseFilters
            onSearchChange={setSearchValue}
            onTermFilter={setTermFilter}
            onSubscribedFilter={setSubscribedFilter}
            searchValue={searchValue}
            termFilter={termFilter}
            subscribedFilter={subscribedFilter}
          />

          {/* Bulk Actions */}
          {filteredCourses.length > 0 && (
            <BulkActions
              selectedCount={selectedCourses.size}
              totalCount={filteredCourses.length}
              onSelectAll={handleSelectAll}
              onSelectNone={handleSelectNone}
              onSubscribeAll={handleBulkSubscribe}
              onUnsubscribeAll={handleBulkUnsubscribe}
              isAllSelected={isAllSelected}
              isIndeterminate={isIndeterminate}
            />
          )}

          {/* Course List */}
          {filteredCourses.length > 0 ? (
            <div className="space-y-4">
              {filteredCourses.map((course) => (
                <CourseRow
                  key={course.id}
                  course={course}
                  onSubscriptionChange={handleSubscriptionChange}
                  onViewAssignments={handleViewAssignments}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border bg-card shadow-sm">
              <EmptyState
                icon={BookOpen}
                title="No courses found"
                description="No courses match your current filters. Try adjusting your search or filters, or sync from Canvas to load your courses."
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
