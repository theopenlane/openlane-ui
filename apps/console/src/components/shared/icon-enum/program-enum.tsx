import { CirclePlus, Cog, Folder, FolderCheck, FolderClock, FolderInput, FolderOutput } from 'lucide-react'
import { ProgramProgramStatus, ProgramProgramType } from '@repo/codegen/src/schema.ts'
import React from 'react'
import Link from 'next/link'

export const ProgramIconMapper: Record<ProgramProgramStatus, React.ReactNode> = {
  [ProgramProgramStatus.ACTION_REQUIRED]: <FolderInput height={16} width={16} />,
  [ProgramProgramStatus.COMPLETED]: <FolderCheck height={16} width={16} />,
  [ProgramProgramStatus.IN_PROGRESS]: <FolderClock height={16} width={16} />,
  [ProgramProgramStatus.NOT_STARTED]: <Folder height={16} width={16} />,
  [ProgramProgramStatus.READY_FOR_AUDITOR]: <FolderOutput height={16} width={16} />,
}

export const PROGRAM_STATUS_LABELS: Record<ProgramProgramStatus, string> = {
  [ProgramProgramStatus.ACTION_REQUIRED]: 'Action Required',
  [ProgramProgramStatus.COMPLETED]: 'Completed',
  [ProgramProgramStatus.IN_PROGRESS]: 'In Progress',
  [ProgramProgramStatus.NOT_STARTED]: 'Not Started',
  [ProgramProgramStatus.READY_FOR_AUDITOR]: 'Ready for Auditor',
}

export const PROGRAM_TYPE_LABELS: Record<ProgramProgramType, string> = {
  [ProgramProgramType.FRAMEWORK]: 'Framework',
  [ProgramProgramType.GAP_ANALYSIS]: 'Gap Analysis',
  [ProgramProgramType.OTHER]: 'Other',
  [ProgramProgramType.RISK_ASSESSMENT]: 'Risk Assessment',
}

export const ProgramCreateIconBtn = (
  <div className="flex items-center space-x-2">
    <CirclePlus size={16} strokeWidth={2} />
    <span>Program</span>
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
