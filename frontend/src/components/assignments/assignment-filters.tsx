"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import { Search, X, CalendarIcon, Filter } from "lucide-react"
import { format } from "date-fns"
import type { DateRange } from "react-day-picker"

interface AssignmentFiltersProps {
  onSearchChange: (search: string) => void
  onStatusFilter: (status: string | null) => void
  onCourseFilter: (courses: string[]) => void
  onDateRangeFilter: (dateRange: DateRange | undefined) => void
  onSubscribedOnlyFilter: (subscribedOnly: boolean) => void
  searchValue: string
  statusFilter: string | null
  courseFilter: string[]
  dateRangeFilter: DateRange | undefined
  subscribedOnlyFilter: boolean
  availableCourses: Array<{ id: string; code: string; name: string }>
}

const statusOptions = [
  { value: "due-soon", label: "Due Soon" },
  { value: "past-due", label: "Past Due" },
  { value: "submitted", label: "Submitted" },
  { value: "unsubmitted", label: "Unsubmitted" },
]

export function AssignmentFilters({
  onSearchChange,
  onStatusFilter,
  onCourseFilter,
  onDateRangeFilter,
  onSubscribedOnlyFilter,
  searchValue,
  statusFilter,
  courseFilter,
  dateRangeFilter,
  subscribedOnlyFilter,
  availableCourses,
}: AssignmentFiltersProps) {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const [isCourseFilterOpen, setIsCourseFilterOpen] = useState(false)

  const activeFiltersCount = [
    statusFilter,
    courseFilter.length > 0 ? courseFilter : null,
    dateRangeFilter,
    subscribedOnlyFilter ? true : null,
  ].filter(Boolean).length

  const clearAllFilters = () => {
    onSearchChange("")
    onStatusFilter(null)
    onCourseFilter([])
    onDateRangeFilter(undefined)
    onSubscribedOnlyFilter(false)
  }

  const handleCourseToggle = (courseId: string) => {
    const newCourseFilter = courseFilter.includes(courseId)
      ? courseFilter.filter((id) => id !== courseId)
      : [...courseFilter, courseId]
    onCourseFilter(newCourseFilter)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search assignments..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Status Filter */}
        <Select value={statusFilter || "all"} onValueChange={(value) => onStatusFilter(value === "all" ? null : value)}>
          <SelectTrigger className="w-full lg:w-[180px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Course Filter */}
        <Popover open={isCourseFilterOpen} onOpenChange={setIsCourseFilterOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full lg:w-[200px] justify-between bg-transparent">
              <span>
                {courseFilter.length === 0
                  ? "All courses"
                  : courseFilter.length === 1
                    ? availableCourses.find((c) => c.id === courseFilter[0])?.code
                    : `${courseFilter.length} courses`}
              </span>
              <Filter className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <div className="p-4 space-y-3">
              <h4 className="font-medium text-sm">Select courses</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {availableCourses.map((course) => (
                  <div key={course.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={course.id}
                      checked={courseFilter.includes(course.id)}
                      onCheckedChange={() => handleCourseToggle(course.id)}
                    />
                    <label
                      htmlFor={course.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      <span className="font-mono text-xs text-muted-foreground mr-2">{course.code}</span>
                      {course.name}
                    </label>
                  </div>
                ))}
              </div>
              <div className="flex justify-between pt-2 border-t">
                <Button variant="ghost" size="sm" onClick={() => onCourseFilter([])}>
                  Clear
                </Button>
                <Button size="sm" onClick={() => setIsCourseFilterOpen(false)}>
                  Done
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Date Range Filter */}
        <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full lg:w-[240px] justify-start text-left font-normal bg-transparent"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRangeFilter?.from ? (
                dateRangeFilter.to ? (
                  <>
                    {format(dateRangeFilter.from, "LLL dd, y")} - {format(dateRangeFilter.to, "LLL dd, y")}
                  </>
                ) : (
                  format(dateRangeFilter.from, "LLL dd, y")
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRangeFilter?.from}
              selected={dateRangeFilter}
              onSelect={onDateRangeFilter}
              numberOfMonths={2}
            />
            <div className="p-3 border-t">
              <Button variant="ghost" size="sm" onClick={() => onDateRangeFilter(undefined)} className="w-full">
                Clear dates
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Secondary Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center space-x-2">
          <Checkbox id="subscribed-only" checked={subscribedOnlyFilter} onCheckedChange={onSubscribedOnlyFilter} />
          <label
            htmlFor="subscribed-only"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            Only subscribed courses
          </label>
        </div>
      </div>

      {/* Active Filters */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {statusFilter && (
            <Badge variant="secondary" className="gap-1">
              Status: {statusOptions.find((s) => s.value === statusFilter)?.label}
              <button onClick={() => onStatusFilter(null)} className="hover:bg-secondary-foreground/20 rounded-sm">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {courseFilter.length > 0 && (
            <Badge variant="secondary" className="gap-1">
              {courseFilter.length} course{courseFilter.length > 1 ? "s" : ""}
              <button onClick={() => onCourseFilter([])} className="hover:bg-secondary-foreground/20 rounded-sm">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {dateRangeFilter && (
            <Badge variant="secondary" className="gap-1">
              Date range
              <button
                onClick={() => onDateRangeFilter(undefined)}
                className="hover:bg-secondary-foreground/20 rounded-sm"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {subscribedOnlyFilter && (
            <Badge variant="secondary" className="gap-1">
              Subscribed only
              <button
                onClick={() => onSubscribedOnlyFilter(false)}
                className="hover:bg-secondary-foreground/20 rounded-sm"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-6 px-2 text-xs">
            Clear all
          </Button>
        </div>
      )}
    </div>
  )
}
