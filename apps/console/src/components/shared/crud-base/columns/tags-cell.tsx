import TagChip from '@/components/shared/tag-chip.tsx/tag-chip'

// TagsCellProps defines the props for TagsCell
type TagsCellProps = {
  tags: string[] | null | undefined
  wrap?: boolean
}

// TagsCell renders a list of tag chips, or '-' if no tags are present
export function TagsCell({ tags, wrap = true }: TagsCellProps) {
  if (!tags?.length) {
    return <>-</>
  }

  return (
    <div className={`flex gap-2${wrap ? ' flex-wrap' : ''}`}>
      {tags.map((tag, i) => (
        <TagChip key={i} tag={tag} />
      ))}
    </div>
  )
}
