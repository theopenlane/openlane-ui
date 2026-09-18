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
  const categoryOrder: DomainScanFindingCategoryValue[] = [
    DomainScanFindingCategory.RISK,
    DomainScanFindingCategory.SECURITY_VIOLATION,
    DomainScanFindingCategory.COMPLIANCE_LINKS,
    DomainScanFindingCategory.EMAIL_AUTHENTICATION,
    DomainScanFindingCategory.WEB_POSTURE,
    DomainScanFindingCategory.AGENT_READINESS,
  ]

  const checklistCategories: DomainScanFindingCategoryValue[] = [DomainScanFindingCategory.AGENT_READINESS, DomainScanFindingCategory.COMPLIANCE_LINKS]

  const groups = categoryOrder
    .flatMap((category) => {
      const items = findings.filter((finding) => finding.category === category)
      const domains = Array.from(new Set(items.map((finding) => finding.domain)))

      return domains.map((domain) => ({
        key: domain ? `${category}:${domain}` : category,
        title: domain ? (
          <span className="inline-flex items-baseline gap-1.5">
            {getEnumLabel(category)} for <span className="font-mono text-sm">{domain}</span>
          </span>
        ) : (
          getEnumLabel(category)
        ),
        description: category === DomainScanFindingCategory.AGENT_READINESS ? agentReadinessDescription(agentReadiness) : undefined,
        items: items.filter((finding) => finding.domain === domain),
      }))
    })
    .filter((group) => group.items.length > 0)

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <SectionCard
          key={group.key}
          title={group.title}
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
                  checklistCategories.includes(finding.category) ? (
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
