import { XIcon } from 'lucide-react'

type TObjectsChipProps = {
  name: string
  objectType: string
  removable?: boolean
  onRemove?: (objectType: string) => void
}

const ObjectsChip = ({ name, objectType, removable, onRemove }: TObjectsChipProps) => {
  const borderClass = `border-${objectType}`

  return (
    <div className={`inline-flex gap-1 bg-secondary items-center rounded-full px-2.5 py-0.5 border text-xs font-semibold transition-colors focus:outline-hidden h-fit shrink-0 ${borderClass}`}>
      {name}
      {removable && onRemove && (
        <XIcon
          size={12}
          className="cursor-pointer ml-1"
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            onRemove(objectType)
          }}
        />
      )}
    </div>
  )
}

export default ObjectsChip
