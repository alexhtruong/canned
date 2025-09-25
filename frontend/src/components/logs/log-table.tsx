"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { MessageSquare, Mail, Bell, CheckCircle, XCircle, Clock, Copy } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

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

interface LogTableProps {
  logs: NotificationLog[]
}

const channelIcons = {
  sms: MessageSquare,
  email: Mail,
  push: Bell,
}

const channelLabels = {
  sms: "SMS",
  email: "Email",
  push: "Push",
}

const resultStyles = {
  success: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
}

const resultIcons = {
  success: CheckCircle,
  failed: XCircle,
  pending: Clock,
}

export function LogTable({ logs }: LogTableProps) {
  const copyMessageId = (messageId: string) => {
    navigator.clipboard.writeText(messageId)
    toast.success("Copied", {
      description: "Message ID copied to clipboard",
    })
  }

  if (logs.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center">
        <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No notification logs found</h3>
        <p className="text-muted-foreground">No notifications match your current filters</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Timestamp</TableHead>
            <TableHead>Channel</TableHead>
            <TableHead>Course</TableHead>
            <TableHead>Assignment</TableHead>
            <TableHead>Result</TableHead>
            <TableHead>Message ID</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => {
            const ChannelIcon = channelIcons[log.channel]
            const ResultIcon = resultIcons[log.result]

            return (
              <TableRow key={log.id}>
                <TableCell>
                  <div className="text-sm">
                    <div>{format(new Date(log.timestamp), "MMM d, yyyy")}</div>
                    <div className="text-xs text-muted-foreground">{format(new Date(log.timestamp), "h:mm:ss a")}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <ChannelIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{channelLabels[log.channel]}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <Badge variant="outline" className="text-xs font-mono">
                      {log.courseCode}
                    </Badge>
                    <div className="text-sm text-muted-foreground truncate max-w-[150px]">{log.courseName}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm font-medium text-pretty max-w-[200px] truncate">{log.assignmentName}</div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <Badge className={cn("text-xs flex items-center gap-1 w-fit", resultStyles[log.result])}>
                      <ResultIcon className="h-3 w-3" />
                      {log.result.charAt(0).toUpperCase() + log.result.slice(1)}
                    </Badge>
                    {log.errorMessage && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="text-xs text-red-600 dark:text-red-400 truncate max-w-[150px] cursor-help">
                              {log.errorMessage}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[300px]">
                            <p className="text-sm">{log.errorMessage}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {log.messageId ? (
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-muted px-2 py-1 rounded font-mono">{log.messageId.slice(0, 8)}</code>
                      <Button variant="ghost" size="sm" onClick={() => copyMessageId(log.messageId!)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
