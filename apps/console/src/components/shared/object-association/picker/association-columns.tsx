import { type ReactNode } from 'react'
import StandardChip from '@/components/pages/protected/standards/shared/standard-chip'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { ObjectTypeObjects, type TableRow } from '@/components/shared/object-association/object-association-config'

export type TAssociationColumn = {
  header: string
  render: (row: TableRow) => ReactNode
}

const EMPTY_VALUE = '-'

const FRAMEWORK_COLUMN: TAssociationColumn = { header: 'Framework', render: ({ referenceFramework }) => <StandardChip referenceFramework={referenceFramework ?? undefined} /> }

const ASSOCIATION_COLUMNS: Partial<Record<ObjectTypeObjects, readonly TAssociationColumn[]>> = {
  [ObjectTypeObjects.CONTROL]: [FRAMEWORK_COLUMN, { header: 'Category', render: ({ category }) => category || EMPTY_VALUE }],
  [ObjectTypeObjects.SUB_CONTROL]: [FRAMEWORK_COLUMN, { header: 'Parent control', render: ({ parentRefCode }) => parentRefCode || EMPTY_VALUE }],
  [ObjectTypeObjects.ASSET]: [
    { header: 'Type', render: ({ assetType }) => getEnumLabel(assetType ?? undefined) || EMPTY_VALUE },
    { header: 'Environment', render: ({ environmentName }) => environmentName || EMPTY_VALUE },
  ],
}

export const getAssociationColumns = (objectType: ObjectTypeObjects): readonly TAssociationColumn[] => ASSOCIATION_COLUMNS[objectType] ?? []

export const SUBCONTROL_CHILD_COLUMNS: readonly TAssociationColumn[] = [
  { header: 'Framework', render: () => 'Subcontrol' },
  { header: 'Category', render: ({ parentRefCode }) => (parentRefCode ? `of ${parentRefCode}` : EMPTY_VALUE) },
]
