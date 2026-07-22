'use client'

import React from 'react'
import { Badge } from '@repo/ui/badge'
import { Separator } from '@repo/ui/separator'
import { EditableName } from '../editable-name'
import { SectionCard } from '../components/section-card'
import { SelectionRow } from '../components/selection-row'
import { SelectAllCheckbox } from '../components/select-all-checkbox'
import { EmptyState } from '../components/empty-state'
import { VendorLogo } from '../components/vendor-logo'
import { guessDomainFromName, resolveVendorLogoUrl } from '../notification-mappers'
import { toggleSetValue } from '../selection-utils'
import type { DomainItem, DomainScanDomains, OverrideMap } from '../types'

type AssetsStepProps = {
  domains: DomainScanDomains
  selected: Set<string>
  setSelected: React.Dispatch<React.SetStateAction<Set<string>>>
  existingIds: Set<string>
  overrides: OverrideMap
  setOverrides: React.Dispatch<React.SetStateAction<OverrideMap>>
}

type AssetSection = {
  key: string
  title: string
  description: string
  emptyMessage: string
  items: DomainItem[]
  collapsible?: boolean
  defaultOpen?: boolean
}

const badgesForItem = (item: DomainItem) => {
  if (item.vendor) return [item.vendor]
  if (item.categories?.length) return item.categories
  if (item.org) return [item.org]
  return undefined
}

const kindBadgeLabel = (item: DomainItem) => {
  if (item.kind === 'technology') return 'Technology'
  if (item.kind === 'ip') return 'IP address'
  if (item.primary) return 'Primary'
  return undefined
}

export const AssetsStep = ({ domains, selected, setSelected, existingIds, overrides, setOverrides }: AssetsStepProps) => {
  const sections: AssetSection[] = [
    { key: 'owned', title: 'Owned domains', description: 'Names are editable', emptyMessage: 'No owned domains were detected in this notification.', items: domains.owned },
    {
      key: 'technologies',
      title: 'Technologies',
      description: 'Non-vendor technologies detected during the scan',
      emptyMessage: 'No technologies were detected in this notification.',
      items: domains.technologies,
    },
    {
      key: 'external',
      title: 'External domains',
      description: 'Optional related domains detected during the scan',
      emptyMessage: 'No external domains were detected in this notification.',
      items: domains.external,
      collapsible: true,
      defaultOpen: false,
    },
    {
      key: 'ip',
      title: 'IP addresses',
      description: 'Resolved IP addresses detected during the scan',
      emptyMessage: 'No IP addresses were detected in this notification.',
      items: domains.ip,
      collapsible: true,
      defaultOpen: false,
    },
  ]

  return (
    <div className="space-y-4">
      {sections.map((section) => (
        <SectionCard
          key={section.key}
          title={section.title}
          count={section.items.length}
          description={section.description}
          collapsible={section.collapsible}
          defaultOpen={section.defaultOpen}
          titleAction={<SelectAllCheckbox ids={section.items.map((item) => item.id)} selected={selected} setSelected={setSelected} />}
        >
          {section.items.length === 0 ? (
            <EmptyState message={section.emptyMessage} />
          ) : (
            section.items.map((item, index) => {
              const kindBadge = kindBadgeLabel(item)

              return (
                <React.Fragment key={item.id}>
                  <SelectionRow
                    checked={selected.has(item.id)}
                    onCheckedChange={() => toggleSetValue(setSelected, item.id)}
                    title={
                      <EditableName
                        value={overrides[item.id]?.name ?? item.name}
                        onChange={(name) => setOverrides((prev) => ({ ...prev, [item.id]: { ...prev[item.id], name } }))}
                        placeholder={item.name}
                      />
                    }
                    leading={item.vendor ? <VendorLogo name={item.vendor} logoUrl={resolveVendorLogoUrl(guessDomainFromName(item.vendor))} /> : undefined}
                    badges={badgesForItem(item)}
                    trailing={
                      <span className="flex items-center gap-2">
                        {existingIds.has(item.id) ? <Badge variant="secondary">Already added</Badge> : null}
                        {kindBadge ? <Badge variant={item.primary ? 'secondary' : 'outline'}>{kindBadge}</Badge> : null}
                      </span>
                    }
                  />
                  {index < section.items.length - 1 ? <Separator separatorClass="bg-border" /> : null}
                </React.Fragment>
              )
            })
          )}
        </SectionCard>
      ))}
    </div>
  )
}
