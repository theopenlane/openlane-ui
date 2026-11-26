import { ControlHoverCard } from '@/components/shared/control-tooltip/control-tooltip'
import { Link } from '@/components/shared/link/link'
import { type TLinkedControlRow } from './linked-control-groups'

const NOT_LINKED_REASON = 'Not linked directly. Only its subcontrols are linked to this implementation.'

type TLinkedControlRefProps = {
  row: TLinkedControlRow
}

export const LinkedControlRef = ({ row }: TLinkedControlRefProps) =>
  row.href ? (
    <ControlHoverCard id={row.id} isSubcontrol={row.isSubcontrol}>
      <Link href={row.href} className="shrink-0 whitespace-nowrap">
        {row.refCode}
      </Link>
    </ControlHoverCard>
  ) : (
    <ControlHoverCard id={row.id} isSubcontrol={row.isSubcontrol} header={NOT_LINKED_REASON}>
      <span className="shrink-0 cursor-default whitespace-nowrap text-muted-foreground">{row.refCode}</span>
    </ControlHoverCard>
  )
