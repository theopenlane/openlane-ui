import React from 'react'
import { ZodType } from 'zod'
import { RenderFieldsProps } from './generic-sheet'

export interface TabConfig<TData, TUpdateInput> {
  id: string
  label: string
  render: (props: RenderFieldsProps<TData, TUpdateInput>) => React.ReactNode
}

export interface StepConfig {
  id: string
  label: string
  schema: ZodType
  render: () => React.ReactNode
}

export type ViewEditMode<TData, TUpdateInput> = { type: 'slideout' } | { type: 'tabbed'; tabs: TabConfig<TData, TUpdateInput>[] }

export type CreateMode = { type: 'slideout' } | { type: 'step-dialog'; steps: StepConfig[]; title?: string } | { type: 'full-page'; route: string }
