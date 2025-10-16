"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { TopNav } from "@/components/layout/top-nav"
import { BreadcrumbNav } from "@/components/layout/breadcrumb-nav"
import { CourseFilters } from "@/components/courses/course-filters"
import { CourseRow } from "@/components/courses/course-row"
import { BulkActions } from "@/components/courses/bulk-actions"
import { EmptyState } from "@/components/dashboard/empty-state"
import { Button } from "@/components/ui/button"
import { BookOpen, RefreshCw } from "lucide-react"
import { Course } from "@/types/types"
import { getApiUrl } from "@/lib/config"

export default function CoursesPage() {
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState("")
  const [termFilter, setTermFilter] = useState<string | null>(null)
  const [subscribedFilter, setSubscribedFilter] = useState<boolean | null>(null)
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(new Set())
  
  const fetchCourses = async () => {
    const apiUrl = getApiUrl();
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${apiUrl}/courses`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
            
      if (!response.ok) {
        throw new Error(`Failed to fetch courses: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(data)
      return data
    } catch (err) {
      setError(`An unexpected error occured: ${err}`)
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transformCoursesFromData = (data: any[]): Course[] => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((course: any) => {
      let courseStatus: "active" | "completed" | "upcoming";
      if (course.id && course.course_code) {
        const isActive = course.is_active
        courseStatus = isActive ? "active" : "completed";
      } else {
        courseStatus = "completed"; // Default status for invalid courses
      }
      
      const emptyTermObj = {
        "id": 0,
        "is_active": false,
        "name": "UNKNOWN TERM",
        "start_at": null
      }
      const courseTerm = course.term ? course.term : emptyTermObj

      return {
        id: course.id.toString(), // Convert to string if needed
        code: course.course_code || "UNKNOWN",
        name: course.name.split(" - ")[1],
        term: courseTerm, 
        status: courseStatus, 
        subscribed: false, // You'll need to get this from your subscription API
        canvasUrl: `https://canvas.calpoly.edu/courses/${course.id}` // Construct Canvas URL
      }
      })
    };

  useEffect(() => {
    const loadCourses = async () => {
      const fetchedCourses = await fetchCourses();
      if (fetchedCourses) {
        const transformedCourses = transformCoursesFromData(fetchedCourses);
        setCourses(transformedCourses)
      }
    }

    loadCourses()
  }, []);

  // Filter courses based on search and filters
  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesSearch =
        searchValue === "" ||
        course.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        course.code.toLowerCase().includes(searchValue.toLowerCase())

      const matchesTerm = termFilter === null || course.term?.name === termFilter
      const matchesSubscribed = subscribedFilter === null || course.subscribed === subscribedFilter

      return matchesSearch && matchesTerm && matchesSubscribed
    })
    .sort((a, b) => {
      // Sort by term chronologically (most recent first)
      const termA = a.term?.name || ""
      const termB = b.term?.name || ""
      
      // If either course has no term, put it at the end
      if (!termA && !termB) return 0
      if (!termA) return 1
      if (!termB) return -1
      
      // Parse term strings like "Fall Quarter 2024"
      const parseTermDate = (termName: string) => {
        const match = termName.match(/(\w+)\s+Quarter\s+(\d{4})/)
        if (!match) return new Date(0) // Invalid terms go to bottom
        
        const [, season, year] = match
        const yearNum = parseInt(year)
        
        // Map seasons to months for chronological ordering
        const seasonToMonth: Record<string, number> = {
          'Winter': 1,   // Jan-Mar (start of year)
          'Spring': 4,   // Apr-Jun  
          'Summer': 7,   // Jul-Sep
          'Fall': 10     // Oct-Dec (end of year)
        }
        
        const month = seasonToMonth[season] || 0
        return new Date(yearNum, month - 1) // month is 0-based in Date constructor
      }
      
      const dateA = parseTermDate(termA)
      const dateB = parseTermDate(termB)
      
      // Sort in descending order (most recent first)
      return dateB.getTime() - dateA.getTime()
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
            <Button variant="outline" onClick={fetchCourses} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
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
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Loading courses...</p>
              </div>
            </div>
          ) : error ? (
            <div className="rounded-2xl border bg-card shadow-sm">
              <EmptyState
                icon={BookOpen}
                title="Failed to load courses"
                description={error}
                actionLabel="Try Again"
                onAction={fetchCourses}
              />
            </div>
          ) : filteredCourses.length > 0 ? (
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
                onAction={fetchCourses}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
