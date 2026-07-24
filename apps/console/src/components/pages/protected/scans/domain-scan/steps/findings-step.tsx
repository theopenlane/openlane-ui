'use client'

import React from 'react'
import { Separator } from '@repo/ui/separator'
import { EditableTextarea } from '@repo/ui/textarea'
import PlateEditor from '@/components/shared/plate/plate-editor'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { EditableName } from '../editable-name'
import { SectionCard } from '../components/section-card'
import { SelectionRow } from '../components/selection-row'
import { SelectAllCheckbox } from '../components/select-all-checkbox'
import { EmptyState } from '../components/empty-state'
import { toggleSetValue } from '../selection-utils'
import { DomainScanFindingCategory, type DomainScanAgentReadinessPayload, type DomainScanFindingCategoryValue, type Finding, type OverrideMap } from '../types'

type FindingsStepProps = {
  findings: Finding[]
  selected: Set<string>
  setSelected: React.Dispatch<React.SetStateAction<Set<string>>>
  agentReadiness?: DomainScanAgentReadinessPayload[]
  overrides: OverrideMap
  setOverrides: React.Dispatch<React.SetStateAction<OverrideMap>>
}

const agentReadinessDescription = (agentReadiness?: DomainScanAgentReadinessPayload[]) => {
  const levels = (agentReadiness || [])
    .filter((entry) => entry.level_name)
    .map((entry) => `${entry.domain ? `${entry.domain}: ` : ''}${entry.level_name}${entry.level !== undefined ? ` (Level ${entry.level})` : ''}`)

  return levels.length > 0 ? `Checks that failed against AI agent readiness. Overall level: ${levels.join(', ')}.` : 'Checks that failed against AI agent readiness.'
}

export const FindingsStep = ({ findings, selected, setSelected, agentReadiness, overrides, setOverrides }: FindingsStepProps) => {
  if (findings.length === 0) {
    return (
      <SectionCard title="Review findings" description="Optional security observations detected">
        <EmptyState message="No findings were included in this scan" />
      </SectionCard>
    )
  }

  const categoryOrder: DomainScanFindingCategoryValue[] = [DomainScanFindingCategory.RISK, DomainScanFindingCategory.SECURITY_VIOLATION, DomainScanFindingCategory.AGENT_READINESS]

  const groups = categoryOrder
    .map((category) => ({
      category,
      description: category === DomainScanFindingCategory.AGENT_READINESS ? agentReadinessDescription(agentReadiness) : undefined,
      items: findings.filter((finding) => finding.category === category),
    }))
    .filter((group) => group.items.length > 0)

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <SectionCard
          key={group.category}
          title={getEnumLabel(group.category)}
          count={group.items.length}
          description={group.description}
          titleAction={<SelectAllCheckbox ids={group.items.map((finding) => finding.id)} selected={selected} setSelected={setSelected} />}
          collapsible
        >
          {group.items.map((finding, index) => (
            <React.Fragment key={finding.id}>
              <SelectionRow
                checked={selected.has(finding.id)}
                onCheckedChange={() => toggleSetValue(setSelected, finding.id)}
                title={
                  <EditableName
                    value={overrides[finding.id]?.name ?? finding.title}
                    onChange={(name) => setOverrides((prev) => ({ ...prev, [finding.id]: { ...prev[finding.id], name } }))}
                    placeholder={finding.title}
                  />
                }
                description={
                  finding.category === DomainScanFindingCategory.AGENT_READINESS ? (
                    <PlateEditor key={finding.id} initialValue={finding.description ?? ''} readonly variant="readonly" toolbarClassName="hidden" />
                  ) : (
                    <EditableTextarea
                      value={(overrides[finding.id]?.description ?? finding.description) || ''}
                      onChange={(event) => setOverrides((prev) => ({ ...prev, [finding.id]: { ...prev[finding.id], description: event.target.value } }))}
                      placeholder="Add a description"
                      className="min-h-0 border-none bg-transparent p-0 text-sm text-muted-foreground"
                    />
                  )
                }
                meta={getEnumLabel(finding.severity)}
              />
              {index < group.items.length - 1 ? <Separator separatorClass="bg-border" /> : null}
            </React.Fragment>
          ))}
        </SectionCard>
      ))}
    </div>
  )
}
