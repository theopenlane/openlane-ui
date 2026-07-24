'use client'

import React, { useState } from 'react'
import { Accordion, AccordionContent, AccordionItem } from '@radix-ui/react-accordion'
import { Card, CardContent } from '@repo/ui/cardpanel'
import AccordionSectionTrigger from '@/components/shared/accordion-section-trigger/accordion-section-trigger'
import CopyableText from '@/components/shared/copyable-text/copyable-text'
import { toHumanLabel } from '@/utils/strings'
import { getDiscoveryEntries, type ScanMetadata } from './openlane-domain-scan/scan-metadata'

type Props = {
  metadata: ScanMetadata | null
  rawMetadata?: unknown
}

const isPlainObject = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value)

const renderPrimitive = (value: unknown): React.ReactNode => {
  if (value === null || value === undefined || value === '') {
    return <span className="text-muted-foreground">—</span>
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }
  return <CopyableText value={String(value)} />
}

const RenderValue: React.FC<{ value: unknown }> = ({ value }) => {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-muted-foreground">—</span>
    }
    if (value.every((item) => !isPlainObject(item) && !Array.isArray(item))) {
      return (
        <ul className="space-y-1">
          {value.map((item, index) => (
            <li key={index} className="text-sm text-muted-foreground">
              {renderPrimitive(item)}
            </li>
          ))}
        </ul>
      )
    }
    return (
      <div className="space-y-2">
        {value.map((item, index) => (
          <div key={index} className="rounded-md border p-2">
            <RenderValue value={item} />
          </div>
        ))}
      </div>
    )
  }

  if (isPlainObject(value)) {
    return <RenderFields value={value} />
  }

  return <div className="text-sm">{renderPrimitive(value)}</div>
}

const RenderFields: React.FC<{ value: Record<string, unknown> }> = ({ value }) => {
  const entries = Object.entries(value).filter(([, v]) => v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0))

  if (!entries.length) {
    return <span className="text-muted-foreground">—</span>
  }

  return (
    <div className="space-y-3">
      {entries.map(([key, v]) => (
        <div key={key} className="space-y-1">
          <p className="text-xs text-muted-foreground">{toHumanLabel(key)}</p>
          <RenderValue value={v} />
        </div>
      ))}
    </div>
  )
}

const getEntryCount = (value: unknown): number | undefined => {
  if (Array.isArray(value)) {
    return value.length
  }
  if (isPlainObject(value)) {
    return Object.keys(value).length
  }
  return undefined
}

const DiscoverySection: React.FC<Props> = ({ metadata, rawMetadata }) => {
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const discoveryEntries = getDiscoveryEntries(metadata)
  const hasDiscoveryEntries = discoveryEntries.length > 0

  const genericEntries =
    !hasDiscoveryEntries && isPlainObject(rawMetadata) ? Object.entries(rawMetadata).filter(([, v]) => v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0)) : []

  if (!hasDiscoveryEntries && !genericEntries.length) {
    return null
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-lg font-medium leading-7">What Was Discovered</p>
        <p className="text-sm text-muted-foreground mb-2">{hasDiscoveryEntries ? 'Summary of key discoveries from this scan' : 'Scan metadata, formatted where possible'}</p>
        <Accordion type="multiple" value={expandedItems} onValueChange={setExpandedItems}>
          {hasDiscoveryEntries
            ? discoveryEntries.map(({ key, label, count, items, groups }) => (
                <AccordionItem key={key} value={key} className="border-b last:border-b-0">
                  <AccordionSectionTrigger label={label} count={count} />
                  <AccordionContent className="overflow-hidden pb-3 data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                    {groups ? (
                      <div className="space-y-3">
                        {groups.map((group) => (
                          <div key={group.label} className="space-y-1">
                            <p className="text-xs font-semibold text-muted-foreground">{group.label}</p>
                            <ul className="space-y-1">
                              {group.items.map((item, index) => (
                                <li key={`${group.label}-${index}`} className="text-sm text-muted-foreground">
                                  <CopyableText value={item} />
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <ul className="space-y-1">
                        {items.map((item, index) => (
                          <li key={`${key}-${index}`} className="text-sm text-muted-foreground">
                            <CopyableText value={item} />
                          </li>
                        ))}
                      </ul>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))
            : genericEntries.map(([key, value]) => (
                <AccordionItem key={key} value={key} className="border-b last:border-b-0">
                  <AccordionSectionTrigger label={toHumanLabel(key)} count={getEntryCount(value)} />
                  <AccordionContent className="overflow-hidden pb-3 data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                    <RenderValue value={value} />
                  </AccordionContent>
                </AccordionItem>
              ))}
        </Accordion>
      </CardContent>
    </Card>
  )
}

export default DiscoverySection
