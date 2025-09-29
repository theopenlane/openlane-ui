import { XIcon } from 'lucide-react'

type TObjectsChipProps = {
  name: string
  objectType: string
  removable?: boolean
  onRemove?: (objectType: string) => void
}

const borderColors: Record<string, string> = {
  controls: 'border-controls',
  programs: 'border-programs',
  tasks: 'border-tasks',
  procedures: 'border-procedures',
  risks: 'border-risks',
  subcontrols: 'border-subcontrols',
  controlObjectives: 'border-controlObjectives',
  policies: 'border-policies',
  groups: 'border-groups',
  evidences: 'border-evidence',
  default: 'border-transparent',
}

const ObjectsChip = ({ name, objectType, removable, onRemove }: TObjectsChipProps) => {
  const colorClass = borderColors[objectType] || borderColors.default

  return (
    <div className={`inline-flex gap-1 items-center rounded-full px-2.5 py-0.5 border text-xs font-semibold transition-colors focus:outline-hidden h-fit shrink-0 ${colorClass}`}>
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
