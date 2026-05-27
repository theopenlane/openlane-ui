'use client'

import React from 'react'
import { AssessmentResponseAssessmentResponseStatus } from '@repo/codegen/src/schema'
import { Button } from '@repo/ui/button'
import { Send } from 'lucide-react'

type ResponseStateCardProps = {
  status: AssessmentResponseAssessmentResponseStatus
  answered: number
  total: number
  dueDate?: string | null
  onResend: () => void
  isResending: boolean
}

const MS_PER_DAY = 1000 * 60 * 60 * 24

const daysPastDue = (dueDate?: string | null): number | null => {
  if (!dueDate) return null
  const diff = Date.now() - new Date(dueDate).getTime()
  if (diff <= 0) return null
  return Math.floor(diff / MS_PER_DAY)
}

const ResponseStateCard: React.FC<ResponseStateCardProps> = ({ status, answered, total, dueDate, onResend, isResending }) => {
  const isOverdue = status === AssessmentResponseAssessmentResponseStatus.OVERDUE
  const isInProgress = status === AssessmentResponseAssessmentResponseStatus.DRAFT
  const pastDue = daysPastDue(dueDate)
  const pct = total > 0 ? Math.round((answered / total) * 100) : 0

  return (
    <div className="space-y-4">
      {/* [MINOR] Review fix M2: semantic destructive tokens instead of hardcoded red-* utilities, matching the Badge destructive variant */}
      {isOverdue && pastDue !== null && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Due date passed {pastDue} {pastDue === 1 ? 'day' : 'days'} ago
        </div>
      )}

      {isInProgress && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>
              {answered} of {total} answered
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-info transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      <div className="rounded-md border border-border bg-muted/30 px-4 py-6 text-center">
        {isInProgress ? (
          <>
            <p className="text-sm font-medium">Partially completed</p>
            <p className="mt-1 text-sm text-muted-foreground">Responses will appear here once submitted.</p>
          </>
        ) : isOverdue ? (
          <>
            <p className="text-sm font-medium">No response received</p>
            <p className="mt-1 text-sm text-muted-foreground">This assessment is past due with no submission.</p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium">No response yet</p>
            <p className="mt-1 text-sm text-muted-foreground">The recipient hasn&apos;t started the assessment.</p>
          </>
        )}
      </div>

      <Button type="button" variant="outline" className="w-full" onClick={onResend} disabled={isResending}>
        <Send className="mr-2 h-4 w-4" />
        Send reminder
      </Button>
    </div>
  )
}

export default ResponseStateCard
