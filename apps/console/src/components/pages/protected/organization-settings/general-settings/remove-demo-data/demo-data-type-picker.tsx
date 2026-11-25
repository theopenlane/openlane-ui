import { useState } from 'react'
import { Button } from '@repo/ui/button'
import { type TDemoDataTypeKey } from '@/constants/demo-data-types'
import { DemoDataTypeGroup } from './demo-data-type-group'
import { DemoDataTypePreview } from './demo-data-type-preview'
import { type TDemoDataTypeSelection } from './use-demo-data-type-selection'

type DemoDataTypePickerProps = {
  selection: TDemoDataTypeSelection
  disabled: boolean
}

export const DemoDataTypePicker = ({ selection, disabled }: DemoDataTypePickerProps) => {
  const { groups, counts, kept, clear } = selection
  const [previewKey, setPreviewKey] = useState<TDemoDataTypeKey | null>(null)

  const types = groups.flatMap((group) => group.types)
  const previewType = types.find((type) => type.key === previewKey) ?? types.find((type) => kept.has(type.key)) ?? types[0]
  const previewGroup = groups.find((group) => group.types.includes(previewType))

  if (!previewType || !previewGroup) return <p className="p-4 text-sm text-muted-foreground">There are no sample records left to keep.</p>

  return (
    <div data-demo-data-picker className="flex h-[640px] max-h-[65vh] flex-col overflow-hidden rounded-lg border md:h-[440px] md:max-h-[50vh] md:flex-row">
      <div className="flex min-h-0 flex-1 flex-col border-b md:w-96 md:flex-none md:border-r md:border-b-0">
        <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
          <p className="text-sm text-muted-foreground">Recommended types are pre-selected</p>
          <Button variant="link" type="button" disabled={disabled} onClick={clear}>
            Clear
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {groups.map((group) => (
            <DemoDataTypeGroup key={group.label} group={group} selection={selection} previewKey={previewType.key} onPreview={setPreviewKey} disabled={disabled} />
          ))}
        </div>
      </div>
      <DemoDataTypePreview type={previewType} previewDocument={previewGroup.previewDocument} total={counts[previewType.key] ?? 0} isKept={kept.has(previewType.key)} />
    </div>
  )
}
