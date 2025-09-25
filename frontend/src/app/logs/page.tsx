"use client"

import { useState, useMemo } from "react"
import { TopNav } from "@/components/layout/top-nav"
import { BreadcrumbNav } from "@/components/layout/breadcrumb-nav"
import { LogFilters } from "@/components/logs/log-filters"
import { LogTable } from "@/components/logs/log-table"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { toast } from "sonner"
import type { DateRange } from "react-day-picker"

interface NotificationLog {
  id: string
  timestamp: string
  channel: "sms" | "email" | "push"
  courseCode: string
  courseName: string
  assignmentName: string
  result: "success" | "failed" | "pending"
  messageId?: string
  errorMessage?: string
  recipientPhone?: string
  recipientEmail?: string
}

// Mock data
const mockLogs: NotificationLog[] = [
  {
    id: "log_001",
    timestamp: "2024-01-15T14:30:00Z",
    channel: "sms",
    courseCode: "CPE-365",
    courseName: "Database Systems",
    assignmentName: "Database Design Project Phase 2",
    result: "success",
    messageId: "msg_abc123",
    recipientPhone: "+1234567890",
  },
  {
    id: "log_002",
    timestamp: "2024-01-15T14:29:45Z",
    channel: "sms",
    courseCode: "CPE-308",
    courseName: "Software Engineering",
    assignmentName: "React Component Library Documentation",
    result: "failed",
    errorMessage: "SMS delivery failed: Invalid phone number format",
    recipientPhone: "+1234567890",
  },
  {
    id: "log_003",
    timestamp: "2024-01-15T12:00:00Z",
    channel: "email",
    courseCode: "CPE-466",
    courseName: "Knowledge Discovery from Data",
    assignmentName: "Machine Learning Midterm",
    result: "success",
    messageId: "msg_def456",
    recipientEmail: "student@university.edu",
  },
  {
    id: "log_004",
    timestamp: "2024-01-14T16:45:30Z",
    channel: "sms",
    courseCode: "CPE-349",
    courseName: "Design & Analysis of Algorithms",
    assignmentName: "Algorithm Analysis Report",
    result: "success",
    messageId: "msg_ghi789",
    recipientPhone: "+1234567890",
  },
  {
    id: "log_005",
    timestamp: "2024-01-14T10:15:00Z",
    channel: "push",
    courseCode: "CPE-357",
    courseName: "Systems Programming",
    assignmentName: "Systems Programming Lab 3",
    result: "pending",
    recipientEmail: "student@university.edu",
  },
  {
    id: "log_006",
    timestamp: "2024-01-13T20:30:00Z",
    channel: "sms",
    courseCode: "CPE-365",
    courseName: "Database Systems",
    assignmentName: "Database Optimization Assignment",
    result: "success",
    messageId: "msg_jkl012",
    recipientPhone: "+1234567890",
  },
  {
    id: "log_007",
    timestamp: "2024-01-13T18:00:00Z",
    channel: "email",
    courseCode: "CPE-308",
    courseName: "Software Engineering",
    assignmentName: "Web Development Final Project",
    result: "failed",
    errorMessage: "Email delivery failed: Recipient mailbox full",
    recipientEmail: "student@university.edu",
  },
  {
    id: "log_008",
    timestamp: "2024-01-12T22:15:00Z",
    channel: "sms",
    courseCode: "CPE-466",
    courseName: "Knowledge Discovery from Data",
    assignmentName: "Data Mining Assignment",
    result: "success",
    messageId: "msg_mno345",
    recipientPhone: "+1234567890",
  },
]

export default function LogsPage() {
  const [logs] = useState<NotificationLog[]>(mockLogs)
  const [searchValue, setSearchValue] = useState("")
  const [channelFilter, setChannelFilter] = useState<string | null>(null)
  const [resultFilter, setResultFilter] = useState<string | null>(null)
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRange | undefined>()
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Search filter
      const matchesSearch =
        searchValue === "" ||
        log.assignmentName.toLowerCase().includes(searchValue.toLowerCase()) ||
        log.courseCode.toLowerCase().includes(searchValue.toLowerCase()) ||
        log.courseName.toLowerCase().includes(searchValue.toLowerCase()) ||
        log.messageId?.toLowerCase().includes(searchValue.toLowerCase())

      // Channel filter
      const matchesChannel = channelFilter === null || log.channel === channelFilter

      // Result filter
      const matchesResult = resultFilter === null || log.result === resultFilter

      // Date range filter
      const logDate = new Date(log.timestamp)
      const matchesDateRange =
        !dateRangeFilter ||
        !dateRangeFilter.from ||
        (logDate >= dateRangeFilter.from && (!dateRangeFilter.to || logDate <= dateRangeFilter.to))

      return matchesSearch && matchesChannel && matchesResult && matchesDateRange
    })
  }, [logs, searchValue, channelFilter, resultFilter, dateRangeFilter])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))
      toast.success("Logs Refreshed",{
        description: "Notification logs have been updated",
      })
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error("Refresh Failed", {
        description: "Unable to refresh logs. Please try again.",
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleExportCsv = () => {
    toast.success("Export Complete", {
      description: `Exported ${filteredLogs.length} notification logs to CSV`,
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
              <h1 className="text-3xl font-bold tracking-tight text-balance">Notification Logs</h1>
              <p className="text-muted-foreground text-pretty">
                View history of sent notifications and delivery status
              </p>
            </div>
            <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>

          {/* Filters */}
          <LogFilters
            onSearchChange={setSearchValue}
            onChannelFilter={setChannelFilter}
            onResultFilter={setResultFilter}
            onDateRangeFilter={setDateRangeFilter}
            onExportCsv={handleExportCsv}
            searchValue={searchValue}
            channelFilter={channelFilter}
            resultFilter={resultFilter}
            dateRangeFilter={dateRangeFilter}
            totalLogs={filteredLogs.length}
          />

          {/* Logs Table */}
          <LogTable logs={filteredLogs} />
        </div>
      </main>
    </div>
  )
}
