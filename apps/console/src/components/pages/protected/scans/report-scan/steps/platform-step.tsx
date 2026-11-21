'use client'

import React, { useId } from 'react'
import { Switch } from '@repo/ui/switch'
import { existingNameKey } from '@/lib/graphql-hooks/report-scan'
import { toggleSetValue } from '../../shared/selection-utils'
import { ImportedRecordCard, RecordField } from '../components/imported-record-card'
import { resolvePlatform } from '../selection'
import type { ReportPlatform, ReportPlatformFields, ReportPlatformOverrides } from '../types'

type PlatformStepProps = {
  platforms: ReportPlatform[]
  selected: Set<string>
  setSelected: React.Dispatch<React.SetStateAction<Set<string>>>
  overrides: ReportPlatformOverrides
  onChange: (id: string, patch: Partial<ReportPlatformFields>) => void
  existingPlatformIds: Record<string, string>
}

const LOCATION_FIELDS: { key: keyof Pick<ReportPlatformFields, 'environmentName' | 'scopeName' | 'region' | 'physicalLocation'>; label: string }[] = [
  { key: 'environmentName', label: 'Environment' },
  { key: 'scopeName', label: 'Scope' },
  { key: 'region', label: 'Region' },
  { key: 'physicalLocation', label: 'Physical location' },
]

const PiiToggle = ({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (checked: boolean) => void }) => {
  const id = useId()

  return (
    <div className="flex items-center gap-4 rounded-md border border-border px-4 py-3">
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
      <label htmlFor={id}>
        <span className="block text-sm font-medium">Contains PII</span>
        <span className="block text-xs text-muted-foreground">Flags this platform for privacy criteria and data-handling controls</span>
      </label>
    </div>
  )
}

export const PlatformStep = ({ platforms, selected, setSelected, overrides, onChange, existingPlatformIds }: PlatformStepProps) => (
  <div className="space-y-4">
    <div>
      <p className="text-lg font-semibold">Start with your platform</p>
      <p className="text-sm text-muted-foreground">
        A platform is your top-level product or service offering. It defines what is being evaluated, and everything we pull from the report hangs off it.
      </p>
    </div>
    {platforms.map((platform) => {
      const resolved = resolvePlatform(platform, overrides)
      const name = resolved.name.trim()
      const alreadyAdded = !!name && !!existingPlatformIds[existingNameKey(name)]

      return (
        <ImportedRecordCard
          key={platform.id}
          title={name || 'Untitled platform'}
          checked={selected.has(platform.id)}
          onCheckedChange={() => toggleSetValue(setSelected, platform.id)}
          alreadyAdded={alreadyAdded}
        >
          <RecordField label="Name" value={resolved.name} onChange={(value) => onChange(platform.id, { name: value })} error={name ? undefined : 'A platform needs a name'} />
          {alreadyAdded ? null : (
            <>
              <RecordField label="Description" value={resolved.description} onChange={(description) => onChange(platform.id, { description })} multiline />
              <RecordField label="Business purpose" value={resolved.businessPurpose} onChange={(businessPurpose) => onChange(platform.id, { businessPurpose })} multiline />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {LOCATION_FIELDS.map((field) => (
                  <RecordField key={field.key} label={field.label} value={resolved[field.key]} onChange={(value) => onChange(platform.id, { [field.key]: value })} />
                ))}
              </div>
              <PiiToggle checked={resolved.containsPii} onCheckedChange={(containsPii) => onChange(platform.id, { containsPii })} />
            </>
          )}
        </ImportedRecordCard>
      )
    })}
  </div>
)
