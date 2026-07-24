'use client'

import { Checkbox } from '@repo/ui/checkbox'
import ControlChip from '@/components/pages/protected/controls/map-controls/shared/control-chip'
import { type MapControl } from '@/types'

type SuggestedControlRowProps = {
  title?: string | null
  description?: string | null
  mappedControls: MapControl[]
  checked: boolean
  disabled?: boolean
  onToggle: () => void
}

const SuggestedControlRow = ({ title, description, mappedControls, checked, disabled, onToggle }: SuggestedControlRowProps) => (
  <div className="flex items-start gap-3 rounded-md border bg-background p-3">
    <Checkbox checked={checked} onCheckedChange={onToggle} disabled={disabled} />
    <span className="min-w-0 flex-1">
      <span className="block text-sm font-medium">{title}</span>
      {description && <span className="block text-xs text-muted-foreground">{description}</span>}
      {mappedControls.length > 0 && (
        <span className="mt-2 flex flex-wrap items-center gap-1">
          <span className="text-xs font-normal text-muted-foreground">Maps to:</span>
          {mappedControls.map((mapped) => (
            <ControlChip key={mapped.id} control={mapped} clickable={false} disableHref />
          ))}
        </span>
      )}
    </span>
  </div>
)

export default SuggestedControlRow
