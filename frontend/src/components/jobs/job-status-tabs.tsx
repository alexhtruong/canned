"use client"

import type React from "react"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Clock, Play, CheckCircle, XCircle } from "lucide-react"

interface JobStatusTabsProps {
  children: React.ReactNode
  jobCounts: {
    due: number
    running: number
    done: number
    errors: number
  }
  activeTab: string
  onTabChange: (tab: string) => void
}

export function JobStatusTabs({ children, jobCounts, activeTab, onTabChange }: JobStatusTabsProps) {
  const tabs = [
    {
      value: "due",
      label: "Due",
      count: jobCounts.due,
      icon: Clock,
      color: "text-yellow-600 dark:text-yellow-400",
    },
    {
      value: "running",
      label: "Running",
      count: jobCounts.running,
      icon: Play,
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      value: "done",
      label: "Done",
      count: jobCounts.done,
      icon: CheckCircle,
      color: "text-green-600 dark:text-green-400",
    },
    {
      value: "errors",
      label: "Errors",
      count: jobCounts.errors,
      icon: XCircle,
      color: "text-red-600 dark:text-red-400",
    },
  ]

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
              <Icon className={`h-4 w-4 ${tab.color}`} />
              <span className="hidden sm:inline">{tab.label}</span>
              <Badge variant="secondary" className="ml-1">
                {tab.count}
              </Badge>
            </TabsTrigger>
          )
        })}
      </TabsList>
      {children}
    </Tabs>
  )
}
