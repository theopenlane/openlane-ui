import { formatDate, formatTimeSince } from '@/utils/date'

type DateCellProps = {
  value: string | null | undefined
  variant?: 'date' | 'timesince'
  empty?: string
}

export const DateCell = ({ value, variant = 'date', empty }: DateCellProps) => {
  const formatted = variant === 'timesince' ? formatTimeSince(value, empty) : formatDate(value, empty)
  return <span className="whitespace-nowrap">{formatted}</span>
}
