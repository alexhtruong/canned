"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Users, UserX } from "lucide-react"

interface BulkActionsProps {
  selectedCount: number
  totalCount: number
  onSelectAll: () => void
  onSelectNone: () => void
  onSubscribeAll: () => void
  onUnsubscribeAll: () => void
  isAllSelected: boolean
  isIndeterminate: boolean
}

export function BulkActions({
  selectedCount,
  totalCount,
  onSelectAll,
  onSelectNone,
  onSubscribeAll,
  onUnsubscribeAll,
  isAllSelected,
  isIndeterminate,
}: BulkActionsProps) {
  return (
    <div className="flex items-center justify-between gap-4 p-4 bg-muted/50 rounded-lg">
      <div className="flex items-center gap-3">
        <Checkbox
          checked={isAllSelected}
          ref={(el) => {
            if (el) el.indeterminate = isIndeterminate
          }}
          onCheckedChange={(checked) => {
            if (checked) {
              onSelectAll()
            } else {
              onSelectNone()
            }
          }}
        />
        <span className="text-sm font-medium">
          {selectedCount > 0 ? (
            <>
              <Badge variant="secondary" className="mr-2">
                {selectedCount}
              </Badge>
              of {totalCount} courses selected
            </>
          ) : (
            `Select courses (${totalCount} total)`
          )}
        </span>
      </div>

      {selectedCount > 0 && (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onSubscribeAll}>
            <Users className="h-4 w-4 mr-2" />
            Subscribe selected
          </Button>
          <Button variant="outline" size="sm" onClick={onUnsubscribeAll}>
            <UserX className="h-4 w-4 mr-2" />
            Unsubscribe selected
          </Button>
        </div>
      )}
    </div>
  )
}
