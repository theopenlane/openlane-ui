import type React from 'react'

export type WorkItemActionKind = 'dismiss' | 'complete'

export type FilterKey = string

export const GROUP_BY_OPTIONS = [
  { value: 'type', label: 'Type' },
  { value: 'kind', label: 'Kind' },
] as const

export type GroupBy = (typeof GROUP_BY_OPTIONS)[number]['value']

export const DEFAULT_GROUP_BY: GroupBy = 'type'

export const isGroupBy = (value: string): value is GroupBy => GROUP_BY_OPTIONS.some((option) => option.value === value)

export const ALL_FILTER_KEY = 'all'
export const UNCATEGORIZED_KIND = 'Uncategorized'

export const FILTER_LABELS: Record<'recommendations' | 'tasks' | 'approvals' | 'evidenceRequests', string> = {
  recommendations: 'Recommendations',
  tasks: 'Tasks',
  approvals: 'Approvals',
  evidenceRequests: 'Evidence Requests',
}

export const WORK_ITEM_ROW_CLASS =
  'flex items-center justify-between gap-3 rounded-lg border border-homepage-card-border bg-homepage-card-item-transparent p-3 cursor-pointer hover:border-muted-foreground transition-colors duration-200'

export type WorkItem = {
  key: string
  kind: string
  kindColor?: string
  title: string
  preview?: string
  dueLabel?: string | null
  docsLink?: string
  onClick: () => void
  actionKind: WorkItemActionKind
  onAction: (e: React.MouseEvent) => void
}

export type WorkItemFilter = {
  key: FilterKey
  label: string
}
