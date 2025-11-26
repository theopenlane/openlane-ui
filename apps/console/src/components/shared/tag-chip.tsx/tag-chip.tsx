import { useGetTags } from '@/lib/graphql-hooks/tags'
import { Badge } from '@repo/ui/badge'
import React from 'react'

const TagChip = ({ tag }: { tag: string }) => {
  const { data: tagsData } = useGetTags()

  const tagNode = tagsData?.tagDefinitions?.edges?.find((t) => t?.node?.name === tag)?.node

  return (
    <Badge variant="outline" className="flex items-center gap-1 w-fit">
      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tagNode?.color ?? '#6B7280' }} />
      <span>{tag}</span>
    </Badge>
  )
}

export default TagChip
