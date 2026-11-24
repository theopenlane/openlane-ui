import { SystemTooltip } from '@repo/ui/system-tooltip'
import { Link } from '@/components/shared/link/link'
import { type TLinkedControlRow } from './linked-control-groups'

const NOT_LINKED_REASON = 'Not linked directly. Only its subcontrols are linked to this implementation.'

type TLinkedControlRefProps = {
  row: TLinkedControlRow
}

export const LinkedControlRef = ({ row }: TLinkedControlRefProps) =>
  row.href ? (
    <Link href={row.href} className="shrink-0 whitespace-nowrap">
      {row.refCode}
    </Link>
  ) : (
    <SystemTooltip icon={<span className="shrink-0 cursor-default whitespace-nowrap text-muted-foreground">{row.refCode}</span>} content={NOT_LINKED_REASON} side="top" portal />
  )
