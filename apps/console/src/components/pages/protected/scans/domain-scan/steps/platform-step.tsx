'use client'

import React from 'react'
import { Badge } from '@repo/ui/badge'
import { Input } from '@repo/ui/input'
import { Separator } from '@repo/ui/separator'
import { EditableTextarea, Textarea } from '@repo/ui/textarea'
import { EditableName } from '../editable-name'
import { SectionCard } from '../components/section-card'
import { SelectionRow } from '../components/selection-row'
import { EmptyState } from '../components/empty-state'
import { canonicalizeLookupValue } from '../notification-mappers'
import { toggleSetValue } from '../selection-utils'
import type { OverrideMap, PlatformCandidate, PlatformMode, TextOverride } from '../types'

type PlatformStepProps = {
  mode: PlatformMode
  setMode: (mode: PlatformMode) => void
  hostname: string
  singleCandidate: PlatformCandidate
  singleOverride: TextOverride
  setSingleOverride: React.Dispatch<React.SetStateAction<TextOverride>>
  perSystemCandidates: PlatformCandidate[]
  selectedPerSystemIds: Set<string>
  setSelectedPerSystemIds: React.Dispatch<React.SetStateAction<Set<string>>>
  perSystemOverrides: OverrideMap
  setPerSystemOverrides: React.Dispatch<React.SetStateAction<OverrideMap>>
  existingPlatformNames: Set<string>
}

const singlePlatformDescription = `A platform represents your top-level product or service offering. It defines what is being evaluated as part of a compliance program or audit.

Next, you'll break the platform down into the system details, assets, vendors, and other components that support it.`

export const PlatformStep = ({
  mode,
  setMode,
  hostname,
  singleCandidate,
  singleOverride,
  setSingleOverride,
  perSystemCandidates,
  selectedPerSystemIds,
  setSelectedPerSystemIds,
  perSystemOverrides,
  setPerSystemOverrides,
  existingPlatformNames,
}: PlatformStepProps) => {
  const singleName = singleOverride.name ?? singleCandidate.name
  const singleAlreadyExists = existingPlatformNames.has(canonicalizeLookupValue(singleName))

  if (mode === 'single') {
    return (
      <div className="space-y-3">
        <SectionCard
          title={
            <span className="flex items-center gap-2">
              Start with your platform
              {singleAlreadyExists ? <Badge variant="secondary">Already added</Badge> : null}
            </span>
          }
          description={singlePlatformDescription}
        >
          <div className="space-y-4 px-6 py-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Platform name</label>
              <Input value={singleName} onChange={(event) => setSingleOverride((prev) => ({ ...prev, name: event.target.value }))} placeholder={singleCandidate.name} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Description <span className="font-normal text-muted-foreground">- Optional</span>
              </label>
              <Textarea
                value={(singleOverride.description ?? singleCandidate.description) || ''}
                onChange={(event) => setSingleOverride((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="Add a short description of this platform"
              />
            </div>
          </div>
        </SectionCard>

        <button type="button" className="px-1 text-sm text-primary underline decoration-dotted" onClick={() => setMode('per-system')}>
          Split these results into multiple platforms
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="px-1 text-sm text-muted-foreground">
        Creating one platform per detected system.{' '}
        <button type="button" className="text-primary underline decoration-dotted" onClick={() => setMode('single')}>
          Switch back to a single platform for {hostname}
        </button>
        .
      </p>

      <SectionCard title="Platforms" count={perSystemCandidates.length} description="One platform will be created per selected system. Names and descriptions are editable.">
        {perSystemCandidates.length === 0 ? (
          <EmptyState message="No systems were detected in this notification." />
        ) : (
          perSystemCandidates.map((candidate, index) => {
            const candidateName = perSystemOverrides[candidate.id]?.name ?? candidate.name
            const alreadyExists = existingPlatformNames.has(canonicalizeLookupValue(candidateName))

            return (
              <React.Fragment key={candidate.id}>
                <SelectionRow
                  checked={selectedPerSystemIds.has(candidate.id)}
                  onCheckedChange={() => toggleSetValue(setSelectedPerSystemIds, candidate.id)}
                  title={
                    <EditableName
                      value={candidateName}
                      onChange={(name) => setPerSystemOverrides((prev) => ({ ...prev, [candidate.id]: { ...prev[candidate.id], name } }))}
                      placeholder={candidate.name}
                    />
                  }
                  description={
                    <EditableTextarea
                      value={(perSystemOverrides[candidate.id]?.description ?? candidate.description) || ''}
                      onChange={(event) => setPerSystemOverrides((prev) => ({ ...prev, [candidate.id]: { ...prev[candidate.id], description: event.target.value } }))}
                      placeholder="Add a description"
                      className="min-h-0 border-none bg-transparent p-0 text-sm text-muted-foreground"
                    />
                  }
                  trailing={alreadyExists ? <Badge variant="secondary">Already added</Badge> : undefined}
                />
                {index < perSystemCandidates.length - 1 ? <Separator separatorClass="bg-border" /> : null}
              </React.Fragment>
            )
          })
        )}
      </SectionCard>
    </div>
  )
}
