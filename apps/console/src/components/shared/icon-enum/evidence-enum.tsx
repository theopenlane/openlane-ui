import { ArchiveX, FileArchive, FileSearch, RefreshCw, Stamp } from 'lucide-react'
import { EvidenceEvidenceStatus } from '@repo/codegen/src/schema.ts'
import { Badge } from '@repo/ui/badge'

export const EvidenceIconMapper: Record<EvidenceEvidenceStatus, React.ReactNode> = {
  [EvidenceEvidenceStatus.APPROVED]: <Stamp height={16} width={16} />,
  [EvidenceEvidenceStatus.REJECTED]: <ArchiveX height={16} width={16} />,
  [EvidenceEvidenceStatus.NEEDS_RENEWAL]: <RefreshCw height={16} width={16} />,
  [EvidenceEvidenceStatus.READY]: <FileArchive height={16} width={16} />,
  [EvidenceEvidenceStatus.MISSING_ARTIFACT]: <FileSearch height={16} width={16} />,
}

export const ChartColorsSequence = ['#16A34A', '#15803D', '#CA8A04', '#EF4444', '#B91C1C']

export const EvidenceBadgeMapper: Record<EvidenceEvidenceStatus, React.ReactNode> = {
  [EvidenceEvidenceStatus.APPROVED]: (
    <Badge style={{ backgroundColor: '#15803D' }} className="text-white text-xs font-medium">
      Approved
    </Badge>
  ),
  [EvidenceEvidenceStatus.REJECTED]: (
    <Badge style={{ backgroundColor: '#B91C1C' }} className="text-white text-xs font-medium">
      Rejected
    </Badge>
  ),
  [EvidenceEvidenceStatus.NEEDS_RENEWAL]: (
    <Badge style={{ backgroundColor: '#CA8A04' }} className="text-white text-xs font-medium">
      Needs Renewal
    </Badge>
  ),
  [EvidenceEvidenceStatus.READY]: (
    <Badge style={{ backgroundColor: '#16A34A' }} className="text-white text-xs font-medium">
      Ready
    </Badge>
  ),
  [EvidenceEvidenceStatus.MISSING_ARTIFACT]: (
    <Badge style={{ backgroundColor: '#EF4444' }} className="text-white text-xs font-medium">
      Missing Artifact
    </Badge>
  ),
}
