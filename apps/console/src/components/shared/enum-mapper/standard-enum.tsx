import { Archive, ArrowUp10, BadgeCheck, CalendarPlus, FileBadge2, FileDigit, FilePen, History, Landmark, type LucideIcon } from 'lucide-react'
import { StandardStandardStatus } from '@repo/codegen/src/schema.ts'

export const StandardIconMapper: Record<StandardStandardStatus, React.ReactNode> = {
  [StandardStandardStatus.ARCHIVED]: <Archive height={16} width={16} />,
  [StandardStandardStatus.ACTIVE]: <FileBadge2 height={16} width={16} />,
  [StandardStandardStatus.DRAFT]: <FilePen height={16} width={16} />,
}

export enum StandardsCatalogFilterIconName {
  SystemOwned = 'SystemOwned',
  UpdatedAt = 'UpdatedAt',
  CreatedAt = 'CreatedAt',
  Version = 'Version',
  Revision = 'Revision',
  GoverningBody = 'GoverningBody',
}

export const FilterIcons: Record<StandardsCatalogFilterIconName, LucideIcon> = {
  [StandardsCatalogFilterIconName.SystemOwned]: BadgeCheck,
  [StandardsCatalogFilterIconName.UpdatedAt]: History,
  [StandardsCatalogFilterIconName.CreatedAt]: CalendarPlus,
  [StandardsCatalogFilterIconName.Version]: FileDigit,
  [StandardsCatalogFilterIconName.Revision]: ArrowUp10,
  [StandardsCatalogFilterIconName.GoverningBody]: Landmark,
}
