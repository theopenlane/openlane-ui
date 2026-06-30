'use client'

import React from 'react'
import { Button } from '@repo/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { FolderKanban, ChevronsUpDown } from 'lucide-react'

type ProgramOption = { label: string; value: string }

type AuditorDashboardHeaderProps = {
  title: string
  subtitle?: string | null
  programOptions: ProgramOption[]
  selectedProgramId?: string
  onSelectProgram: (programId: string) => void
}

export const AuditorDashboardHeader: React.FC<AuditorDashboardHeaderProps> = ({ title, subtitle, programOptions, selectedProgramId, onSelectProgram }) => {
  const selectedLabel = programOptions.find((option) => option.value === selectedProgramId)?.label ?? 'Select program'

  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-3xl leading-9 font-medium">{title}</h1>
        {subtitle && <p className="text-muted-foreground text-base font-normal leading-6">{subtitle}</p>}
      </div>
      {programOptions.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" icon={<FolderKanban />} iconPosition="left" className="gap-1.5">
              <span className="text-muted-foreground">Program:</span>
              <span className="max-w-48 truncate">{selectedLabel}</span>
              <ChevronsUpDown size={15} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuRadioGroup value={selectedProgramId} onValueChange={onSelectProgram}>
              {programOptions.map((option) => (
                <DropdownMenuRadioItem key={option.value} value={option.value}>
                  <span className="truncate">{option.label}</span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}
