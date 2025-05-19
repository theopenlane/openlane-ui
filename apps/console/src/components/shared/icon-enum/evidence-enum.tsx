import { ArchiveX, FileArchive, FileSearch, RefreshCw, Stamp } from 'lucide-react'
import { EvidenceEvidenceStatus } from '@repo/codegen/src/schema.ts'

export const EvidenceIconMapper: Record<EvidenceEvidenceStatus, React.ReactNode> = {
  [EvidenceEvidenceStatus.APPROVED]: <Stamp height={16} width={16} />,
  [EvidenceEvidenceStatus.REJECTED]: <ArchiveX height={16} width={16} />,
  [EvidenceEvidenceStatus.NEEDS_RENEWAL]: <RefreshCw height={16} width={16} />,
  [EvidenceEvidenceStatus.READY]: <FileArchive height={16} width={16} />,
  [EvidenceEvidenceStatus.MISSING_ARTIFACT]: <FileSearch height={16} width={16} />,
}
