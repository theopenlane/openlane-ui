import { CirclePlus, Cog, FilePlus, Folder, FolderCheck, FolderClock, FolderInput, FolderOutput } from 'lucide-react'
import { ProgramProgramStatus } from '@repo/codegen/src/schema.ts'
import React from 'react'
import Link from 'next/link'
import { Button } from '@repo/ui/button'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'

export const ProgramIconMapper: Record<ProgramProgramStatus, React.ReactNode> = {
  [ProgramProgramStatus.ACTION_REQUIRED]: <FolderInput height={16} width={16} className="text-action-required" />,
  [ProgramProgramStatus.COMPLETED]: <FolderCheck height={16} width={16} className="text-completed" />,
  [ProgramProgramStatus.IN_PROGRESS]: <FolderClock height={16} width={16} className="text-in-progress" />,
  [ProgramProgramStatus.NOT_STARTED]: <Folder height={16} width={16} className="text-not-started" />,
  [ProgramProgramStatus.READY_FOR_AUDITOR]: <FolderOutput height={16} width={16} className="text-ready-for-auditor" />,
  [ProgramProgramStatus.ARCHIVED]: <FolderOutput height={16} width={16} className="text-archived" />,
}

// Status options for select dropdowns
export const ProgramStatusOptions = Object.values(ProgramProgramStatus).map((status) => ({
  label: getEnumLabel(status),
  value: status,
}))

// Status options for table filters
export const ProgramStatusFilterOptions = Object.entries(ProgramProgramStatus).map(([key, value]) => ({
  label: key
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase()),
  value,
}))

export const ProgramCreateIconBtn = (
  <div className="flex items-center space-x-2">
    <CirclePlus size={16} strokeWidth={2} />
    <span>Program</span>
  </div>
)

export const ProgramCreatePrefixIconBtn = (
  <Button size="sm" variant="transparent" className="flex items-center space-x-2 justify-start">
    <FilePlus size={16} strokeWidth={2} />
    <span>Create Program</span>
  </Button>
)

export const ProgramSettingsIconBtn = ({ programId }: { programId: string }) => (
  <Link className="flex" href={`/programs/${programId}/settings`}>
    <div className="flex items-center space-x-2">
      <Cog size={16} strokeWidth={2} />
      <span>Settings</span>
    </div>
  </Link>
)
