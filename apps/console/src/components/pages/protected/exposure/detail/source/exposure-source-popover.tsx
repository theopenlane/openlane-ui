'use client'

import React from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover'

export const ExposureSourcePopover: React.FC<{ source?: string | null; children: React.ReactNode }> = ({ source, children }) => (
  <Popover>
    <PopoverTrigger asChild>
      <Button type="button" variant="secondary" className="h-6 gap-1 px-2 text-xs">
        {source?.trim() || 'Source details'}
        <ChevronDown size={12} />
      </Button>
    </PopoverTrigger>
    <PopoverContent align="start" className="w-[420px] max-w-[calc(100vw-2rem)]">
      {children}
    </PopoverContent>
  </Popover>
)
