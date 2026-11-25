import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { Checkbox } from '@repo/ui/checkbox'
import { cn } from '@repo/ui/lib/utils'
import { DisabledReasonTooltip } from '@/components/shared/disabled-reason-tooltip/disabled-reason-tooltip'
import { requiredByLabels, type TDemoDataType, type TDemoDataTypeGroup, type TDemoDataTypeKey } from '@/constants/demo-data-types'
import { formatTruncatedList } from '@/utils/strings'
import { type TDemoDataTypeSelection } from './use-demo-data-type-selection'

type DemoDataTypeGroupProps = {
  group: TDemoDataTypeGroup
  selection: TDemoDataTypeSelection
  previewKey: TDemoDataTypeKey
  onPreview: (key: TDemoDataTypeKey) => void
  disabled: boolean
}

type DemoDataTypeRowProps = Omit<DemoDataTypeGroupProps, 'group'> & { type: TDemoDataType }

const MAX_REASON_LABELS = 3
const ROW_BUTTON_CLASS = 'min-w-0 flex-1 justify-start border-none px-1 hover:border-none hover:bg-transparent'

const DemoDataTypeRow = ({ type, selection, previewKey, onPreview, disabled }: DemoDataTypeRowProps) => {
  const { kept, counts, setTypesKept } = selection
  const requiredBy = requiredByLabels(type.key, kept)
  const lockedReason = requiredBy.length > 0 ? `Kept because these records depend on it: ${formatTruncatedList(requiredBy, requiredBy.length, MAX_REASON_LABELS)}.` : null

  return (
    <li className={cn('flex items-center gap-2 rounded-md px-2', previewKey === type.key && 'bg-btn-secondary')}>
      <DisabledReasonTooltip reason={lockedReason} side="right">
        <Checkbox
          checked={kept.has(type.key)}
          disabled={disabled || !!lockedReason}
          className={cn(lockedReason && 'opacity-60')}
          aria-label={`Keep ${type.label}`}
          aria-description={lockedReason ?? undefined}
          onCheckedChange={(checked) => {
            setTypesKept([type], checked === true)
            onPreview(type.key)
          }}
        />
      </DisabledReasonTooltip>
      <Button variant="transparent" type="button" childFull className={cn(ROW_BUTTON_CLASS, 'font-normal')} aria-pressed={previewKey === type.key} onClick={() => onPreview(type.key)}>
        <span className="flex w-full min-w-0 items-center gap-2">
          <span className="truncate">{type.label}</span>
          {type.recommended && <Badge variant="green">Recommended</Badge>}
          <span className="ml-auto text-muted-foreground tabular-nums">{counts[type.key] ?? 0}</span>
        </span>
      </Button>
    </li>
  )
}

export const DemoDataTypeGroup = ({ group, selection, previewKey, onPreview, disabled }: DemoDataTypeGroupProps) => {
  const { kept, setTypesKept } = selection
  const keptInGroup = group.types.filter((type) => kept.has(type.key)).length
  const isAllKept = keptInGroup === group.types.length
  const [isExpanded, setIsExpanded] = useState(keptInGroup > 0)
  const unlockedTypes = group.types.filter((type) => requiredByLabels(type.key, kept).length === 0)
  const Chevron = isExpanded ? ChevronDown : ChevronRight

  const toggleAll = (isKept: boolean) => {
    setTypesKept(unlockedTypes, isKept)
    setIsExpanded(true)
  }

  return (
    <div className="border-b px-4 py-2 last:border-b-0">
      <div className="flex items-center gap-2">
        <Checkbox
          checked={isAllKept || (keptInGroup > 0 && 'indeterminate')}
          disabled={disabled || unlockedTypes.length === 0}
          aria-label={`Keep all ${group.label}`}
          onCheckedChange={(checked) => toggleAll(checked === true)}
        />
        <Button variant="transparent" type="button" childFull className={ROW_BUTTON_CLASS} aria-expanded={isExpanded} onClick={() => setIsExpanded((prev) => !prev)}>
          <span className="flex w-full min-w-0 items-center gap-2">
            <span className="truncate">{group.label}</span>
            <span className="ml-auto font-normal text-muted-foreground tabular-nums">{keptInGroup > 0 && `${keptInGroup} of ${group.types.length}`}</span>
            <Chevron className="shrink-0 text-muted-foreground" />
          </span>
        </Button>
      </div>
      {isExpanded && (
        <ul className="mt-1 flex flex-col pl-5" aria-label={group.label}>
          {group.types.map((type) => (
            <DemoDataTypeRow key={type.key} type={type} selection={selection} previewKey={previewKey} onPreview={onPreview} disabled={disabled} />
          ))}
        </ul>
      )}
    </div>
  )
}
