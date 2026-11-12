import React from 'react'
import { Badge } from '@repo/ui/badge'
import { type questionOrigin } from '@/lib/vendor-scoring-config'

type TBadgeOrigin = Exclude<ReturnType<typeof questionOrigin>, 'default'>

const ORIGIN_BADGE: Record<TBadgeOrigin, { label: string; variant: React.ComponentProps<typeof Badge>['variant'] }> = {
  custom: { label: 'Custom', variant: 'purple' },
  edited: { label: 'Edited', variant: 'blue' },
}

export const QuestionOriginBadge: React.FC<{ origin: TBadgeOrigin }> = ({ origin }) => <Badge variant={ORIGIN_BADGE[origin].variant}>{ORIGIN_BADGE[origin].label}</Badge>
