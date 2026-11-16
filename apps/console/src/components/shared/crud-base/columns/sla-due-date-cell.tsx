import { isSlaPastDue, type SlaDaysByLevel } from '@/lib/sla'
import { formatDate } from '@/utils/date'
import { getSlaDueDate, type TVulnerabilityDueDateSource } from '@/utils/vulnerability-due-date'
import { cn } from '@repo/ui/lib/utils'

type SlaDueDateCellProps = {
  item: TVulnerabilityDueDateSource & { open?: boolean | null }
  slaDaysByLevel: SlaDaysByLevel
}

export const SlaDueDateCell = ({ item, slaDaysByLevel }: SlaDueDateCellProps) => {
  const dueDate = getSlaDueDate(item, slaDaysByLevel)
  if (!dueDate) return <span className="text-muted-foreground">-</span>

  const pastDue = item.open === true && isSlaPastDue(dueDate)
  return <span className={cn('whitespace-nowrap', pastDue && 'text-danger')}>{formatDate(dueDate.toISOString())}</span>
}
