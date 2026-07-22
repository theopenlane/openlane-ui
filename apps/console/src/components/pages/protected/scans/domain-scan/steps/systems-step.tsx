'use client'

import React from 'react'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { SectionCard } from '../components/section-card'
import { EmptyState } from '../components/empty-state'
import { SystemCandidateCard } from '../components/system-candidate-card'
import { canonicalizeLookupValue } from '../notification-mappers'
import type { OverrideMap, PlatformMode, SystemCandidate } from '../types'

type SystemsStepProps = {
  mode: PlatformMode
  systemCandidates: SystemCandidate[]
  systemOverrides: OverrideMap
  setSystemOverrides: React.Dispatch<React.SetStateAction<OverrideMap>>
  onAddSystem: () => void
  onRemoveSystem: (id: string) => void
  existingSystemNames: Set<string>
}

const SINGLE_MODE_DESCRIPTION = 'System details are the applications, services, and capabilities that make up your platform. Review what we found, then edit or remove anything that does not belong.'

const PER_SYSTEM_MODE_DESCRIPTION =
  'Each platform from the previous step also gets a System Details record. Names and descriptions you set here are used for those records, and anything you add here is created alongside them.'

export const SystemsStep = ({ mode, systemCandidates, systemOverrides, setSystemOverrides, onAddSystem, onRemoveSystem, existingSystemNames }: SystemsStepProps) => {
  const description = mode === 'single' ? SINGLE_MODE_DESCRIPTION : PER_SYSTEM_MODE_DESCRIPTION

  return (
    <div className="space-y-3">
      <SectionCard title="Review your system details" description={description}>
        {systemCandidates.length === 0 ? (
          <EmptyState message="No systems were detected in this notification, add one manually below." />
        ) : (
          <div className="px-6 py-4">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Detected system details
              <Badge variant="secondary">{systemCandidates.length}</Badge>
            </div>
            <div className="space-y-3">
              {systemCandidates.map((candidate) => {
                const name = systemOverrides[candidate.id]?.name ?? candidate.name

                return (
                  <SystemCandidateCard
                    key={candidate.id}
                    name={name}
                    namePlaceholder={candidate.name || 'e.g. Billing Service'}
                    description={(systemOverrides[candidate.id]?.description ?? candidate.description) || ''}
                    onNameChange={(value) => setSystemOverrides((prev) => ({ ...prev, [candidate.id]: { ...prev[candidate.id], name: value } }))}
                    onDescriptionChange={(value) => setSystemOverrides((prev) => ({ ...prev, [candidate.id]: { ...prev[candidate.id], description: value } }))}
                    onRemove={() => onRemoveSystem(candidate.id)}
                    alreadyExists={existingSystemNames.has(canonicalizeLookupValue(name))}
                  />
                )
              })}
            </div>
          </div>
        )}
      </SectionCard>

      <Button variant="secondary" onClick={onAddSystem}>
        + Add a system
      </Button>
    </div>
  )
}
