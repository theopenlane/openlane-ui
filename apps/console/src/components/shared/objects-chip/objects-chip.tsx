type ObjectsChipProps = {
  name: string
  objectType: string
}

const borderColors: Record<string, string> = {
  Control: 'border-object-controls',
  Program: 'border-object-programs',
  Tasks: 'border-object-tasks',
  Procedure: 'border-object-procedures',
  Risk: 'border-object-risks',
  Subcontrol: 'border-object-subcontrols',
  'Control objective': 'border-object-controlObjectives',
  Policy: 'border-object-policies',
  default: 'border border',
}

const ObjectsChip = ({ name, objectType }: ObjectsChipProps) => {
  const colorClass = borderColors[objectType] || borderColors.default

  return <div className={`inline-flex gap-1 items-center rounded-full px-2.5 py-0.5 border text-xs font-semibold transition-colors focus:outline-hidden h-fit shrink-0 ${colorClass}`}>{name}</div>
}

export default ObjectsChip
