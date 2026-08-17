'use client'

import React, { useMemo } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Checkbox } from '@repo/ui/checkbox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'

type TEvidenceProgramFilterProps = {
  programOptions: { label: string; value: string }[]
  selectedProgramId: string | null
  onSelect: (programId: string | null) => void
}

const EvidenceProgramFilter: React.FC<TEvidenceProgramFilterProps> = ({ programOptions, selectedProgramId, onSelect }) => {
  const options = useMemo<{ label: string; value: string | null }[]>(() => [{ label: 'All programs', value: null }, ...programOptions], [programOptions])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className={`h-8 px-2! pl-3! outline-none ring-0 focus-visible:outline-none focus-visible:ring-0 ${selectedProgramId ? 'border border-primary!' : ''}`}
          icon={<SlidersHorizontal />}
          iconPosition="left"
          variant="outline"
        >
          <span className="text-muted-foreground">Filter by:</span>
          <span>Program</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="max-h-72 overflow-y-auto min-w-56">
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value ?? 'all'}
            className="flex items-center gap-2"
            onSelect={(event) => {
              event.preventDefault()
              onSelect(option.value)
            }}
          >
            <Checkbox checked={option.value === selectedProgramId} />
            <span>{option.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default EvidenceProgramFilter
