import { Folder, FolderCheck, FolderClock, FolderInput, FolderOutput } from 'lucide-react'
import { ProgramProgramStatus } from '@repo/codegen/src/schema.ts'

export const ProgramIconMapper: Record<ProgramProgramStatus, React.ReactNode> = {
  [ProgramProgramStatus.ACTION_REQUIRED]: <FolderInput height={16} width={16} />,
  [ProgramProgramStatus.COMPLETED]: <FolderCheck height={16} width={16} />,
  [ProgramProgramStatus.IN_PROGRESS]: <FolderClock height={16} width={16} />,
  [ProgramProgramStatus.NOT_STARTED]: <Folder height={16} width={16} />,
  [ProgramProgramStatus.READY_FOR_AUDITOR]: <FolderOutput height={16} width={16} />,
}
