import { Cog, Folder, FolderCheck, FolderClock, FolderInput, FolderOutput, ShieldPlus } from 'lucide-react'
import { ProgramProgramStatus } from '@repo/codegen/src/schema.ts'
import React from 'react'
import { Button } from '@repo/ui/button'
import Link from 'next/link'

export const ProgramIconMapper: Record<ProgramProgramStatus, React.ReactNode> = {
  [ProgramProgramStatus.ACTION_REQUIRED]: <FolderInput height={16} width={16} />,
  [ProgramProgramStatus.COMPLETED]: <FolderCheck height={16} width={16} />,
  [ProgramProgramStatus.IN_PROGRESS]: <FolderClock height={16} width={16} />,
  [ProgramProgramStatus.NOT_STARTED]: <Folder height={16} width={16} />,
  [ProgramProgramStatus.READY_FOR_AUDITOR]: <FolderOutput height={16} width={16} />,
}

export const ProgramCreateIconBtn = (
  <div className="flex items-center space-x-2">
    <ShieldPlus size={16} strokeWidth={2} />
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
