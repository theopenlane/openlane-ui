'use client'

import React from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { FileSpreadsheet, Link2, SkipForward, type LucideIcon } from 'lucide-react'
import { RadioGroup, RadioGroupItem } from '@repo/ui/radio-group'
import { Label } from '@repo/ui/label'
import { cn } from '@repo/ui/lib/utils'
import { LinkControlsPicker } from '../link-controls-picker'
import { ControlSource, toControlSource, type TCreateFrameworkFormData } from '../hooks/use-custom-framework-form-schema'

const CONTROL_SOURCE_OPTIONS: { value: ControlSource; title: string; description: string; points: string[]; icon: LucideIcon }[] = [
  {
    value: ControlSource.CSV,
    title: 'Import from CSV',
    description: 'Upload the spreadsheet you already keep. You map your columns to control fields after the framework is created.',
    points: ['Only Ref Code is required', 'A Category column groups controls into domains', 'Each row becomes a control linked to this framework'],
    icon: FileSpreadsheet,
  },
  {
    value: ControlSource.LINK,
    title: 'Link existing controls',
    description: 'Reuse custom controls already in your organization.',
    points: ['Evidence, owner and status stay with the control', 'Only controls not in another framework can be linked'],
    icon: Link2,
  },
  {
    value: ControlSource.SKIP,
    title: 'Skip for now',
    description: 'Create the framework with no controls.',
    points: ['Add controls any time from the framework page'],
    icon: SkipForward,
  },
]

export const ControlsStep: React.FC = () => {
  const { control, setValue } = useFormContext<TCreateFrameworkFormData>()
  const controlSource = useWatch({ control, name: 'controlSource' })
  const linkedControls = useWatch({ control, name: 'linkedControls' })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">How do you want to add controls?</h2>
        <p className="text-sm text-muted-foreground">Pick one. You can add controls another way later from the framework page.</p>
      </div>
      <RadioGroup
        value={controlSource}
        onValueChange={(value) => {
          const source = toControlSource(value)
          if (source) setValue('controlSource', source, { shouldDirty: true })
        }}
        className="grid gap-4 md:grid-cols-3"
        aria-label="Control source"
      >
        {CONTROL_SOURCE_OPTIONS.map(({ value, title, description, points, icon: Icon }) => (
          <Label
            key={value}
            htmlFor={`control-source-${value}`}
            className={cn('flex cursor-pointer flex-col gap-3 rounded-lg border p-4 font-normal', controlSource === value && 'border-primary bg-primary/5')}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 font-semibold">
                <Icon size={18} className="text-primary" />
                {title}
              </span>
              <RadioGroupItem id={`control-source-${value}`} value={value} />
            </div>
            <span className="text-sm text-muted-foreground">{description}</span>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </Label>
        ))}
      </RadioGroup>
      {controlSource === ControlSource.LINK && <LinkControlsPicker value={linkedControls} onChange={(next) => setValue('linkedControls', next, { shouldDirty: true })} />}
    </div>
  )
}
