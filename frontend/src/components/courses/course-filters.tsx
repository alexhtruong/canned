"use client"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, X } from "lucide-react"
import { attachReactRefresh } from "next/dist/build/webpack-config"

interface CourseFiltersProps {
  onSearchChange: (search: string) => void
  onTermFilter: (term: string | null) => void
  onSubscribedFilter: (subscribed: boolean | null) => void
  searchValue: string
  termFilter: string | null
  subscribedFilter: boolean | null
}

function generateTerms(): string[] {
  const terms: string[] = [];
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // getMonth() returns 0-11
  
  // Determine current quarter based on month
  let currentQuarter: number;
  if (currentMonth >= 1 && currentMonth <= 3) {
    currentQuarter = 1; // Winter
  } else if (currentMonth >= 4 && currentMonth <= 6) {
    currentQuarter = 2; // Spring  
  } else if (currentMonth >= 7 && currentMonth <= 9) {
    currentQuarter = 3; // Summer
  } else {
    currentQuarter = 4; // Fall
  }
  
  const quarterNames = ["Winter", "Spring", "Summer", "Fall"];
  
  // Generate current + past 3 quarters (4 total)
  for (let i = 0; i < 4; i++) {
    let quarterIndex = currentQuarter - 1 - i; // Convert to 0-based index
    let year = currentYear;
    
    // Handle year rollover
    if (quarterIndex < 0) {
      quarterIndex += 4; // Wrap around (e.g., -1 becomes 3)
      year -= 1;
    }
    
    const quarterName = quarterNames[quarterIndex];
    terms.push(`${quarterName} Quarter ${year}`);
  }
  
  return terms;
}

const terms = generateTerms();

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
