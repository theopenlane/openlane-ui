'use client'

import React from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover'
import { ExposureSourceDetails } from './exposure-source-details'
import { type TExposureSourceFields, type TSourceDetailRow } from './use-exposure-source'

type TExposureSourcePopoverProps = {
  fields: TExposureSourceFields
  extraRows?: TSourceDetailRow[]
}

export const ExposureSourcePopover: React.FC<TExposureSourcePopoverProps> = ({ fields, extraRows }) => (
  <Popover>
    <PopoverTrigger asChild>
      <Button type="button" variant="secondary" className="h-6 gap-1 px-2 text-xs">
        {fields.source?.trim() || 'Source details'}
        <ChevronDown size={12} />
      </Button>
    </PopoverTrigger>
    <PopoverContent align="start" className="w-[420px] max-w-[calc(100vw-2rem)]">
      <ExposureSourceDetails fields={fields} extraRows={extraRows} />
    </PopoverContent>
  </Popover>
)
