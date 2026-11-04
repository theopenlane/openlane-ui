'use client'

import React, { useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useSmartRouter } from '@/hooks/useSmartRouter'
import { Tabs, TabsList, TabsTrigger } from '@repo/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@repo/ui/tooltip'
import { type StandardWhereInput } from '@repo/codegen/src/schema'
import { CUSTOM_STANDARDS_WHERE, OPENLANE_STANDARDS_WHERE } from './custom-framework/custom-framework'

export enum StandardSource {
  ALL = 'all',
  SUPPORTED = 'supported',
  CUSTOM = 'custom',
}

const SOURCE_PARAM = 'source'

const SOURCE_OPTIONS: { value: StandardSource; label: string; tooltip?: string; where?: StandardWhereInput }[] = [
  { value: StandardSource.ALL, label: 'All' },
  {
    value: StandardSource.SUPPORTED,
    label: 'Supported',
    tooltip: 'Published standards and frameworks maintained by Openlane, including updates and revisions.',
    where: OPENLANE_STANDARDS_WHERE,
  },
  { value: StandardSource.CUSTOM, label: 'Custom', where: CUSTOM_STANDARDS_WHERE },
]

const toStandardSource = (value: string | null): StandardSource => SOURCE_OPTIONS.find((option) => option.value === value)?.value ?? StandardSource.ALL

export const useStandardSourceFilter = () => {
  const searchParams = useSearchParams()
  const { replace } = useSmartRouter()
  const source = toStandardSource(searchParams.get(SOURCE_PARAM))

  const setSource = useCallback((next: StandardSource) => replace({ [SOURCE_PARAM]: next === StandardSource.ALL ? null : next }), [replace])

  return { source, sourceWhere: SOURCE_OPTIONS.find((option) => option.value === source)?.where, setSource }
}

type TStandardSourceTabsProps = {
  value: StandardSource
  onValueChange: (value: StandardSource) => void
}

export const StandardSourceTabs: React.FC<TStandardSourceTabsProps> = ({ value, onValueChange }) => (
  <Tabs value={value} onValueChange={(next) => onValueChange(toStandardSource(next))} variant="solid">
    <TabsList className="w-fit" aria-label="Filter standards by source">
      {SOURCE_OPTIONS.map((option) =>
        option.tooltip ? (
          <Tooltip key={option.value}>
            <TabsTrigger value={option.value} asChild>
              <TooltipTrigger>{option.label}</TooltipTrigger>
            </TabsTrigger>
            <TooltipContent portal side="bottom" align="end" className="max-w-xs whitespace-normal break-words">
              {option.tooltip}
            </TooltipContent>
          </Tooltip>
        ) : (
          <TabsTrigger key={option.value} value={option.value}>
            {option.label}
          </TabsTrigger>
        ),
      )}
    </TabsList>
  </Tabs>
)
