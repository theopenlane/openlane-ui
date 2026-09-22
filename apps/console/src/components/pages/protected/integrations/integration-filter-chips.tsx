import React, { useId } from 'react'
import { Button } from '@repo/ui/button'
import { SystemTooltip } from '@repo/ui/system-tooltip'

export type TIntegrationFilterChip<TValue extends string> = {
  value: TValue
  label: string
  count?: number
  tooltip?: string
}

type IntegrationFilterChipsProps<TValue extends string> = {
  label: string
  chips: TIntegrationFilterChip<TValue>[]
  isSelected: (value: TValue) => boolean
  onSelect: (value: TValue) => void
  onClear?: () => void
}

const IntegrationFilterChips = <TValue extends string>({ label, chips, isSelected, onSelect, onClear }: IntegrationFilterChipsProps<TValue>) => {
  const labelId = useId()

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-labelledby={labelId}>
      <span id={labelId} className="text-sm text-muted-foreground">
        {label}:
      </span>
      {chips.map(({ value, label: chipLabel, count, tooltip }) => {
        const chip = (
          <Button key={value} type="button" size="sm" variant="tag" aria-pressed={isSelected(value)} className={isSelected(value) ? 'is-active' : ''} onClick={() => onSelect(value)}>
            {count === undefined ? chipLabel : `${chipLabel} (${count})`}
          </Button>
        )

        return tooltip ? <SystemTooltip key={value} content={tooltip} icon={<span className="inline-flex">{chip}</span>} /> : chip
      })}
      {onClear && (
        <Button type="button" variant="transparent" size="sm" className="text-xs text-muted-foreground underline-offset-2 hover:underline" onClick={onClear}>
          Clear
        </Button>
      )}
    </div>
  )
}

export default IntegrationFilterChips
