'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/cardpanel'
import { Tabs, TabsList, TabsTrigger } from '@repo/ui/tabs'
import { ExternalLinkValue } from '@/components/shared/external-link/external-link-value'
import { formatDateTime } from '@/utils/date'
import { toUpperSnakeCase } from '@/utils/strings'
import { isOneOf, isRecord } from '@/utils/type-guards'

export const CardSectionHeader: React.FC<{ title: string; description: string; action?: React.ReactNode }> = ({ title, description, action }) => (
  <div className="flex items-start justify-between gap-3">
    <div>
      <CardTitle className="p-0 text-base">{title}</CardTitle>
      <CardDescription className="p-0">{description}</CardDescription>
    </div>
    {action}
  </div>
)

const TARGET_DETAILS_VIEWS = ['fields', 'json'] as const
type TTargetDetailsView = (typeof TARGET_DETAILS_VIEWS)[number]
const isTargetDetailsView = isOneOf(TARGET_DETAILS_VIEWS)

const TargetDetailsHeader: React.FC<{ view: TTargetDetailsView; onViewChange: (view: TTargetDetailsView) => void }> = ({ view, onViewChange }) => (
  <CardSectionHeader
    title="Target Details"
    description="Resource context from the source system"
    action={
      <Tabs variant="solid" value={view} onValueChange={(value) => isTargetDetailsView(value) && onViewChange(value)}>
        <TabsList className="w-fit">
          <TabsTrigger value="fields">Fields</TabsTrigger>
          <TabsTrigger value="json">JSON</TabsTrigger>
        </TabsList>
      </Tabs>
    }
  />
)

const TargetDetailsBody: React.FC<{ view: TTargetDetailsView; value: Record<string, unknown> }> = ({ view, value }) =>
  view === 'json' ? <pre className="text-xs overflow-auto max-h-120 bg-muted rounded p-3 whitespace-pre-wrap break-all">{JSON.stringify(value, null, 2)}</pre> : <TargetDetailsFields value={value} />

export const TargetDetailsSection: React.FC<{ value: Record<string, unknown> }> = ({ value }) => {
  const [view, setView] = useState<TTargetDetailsView>('fields')
  return (
    <div className="space-y-4">
      <TargetDetailsHeader view={view} onViewChange={setView} />
      <TargetDetailsBody view={view} value={value} />
    </div>
  )
}

export const TargetDetailsCard: React.FC<{ value: Record<string, unknown> }> = ({ value }) => {
  const [view, setView] = useState<TTargetDetailsView>('fields')
  return (
    <Card>
      <CardHeader className="pb-2">
        <TargetDetailsHeader view={view} onViewChange={setView} />
      </CardHeader>
      <CardContent>
        <TargetDetailsBody view={view} value={value} />
      </CardContent>
    </Card>
  )
}

const URL_RE = /^(https?:\/\/|ghcr\.io\/|docker\.io\/|gcr\.io\/|registry\.)/i
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T/

const isEmpty = (val: unknown): boolean => {
  if (val === null || val === undefined) return true
  if (typeof val === 'string' && val.trim() === '') return true
  if (Array.isArray(val)) return val.length === 0 || val.every(isEmpty)
  if (isRecord(val)) return Object.values(val).every(isEmpty)
  return false
}

const formatPrimitive = (val: unknown): React.ReactNode => {
  if (typeof val === 'boolean') return val ? 'Yes' : 'No'
  if (typeof val === 'number') return String(val)
  if (typeof val === 'string') {
    if (ISO_DATE_RE.test(val)) return formatDateTime(val)
    if (URL_RE.test(val)) return <ExternalLinkValue value={val} fallback={val} />
    return val
  }
  return String(val)
}

const TargetDetailsFields: React.FC<{ value: Record<string, unknown> }> = ({ value }) => {
  const entries = Object.entries(value).filter(([, v]) => !isEmpty(v))
  if (entries.length === 0) {
    return <span className="text-muted-foreground italic text-sm">No populated fields</span>
  }
  return (
    <div className="space-y-4">
      {entries.map(([key, val]) => (
        <div key={key}>
          <div className="text-xs text-muted-foreground tracking-wide mb-2">{toUpperSnakeCase(key)}</div>
          <TargetNode value={val} />
        </div>
      ))}
    </div>
  )
}

const TargetNode: React.FC<{ value: unknown }> = ({ value }) => {
  if (isEmpty(value)) return null

  if (Array.isArray(value)) {
    const allPrimitive = value.every((v) => typeof v !== 'object' || v === null)
    if (allPrimitive) {
      return (
        <div className="text-sm">
          {value
            .filter((v) => !isEmpty(v))
            .map(String)
            .join(', ')}
        </div>
      )
    }
    return (
      <div className="space-y-2">
        {value.map((item, i) => (
          <div key={i} className="border-l pl-3 ml-1">
            <TargetNode value={item} />
          </div>
        ))}
      </div>
    )
  }

  if (isRecord(value)) {
    const entries = Object.entries(value).filter(([, v]) => !isEmpty(v))
    return (
      <dl className="grid grid-cols-[minmax(120px,max-content)_1fr] gap-x-3 gap-y-1 text-sm">
        {entries.map(([k, v]) => (
          <React.Fragment key={k}>
            <dt className="text-muted-foreground break-all">{k}</dt>
            <dd className="min-w-0 break-all">{typeof v === 'object' && v !== null ? <TargetNode value={v} /> : formatPrimitive(v)}</dd>
          </React.Fragment>
        ))}
      </dl>
    )
  }

  return <div className="text-sm">{formatPrimitive(value)}</div>
}
