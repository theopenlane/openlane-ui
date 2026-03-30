import { ArchiveX, FileBadge, FileCheck, FileClock, FileCog, FileLock, FilePen, FileSearch, FileWarning } from 'lucide-react'
import { EntityEntityStatus } from '@repo/codegen/src/schema.ts'
import { Badge } from '@repo/ui/badge'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'

export const VendorStatusIconMapper: Record<EntityEntityStatus, React.ReactNode> = {
  [EntityEntityStatus.DRAFT]: <FilePen height={16} width={16} className="text-draft" />,
  [EntityEntityStatus.UNDER_REVIEW]: <FileSearch height={16} width={16} className="text-under-review" />,
  [EntityEntityStatus.APPROVED]: <FileBadge height={16} width={16} className="text-approved" />,
  [EntityEntityStatus.RESTRICTED]: <FileLock height={16} width={16} className="text-restricted" />,
  [EntityEntityStatus.REJECTED]: <ArchiveX height={16} width={16} className="text-rejected" />,
  [EntityEntityStatus.ACTIVE]: <FileCheck height={16} width={16} className="text-active" />,
  [EntityEntityStatus.SUSPENDED]: <FileClock height={16} width={16} className="text-suspended" />,
  [EntityEntityStatus.OFFBOARDING]: <FileCog height={16} width={16} className="text-offboarding" />,
  [EntityEntityStatus.TERMINATED]: <FileWarning height={16} width={16} className="text-terminated" />,
}

const VendorStatusColorMapper: Record<EntityEntityStatus, string> = {
  [EntityEntityStatus.DRAFT]: 'text-vendor-draft bg-vendor-draft-muted border-vendor-draft-border',
  [EntityEntityStatus.UNDER_REVIEW]: 'text-vendor-under-review bg-vendor-under-review-muted border-vendor-under-review-border',
  [EntityEntityStatus.APPROVED]: 'text-vendor-approved bg-vendor-approved-muted border-vendor-approved-border',
  [EntityEntityStatus.RESTRICTED]: 'text-vendor-restricted bg-vendor-restricted-muted border-vendor-restricted-border',
  [EntityEntityStatus.REJECTED]: 'text-vendor-rejected bg-vendor-rejected-muted border-vendor-rejected-border',
  [EntityEntityStatus.ACTIVE]: 'text-vendor-active bg-vendor-active-muted border-vendor-active-border',
  [EntityEntityStatus.SUSPENDED]: 'text-vendor-suspended bg-vendor-suspended-muted border-vendor-suspended-border',
  [EntityEntityStatus.OFFBOARDING]: 'text-vendor-offboarding bg-vendor-offboarding-muted border-vendor-offboarding-border',
  [EntityEntityStatus.TERMINATED]: 'text-vendor-terminated bg-vendor-terminated-muted border-vendor-terminated-border',
}

export function VendorStatusBadge({ status }: { status: EntityEntityStatus }) {
  return (
    <Badge variant="outline" className={`flex w-fit items-center text-center gap-1.5 text-xs leading-none py-0.5 px-2 ${VendorStatusColorMapper[status]}`}>
      {getEnumLabel(status)}
    </Badge>
  )
}
