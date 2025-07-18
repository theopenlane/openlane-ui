import { Archive, FileBadge2, FilePen } from 'lucide-react'
import { StandardStandardStatus } from '@repo/codegen/src/schema.ts'

export const StandardIconMapper: Record<StandardStandardStatus, React.ReactNode> = {
  [StandardStandardStatus.ARCHIVED]: <Archive height={16} width={16} />,
  [StandardStandardStatus.ACTIVE]: <FileBadge2 height={16} width={16} />,
  [StandardStandardStatus.DRAFT]: <FilePen height={16} width={16} />,
}
