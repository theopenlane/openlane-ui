import { activatable } from '@repo/ui/lib/a11y'
import { XIcon } from 'lucide-react'

type TObjectsChipProps = {
  name: string
  objectType: string
  removable?: boolean
  onRemove?: () => void
  onClick?: () => void
}

const ObjectsChip = ({ name, objectType, removable, onRemove, onClick }: TObjectsChipProps) => {
  const borderClass = `border-${objectType}`

  return (
    <div
      {...activatable(onClick)}
      className={`inline-flex gap-1 bg-secondary items-center rounded-full px-2.5 py-0.5 border text-xs font-semibold transition-colors focus:outline-hidden h-fit shrink-0 ${borderClass} ${onClick ? 'cursor-pointer' : ''}`}
    >
      {name}
      {removable && onRemove && (
        <button
          type="button"
          data-testid="objects-chip-remove"
          aria-label={`Remove ${name}`}
          className="cursor-pointer ml-1 bg-transparent"
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            onRemove()
          }}
        >
          <XIcon size={12} />
        </button>
      )}
    </div>
  )
}

export default ObjectsChip
