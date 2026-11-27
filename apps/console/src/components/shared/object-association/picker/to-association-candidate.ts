import { type ObjectTypeObjects, type TableRow } from '@/components/shared/object-association/object-association-config'
import { type TAssociationCandidate } from './use-association-changes'

export const toAssociationCandidate = (objectType: ObjectTypeObjects, row: TableRow): TAssociationCandidate => ({
  objectType,
  id: row.id ?? '',
  label: row.name || row.refCode || row.id || '',
  title: row.title,
})
