"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Search, X, CalendarIcon, Download } from "lucide-react"
import { format } from "date-fns"
import type { DateRange } from "react-day-picker"

interface LogFiltersProps {
  onSearchChange: (search: string) => void
  onChannelFilter: (channel: string | null) => void
  onResultFilter: (result: string | null) => void
  onDateRangeFilter: (dateRange: DateRange | undefined) => void
  onExportCsv: () => void
  searchValue: string
  channelFilter: string | null
  resultFilter: string | null
  dateRangeFilter: DateRange | undefined
  totalLogs: number
}

const channelOptions = [
  { value: "sms", label: "SMS" },
  { value: "email", label: "Email" },
  { value: "push", label: "Push Notification" },
]

const resultOptions = [
  { value: "success", label: "Success" },
  { value: "failed", label: "Failed" },
  { value: "pending", label: "Pending" },
]

export function LogFilters({
  onSearchChange,
  onChannelFilter,
  onResultFilter,
  onDateRangeFilter,
  onExportCsv,
  searchValue,
  channelFilter,
  resultFilter,
  dateRangeFilter,
  totalLogs,
}: LogFiltersProps) {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)

  const activeFiltersCount = [channelFilter, resultFilter, dateRangeFilter].filter(Boolean).length

  const clearAllFilters = () => {
    onSearchChange("")
    onChannelFilter(null)
    onResultFilter(null)
    onDateRangeFilter(undefined)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search logs by assignment, course, or message..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Channel Filter */}
        <Select
          value={channelFilter || "all"}
          onValueChange={(value) => onChannelFilter(value === "all" ? null : value)}
        >
          <SelectTrigger className="w-full lg:w-[150px]">
            <SelectValue placeholder="All channels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All channels</SelectItem>
            {channelOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Result Filter */}
        <Select value={resultFilter || "all"} onValueChange={(value) => onResultFilter(value === "all" ? null : value)}>
          <SelectTrigger className="w-full lg:w-[150px]">
            <SelectValue placeholder="All results" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All results</SelectItem>
            {resultOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

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

        {/* Export Button */}
        <Button onClick={onExportCsv} variant="outline" className="w-full lg:w-auto bg-transparent">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Active Filters */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {channelFilter && (
            <Badge variant="secondary" className="gap-1">
              Channel: {channelOptions.find((c) => c.value === channelFilter)?.label}
              <button onClick={() => onChannelFilter(null)} className="hover:bg-secondary-foreground/20 rounded-sm">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {resultFilter && (
            <Badge variant="secondary" className="gap-1">
              Result: {resultOptions.find((r) => r.value === resultFilter)?.label}
              <button onClick={() => onResultFilter(null)} className="hover:bg-secondary-foreground/20 rounded-sm">
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
          <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-6 px-2 text-xs">
            Clear all
          </Button>
        </div>
      )}

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Showing {totalLogs} notification{totalLogs !== 1 ? "s" : ""}
      </div>
    </div>
  )
}
