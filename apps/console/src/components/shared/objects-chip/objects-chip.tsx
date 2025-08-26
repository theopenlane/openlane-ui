type ObjectsChipProps = {
  name: string
  objectType: string
}

const borderColors: Record<string, string> = {
  controls: 'border-object-controls',
  programs: 'border-object-programs',
  tasks: 'border-object-tasks',
  procedures: 'border-object-procedures',
  risks: 'border-object-risks',
  subcontrols: 'border-object-subcontrols',
  controlObjectives: 'border-object-controlObjectives',
  policies: 'border-object-policies',
  groups: 'border-object-groups',
  evidences: 'border-object-evidence',
  default: 'border-transparent',
}

const ObjectsChip = ({ name, objectType }: ObjectsChipProps) => {
  const colorClass = borderColors[objectType] || borderColors.default

  return <div className={`inline-flex gap-1 items-center rounded-full px-2.5 py-0.5 border text-xs font-semibold transition-colors focus:outline-hidden h-fit shrink-0 ${colorClass}`}>{name}</div>
}

export default ObjectsChip
