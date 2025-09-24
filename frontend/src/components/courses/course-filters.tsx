"use client"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, X } from "lucide-react"

interface CourseFiltersProps {
  onSearchChange: (search: string) => void
  onTermFilter: (term: string | null) => void
  onSubscribedFilter: (subscribed: boolean | null) => void
  searchValue: string
  termFilter: string | null
  subscribedFilter: boolean | null
}

const terms = ["Fall 2024", "Winter 2024", "Spring 2024", "Summer 2024"]

export function CourseFilters({
  onSearchChange,
  onTermFilter,
  onSubscribedFilter,
  searchValue,
  termFilter,
  subscribedFilter,
}: CourseFiltersProps) {
  const activeFiltersCount = [termFilter, subscribedFilter].filter(Boolean).length

  const clearAllFilters = () => {
    onSearchChange("")
    onTermFilter(null)
    onSubscribedFilter(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search courses..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Term Filter */}
        <Select value={termFilter || "all"} onValueChange={(value) => onTermFilter(value === "all" ? null : value)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All terms" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All terms</SelectItem>
            {terms.map((term) => (
              <SelectItem key={term} value={term}>
                {term}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Subscribed Filter */}
        <Select
          value={subscribedFilter === null ? "all" : subscribedFilter.toString()}
          onValueChange={(value) => onSubscribedFilter(value === "all" ? null : value === "true")}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All courses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All courses</SelectItem>
            <SelectItem value="true">Subscribed only</SelectItem>
            <SelectItem value="false">Unsubscribed only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Active Filters */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {termFilter && (
            <Badge variant="secondary" className="gap-1">
              Term: {termFilter}
              <button onClick={() => onTermFilter(null)} className="hover:bg-secondary-foreground/20 rounded-sm">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {subscribedFilter !== null && (
            <Badge variant="secondary" className="gap-1">
              {subscribedFilter ? "Subscribed" : "Unsubscribed"}
              <button onClick={() => onSubscribedFilter(null)} className="hover:bg-secondary-foreground/20 rounded-sm">
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
