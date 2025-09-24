"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"

const routeNames: Record<string, string> = {
  "/": "Dashboard",
  "/courses": "Courses",
  "/assignments": "Assignments",
  "/preferences": "Preferences",
  "/jobs": "Jobs",
  "/logs": "Logs",
  "/auth": "Authentication",
}

export function BreadcrumbNav() {
  const pathname = usePathname()

  if (pathname === "/") return null

  const segments = pathname.split("/").filter(Boolean)
  const breadcrumbs = [
    { name: "Dashboard", href: "/", icon: Home },
    ...segments.map((segment, index) => {
      const href = "/" + segments.slice(0, index + 1).join("/")
      return {
        name: routeNames[href] || segment.charAt(0).toUpperCase() + segment.slice(1),
        href,
      }
    }),
  ]

  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground mb-6">
      {breadcrumbs.map((breadcrumb, index) => (
        <div key={breadcrumb.href} className="flex items-center">
          {index > 0 && <ChevronRight className="h-4 w-4 mx-1" />}
          {index === breadcrumbs.length - 1 ? (
            <span className="font-medium text-foreground flex items-center gap-1">
              {breadcrumb.icon && <breadcrumb.icon className="h-4 w-4" />}
              {breadcrumb.name}
            </span>
          ) : (
            <Link href={breadcrumb.href} className="hover:text-foreground transition-colors flex items-center gap-1">
              {breadcrumb.icon && <breadcrumb.icon className="h-4 w-4" />}
              {breadcrumb.name}
            </Link>
          )}
        </div>
      ))}
    </nav>
  )
}
