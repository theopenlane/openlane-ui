import { getSlaDueDate, isSlaPastDue, type SlaDaysByLevel } from '@/lib/sla'
import { formatDate } from '@/utils/date'
import { cn } from '@repo/ui/lib/utils'

type SlaDueDateCellProps = {
  createdAt: string | null | undefined
  securityLevel: string | null | undefined
  open?: boolean | null
  slaDaysByLevel: SlaDaysByLevel
}

export function SlaDueDateCell({ createdAt, securityLevel, open, slaDaysByLevel }: SlaDueDateCellProps) {
  const dueDate = getSlaDueDate(createdAt, securityLevel, slaDaysByLevel)
  if (!dueDate) return <span className="text-muted-foreground">-</span>

  const pastDue = open === true && isSlaPastDue(dueDate)
  return <span className={cn('whitespace-nowrap', pastDue && 'text-danger')}>{formatDate(dueDate.toISOString())}</span>
}
