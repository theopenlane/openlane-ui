import TagChip from '@/components/shared/tag-chip.tsx/tag-chip'
import { cn } from '@repo/ui/lib/utils'

type TagsCellProps = {
  tags: string[] | null | undefined
  wrap?: boolean
}

export function TagsCell({ tags, wrap = true }: TagsCellProps) {
  if (!tags?.length) {
    return <>-</>
  }

  return (
    <div className={cn('flex gap-2', wrap && 'flex-wrap')}>
      {tags.map((tag, i) => (
        <TagChip key={i} tag={tag} />
      ))}
    </div>
  )
}
