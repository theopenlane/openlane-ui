import React from 'react'
import { Badge } from '@repo/ui/badge'
import IntegrationTagPill from './integration-tag-pill'

const MAX_VISIBLE_TAGS = 5

type IntegrationTagListProps = {
  tags: string[]
}

const IntegrationTagList = ({ tags }: IntegrationTagListProps) => {
  const visibleTags = tags.slice(0, MAX_VISIBLE_TAGS)
  const hiddenTagCount = Math.max(tags.length - visibleTags.length, 0)

  return (
    <div className="flex items-center gap-1 overflow-hidden">
      {visibleTags.map((tag, index) => (
        <IntegrationTagPill key={`${tag}-${index}`} tag={tag} />
      ))}
      {hiddenTagCount > 0 ? (
        <Badge variant="outline" className="h-5 rounded-sm border-transparent bg-muted/35 px-2 text-[10px] font-medium text-muted-foreground">
          +{hiddenTagCount} more
        </Badge>
      ) : null}
    </div>
  )
}

export default IntegrationTagList
