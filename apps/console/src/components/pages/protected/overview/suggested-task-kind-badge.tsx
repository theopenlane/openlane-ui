import React from 'react'
import { Badge } from '@repo/ui/badge'
import { type SuggestedTaskKind } from '@/lib/suggested-tasks/types'

export const SuggestedTaskKindBadge = ({ taskKind }: { taskKind: SuggestedTaskKind }) => (
  <Badge variant="outline" className="self-start" style={{ borderColor: taskKind.color, color: taskKind.color }}>
    {taskKind.name}
  </Badge>
)
