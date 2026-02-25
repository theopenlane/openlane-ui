import { formatDate, formatTimeSince } from '@/utils/date'

type DateCellProps = {
  value: string | null | undefined
  variant?: 'date' | 'timesince'
}

export function DateCell({ value, variant = 'date' }: DateCellProps) {
  const formatted = variant === 'timesince' ? formatTimeSince(value) : formatDate(value)
  return <span className="whitespace-nowrap">{formatted}</span>
}
