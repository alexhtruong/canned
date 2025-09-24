import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: string | number
  subtitle: string
  icon: LucideIcon
  variant?: "default" | "success" | "warning" | "danger"
  className?: string
}

const variantStyles = {
  default: "border-border",
  success: "border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20",
  warning: "border-yellow-200 bg-yellow-50/50 dark:border-yellow-800 dark:bg-yellow-950/20",
  danger: "border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20",
}

const valueStyles = {
  default: "text-foreground",
  success: "text-green-600 dark:text-green-400",
  warning: "text-yellow-600 dark:text-yellow-400",
  danger: "text-red-600 dark:text-red-400",
}

const iconStyles = {
  default: "text-muted-foreground",
  success: "text-green-500",
  warning: "text-yellow-500",
  danger: "text-red-500",
}

export function StatCard({ title, value, subtitle, icon: Icon, variant = "default", className }: StatCardProps) {
  return (
    <div
      className={cn("rounded-2xl border bg-card p-6 shadow-sm transition-colors", variantStyles[variant], className)}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className={cn("text-3xl font-bold tracking-tight", valueStyles[variant])}>{value}</p>
          <p className="text-sm text-muted-foreground text-pretty">{subtitle}</p>
        </div>
        <div className={cn("rounded-lg p-2", iconStyles[variant])}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  )
}
