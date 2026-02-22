import { formatDate, formatTimeSince } from '@/utils/date'

// DateCellProps defines the props for DateCell
type DateCellProps = {
  value: string | null | undefined
  variant?: 'date' | 'timesince'
}

// DateCell renders a formatted date string in a non-wrapping span
export function DateCell({ value, variant = 'date' }: DateCellProps) {
  const formatted = variant === 'timesince' ? formatTimeSince(value) : formatDate(value)
  return <span className="whitespace-nowrap">{formatted}</span>
}
