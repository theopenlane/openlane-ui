import React from 'react'
import { Badge } from '@repo/ui/badge'

type IntegrationTagPillProps = {
  tag: string
}

const IntegrationTagPill = ({ tag }: IntegrationTagPillProps) => {
  return (
    <Badge variant="outline" className="flex items-center gap-1 w-fit truncate max-w-[120px]" title={tag}>
      <span className="truncate">{tag}</span>
    </Badge>
  )
}

export default IntegrationTagPill
