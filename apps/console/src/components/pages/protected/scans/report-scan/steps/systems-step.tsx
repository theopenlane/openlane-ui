'use client'

import React from 'react'
import { toggleSetValue } from '../../shared/selection-utils'
import { ImportedRecordCard, RecordField } from '../components/imported-record-card'
import { resolvePlatform, resolveSystem } from '../selection'
import type { ReportPlatform, ReportPlatformOverrides, ReportSystem, ReportSystemFields, ReportSystemOverrides } from '../types'

type SystemsStepProps = {
  systems: ReportSystem[]
  platforms: ReportPlatform[]
  platformOverrides: ReportPlatformOverrides
  selected: Set<string>
  setSelected: React.Dispatch<React.SetStateAction<Set<string>>>
  overrides: ReportSystemOverrides
  onChange: (id: string, patch: Partial<ReportSystemFields>) => void
}

export const SystemsStep = ({ systems, platforms, platformOverrides, selected, setSelected, overrides, onChange }: SystemsStepProps) => {
  const platformNames = new Map(platforms.map((platform) => [platform.id, resolvePlatform(platform, platformOverrides).name.trim()]))

  return (
    <div className="space-y-4">
      <div>
        <p className="text-lg font-semibold">Review your systems</p>
        <p className="text-sm text-muted-foreground">A system is a component inside your platform, such as the application, the data environment or the corporate estate.</p>
      </div>
      {systems.map((system) => {
        const resolved = resolveSystem(system, overrides)
        const name = resolved.name.trim()
        const platformName = system.platformId ? platformNames.get(system.platformId) : undefined

        return (
          <ImportedRecordCard key={system.id} title={name || 'Untitled system'} checked={selected.has(system.id)} onCheckedChange={() => toggleSetValue(setSelected, system.id)}>
            <RecordField label="Name" value={resolved.name} onChange={(value) => onChange(system.id, { name: value })} error={name ? undefined : 'A system needs a name'} />
            <RecordField label="Description" value={resolved.description} onChange={(description) => onChange(system.id, { description })} multiline />
            {platformName ? <p className="text-xs text-muted-foreground">Part of {platformName}</p> : null}
          </ImportedRecordCard>
        )
      })}
    </div>
  )
}
