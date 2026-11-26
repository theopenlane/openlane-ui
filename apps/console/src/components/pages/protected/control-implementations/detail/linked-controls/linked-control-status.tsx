import { Badge } from '@repo/ui/badge'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { CONTROL_STATUS_STYLES } from '@/components/shared/enum-mapper/control-enum'
import { type TLinkedControlRow } from './linked-control-groups'

type TLinkedControlStatusProps = {
  status: TLinkedControlRow['status']
}

export const LinkedControlStatus = ({ status }: TLinkedControlStatusProps) => {
  if (!status) return '-'

  const style = CONTROL_STATUS_STYLES[status]

  return (
    <Badge variant="outline" className="whitespace-nowrap" style={style && { backgroundColor: style.bg, borderColor: style.bg, color: style.color }}>
      {getEnumLabel(status)}
    </Badge>
  )
}
