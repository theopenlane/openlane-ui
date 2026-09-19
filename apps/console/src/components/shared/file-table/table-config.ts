import { type FileWhereInput } from '@repo/codegen/src/schema'

export const FILE_SORT_FIELDS = [
  { key: 'size', label: 'Size' },
  {
    key: 'name',
    label: 'File Name',
  },
  { key: 'created_at', label: 'Created At' },
  { key: 'updated_at', label: 'Updated At' },
]

export const fileNameSearchWhere = (term: string): FileWhereInput | null => (term ? { or: [{ providedFileNameContainsFold: term }, { nameContainsFold: term }] } : null)
