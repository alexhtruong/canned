"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { BookOpen, ExternalLink, MoreHorizontal, Eye } from "lucide-react"
import { cn } from "@/lib/utils"
import { Course } from "@/types/types"
import { getApiUrl } from "@/lib/config"
import { subscriptionsApi } from "@/lib/api"

interface CourseRowProps {
  course: Course
  onSubscriptionChange: (courseId: string, subscribed: boolean) => void
  onViewAssignments: (courseId: string) => void
}

const statusStyles = {
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  completed: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  upcoming: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
}

export function CourseRow({ course, onSubscriptionChange, onViewAssignments }: CourseRowProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  
  const handleSubscriptionToggle = async (checked: boolean) => {
    try {
      setIsUpdating(true)
      const courseIdAsNum = parseInt(course.id)
      const data = await subscriptionsApi.toggle(courseIdAsNum, !checked)
      console.log(data);
      onSubscriptionChange(course.id, checked)
    } catch (e) {
      console.error(e)
      // implement toast
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* Course Icon */}
          <div className="rounded-lg bg-primary/10 p-2 flex-shrink-0">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>

          {/* Course Info */}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="font-mono text-xs">
                {course.code}
              </Badge>
              <Badge className={cn("text-xs", statusStyles[course.status])}>{course.status}</Badge>
            </div>
            <h3 className="font-medium text-foreground truncate">{course.name}</h3>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{course.term?.name}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Subscription Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:inline">Subscribed</span>
            <Switch
              checked={course.subscribed}
              onCheckedChange={handleSubscriptionToggle}
              disabled={isUpdating}
              className="data-[state=checked]:bg-green-600"
            />
          </div>

          {/* View Assignments Button */}
          <Button variant="outline" size="sm" onClick={() => onViewAssignments(course.id)}>
            <Eye className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">View assignments</span>
            <span className="sm:hidden">View</span>
          </Button>

          {/* More Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <a href={course.canvasUrl} target="_blank" rel="noopener noreferrer" className="flex items-center">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in Canvas
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onViewAssignments(course.id)}>
                <Eye className="h-4 w-4 mr-2" />
                View assignments
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
