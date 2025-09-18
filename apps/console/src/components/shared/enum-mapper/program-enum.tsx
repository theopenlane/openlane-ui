import { CirclePlus, Cog, FilePlus, Folder, FolderCheck, FolderClock, FolderInput, FolderOutput } from 'lucide-react'
import { ProgramProgramStatus, ProgramProgramType } from '@repo/codegen/src/schema.ts'
import React from 'react'
import Link from 'next/link'

export const ProgramIconMapper: Record<ProgramProgramStatus, React.ReactNode> = {
  [ProgramProgramStatus.ACTION_REQUIRED]: <FolderInput height={16} width={16} />,
  [ProgramProgramStatus.COMPLETED]: <FolderCheck height={16} width={16} />,
  [ProgramProgramStatus.IN_PROGRESS]: <FolderClock height={16} width={16} />,
  [ProgramProgramStatus.NOT_STARTED]: <Folder height={16} width={16} />,
  [ProgramProgramStatus.READY_FOR_AUDITOR]: <FolderOutput height={16} width={16} />,
  [ProgramProgramStatus.ARCHIVED]: <FolderOutput height={16} width={16} />,
}

export const ProgramStatusLabels: Record<ProgramProgramStatus, string> = {
  [ProgramProgramStatus.ACTION_REQUIRED]: 'Action Required',
  [ProgramProgramStatus.COMPLETED]: 'Completed',
  [ProgramProgramStatus.IN_PROGRESS]: 'In Progress',
  [ProgramProgramStatus.NOT_STARTED]: 'Not Started',
  [ProgramProgramStatus.READY_FOR_AUDITOR]: 'Ready for Auditor',
  [ProgramProgramStatus.ARCHIVED]: 'Archived',
}

export const ProgramTypeLabels: Record<ProgramProgramType, string> = {
  [ProgramProgramType.FRAMEWORK]: 'Framework',
  [ProgramProgramType.GAP_ANALYSIS]: 'Gap Analysis',
  [ProgramProgramType.OTHER]: 'Other',
  [ProgramProgramType.RISK_ASSESSMENT]: 'Risk Assessment',
}

// Status options for select dropdowns
export const ProgramStatusOptions = Object.values(ProgramProgramStatus).map((status) => ({
  label: ProgramStatusLabels[status],
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

export const ProgramTypeOptions = Object.values(ProgramProgramType).map((type) => ({
  label: ProgramTypeLabels[type],
  value: type,
}))

export const ProgramCreateIconBtn = (
  <div className="flex items-center space-x-2">
    <CirclePlus size={16} strokeWidth={2} />
    <span>Program</span>
  </div>
)

export const ProgramCreatePrefixIconBtn = (
  <div className="flex items-center space-x-2">
    <FilePlus size={16} strokeWidth={2} />
    <span>Create Program</span>
  </div>
)

export const ProgramSettingsIconBtn = ({ programId }: { programId: string }) => (
  <Link className="flex" href={`/programs/settings?id=${programId}`}>
    <div className="flex items-center space-x-2">
      <Cog size={16} strokeWidth={2} />
      <span>Settings</span>
    </div>
  </Link>
)
